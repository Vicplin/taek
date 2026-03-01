export interface AgeCategory {
  id: string;
  label: string;
  minAge: number;
  maxAge: number;
  // UI Properties
  name: string;
  age: string;
  details: string;
  activeBorder: string;
  border: string;
  iconColor: string;
  dot: string;
  color: string;
}

export interface WeightClass {
  category: string;
  maxWeight: number;
  minWeight?: number;
}

export interface WeightClassDisplay {
  name: string;
  male: string;
  female: string;
}

export const AGE_CATEGORIES_DATA: AgeCategory[] = [
  { 
    id: 'super_cadet', 
    label: 'Super Cadet (9-11)', 
    minAge: 9, 
    maxAge: 11,
    name: 'SUPER CADET',
    age: '9 - 11 YEARS',
    details: 'Standard weight divisions for Super Cadet (9-11 years)',
    activeBorder: 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
    border: 'border-white/10 hover:border-yellow-500/50 hover:bg-white/5',
    iconColor: 'text-yellow-500',
    dot: 'bg-yellow-500',
    color: 'text-yellow-500'
  },
  { 
    id: 'cadet', 
    label: 'Cadet (12-14)', 
    minAge: 12, 
    maxAge: 14,
    name: 'CADET',
    age: '12 - 14 YEARS',
    details: 'Standard weight divisions for Cadet (12-14 years)',
    activeBorder: 'border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
    border: 'border-white/10 hover:border-green-500/50 hover:bg-white/5',
    iconColor: 'text-green-500',
    dot: 'bg-green-500',
    color: 'text-green-500'
  },
  { 
    id: 'junior', 
    label: 'Junior (15-17)', 
    minAge: 15, 
    maxAge: 17,
    name: 'JUNIOR',
    age: '15 - 17 YEARS',
    details: 'Standard weight divisions for Junior (15-17 years)',
    activeBorder: 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    border: 'border-white/10 hover:border-blue-500/50 hover:bg-white/5',
    iconColor: 'text-blue-500',
    dot: 'bg-blue-500',
    color: 'text-blue-500'
  },
  { 
    id: 'senior', 
    label: 'Senior (17+)', 
    minAge: 17, 
    maxAge: 99,
    name: 'SENIOR',
    age: '17+ YEARS',
    details: 'Standard Olympic weight divisions for Senior (17+ years)',
    activeBorder: 'border-arena-red bg-arena-red/10 shadow-[0_0_15px_rgba(255,70,85,0.3)]',
    border: 'border-white/10 hover:border-arena-red/50 hover:bg-white/5',
    iconColor: 'text-arena-red',
    dot: 'bg-arena-red',
    color: 'text-arena-red'
  },
];

export const WEIGHT_CLASSES_DATA: Record<string, WeightClass[]> = {
  Male: [
    { category: 'Fin', maxWeight: 54 },
    { category: 'Fly', maxWeight: 58 },
    { category: 'Bantam', maxWeight: 63 },
    { category: 'Feather', maxWeight: 68 },
    { category: 'Light', maxWeight: 74 },
    { category: 'Welter', maxWeight: 80 },
    { category: 'Middle', maxWeight: 87 },
    { category: 'Heavy', maxWeight: 999 },
  ],
  Female: [
    { category: 'Fin', maxWeight: 46 },
    { category: 'Fly', maxWeight: 49 },
    { category: 'Bantam', maxWeight: 53 },
    { category: 'Feather', maxWeight: 57 },
    { category: 'Light', maxWeight: 62 },
    { category: 'Welter', maxWeight: 67 },
    { category: 'Middle', maxWeight: 73 },
    { category: 'Heavy', maxWeight: 999 },
  ],
};



