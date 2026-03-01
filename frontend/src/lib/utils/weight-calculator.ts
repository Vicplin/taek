import { WEIGHT_CLASSES_DATA, WEIGHT_CLASSES_BY_AGE_CATEGORY, AGE_CATEGORIES_DATA } from '@/lib/data/tournament-data';

export function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birthDateObj = new Date(birthDate);
  return today.getFullYear() - birthDateObj.getFullYear();
}

export function calculateWeightClass(weight: number, gender: string, birthDate?: string): { category: string; weightClass: string; ageGroup: string } | null {
  if (!weight || !gender) return null;
  
  // Normalize gender
  const normalizedGender = gender === 'Male' ? 'Male' : gender === 'Female' ? 'Female' : null;
  if (!normalizedGender) return null;

  let classes = WEIGHT_CLASSES_DATA[normalizedGender];
  let ageGroup = 'SENIOR'; // Default to Senior

  if (birthDate) {
    const age = calculateAge(birthDate);
    const category = AGE_CATEGORIES_DATA.find(c => age >= c.minAge && age <= c.maxAge);
    
    if (category) {
      ageGroup = category.name;
      const ageClasses = WEIGHT_CLASSES_BY_AGE_CATEGORY[category.id];
      if (ageClasses && ageClasses[normalizedGender]) {
        classes = ageClasses[normalizedGender];
      }
    }
  }
  
  for (const cls of classes) {
    if (weight <= cls.maxWeight) {
      return { category: cls.category, weightClass: cls.category, ageGroup };
    }
  }
  
  // If heavier than max, return heavy
  return { category: 'Heavy', weightClass: 'Heavy', ageGroup };
}
