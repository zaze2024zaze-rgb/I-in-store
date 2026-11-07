import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  where,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { 
  Product, 
  StoreSettings, 
  BannerItem, 
  Order, 
  OrderStatus, 
  CustomerAccount, 
  CartItem 
} from '../types.ts';

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
 * Production Firebase Configuration provided by user for I in Store
 */
export const DEFAULT_BUILTIN_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyDY36h48B5SdC-ZCh_gAB0r8hs-1tsU1YY",
  authDomain: "i-in-store.firebaseapp.com",
  projectId: "i-in-store",
  storageBucket: "i-in-store.firebasestorage.app",
  messagingSenderId: "888808655629",
  appId: "1:888808655629:web:54862f75751d2a3e1f3e044"
};

/**
 * Retrieve the active Firebase configuration.
 * Priority:
 * 1. Custom config entered by admin in the Dashboard (stored in localStorage)
 * 2. Vite environment variables (VITE_FIREBASE_*)
 * 3. Default built-in user project configuration (i-in-store)
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

  // Default to user's connected Firebase project
  return DEFAULT_BUILTIN_FIREBASE_CONFIG;
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

/**
 * Real-time listener for banners collection.
 * Triggers callback whenever any top square banner is added, updated, or removed.
 */
export function subscribeToBanners(
  onUpdate: (banners: BannerItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  const { db } = initFirebase();
  if (!db) return null;

  try {
    const bannersCol = collection(db, 'banners');
    const unsubscribe = onSnapshot(
      bannersCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: BannerItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              ...(data as BannerItem),
              id: docSnap.id,
            });
          });
          onUpdate(list);
        }
      },
      (error) => {
        console.warn('Firestore banners snapshot error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to subscribe to banners:', err);
    if (onError) onError(err);
    return null;
  }
}

/**
 * Save or update a square hero banner in Firestore cloud
 */
export async function saveBannerToCloud(banner: BannerItem): Promise<boolean> {
  const { db } = initFirebase();
  if (!db) return false;

  try {
    const docRef = doc(db, 'banners', banner.id);
    await setDoc(docRef, { ...banner }, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to save banner to cloud:', error);
    throw error;
  }
}

/**
 * Delete a banner from Firestore cloud
 */
export async function deleteBannerFromCloud(bannerId: string): Promise<boolean> {
  const { db } = initFirebase();
  if (!db) return false;

  try {
    const docRef = doc(db, 'banners', bannerId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Failed to delete banner from cloud:', error);
    throw error;
  }
}

/**
 * Upload all current banners to Firestore cloud in one batch
 */
export async function syncAllBannersToCloud(banners: BannerItem[]): Promise<number> {
  const { db } = initFirebase();
  if (!db) throw new Error('قاعدة بيانات Firebase غير مهيأة.');

  try {
    const batch = writeBatch(db);
    let count = 0;
    for (const b of banners) {
      const docRef = doc(db, 'banners', b.id);
      batch.set(docRef, b, { merge: true });
      count++;
    }
    await batch.commit();
    return count;
  } catch (error) {
    console.error('Batch sync banners error:', error);
    throw error;
  }
}

/**
 * Normalizes phone numbers to a clean numeric document key for Firestore.
 */
export function normalizePhoneKey(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  return digits || phone.trim();
}

/**
 * Real-time listener for orders collection (Admin Dashboard live monitoring via onSnapshot)
 */
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  const { db } = initFirebase();
  if (!db) return null;

  try {
    const ordersCol = collection(db, 'orders');
    const unsubscribe = onSnapshot(
      ordersCol,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const ordId = docSnap.id;
          const ordNumber =
            data.orderNumber ||
            (ordId.startsWith('IN-') ? ordId : (ordId.startsWith('ord_') ? ('IN-' + ordId.slice(-5)) : ('IN-' + ordId.slice(0, 8))));

          list.push({
            id: ordId,
            orderNumber: ordNumber,
            createdAt: data.createdAt || new Date().toISOString(),
            items: Array.isArray(data.items) ? data.items : [],
            subtotal: typeof data.subtotal === 'number' ? data.subtotal : (Number(data.subtotal) || Number(data.total) || 0),
            couponDiscount: typeof data.couponDiscount === 'number' ? data.couponDiscount : (Number(data.couponDiscount) || 0),
            shippingFee: typeof data.shippingFee === 'number' ? data.shippingFee : (Number(data.shippingFee) || 0),
            total: typeof data.total === 'number' ? data.total : (Number(data.total) || Number(data.subtotal) || 0),
            currency: data.currency || 'SAR',
            status: (data.status as OrderStatus) || 'pending_confirmation',
            customerName: data.customerName || data.name || 'عميل المتجر',
            customerPhone: data.customerPhone || data.phone || '',
            customerCity: data.customerCity || data.city || 'صنعاء',
            customerAddress: data.customerAddress || data.address || '',
            paymentMethod: data.paymentMethod || 'whatsapp_order',
            depositBank: data.depositBank,
            depositNotes: data.depositNotes || data.notes || '',
            whatsappMessageSent: data.whatsappMessageSent !== false,
            adminNotes: data.adminNotes || '',
            updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
            ...(data as Partial<Order>),
          });
        });
        // Sort orders newest first with safe date comparison
        list.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore orders snapshot error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to subscribe to orders:', err);
    if (onError) onError(err);
    return null;
  }
}

/**
 * Save an order in Firestore cloud
 */
