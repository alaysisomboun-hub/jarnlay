import { Role, StaffUser, MenuPermission, ActionPermission } from '../types';

export interface RoleDefinition {
  id: Role;
  nameLao: string;
  nameEn: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  defaultMenus: MenuPermission[];
  defaultActions: ActionPermission[];
}

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  admin: {
    id: 'admin',
    nameLao: 'ຜູ້ດູແລລະບົບ (Admin / ເຈົ້າຂອງຮ້ານ)',
    nameEn: 'Super Admin / Store Owner',
    description: 'ສິດສູງສຸດ: ເຂົ້າເຖິງທຸກເມນູ, ຈັດການພະນັກງານ, ເບິ່ງລາຍງານການເງິນ ແລະ ຕັ້ງຄ່າຮ້ານ',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    dotColor: 'bg-purple-500',
    defaultMenus: [
      'dashboard',
      'retail-pos',
      'wholesale-pos',
      'products',
      'stock',
      'customers',
      'suppliers',
      'finance',
      'reports',
      'staff',
      'settings',
    ],
    defaultActions: [
      'canVoidSale',
      'canEditPrice',
      'canViewCost',
      'canExportData',
      'canManageUsers',
    ],
  },
  manager: {
    id: 'manager',
    nameLao: 'ຜູ້ຈັດການຮ້ານ (Manager)',
    nameEn: 'Store Manager',
    description: 'ສິດຈັດການ: ຂາຍໜ້າຮ້ານ, ຄຸມສະຕັອກສິນຄ້າ, ຄຸມລູກໜີ້-ເຈົ້າໜີ້ ແລະ ເບິ່ງລາຍງານການເງິນ',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-500',
    defaultMenus: [
      'dashboard',
      'retail-pos',
      'wholesale-pos',
      'products',
      'stock',
      'customers',
      'suppliers',
      'finance',
      'reports',
    ],
    defaultActions: [
      'canVoidSale',
      'canEditPrice',
      'canViewCost',
      'canExportData',
    ],
  },
  cashier: {
    id: 'cashier',
    nameLao: 'ພະນັກງານຂາຍໜ້າຮ້ານ (Cashier / Sales)',
    nameEn: 'Cashier & Counter Sales',
    description: 'ສິດຂາຍສິນຄ້າ: ຂາຍຍ່ອຍ, ຂາຍສົ່ງ ແລະ ຄົ້ນຫາລູກຄ້າ (ບໍ່ເຫັນຕົ້ນທຶນ ຫຼື ລາຍງານການເງິນ)',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    defaultMenus: [
      'retail-pos',
      'wholesale-pos',
      'customers',
    ],
    defaultActions: [
      'canEditPrice',
    ],
  },
  stock: {
    id: 'stock',
    nameLao: 'ພະນັກງານສາງ & ສະຕັອກ (Inventory / Stock)',
    nameEn: 'Warehouse & Stock Keeper',
    description: 'ສິດຈັດການສາງ: ກວດນັບສະຕັອກ, ຮັບສິນຄ້າເຂົ້າສາງ, ເບິ່ງລາຍການສິນຄ້າ ແລະ ຜູ້ສະໜອງ',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
    defaultMenus: [
      'stock',
      'products',
      'suppliers',
    ],
    defaultActions: [
      'canEditPrice',
    ],
  },
  accountant: {
    id: 'accountant',
    nameLao: 'ພະນັກງານບັນຊີ & ການເງິນ (Accountant)',
    nameEn: 'Accountant & Finance',
    description: 'ສິດການເງິນ: ບັນທຶກລາຍຮັບ-ລາຍຈ່າຍ, ເບິ່ງບົດລາຍງານການເງິນ, ຍອດລູກໜີ້ ແລະ ເຈົ້າໜີ້',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    badgeBorder: 'border-cyan-200',
    dotColor: 'bg-cyan-500',
    defaultMenus: [
      'dashboard',
      'finance',
      'reports',
      'customers',
      'suppliers',
    ],
    defaultActions: [
      'canViewCost',
      'canExportData',
    ],
  },
};

export interface PermissionItem {
  id: MenuPermission;
  labelLao: string;
  labelEn: string;
  category: string;
}

