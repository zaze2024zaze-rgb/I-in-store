export interface SizeRecommendation {
  recommendedSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL';
  confidenceScore: number; // e.g. 96%
  matchReason: string;
  measurementsGuide: {
    bustCm: string;
    waistCm: string;
    hipCm: string;
    lengthCm: string;
  };
}

/**
 * Smart size calculator based on height (cm), weight (kg), and fit preference
 */
export function calculateRecommendedSize(
  heightCm: number,
  weightKg: number,
  fitPreference: 'slim' | 'regular' | 'oversized' = 'regular'
): SizeRecommendation {
  const safeHeight = Math.max(130, Math.min(220, Number(heightCm) || 165));
  const safeWeight = Math.max(35, Math.min(160, Number(weightKg) || 60));

  const heightM = safeHeight / 100;
  const bmi = safeWeight / (heightM * heightM);

  let baseSizeIndex = 2; // 0=XS, 1=S, 2=M, 3=L, 4=XL, 5=2XL

  if (bmi < 18.5) {
    baseSizeIndex = 0; // XS
  } else if (bmi < 22) {
    baseSizeIndex = 1; // S
  } else if (bmi < 25) {
    baseSizeIndex = 2; // M
  } else if (bmi < 28.5) {
    baseSizeIndex = 3; // L
  } else if (bmi < 32.5) {
    baseSizeIndex = 4; // XL
  } else {
    baseSizeIndex = 5; // 2XL
  }

  // Adjust for tall/short heights
  if (safeHeight > 175 && baseSizeIndex < 5) {
    baseSizeIndex += 0.5;
  } else if (safeHeight < 155 && baseSizeIndex > 0) {
    baseSizeIndex -= 0.5;
  }

  // Adjust for preference
  if (fitPreference === 'oversized' && baseSizeIndex < 5) {
    baseSizeIndex += 0.5;
  } else if (fitPreference === 'slim' && baseSizeIndex > 0) {
    baseSizeIndex -= 0.5;
  }

  const finalIndex = Math.max(0, Math.min(5, Math.round(baseSizeIndex)));
  const sizeMap: ('XS' | 'S' | 'M' | 'L' | 'XL' | '2XL')[] = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
  const recommendedSize = sizeMap[finalIndex];

  const sizeGuides: Record<string, { bustCm: string; waistCm: string; hipCm: string; lengthCm: string }> = {
    XS: { bustCm: '80 - 84', waistCm: '60 - 64', hipCm: '86 - 90', lengthCm: '105' },
    S:  { bustCm: '85 - 89', waistCm: '65 - 69', hipCm: '91 - 95', lengthCm: '108' },
    M:  { bustCm: '90 - 95', waistCm: '70 - 75', hipCm: '96 - 101', lengthCm: '110' },
    L:  { bustCm: '96 - 102', waistCm: '76 - 82', hipCm: '102 - 108', lengthCm: '112' },
    XL: { bustCm: '103 - 110', waistCm: '83 - 90', hipCm: '109 - 116', lengthCm: '114' },
    '2XL': { bustCm: '111 - 120', waistCm: '91 - 100', hipCm: '117 - 126', lengthCm: '116' },
  };

  const confidenceScore = Math.min(99, Math.max(90, Math.floor(98 - Math.abs(bmi - 22) * 0.8)));

  const prefLabel = fitPreference === 'oversized' ? 'الفضفاض والمريح' : fitPreference === 'slim' ? 'المجسم والأنيق' : 'المثالي المعتدل';
  const matchReason = `بناءً على طولك (${safeHeight} سم) ووزنك (${safeWeight} كجم) واختيارك للقصة ذات الطابع ${prefLabel}، فإن مقاس ${recommendedSize} يمنحك تناسقاً مثالياً ومطابقة بنسبة ${confidenceScore}%.`;

  return {
    recommendedSize,
    confidenceScore,
    matchReason,
    measurementsGuide: sizeGuides[recommendedSize],
  };
}