export async function saveOrderToCloud(order: Order): Promise<boolean> {
  const { db } = initFirebase();
  if (!db) return false;

  try {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, { ...order, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to save order to cloud:', error);
    throw error;
  }
}

/**
 * Update order status and admin notes in Firestore
 */
export async function updateOrderStatusInCloud(
  orderId: string, 
  status: OrderStatus, 
  adminNotes?: string
): Promise<boolean> {
  const { db } = initFirebase();
  if (!db) return false;

  try {
    const docRef = doc(db, 'orders', orderId);
    const updatePayload: Record<string, any> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (adminNotes !== undefined) {
      updatePayload.adminNotes = adminNotes;
    }
    await setDoc(docRef, updatePayload, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to update order status in cloud:', error);
    throw error;
  }
}

/**
 * Batch sync orders to cloud
 */
export async function syncAllOrdersToCloud(orders: Order[]): Promise<number> {
  const { db } = initFirebase();
  if (!db) throw new Error('قاعدة بيانات Firebase غير مهيأة.');

  try {
    const batch = writeBatch(db);
    let count = 0;
    for (const ord of orders) {
      const docRef = doc(db, 'orders', ord.id);
      batch.set(docRef, ord, { merge: true });
      count++;
    }
    await batch.commit();
    return count;
  } catch (error) {
    console.error('Batch sync orders error:', error);
    throw error;
  }
}

/**
 * Real-time listener for customers collection (Admin Dashboard live monitoring)
 */
export function subscribeToCustomers(
  onUpdate: (customers: CustomerAccount[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  const { db } = initFirebase();
  if (!db) return null;

  try {
    const customersCol = collection(db, 'customers');
    const unsubscribe = onSnapshot(
      customersCol,
      (snapshot) => {
        const list: CustomerAccount[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || `عميل (${data.phone || docSnap.id})`,
            phone: data.phone || docSnap.id,
            isActive: data.isActive !== false,
            createdAt: data.createdAt || new Date().toISOString(),
            city: data.city || '',
            address: data.address || '',
            cart: Array.isArray(data.cart) ? data.cart : [],
            wishlist: Array.isArray(data.wishlist) ? data.wishlist : [],
            notes: data.notes || '',
            ...(data as Partial<CustomerAccount>),
          });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore customers snapshot error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to subscribe to customers:', err);
    if (onError) onError(err);
    return null;
  }
}

/**
 * Save or update a customer account in Firestore
 */
export async function saveCustomerToCloud(customer: CustomerAccount): Promise<boolean> {
  const { db } = initFirebase();
  if (!db) return false;

  try {
    const key = normalizePhoneKey(customer.phone) || customer.id;
    const docRef = doc(db, 'customers', key);
    await setDoc(docRef, { ...customer, id: key }, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to save customer to cloud:', error);
    throw error;
  }
}

/**
 * Fetch a customer by phone number from Firestore
 */
export async function getCustomerFromCloud(phone: string): Promise<CustomerAccount | null> {
  const { db } = initFirebase();
  if (!db) return null;

  try {
    const key = normalizePhoneKey(phone);
    const docRef = doc(db, 'customers', key);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CustomerAccount;
    }
    return null;
  } catch (error) {
    console.error('Failed to get customer from cloud:', error);
    return null;
  }
}

/**
 * Admin action: toggle customer active status (إيقاف أو تشغيل الحساب)
 */
export async function updateCustomerStatusInCloud(
  phone: string, 
  isActive: boolean, 
  customerData?: Partial<CustomerAccount>
): Promise<boolean> {
  const { db } = initFirebase();
  if (!db) return false;

  try {
    const key = normalizePhoneKey(phone);
    const docRef = doc(db, 'customers', key);
    await setDoc(
      docRef, 
      { 
        phone, 
        isActive, 
        statusUpdatedAt: new Date().toISOString(),
        ...(customerData || {})
      }, 
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Failed to update customer status in cloud:', error);
    throw error;
  }
}

/**
 * Save customer's live cart and wishlist in Firestore
 */
export async function syncCustomerCartAndWishlist(
  phone: string, 
  cart: CartItem[], 
  wishlist: string[]
): Promise<boolean> {
  const { db } = initFirebase();
  if (!db || !phone) return false;

  try {
    const key = normalizePhoneKey(phone);
    const docRef = doc(db, 'customers', key);
    await setDoc(docRef, {
      cart,
      wishlist,
      lastCartUpdateAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to sync customer cart to cloud:', error);
    return false;
  }
}

/**
 * Real-time listener for a specific customer profile
 */
export function subscribeToCustomerData(
  phone: string,
  onUpdate: (customer: CustomerAccount | null) => void
): Unsubscribe | null {
  const { db } = initFirebase();
  if (!db || !phone) return null;

  try {
    const key = normalizePhoneKey(phone);
    const docRef = doc(db, 'customers', key);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as CustomerAccount);
      } else {
        onUpdate(null);
      }
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to subscribe to customer data:', err);
    return null;
  }
}

/**
 * Batch sync all customers to Firestore
 */
export async function syncAllCustomersToCloud(customers: CustomerAccount[]): Promise<number> {
  const { db } = initFirebase();
  if (!db) throw new Error('قاعدة بيانات Firebase غير مهيأة.');

  try {
    const batch = writeBatch(db);
    let count = 0;
    for (const cust of customers) {
      const key = normalizePhoneKey(cust.phone) || cust.id;
      const docRef = doc(db, 'customers', key);
      batch.set(docRef, { ...cust, id: key }, { merge: true });
      count++;
    }
    await batch.commit();
    return count;
  } catch (error) {
    console.error('Batch sync customers error:', error);
    throw error;
  }
}