export const MENU_PERMISSIONS_LIST: PermissionItem[] = [
  { id: 'dashboard', labelLao: 'ໜ້າຫຼັກ Dashboard', labelEn: 'Dashboard Overview', category: 'ທົ່ວໄປ' },
  { id: 'retail-pos', labelLao: 'ຂາຍຍ່ອຍ Retail POS', labelEn: 'Retail POS', category: 'ການຂາຍ' },
  { id: 'wholesale-pos', labelLao: 'ຂາຍສົ່ງ Wholesale POS', labelEn: 'Wholesale POS', category: 'ການຂາຍ' },
  { id: 'products', labelLao: 'ຈັດການສິນຄ້າ', labelEn: 'Product Catalog', category: 'ສິນຄ້າ & ສະຕັອກ' },
  { id: 'stock', labelLao: 'ສະຕັອກສິນຄ້າ & ນຳເຂົ້າ', labelEn: 'Stock Management', category: 'ສິນຄ້າ & ສະຕັອກ' },
  { id: 'customers', labelLao: 'ລູກຄ້າ & ລູກໜີ້', labelEn: 'Customers & Receivables', category: 'ຄູ່ຄ້າ' },
  { id: 'suppliers', labelLao: 'ຜູ້ສະໜອງ & ເຈົ້າໜີ້', labelEn: 'Suppliers & Payables', category: 'ຄູ່ຄ້າ' },
  { id: 'finance', labelLao: 'ລາຍຮັບ - ລາຍຈ່າຍ', labelEn: 'Income & Expenses', category: 'ການເງິນ' },
  { id: 'reports', labelLao: 'ລາຍງານການເງິນ & ກຳໄລ', labelEn: 'Financial Reports', category: 'ການເງິນ' },
  { id: 'staff', labelLao: 'ພະນັກງານ & ສິດທິ RBAC', labelEn: 'Staff & Permissions', category: 'ລະບົບ' },
  { id: 'settings', labelLao: 'ຕັ້ງຄ່າຮ້ານຄ້າ & ລະບົບ', labelEn: 'Store & System Settings', category: 'ລະບົບ' },
];

export interface ActionItem {
  id: ActionPermission;
  labelLao: string;
  description: string;
}

export const ACTION_PERMISSIONS_LIST: ActionItem[] = [
  { id: 'canVoidSale', labelLao: 'ສິດຍົກເລີກບິນ (Void Sale)', description: 'ສາມາດຍົກເລີກບິນທີ່ຂາຍແລ້ວ ແລະ ຄືນສະຕັອກອັດຕະໂນມັດ' },
  { id: 'canEditPrice', labelLao: 'ສິດແກ້ໄຂ / ຫຼຸດລາຄາ', description: 'ສາມາດໃຫ້ສ່ວນຫຼຸດ ຫຼື ປັບລາຄາພິເສດໜ້າຮ້ານ' },
  { id: 'canViewCost', labelLao: 'ສິດເບິ່ງຕົ້ນທຶນ ແລະ ກຳໄລ', description: 'ສາມາດເບິ່ງລາຄາຕົ້ນທຶນ ແລະ ຍອດກຳໄລສຸດທິ' },
  { id: 'canExportData', labelLao: 'ສິດ Export ຂໍ້ມູນ Excel/JSON', description: 'ສາມາດດາວໂຫຼດ ຫຼື Export ຂໍ້ມູນອອກນອກລະບົບ' },
  { id: 'canManageUsers', labelLao: 'ສິດຈັດການພະນັກງານ & ລະຫັດ PIN', description: 'ສາມາດເພີ່ມ, ແກ້ໄຂ ຫຼື ຕັ້ງສິດທິພະນັກງານຄົນອື່ນ' },
];

/**
 * Checks if a staff user has permission to access a specific menu.
 */
export function hasMenuAccess(user: StaffUser | null | undefined, menuId: string): boolean {
  if (!user || !user.active) return false;

  // Admin always has access to everything
  if (user.role === 'admin' || user.permissions.includes('all')) {
    return true;
  }

  // Check explicit permissions array
  if (user.permissions.includes(menuId)) {
    return true;
  }

  // Fallback to role definition defaults if permissions array is empty or partial
  const def = ROLE_DEFINITIONS[user.role];
  if (def && def.defaultMenus.includes(menuId as MenuPermission)) {
    return true;
  }

  return false;
}

/**
 * Checks if a staff user has permission for a specific action (e.g. void sale, view cost).
 */
export function hasActionPermission(user: StaffUser | null | undefined, action: ActionPermission): boolean {
  if (!user || !user.active) return false;

  if (user.role === 'admin' || user.permissions.includes('all')) {
    return true;
  }

  if (user.permissions.includes(action)) {
    return true;
  }

  const def = ROLE_DEFINITIONS[user.role];
  if (def && def.defaultActions.includes(action)) {
    return true;
  }

  return false;
}

/**
 * Gets all menu IDs accessible by the user.
 */
export function getAllowedMenus(user: StaffUser | null | undefined): string[] {
  if (!user || !user.active) return ['retail-pos'];

  if (user.role === 'admin' || user.permissions.includes('all')) {
    return MENU_PERMISSIONS_LIST.map((m) => m.id);
  }

  const allowed = new Set<string>();

  // Add from user.permissions that match menu keys
  user.permissions.forEach((p) => {
    if (MENU_PERMISSIONS_LIST.some((m) => m.id === p)) {
      allowed.add(p);
    }
  });

  // Add from default role permissions
  const def = ROLE_DEFINITIONS[user.role];
  if (def) {
    def.defaultMenus.forEach((m) => allowed.add(m));
  }

  return Array.from(allowed);
}

/**
 * Returns the default home tab for a given user role.
 */
export function getDefaultTabForRole(role: Role): string {
  switch (role) {
    case 'cashier':
      return 'retail-pos';
    case 'stock':
      return 'stock';
    case 'accountant':
      return 'finance';
    case 'manager':
    case 'admin':
    default:
      return 'dashboard';
  }
}
