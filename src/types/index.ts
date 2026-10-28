export type Role = 'admin' | 'manager' | 'cashier';

export type CustomerType = 'general' | 'retail' | 'wholesale';

export type OrderType = 'retail' | 'wholesale';

export type PaymentMethod = 'cash' | 'transfer' | 'credit' | 'split';

export type Currency = 'LAK' | 'THB' | 'USD' | 'VND';

export interface UnitConversion {
  name: string;        // e.g., 'ອັນ', 'ແພັກ', 'ລັງ', 'ກ່ອງ'
  factor: number;      // e.g., 1 for base, 6 for pack, 24 for carton
  retailPrice: number; // LAK price for this unit
  wholesalePrice: number; // LAK price for wholesale
  barcode?: string;
  isBase?: boolean;
}

export interface VolumePriceTier {
  minQty: number; // min quantity in base unit
  unitPrice: number; // price per base unit in LAK
  label?: string; // e.g. "ຊື້ 10 ຂຶ້ນໄປ"
}

export interface Product {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category: string;
  imageUrl?: string;
  baseUnit: string; // 'ອັນ', 'ກ່ອງ', 'ຂວດ'
  costPrice: number; // ຕົ້ນທຶນ per base unit in LAK
  retailPrice: number; // ລາຄາຂາຍຍ່ອຍ per base unit in LAK
  wholesalePrice: number; // ລາຄາຂາຍສົ່ງ per base unit in LAK
  wholesaleMinQty: number; // ຈຳນວນຂັ້ນຕ່ຳເພື່ອໄດ້ລາຄາສົ່ງ (in base unit)
  stockQty: number; // Available inventory in base unit
  minStockAlert: number; // Alert threshold in base unit
  units: UnitConversion[]; // Available units (ອັນ, ແພັກ, ລັງ)
  volumePrices?: VolumePriceTier[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  type: CustomerType;
  creditLimit: number; // ວົງເງິນສິນເຊື່ອສູງສຸດ in LAK
  currentDebt: number; // ຍອດໜີ້ຄ້າງຊຳລະ in LAK
  paymentTermsDays: number; // ໄລຍະເວລາໃຫ້ເຄຣດິດ (ມື້)
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  totalPayable: number; // ໜີ້ທີ່ຕ້ອງຈ່າຍໃຫ້ຜູ້ສະໜອງ in LAK
  notes?: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  productCode: string;
  productName: string;
  selectedUnit: string; // 'ອັນ', 'ແພັກ', 'ລັງ'
  factor: number; // how many base units this unit represents
  qty: number; // quantity in chosen unit
  baseQty: number; // qty * factor
  unitPrice: number; // price per selected unit
  costPrice: number; // cost per selected unit (costPricePerBase * factor)
  discount: number; // discount per unit or total for item
  subtotal: number; // (unitPrice * qty) - discount
  wholesaleApplied?: boolean;
}

export interface SaleOrder {
  id: string;
  invoiceNo: string;
  orderType: OrderType;
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  date: string; // ISO string
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  costTotal: number;
  profit: number; // total - costTotal
  paymentMethod: PaymentMethod;
  splitDetails?: {
    cash: number;
    transfer: number;
  };
  amountPaid: number;
  change: number;
  debtAmount: number; // Remaining debt if credit/partial
  status: 'completed' | 'pending_credit' | 'voided';
  voidReason?: string;
  cashierId: string;
  cashierName: string;
  notes?: string;
  quotationNo?: string;
  dueDate?: string;
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'inbound' | 'sale' | 'sale_return' | 'supplier_return' | 'adjustment' | 'physical_audit';
  qtyChange: number; // in base unit (+ or -)
  unit: string;
  balanceAfter: number;
  referenceNo: string; // InvoiceNo or PO number
  note?: string;
  operatorId: string;
  operatorName: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  unit: string;
  factor: number;
  qty: number;
  baseQty: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  amountPaid: number;
  debtAmount: number; // unpaid payable
  status: 'received' | 'pending' | 'returned';
  notes?: string;
  operatorName: string;
}

export interface IncomeExpense {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string; // 'transport' | 'rent' | 'electricity' | 'salary' | 'packaging' | 'other'
  amount: number;
  paymentMethod: 'cash' | 'transfer';
  reference?: string;
  notes?: string;
  createdBy: string;
}

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  pin: string; // 4-6 digit quick PIN
  role: Role;
  permissions: string[];
  active: boolean;
  avatar?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  target: string;
  details: string;
}

export interface AppSettings {
  storeName: string;
  storeBranch: string;
  phone: string;
  address: string;
  taxId: string;
  receiptFooter: string;
  defaultCurrency: Currency;
  exchangeRates: {
    THB: number; // e.g., 680 LAK per 1 THB
    USD: number; // e.g., 22000 LAK per 1 USD
    VND: number; // e.g., 0.88 LAK per 1 VND
  };
  qrAccountName: string;
  qrAccountNumber: string;
  qrBankName: string;
}
