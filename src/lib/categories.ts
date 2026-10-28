import React from 'react';
import {
  Wine,
  UtensilsCrossed,
  Wheat,
  Coffee,
  Sparkles,
  Cookie,
  Milk,
  Boxes,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

export interface CategoryMeta {
  id: string;
  name: string;
  shortLabel: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  activeBgColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export const CATEGORIES_CONFIG: CategoryMeta[] = [
  {
    id: 'all',
    name: 'ທຸກໝວດໝູ່',
    shortLabel: 'ທັງໝົດ',
    icon: Boxes,
    color: 'text-slate-800',
    bgColor: 'bg-slate-100 hover:bg-slate-200',
    activeBgColor: 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20',
    borderColor: 'border-slate-300',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-700',
    description: 'ສິນຄ້າທັງໝົດໃນຮ້ານ',
  },
  {
    id: 'drinks',
    name: 'ເຄື່ອງດື່ມ',
    shortLabel: 'ເຄື່ອງດື່ມ',
    icon: Wine,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100',
    activeBgColor: 'bg-cyan-600 text-white shadow-sm ring-2 ring-cyan-500/30',
    borderColor: 'border-cyan-200',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    description: 'ເບຍລາວ, ນ້ຳດື່ມ, ນ້ຳອັດລົມ',
  },
  {
    id: 'food',
    name: 'ອາຫານ & ເຄື່ອງປຸງ',
    shortLabel: 'ອາຫານ',
    icon: UtensilsCrossed,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    activeBgColor: 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/30',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    description: 'ໝີ່, ນ້ຳມັນພືດ, ນ້ຳຕານ, ເກືອ, ປາແດກ',
  },
  {
    id: 'rice',
    name: 'ເຂົ້າສານ & ທັນຍາພືດ',
    shortLabel: 'ເຂົ້າສານ',
    icon: Wheat,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    activeBgColor: 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    description: 'ເຂົ້າໜຽວ, ເຂົ້າຈ້າວ, ແປ້ງ',
  },
  {
    id: 'coffee',
    name: 'ກາເຟ & ຊາ',
    shortLabel: 'ກາເຟ/ຊາ',
    icon: Coffee,
    color: 'text-amber-900',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    activeBgColor: 'bg-amber-800 text-white shadow-sm ring-2 ring-amber-700/30',
    borderColor: 'border-amber-300',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-amber-900',
    description: 'ກາເຟດາວ 3in1, ຊາຂຽວ, ຄຣີມທຽມ',
  },
  {
    id: 'household',
    name: 'ຂອງໃຊ້ໃນເຮືອນ',
    shortLabel: 'ຂອງໃຊ້',
    icon: Sparkles,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    activeBgColor: 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-500/30',
    borderColor: 'border-purple-200',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    description: 'ແຟັບ, ນ້ຳຢາລ້າງຈານ, ສະບູ',
  },
  {
    id: 'snacks',
    name: 'ຂະໜົມ & ຂອງຫວານ',
    shortLabel: 'ຂະໜົມ',
    icon: Cookie,
    color: 'text-pink-700',
    bgColor: 'bg-pink-50 hover:bg-pink-100',
    activeBgColor: 'bg-pink-600 text-white shadow-sm ring-2 ring-pink-500/30',
    borderColor: 'border-pink-200',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-800',
    description: 'ບິສກິດ, ມັນຝຣັ່ງທອດ, ລູກອົມ',
  },
  {
    id: 'dairy',
    name: 'ນົມ & ຜະລິດຕະພັນນົມ',
    shortLabel: 'ນົມ',
    icon: Milk,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    activeBgColor: 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30',
    borderColor: 'border-blue-200',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    description: 'ນົມຂົ້ນຫວານ, ນົມ UHT, ນົມສົ້ມ',
  },
];

export const getCategoryMeta = (categoryName: string): CategoryMeta => {
  const normalized = categoryName.trim().toLowerCase();

  const found = CATEGORIES_CONFIG.find(
    (c) =>
      c.name.toLowerCase() === normalized ||
      c.id === normalized ||
      (normalized === 'all' && c.id === 'all')
  );

  if (found) return found;

  // Fuzzy match keywords
  if (normalized.includes('ດື່ມ') || normalized.includes('ເບຍ') || normalized.includes('ນ້ຳ')) {
    return CATEGORIES_CONFIG[1];
  }
  if (normalized.includes('ອາຫານ') || normalized.includes('ປຸງ') || normalized.includes('ໝີ່')) {
    return CATEGORIES_CONFIG[2];
  }
  if (normalized.includes('ເຂົ້າ') || normalized.includes('ສານ') || normalized.includes('ເຂົ້າໜຽວ')) {
    return CATEGORIES_CONFIG[3];
  }
  if (normalized.includes('ກາເຟ') || normalized.includes('ຊາ')) {
    return CATEGORIES_CONFIG[4];
  }
  if (normalized.includes('ໃຊ້') || normalized.includes('ແຟັບ') || normalized.includes('ຊັກ')) {
    return CATEGORIES_CONFIG[5];
  }
  if (normalized.includes('ຂະໜົມ') || normalized.includes('ຫວານ')) {
    return CATEGORIES_CONFIG[6];
  }
  if (normalized.includes('ນົມ')) {
    return CATEGORIES_CONFIG[7];
  }

  // Fallback
  return {
    id: 'other',
    name: categoryName,
    shortLabel: categoryName,
    icon: HelpCircle,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100 hover:bg-slate-200',
    activeBgColor: 'bg-slate-800 text-white shadow-sm',
    borderColor: 'border-slate-200',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-700',
    description: 'ສິນຄ້າທົ່ວໄປ',
  };
};

export const PRESET_CATEGORY_OPTIONS = [
  'ເຄື່ອງດື່ມ',
  'ອາຫານ & ເຄື່ອງປຸງ',
  'ເຂົ້າສານ & ທັນຍາພືດ',
  'ກາເຟ & ຊາ',
  'ຂອງໃຊ້ໃນເຮືອນ',
  'ຂະໜົມ & ຂອງຫວານ',
  'ນົມ & ຜະລິດຕະພັນນົມ',
  'ອື່ນໆ',
];