export const WEIGHT_CLASSES_BY_AGE_CATEGORY: Record<string, Record<string, WeightClass[]>> = {
  super_cadet: {
    Male: [
      { category: 'Fin', maxWeight: 20 },
      { category: 'Fly', maxWeight: 23 },
      { category: 'Bantam', maxWeight: 26 },
      { category: 'Feather', maxWeight: 29 },
      { category: 'Light', maxWeight: 32 },
      { category: 'Welter', maxWeight: 36 },
      { category: 'Middle', maxWeight: 40 },
      { category: 'Heavy', maxWeight: 999 },
    ],
    Female: [
      { category: 'Fin', maxWeight: 18 },
      { category: 'Fly', maxWeight: 21 },
      { category: 'Bantam', maxWeight: 24 },
      { category: 'Feather', maxWeight: 27 },
      { category: 'Light', maxWeight: 30 },
      { category: 'Welter', maxWeight: 34 },
      { category: 'Middle', maxWeight: 38 },
      { category: 'Heavy', maxWeight: 999 },
    ]
  },
  cadet: {
    Male: [
      { category: 'Fin', maxWeight: 33 },
      { category: 'Fly', maxWeight: 37 },
      { category: 'Bantam', maxWeight: 41 },
      { category: 'Feather', maxWeight: 45 },
      { category: 'Light', maxWeight: 49 },
      { category: 'Light Welter', maxWeight: 53 },
      { category: 'Welter', maxWeight: 57 },
      { category: 'Light Middle', maxWeight: 61 },
      { category: 'Middle', maxWeight: 65 },
      { category: 'Heavy', maxWeight: 999 },
    ],
    Female: [
      { category: 'Fin', maxWeight: 29 },
      { category: 'Fly', maxWeight: 33 },
      { category: 'Bantam', maxWeight: 37 },
      { category: 'Feather', maxWeight: 41 },
      { category: 'Light', maxWeight: 44 },
      { category: 'Light Welter', maxWeight: 47 },
      { category: 'Welter', maxWeight: 51 },
      { category: 'Light Middle', maxWeight: 55 },
      { category: 'Middle', maxWeight: 59 },
      { category: 'Heavy', maxWeight: 999 },
    ]
  },
  junior: {
    Male: [
      { category: 'Fin', maxWeight: 45 },
      { category: 'Fly', maxWeight: 48 },
      { category: 'Bantam', maxWeight: 51 },
      { category: 'Feather', maxWeight: 55 },
      { category: 'Light', maxWeight: 59 },
      { category: 'Light Welter', maxWeight: 63 },
      { category: 'Welter', maxWeight: 68 },
      { category: 'Light Middle', maxWeight: 73 },
      { category: 'Middle', maxWeight: 78 },
      { category: 'Heavy', maxWeight: 999 },
    ],
    Female: [
      { category: 'Fin', maxWeight: 42 },
      { category: 'Fly', maxWeight: 44 },
      { category: 'Bantam', maxWeight: 46 },
      { category: 'Feather', maxWeight: 49 },
      { category: 'Light', maxWeight: 52 },
      { category: 'Light Welter', maxWeight: 55 },
      { category: 'Welter', maxWeight: 59 },
      { category: 'Light Middle', maxWeight: 63 },
      { category: 'Middle', maxWeight: 68 },
      { category: 'Heavy', maxWeight: 999 },
    ]
  },
  senior: {
    Male: [
      { category: 'Fin', maxWeight: 54 },
      { category: 'Fly', maxWeight: 58 },
      { category: 'Bantam', maxWeight: 63 },
      { category: 'Feather', maxWeight: 68 },
      { category: 'Light', maxWeight: 74 },
      { category: 'Welter', maxWeight: 80 },
      { category: 'Middle', maxWeight: 87 },
      { category: 'Heavy', maxWeight: 999 },
    ],
    Female: [
      { category: 'Fin', maxWeight: 46 },
      { category: 'Fly', maxWeight: 49 },
      { category: 'Bantam', maxWeight: 53 },
      { category: 'Feather', maxWeight: 57 },
      { category: 'Light', maxWeight: 62 },
      { category: 'Welter', maxWeight: 67 },
      { category: 'Middle', maxWeight: 73 },
      { category: 'Heavy', maxWeight: 999 },
    ]
  }
};

export const WEIGHT_CLASSES_DISPLAY_DATA: Record<string, WeightClassDisplay[]> = {
  super_cadet: [
    { name: 'Fin', male: '≤ 20kg', female: '≤ 18kg' },
    { name: 'Fly', male: '< 23kg', female: '< 21kg' },
    { name: 'Bantam', male: '< 26kg', female: '< 24kg' },
    { name: 'Feather', male: '< 29kg', female: '< 27kg' },
    { name: 'Light', male: '< 32kg', female: '< 30kg' },
    { name: 'Welter', male: '< 36kg', female: '< 34kg' },
    { name: 'Middle', male: '< 40kg', female: '< 38kg' },
    { name: 'Heavy', male: '> 40kg', female: '> 38kg' },
  ],
  cadet: [
    { name: 'Fin', male: '≤ 33kg', female: '≤ 29kg' },
    { name: 'Fly', male: '33.1 - 37kg', female: '29.1 - 33kg' },
    { name: 'Bantam', male: '37.1 - 41kg', female: '33.1 - 37kg' },
    { name: 'Feather', male: '41.1 - 45kg', female: '37.1 - 41kg' },
    { name: 'Light', male: '45.1 - 49kg', female: '41.1 - 44kg' },
    { name: 'Light Welter', male: '49.1 - 53kg', female: '44.1 - 47kg' },
    { name: 'Welter', male: '53.1 - 57kg', female: '47.1 - 51kg' },
    { name: 'Light Middle', male: '57.1 - 61kg', female: '51.1 - 55kg' },
    { name: 'Middle', male: '61.1 - 65kg', female: '55.1 - 59kg' },
    { name: 'Heavy', male: '> 65kg', female: '> 59kg' },
  ],
  junior: [
    { name: 'Fin', male: '≤ 45kg', female: '≤ 42kg' },
    { name: 'Fly', male: '45.1 - 48kg', female: '42.1 - 44kg' },
    { name: 'Bantam', male: '48.1 - 51kg', female: '44.1 - 46kg' },
    { name: 'Feather', male: '51.1 - 55kg', female: '46.1 - 49kg' },
    { name: 'Light', male: '55.1 - 59kg', female: '49.1 - 52kg' },
    { name: 'Light Welter', male: '59.1 - 63kg', female: '52.1 - 55kg' },
    { name: 'Welter', male: '63.1 - 68kg', female: '55.1 - 59kg' },
    { name: 'Light Middle', male: '68.1 - 73kg', female: '59.1 - 63kg' },
    { name: 'Middle', male: '73.1 - 78kg', female: '63.1 - 68kg' },
    { name: 'Heavy', male: '> 78kg', female: '> 68kg' },
  ],
  senior: [
    { name: 'Fin', male: '≤ 54kg', female: '≤ 46kg' },
    { name: 'Fly', male: '54.1 - 58kg', female: '46.1 - 49kg' },
    { name: 'Bantam', male: '58.1 - 63kg', female: '49.1 - 53kg' },
    { name: 'Feather', male: '63.1 - 68kg', female: '53.1 - 57kg' },
    { name: 'Light', male: '68.1 - 74kg', female: '57.1 - 62kg' },
    { name: 'Welter', male: '74.1 - 80kg', female: '62.1 - 67kg' },
    { name: 'Middle', male: '80.1 - 87kg', female: '67.1 - 73kg' },
    { name: 'Heavy', male: '> 87kg', female: '> 73kg' },
  ],
};
