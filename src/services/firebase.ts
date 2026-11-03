import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { Product, StoreSettings } from '../types.ts';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const STORAGE_KEY_FIREBASE_CONFIG = 'iin_firebase_custom_config';

/**
 * Retrieve the active Firebase configuration.
 * Priority:
 * 1. Custom config entered by admin in the Dashboard (stored in localStorage)
 * 2. Vite environment variables (VITE_FIREBASE_*)
 */
export function getActiveFirebaseConfig(): FirebaseConfig | null {
  // Check localStorage first
  try {
    const custom = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (custom) {
      const parsed = JSON.parse(custom) as FirebaseConfig;
      if (parsed.apiKey && parsed.projectId && parsed.appId) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read custom Firebase config from localStorage:', err);
  }

  // Fallback to Vite environment variables
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const envAppId = import.meta.env.VITE_FIREBASE_APP_ID;

  if (envApiKey && envProjectId && envAppId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.firebasestorage.app`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: envAppId,
    };
  }

  return null;
}

/**
 * Save custom Firebase config from admin dashboard
 */
export function saveCustomFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
  // Re-initialize app
  initFirebase();
}

/**
 * Remove custom config (reverts to env or local mode)
 */
export function clearCustomFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
  cachedDb = null;
  cachedApp = null;
}

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

export function isCloudConfigured(): boolean {
  return getActiveFirebaseConfig() !== null;
}

export function initFirebase(): { app: FirebaseApp | null; db: Firestore | null } {
  const config = getActiveFirebaseConfig();
  if (!config) {
    cachedApp = null;
    cachedDb = null;
    return { app: null, db: null };
  }

  try {
    if (getApps().length > 0) {
      cachedApp = getApp();
    } else {
      cachedApp = initializeApp(config);
    }
    cachedDb = getFirestore(cachedApp);
    return { app: cachedApp, db: cachedDb };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return { app: null, db: null };
  }
}

/**
 * Test connectivity to Firestore
 */
export async function testFirebaseConnection(customConfig?: FirebaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    let testApp: FirebaseApp;
    const configToTest = customConfig || getActiveFirebaseConfig();

    if (!configToTest || !configToTest.apiKey || !configToTest.projectId) {
      return {
        success: false,
        message: 'بيانات الربط غير مكتملة. يرجى إدخال apiKey و projectId على الأقل.',
      };
    }

    try {
      testApp = initializeApp(configToTest, 'test-app-' + Date.now());
    } catch {
      testApp = getApp();
    }

    const testDb = getFirestore(testApp);
    // Attempt a light read from 'products' collection
    const testCol = collection(testDb, 'products');
    await getDocs(testCol);

    return {
      success: true,
      message: 'تم الاتصال بقاعدة بيانات Firebase Firestore بنجاح! المزامنة السحابية تعمل الآن.',
    };
  } catch (error: any) {
    console.error('Test connection error:', error);
    let msg = error?.message || 'فشل الاتصال بقاعدة البيانات.';
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      msg = 'تم الاتصال بالسحابة بنجاح لكن يلزم تفعيل أذونات القراءة والكتابة (Firestore Security Rules).';
    }
    return {
      success: false,
      message: `خطأ أثناء الاتصال: ${msg}`,
    };
  }
}

/**
 * Real-time listener for products collection.
 * Triggers callback whenever any product is added, updated, or deleted anywhere.
 */
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  const { db } = initFirebase();
  if (!db) {
    return null;
  }

  try {
    const productsCol = collection(db, 'products');
    const unsubscribe = onSnapshot(
      productsCol,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is completely empty, don't wipe local products immediately; notify caller with empty list
          onUpdate([]);
        } else {
          const list: Product[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              ...(data as Product),
              id: docSnap.id,
            });
          });
          onUpdate(list);
        }
      },
      (error) => {
        console.warn('Firestore snapshot error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to subscribe to products:', err);
    if (onError) onError(err);
    return null;
  }
}

/**
 * Save or update a product in Firestore cloud
 */
export async function saveProductToCloud(product: Product): Promise<boolean> {
  const { db } = initFirebase();
  if (!db) return false;

  try {
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, { ...product }, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to save product to cloud:', error);
    throw error;
  }
}

/**
 * Delete a product from Firestore cloud
 */
export async function deleteProductFromCloud(productId: string): Promise<boolean> {
  const { db } = initFirebase();
  if (!db) return false;

  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Failed to delete product from cloud:', error);
    throw error;
  }
}

/**
 * Upload all current local products to the cloud in one batch
 */
export async function syncAllProductsToCloud(products: Product[]): Promise<number> {
  const { db } = initFirebase();
  if (!db) throw new Error('قاعدة بيانات Firebase غير مهيأة.');

  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const p of products) {
      const docRef = doc(db, 'products', p.id);
      batch.set(docRef, p, { merge: true });
      count++;
    }

    await batch.commit();
    return count;
  } catch (error) {
    console.error('Batch sync error:', error);
    throw error;
  }
}

/**
 * Save store settings to Firestore
 */
export async function saveSettingsToCloud(settings: StoreSettings): Promise<boolean> {
  const { db } = initFirebase();
  if (!db) return false;

  try {
    const docRef = doc(db, 'settings', 'store');
    await setDoc(docRef, settings, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to save settings to cloud:', error);
    return false;
  }
}

/**
 * Subscribe to store settings
 */
export function subscribeToSettings(
  onUpdate: (settings: StoreSettings) => void
): Unsubscribe | null {
  const { db } = initFirebase();
  if (!db) return null;

  try {
    const docRef = doc(db, 'settings', 'store');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as StoreSettings);
      }
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to subscribe to settings:', err);
    return null;
  }
}
