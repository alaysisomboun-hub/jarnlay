import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Product,
  Customer,
  Supplier,
  SaleOrder,
  StockMovement,
  IncomeExpense,
  StaffUser,
  AppSettings,
  AuditLog,
  CartItem,
  Currency,
  Role,
} from '../types';
import {
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialSales,
  initialExpenses,
  initialStockMovements,
  initialStaff,
  initialSettings,
  initialAuditLogs,
} from '../lib/initialData';

interface PosContextType {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => boolean;
  
  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => boolean;
  payCustomerDebt: (customerId: string, amount: number, paymentMethod: 'cash' | 'transfer', notes?: string) => void;

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => boolean;
  paySupplierDebt: (supplierId: string, amount: number, paymentMethod: 'cash' | 'transfer', notes?: string) => void;

  // Sales Orders & POS
  sales: SaleOrder[];
  completeSale: (saleData: Omit<SaleOrder, 'id' | 'invoiceNo' | 'date' | 'status' | 'costTotal' | 'profit'>) => SaleOrder;
  voidSale: (invoiceId: string, reason: string) => boolean;

  // Stock Management
  stockMovements: StockMovement[];
  receiveStock: (data: {
    supplierId?: string;
    supplierName?: string;
    items: Array<{ productId: string; unit: string; factor: number; qty: number; unitCost: number }>;
    totalAmount: number;
    amountPaid: number;
    referenceNo: string;
    notes?: string;
  }) => void;
  adjustStock: (productId: string, newQty: number, reason: string) => void;
  processStockReturn: (data: {
    type: 'customer_return' | 'supplier_return';
    productId: string;
    unit: string;
    factor: number;
    qty: number;
    amount: number;
    referenceNo: string;
    notes?: string;
    customerId?: string;
    supplierId?: string;
  }) => void;
  reconcileAudit: (productId: string, physicalCount: number, notes?: string) => void;

  // Income & Expenses
  incomeExpenses: IncomeExpense[];
  addIncomeExpense: (entry: Omit<IncomeExpense, 'id' | 'date' | 'createdBy'>) => void;
  deleteIncomeExpense: (id: string) => void;

  // Staff & Permissions
  staffList: StaffUser[];
  currentUser: StaffUser;
  switchUser: (pin: string) => boolean;
  setCurrentUserDirectly: (user: StaffUser) => void;
  addStaff: (staff: Omit<StaffUser, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<StaffUser>) => void;

  // Settings & System
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  selectedCurrency: Currency;
  setSelectedCurrency: (c: Currency) => void;
  formatMoney: (amountInLak: number, targetCurrency?: Currency) => string;
  auditLogs: AuditLog[];
  logAudit: (action: string, target: string, details: string) => void;

  // Backup & Reset
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonString: string) => boolean;
  resetToDefaults: () => void;

  // Real-time Multi-Device Sync
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime: number | null;
  syncNow: () => Promise<void>;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'laopos_products_v1',
  CUSTOMERS: 'laopos_customers_v1',
  SUPPLIERS: 'laopos_suppliers_v1',
  SALES: 'laopos_sales_v1',
  EXPENSES: 'laopos_expenses_v1',
  STOCK_MOVEMENTS: 'laopos_stock_mov_v1',
  STAFF: 'laopos_staff_v1',
  SETTINGS: 'laopos_settings_v1',
  AUDIT: 'laopos_audit_v1',
  CURRENT_USER_ID: 'laopos_active_user_v1',
};

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load helper
  const loadState = <T,>(key: string, fallback: T): T => {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(`Error loading key ${key}:`, e);
    }
    return fallback;
  };

  const [products, setProducts] = useState<Product[]>(() => loadState(STORAGE_KEYS.PRODUCTS, initialProducts));
  const [customers, setCustomers] = useState<Customer[]>(() => loadState(STORAGE_KEYS.CUSTOMERS, initialCustomers));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadState(STORAGE_KEYS.SUPPLIERS, initialSuppliers));
  const [sales, setSales] = useState<SaleOrder[]>(() => loadState(STORAGE_KEYS.SALES, initialSales));
  const [incomeExpenses, setIncomeExpenses] = useState<IncomeExpense[]>(() => loadState(STORAGE_KEYS.EXPENSES, initialExpenses));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => loadState(STORAGE_KEYS.STOCK_MOVEMENTS, initialStockMovements));
  const [staffList, setStaffList] = useState<StaffUser[]>(() => loadState(STORAGE_KEYS.STAFF, initialStaff));
  const [settings, setSettings] = useState<AppSettings>(() => loadState(STORAGE_KEYS.SETTINGS, initialSettings));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState(STORAGE_KEYS.AUDIT, initialAuditLogs));
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('LAK');

  const [currentUser, setCurrentUser] = useState<StaffUser>(() => {
    const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const found = staffList.find((s) => s.id === savedUserId);
    return found || staffList[0] || initialStaff[0];
  });

  // Safe Storage persistence with quota overflow protection and image auto-downscaling
  const safeSaveState = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e: any) {
      console.warn(`LocalStorage quota error on key ${key}:`, e);
      if (key === STORAGE_KEYS.PRODUCTS && Array.isArray(data)) {
        try {
          // If quota is exceeded (e.g. photos captured on mobile phone),
          // strip heavy base64 strings so product records (name, code, price, stock, units) are ALWAYS preserved!
          const compact = data.map((item: Product) => {
            if (item.imageUrl && item.imageUrl.startsWith('data:') && item.imageUrl.length > 25000) {
              return { ...item, imageUrl: '' };
            }
            return item;
          });
          localStorage.setItem(key, JSON.stringify(compact));
          console.info('Safely saved products by trimming oversized image payload.');
        } catch (innerErr) {
          console.error('Critical quota failure in PosContext:', innerErr);
        }
      }
    }
  };

  // Real-Time Multi-Device Sync State
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(() => Date.now());
  const deviceIdRef = useRef<string>('');
  const lastServerTimestampRef = useRef<number>(0);
  const isRemoteUpdateRef = useRef<boolean>(false);
  const isSyncingInFlightRef = useRef<boolean>(false);

  // Initialize unique device id
  useEffect(() => {
    try {
      let id = sessionStorage.getItem('laopos_device_id');
      if (!id) {
        id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        sessionStorage.setItem('laopos_device_id', id);
      }
      deviceIdRef.current = id;
    } catch {
      deviceIdRef.current = `dev_${Date.now()}`;
    }
  }, []);

  // Fetch full sync from server
  const fetchServerSync = async (silent = false) => {
    if (isSyncingInFlightRef.current) return;
    try {
      if (!silent) setSyncStatus('syncing');
      isSyncingInFlightRef.current = true;
      const res = await fetch('/api/sync');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json && json.success && json.data) {
        if (json.lastUpdated > lastServerTimestampRef.current) {
          lastServerTimestampRef.current = json.lastUpdated;
          isRemoteUpdateRef.current = true;
          const d = json.data;
          if (Array.isArray(d.products)) setProducts(d.products);
          if (Array.isArray(d.customers)) setCustomers(d.customers);
          if (Array.isArray(d.suppliers)) setSuppliers(d.suppliers);
          if (Array.isArray(d.sales)) setSales(d.sales);
          if (Array.isArray(d.incomeExpenses)) setIncomeExpenses(d.incomeExpenses);
          if (Array.isArray(d.stockMovements)) setStockMovements(d.stockMovements);
          if (Array.isArray(d.staffList)) setStaffList(d.staffList);
          if (d.settings) setSettings(d.settings);
          if (Array.isArray(d.auditLogs)) setAuditLogs(d.auditLogs);
          setTimeout(() => { isRemoteUpdateRef.current = false; }, 200);
        }
        setSyncStatus('synced');
        setLastSyncTime(Date.now());
      }
    } catch (err) {
      if (!silent) console.warn('Server sync offline, fallback to local-first storage:', err);
      setSyncStatus('offline');
    } finally {
      isSyncingInFlightRef.current = false;
    }
  };

  // Push updates to server so all phones and desktops stay synchronized
  const pushServerSync = async (payload: Record<string, any>) => {
    try {
      setSyncStatus('syncing');
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          sourceDevice: deviceIdRef.current,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.lastUpdated) {
          lastServerTimestampRef.current = json.lastUpdated;
        }
        setSyncStatus('synced');
        setLastSyncTime(Date.now());
      } else {
        setSyncStatus('offline');
      }
    } catch (err) {
      console.warn('Network push error, safely saved to local device:', err);
      setSyncStatus('offline');
    }
  };

  const syncNow = async () => {
    await fetchServerSync(false);
  };

  // Real-time SSE Connection + Periodic Fallback Polling (Every 4 seconds)
  useEffect(() => {
    fetchServerSync(true);

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSse = () => {
      try {
        eventSource = new EventSource('/api/sync/events');

        eventSource.onopen = () => {
          setSyncStatus('synced');
        };

        eventSource.addEventListener('connected', (e: any) => {
          try {
            const data = JSON.parse(e.data);
            if (data.lastUpdated && data.lastUpdated > lastServerTimestampRef.current) {
              fetchServerSync(true);
            }
          } catch {}
        });

        eventSource.addEventListener('sync_update', (e: any) => {
          try {
            const msg = JSON.parse(e.data);
            // Skip own device echo
            if (msg.source === deviceIdRef.current) return;
            if (msg.data) {
              lastServerTimestampRef.current = msg.lastUpdated || Date.now();
              isRemoteUpdateRef.current = true;
              const d = msg.data;
              if (Array.isArray(d.products)) setProducts(d.products);
              if (Array.isArray(d.customers)) setCustomers(d.customers);
              if (Array.isArray(d.suppliers)) setSuppliers(d.suppliers);
              if (Array.isArray(d.sales)) setSales(d.sales);
              if (Array.isArray(d.incomeExpenses)) setIncomeExpenses(d.incomeExpenses);
              if (Array.isArray(d.stockMovements)) setStockMovements(d.stockMovements);
              if (Array.isArray(d.staffList)) setStaffList(d.staffList);
              if (d.settings) setSettings(d.settings);
              if (Array.isArray(d.auditLogs)) setAuditLogs(d.auditLogs);
              setSyncStatus('synced');
              setLastSyncTime(Date.now());
              setTimeout(() => { isRemoteUpdateRef.current = false; }, 200);
            }
          } catch (err) {
            console.error('Error handling sync_update event:', err);
          }
        });

        eventSource.addEventListener('product_updated', (e: any) => {
          try {
            const msg = JSON.parse(e.data);
            if (Array.isArray(msg.allProducts)) {
              lastServerTimestampRef.current = msg.lastUpdated || Date.now();
              isRemoteUpdateRef.current = true;
              setProducts(msg.allProducts);
              setSyncStatus('synced');
              setLastSyncTime(Date.now());
              setTimeout(() => { isRemoteUpdateRef.current = false; }, 200);
            }
          } catch {}
        });

        eventSource.addEventListener('product_deleted', (e: any) => {
          try {
            const msg = JSON.parse(e.data);
            if (Array.isArray(msg.allProducts)) {
              lastServerTimestampRef.current = msg.lastUpdated || Date.now();
              isRemoteUpdateRef.current = true;
              setProducts(msg.allProducts);
              setSyncStatus('synced');
              setLastSyncTime(Date.now());
              setTimeout(() => { isRemoteUpdateRef.current = false; }, 200);
            }
          } catch {}
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          reconnectTimeout = setTimeout(connectSse, 3500);
        };
      } catch (e) {
        reconnectTimeout = setTimeout(connectSse, 5000);
      }
    };

    connectSse();

    // Fallback polling for mobile background wake-up
    const pollTimer = setInterval(() => {
      fetchServerSync(true);
    }, 4000);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollTimer);
    };
  }, []);

  // Sync state to LocalStorage safely
  useEffect(() => { safeSaveState(STORAGE_KEYS.PRODUCTS, products); }, [products]);
  useEffect(() => { safeSaveState(STORAGE_KEYS.CUSTOMERS, customers); }, [customers]);
  useEffect(() => { safeSaveState(STORAGE_KEYS.SUPPLIERS, suppliers); }, [suppliers]);
  useEffect(() => { safeSaveState(STORAGE_KEYS.SALES, sales); }, [sales]);
  useEffect(() => { safeSaveState(STORAGE_KEYS.EXPENSES, incomeExpenses); }, [incomeExpenses]);
  useEffect(() => { safeSaveState(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements); }, [stockMovements]);
  useEffect(() => { safeSaveState(STORAGE_KEYS.STAFF, staffList); }, [staffList]);
  useEffect(() => { safeSaveState(STORAGE_KEYS.SETTINGS, settings); }, [settings]);
  useEffect(() => { safeSaveState(STORAGE_KEYS.AUDIT, auditLogs); }, [auditLogs]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
    } catch (e) {
      console.warn('Could not save current user id', e);
    }
  }, [currentUser]);

  // Push local user changes to server (debounced so rapid typing doesn't spam)
  useEffect(() => {
    if (isRemoteUpdateRef.current) return;
    const t = setTimeout(() => {
      pushServerSync({ products });
    }, 400);
    return () => clearTimeout(t);
  }, [products]);

  useEffect(() => {
    if (isRemoteUpdateRef.current) return;
    const t = setTimeout(() => {
      pushServerSync({ sales, stockMovements, customers, suppliers, incomeExpenses });
    }, 600);
    return () => clearTimeout(t);
  }, [sales, stockMovements, customers, suppliers, incomeExpenses]);

  // Sync across tabs/windows on the same device
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.PRODUCTS && e.newValue) {
        try {
          const fresh = JSON.parse(e.newValue);
          if (Array.isArray(fresh)) setProducts(fresh);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Audit logger
  const logAudit = (action: string, target: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      target,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Currency Converter Formatter
  const formatMoney = (amountInLak: number, targetCurrency: Currency = selectedCurrency): string => {
    if (isNaN(amountInLak)) amountInLak = 0;
    if (targetCurrency === 'LAK') {
      return `${amountInLak.toLocaleString('lo-LA')} ₭`;
    }
    if (targetCurrency === 'THB') {
      const thb = amountInLak / (settings.exchangeRates.THB || 685);
      return `฿ ${thb.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (targetCurrency === 'USD') {
      const usd = amountInLak / (settings.exchangeRates.USD || 22150);
      return `$ ${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (targetCurrency === 'VND') {
      const vnd = amountInLak / (settings.exchangeRates.VND || 0.88);
      return `${Math.round(vnd).toLocaleString('vi-VN')} ₫`;
    }
    return `${amountInLak.toLocaleString('lo-LA')} ₭`;
  };

  // Product Actions
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => {
      const updated = [newProduct, ...prev];
      // Immediately write to storage to guarantee persistence across mobile page navigation
      safeSaveState(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });
    logAudit('ເພີ່ມສິນຄ້າໃໝ່ (Create Product)', newProduct.code, `ເພີ່ມສິນຄ້າ: ${newProduct.name}`);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          return { ...p, ...updates, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      safeSaveState(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });
    const prod = products.find((p) => p.id === id);
    logAudit('ແກ້ໄຂສິນຄ້າ (Edit Product)', prod?.code || id, `ອັບເດດຂໍ້ມູນສິນຄ້າ ${prod?.name || ''}`);
  };

  const deleteProduct = (id: string): boolean => {
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      safeSaveState(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });
    logAudit('ລຶບສິນຄ້າ (Delete Product)', prod?.code || id, `ລຶບສິນຄ້າ ${prod?.name || ''}`);
    return true;
  };

  // Customer Actions
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCust: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    logAudit('ເພີ່ມລູກຄ້າໃໝ່ (Add Customer)', newCust.code, `ເພີ່ມລູກຄ້າ: ${newCust.name} (${newCust.type})`);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    const cust = customers.find((c) => c.id === id);
    logAudit('ແກ້ໄຂຂໍ້ມູນລູກຄ້າ (Edit Customer)', cust?.code || id, `ແກ້ໄຂ: ${cust?.name || ''}`);
  };

  const deleteCustomer = (id: string): boolean => {
    const cust = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    logAudit('ລຶບຂໍ້ມູນລູກຄ້າ (Delete Customer)', cust?.code || id, `ລຶບລູກຄ້າ ${cust?.name || ''}`);
    return true;
  };

  const payCustomerDebt = (customerId: string, amount: number, paymentMethod: 'cash' | 'transfer', notes?: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newDebt = Math.max(0, c.currentDebt - amount);
          return { ...c, currentDebt: newDebt };
        }
        return c;
      })
    );

    const cust = customers.find((c) => c.id === customerId);

    // Record as Income
    const incomeEntry: IncomeExpense = {
      id: `inc-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'income',
      category: 'ຮັບຊຳລະໜີ້ລູກຄ້າ',
      amount,
      paymentMethod,
      reference: `DEBT-PAY-${cust?.code || 'CUST'}`,
      notes: notes || `ຮັບຊຳລະໜີ້ຈາກ ${cust?.name || ''}`,
      createdBy: currentUser.name,
    };
    setIncomeExpenses((prev) => [incomeEntry, ...prev]);

    logAudit('ຮັບຊຳລະໜີ້ (Debtor Payment)', cust?.code || customerId, `ຮັບຊຳລະ: ${amount.toLocaleString()} ₭ ຈາກ ${cust?.name}`);
  };

  // Supplier Actions
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSup: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSup, ...prev]);
    logAudit('ເພີ່ມຜູ້ສະໜອງໃໝ່ (Add Supplier)', newSup.code, `ເພີ່ມ: ${newSup.name}`);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    const sup = suppliers.find((s) => s.id === id);
    logAudit('ແກ້ໄຂຜູ້ສະໜອງ (Edit Supplier)', sup?.code || id, `ແກ້ໄຂ: ${sup?.name || ''}`);
  };

  const deleteSupplier = (id: string): boolean => {
    const sup = suppliers.find((s) => s.id === id);
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    logAudit('ລຶບຜູ້ສະໜອງ (Delete Supplier)', sup?.code || id, `ລຶບ: ${sup?.name || ''}`);
    return true;
  };

  const paySupplierDebt = (supplierId: string, amount: number, paymentMethod: 'cash' | 'transfer', notes?: string) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId) {
          const newDebt = Math.max(0, s.totalPayable - amount);
          return { ...s, totalPayable: newDebt };
        }
        return s;
      })
    );

    const sup = suppliers.find((s) => s.id === supplierId);

    // Record as Expense
    const expenseEntry: IncomeExpense = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'expense',
      category: 'ຊຳລະໜີ້ຜູ້ສະໜອງ',
      amount,
      paymentMethod,
      reference: `SUP-PAY-${sup?.code || 'SUP'}`,
      notes: notes || `ຊຳລະໜີ້ຄ່າສິນຄ້າໃຫ້ ${sup?.name || ''}`,
      createdBy: currentUser.name,
    };
    setIncomeExpenses((prev) => [expenseEntry, ...prev]);

    logAudit('ຊຳລະໜີ້ຜູ້ສະໜອງ (Supplier Payment)', sup?.code || supplierId, `ຊຳລະ: ${amount.toLocaleString()} ₭ ໃຫ້ ${sup?.name}`);
  };

  // COMPLETE SALE - Core Business Logic
  const completeSale = (saleData: Omit<SaleOrder, 'id' | 'invoiceNo' | 'date' | 'status' | 'costTotal' | 'profit'>): SaleOrder => {
    const dateNow = new Date();
    const dateStr = dateNow.toISOString();
    const invoicePrefix = saleData.orderType === 'wholesale' ? 'WS' : 'INV';
    const dateFormatted = dateNow.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = `${invoicePrefix}-${dateFormatted}-${randomSuffix}`;

    // Calculate total cost and item costs
    let costTotal = 0;
    saleData.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const baseCost = prod ? prod.costPrice : 0;
      costTotal += baseCost * item.baseQty;
    });

    const profit = Math.max(0, saleData.total - costTotal);

    const newSale: SaleOrder = {
      ...saleData,
      id: `sale-${Date.now()}`,
      invoiceNo,
      date: dateStr,
      costTotal,
      profit,
      status: saleData.debtAmount > 0 ? 'pending_credit' : 'completed',
    };

    // 1. Deduct Stock for all items accurately
    const newStockMovements: StockMovement[] = [];
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItem = saleData.items.find((item) => item.productId === prod.id);
        if (cartItem) {
          const newQty = Math.max(0, prod.stockQty - cartItem.baseQty);
          newStockMovements.push({
            id: `sm-${Date.now()}-${prod.id}`,
            date: dateStr,
            productId: prod.id,
            productName: prod.name,
            type: 'sale',
            qtyChange: -cartItem.baseQty,
            unit: cartItem.selectedUnit,
            balanceAfter: newQty,
            referenceNo: invoiceNo,
            note: `${saleData.orderType === 'wholesale' ? 'ຂາຍສົ່ງ' : 'ຂາຍຍ່ອຍ'} ຈຳນວນ ${cartItem.qty} ${cartItem.selectedUnit}`,
            operatorId: currentUser.id,
            operatorName: currentUser.name,
          });
          return { ...prod, stockQty: newQty };
        }
        return prod;
      })
    );

    if (newStockMovements.length > 0) {
      setStockMovements((prev) => [...newStockMovements, ...prev]);
    }

    // 2. If credit sale, update Customer Debt
    if (saleData.debtAmount > 0 && saleData.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === saleData.customerId) {
            return { ...c, currentDebt: c.currentDebt + saleData.debtAmount };
          }
          return c;
        })
      );
    }

    // 3. Add to sales list
    setSales((prev) => [newSale, ...prev]);

    // 4. Audit Log
    logAudit(
      `ອອກໃບບິນຂາຍ (${newSale.orderType === 'wholesale' ? 'Wholesale' : 'Retail'})`,
      invoiceNo,
      `ຍອດລວມ ${newSale.total.toLocaleString()} ₭, ລູກຄ້າ: ${newSale.customerName}, ຊຳລະ: ${newSale.paymentMethod}`
    );

    return newSale;
  };

  // VOID SALE
  const voidSale = (invoiceId: string, reason: string): boolean => {
    const saleToVoid = sales.find((s) => s.id === invoiceId);
    if (!saleToVoid || saleToVoid.status === 'voided') return false;

    // 1. Restore Stock
    const restoreMovements: StockMovement[] = [];
    const dateStr = new Date().toISOString();

    setProducts((prev) =>
      prev.map((prod) => {
        const item = saleToVoid.items.find((i) => i.productId === prod.id);
        if (item) {
          const newQty = prod.stockQty + item.baseQty;
          restoreMovements.push({
            id: `sm-${Date.now()}-${prod.id}`,
            date: dateStr,
            productId: prod.id,
            productName: prod.name,
            type: 'sale_return',
            qtyChange: item.baseQty,
            unit: item.selectedUnit,
            balanceAfter: newQty,
            referenceNo: `VOID-${saleToVoid.invoiceNo}`,
            note: `ຍົກເລີກບິນ: ${reason}`,
            operatorId: currentUser.id,
            operatorName: currentUser.name,
          });
          return { ...prod, stockQty: newQty };
        }
        return prod;
      })
    );

    if (restoreMovements.length > 0) {
      setStockMovements((prev) => [...restoreMovements, ...prev]);
    }

    // 2. Reverse customer debt if there was credit
    if (saleToVoid.debtAmount > 0 && saleToVoid.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === saleToVoid.customerId) {
            return { ...c, currentDebt: Math.max(0, c.currentDebt - saleToVoid.debtAmount) };
          }
          return c;
        })
      );
    }

    // 3. Update Sale Order status
    setSales((prev) =>
      prev.map((s) => (s.id === invoiceId ? { ...s, status: 'voided', voidReason: reason } : s))
    );

    logAudit('ຍົກເລີກໃບບິນ (Void Sale)', saleToVoid.invoiceNo, `ເຫດຜົນ: ${reason}`);
    return true;
  };

  // RECEIVE STOCK (Inbound Inventory from PO or Direct purchase)
  const receiveStock = (data: {
    supplierId?: string;
    supplierName?: string;
    items: Array<{ productId: string; unit: string; factor: number; qty: number; unitCost: number }>;
    totalAmount: number;
    amountPaid: number;
    referenceNo: string;
    notes?: string;
  }) => {
    const dateStr = new Date().toISOString();
    const movements: StockMovement[] = [];

    // Increase product stock
    setProducts((prev) =>
      prev.map((prod) => {
        const recItem = data.items.find((i) => i.productId === prod.id);
        if (recItem) {
          const addedBase = recItem.qty * recItem.factor;
          const newStock = prod.stockQty + addedBase;
          movements.push({
            id: `sm-${Date.now()}-${prod.id}`,
            date: dateStr,
            productId: prod.id,
            productName: prod.name,
            type: 'inbound',
            qtyChange: addedBase,
            unit: recItem.unit,
            balanceAfter: newStock,
            referenceNo: data.referenceNo,
            note: `ຮັບສິນຄ້າເຂົ້າ ${recItem.qty} ${recItem.unit} ຈາກ ${data.supplierName || 'ຜູ້ສະໜອງ'}`,
            operatorId: currentUser.id,
            operatorName: currentUser.name,
          });
          return { ...prod, stockQty: newStock };
        }
        return prod;
      })
    );

    if (movements.length > 0) {
      setStockMovements((prev) => [...movements, ...prev]);
    }

    // If there is unpaid balance and supplier provided, increase supplier debt
    const unpaidDebt = data.totalAmount - data.amountPaid;
    if (unpaidDebt > 0 && data.supplierId) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === data.supplierId ? { ...s, totalPayable: s.totalPayable + unpaidDebt } : s))
      );
    }

    // If paid cash or transfer, record as expense
    if (data.amountPaid > 0) {
      setIncomeExpenses((prev) => [
        {
          id: `exp-${Date.now()}`,
          date: dateStr,
          type: 'expense',
          category: 'ຊື້ສິນຄ້າເຂົ້າສາງ',
          amount: data.amountPaid,
          paymentMethod: 'transfer',
          reference: data.referenceNo,
          notes: `ຊຳລະຄ່າສິນຄ້າເຂົ້າໃຫ້ ${data.supplierName || 'ຜູ້ສະໜອງ'}`,
          createdBy: currentUser.name,
        },
        ...prev,
      ]);
    }

    logAudit('ຮັບສິນຄ້າເຂົ້າ (Receive Stock)', data.referenceNo, `ຍອດລວມ: ${data.totalAmount.toLocaleString()} ₭, ຜູ້ສະໜອງ: ${data.supplierName || '-'}`);
  };

  // ADJUST STOCK (Manual correction)
  const adjustStock = (productId: string, newQty: number, reason: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const diff = newQty - prod.stockQty;
    const dateStr = new Date().toISOString();

    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stockQty: newQty } : p)));

    setStockMovements((prev) => [
      {
        id: `sm-${Date.now()}`,
        date: dateStr,
        productId: prod.id,
        productName: prod.name,
        type: 'adjustment',
        qtyChange: diff,
        unit: prod.baseUnit,
        balanceAfter: newQty,
        referenceNo: `ADJ-${Date.now().toString().slice(-6)}`,
        note: `ປັບຍອດສະຕັອກ: ${reason} (${diff > 0 ? '+' : ''}${diff} ${prod.baseUnit})`,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
      },
      ...prev,
    ]);

    logAudit('ປັບຍອດສະຕັອກ (Adjust Stock)', prod.code, `ປັບຈາກ ${prod.stockQty} ເປັນ ${newQty} ${prod.baseUnit}. ເຫດຜົນ: ${reason}`);
  };

  // PHYSICAL AUDIT RECONCILIATION
  const reconcileAudit = (productId: string, physicalCount: number, notes?: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const diff = physicalCount - prod.stockQty;
    const dateStr = new Date().toISOString();

    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stockQty: physicalCount } : p)));

    setStockMovements((prev) => [
      {
        id: `sm-${Date.now()}`,
        date: dateStr,
        productId: prod.id,
        productName: prod.name,
        type: 'physical_audit',
        qtyChange: diff,
        unit: prod.baseUnit,
        balanceAfter: physicalCount,
        referenceNo: `AUDIT-${Date.now().toString().slice(-6)}`,
        note: `ກວດນັບສະຕັອກຈິງ: ${notes || 'ກວດນັບປະຈຳງວດ'} (ຕ່າງ ${diff > 0 ? '+' : ''}${diff})`,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
      },
      ...prev,
    ]);

    logAudit('ກວດນັບສະຕັອກຈິງ (Stock Audit)', prod.code, `ລະບົບ ${prod.stockQty} vs ຈິງ ${physicalCount} (ຜົນຕ່າງ ${diff})`);
  };

  // PROCESS STOCK RETURNS (Customer or Supplier)
  const processStockReturn = (data: {
    type: 'customer_return' | 'supplier_return';
    productId: string;
    unit: string;
    factor: number;
    qty: number;
    amount: number;
    referenceNo: string;
    notes?: string;
    customerId?: string;
    supplierId?: string;
  }) => {
    const prod = products.find((p) => p.id === data.productId);
    if (!prod) return;

    const baseChange = data.qty * data.factor;
    const dateStr = new Date().toISOString();

    if (data.type === 'customer_return') {
      // Customer return: stock comes BACK in
      const newStock = prod.stockQty + baseChange;
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, stockQty: newStock } : p)));

      setStockMovements((prev) => [
        {
          id: `sm-${Date.now()}`,
          date: dateStr,
          productId: prod.id,
          productName: prod.name,
          type: 'sale_return',
          qtyChange: baseChange,
          unit: data.unit,
          balanceAfter: newStock,
          referenceNo: data.referenceNo,
          note: `ລູກຄ້າສົ່ງຄືນ: ${data.notes || ''}`,
          operatorId: currentUser.id,
          operatorName: currentUser.name,
        },
        ...prev,
      ]);

      // Deduct customer debt if provided
      if (data.customerId) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === data.customerId ? { ...c, currentDebt: Math.max(0, c.currentDebt - data.amount) } : c))
        );
      }
    } else {
      // Supplier return: stock goes OUT to supplier
      const newStock = Math.max(0, prod.stockQty - baseChange);
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, stockQty: newStock } : p)));

      setStockMovements((prev) => [
        {
          id: `sm-${Date.now()}`,
          date: dateStr,
          productId: prod.id,
          productName: prod.name,
          type: 'supplier_return',
          qtyChange: -baseChange,
          unit: data.unit,
          balanceAfter: newStock,
          referenceNo: data.referenceNo,
          note: `ສົ່ງຄືນຜູ້ສະໜອງ: ${data.notes || ''}`,
          operatorId: currentUser.id,
          operatorName: currentUser.name,
        },
        ...prev,
      ]);

      // Deduct payable to supplier
      if (data.supplierId) {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === data.supplierId ? { ...s, totalPayable: Math.max(0, s.totalPayable - data.amount) } : s))
        );
      }
    }

    logAudit(`ການຄືນສິນຄ້າ (${data.type})`, data.referenceNo, `ຈຳນວນ ${data.qty} ${data.unit}, ມູນຄ່າ ${data.amount.toLocaleString()} ₭`);
  };

  // Income & Expenses
  const addIncomeExpense = (entry: Omit<IncomeExpense, 'id' | 'date' | 'createdBy'>) => {
    const newEntry: IncomeExpense = {
      ...entry,
      id: `iex-${Date.now()}`,
      date: new Date().toISOString(),
      createdBy: currentUser.name,
    };
    setIncomeExpenses((prev) => [newEntry, ...prev]);
    logAudit(
      `ບັນທຶກ${entry.type === 'income' ? 'ລາຍຮັບ' : 'ລາຍຈ່າຍ'} (Finance)`,
      entry.category,
      `ຈຳນວນ: ${entry.amount.toLocaleString()} ₭ (${entry.paymentMethod})`
    );
  };

  const deleteIncomeExpense = (id: string) => {
    setIncomeExpenses((prev) => prev.filter((i) => i.id !== id));
  };

  // Staff & RBAC
  const switchUser = (pin: string): boolean => {
    const matched = staffList.find((s) => s.pin === pin && s.active);
    if (matched) {
      setCurrentUser(matched);
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, matched.id);
      } catch (e) {
        console.error(e);
      }
      logAudit('ເຂົ້າສູ່ລະບົບດ້ວຍ PIN', matched.name, `ບົດບາດ: ${matched.role}`);
      return true;
    }
    return false;
  };

  const setCurrentUserDirectly = (user: StaffUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    } catch (e) {
      console.error(e);
    }
    logAudit('ປ່ຽນຜູ້ໃຊ້ງານ', user.name, `ບົດບາດ: ${user.role}`);
  };

  const addStaff = (staffData: Omit<StaffUser, 'id'>) => {
    const newStaff: StaffUser = {
      ...staffData,
      id: `staff-${Date.now()}`,
    };
    setStaffList((prev) => [...prev, newStaff]);
    logAudit('ເພີ່ມພະນັກງານໃໝ່', newStaff.name, `ບົດບາດ: ${newStaff.role}`);
  };

  const updateStaff = (id: string, updates: Partial<StaffUser>) => {
    setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    const target = staffList.find((s) => s.id === id);
    logAudit('ແກ້ໄຂຂໍ້ມູນພະນັກງານ', target?.name || id, 'ອັບເດດສິດທິ ຫຼື ຂໍ້ມູນ');
  };

  // Settings
  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    logAudit('ປັບປຸງການຕັ້ງຄ່າລະບົບ', 'Settings', 'ອັບເດດຂໍ້ມູນຮ້ານ ຫຼື ອັດຕາແລກປ່ຽນ');
  };

  // Full Database Backup & Restore
  const exportDatabaseJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      store: settings.storeName,
      products,
      customers,
      suppliers,
      sales,
      incomeExpenses,
      stockMovements,
      staffList,
      settings,
      auditLogs,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laopos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logAudit('ສຳຮອງຂໍ້ມູນ (Export Backup)', 'JSON', 'ດາວໂຫຼດໄຟລ໌ສຳຮອງຂໍ້ມູນລະບົບທັງໝົດ');
  };

  const importDatabaseJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && Array.isArray(data.products)) setProducts(data.products);
      if (data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
      if (data.suppliers && Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (data.sales && Array.isArray(data.sales)) setSales(data.sales);
      if (data.incomeExpenses && Array.isArray(data.incomeExpenses)) setIncomeExpenses(data.incomeExpenses);
      if (data.stockMovements && Array.isArray(data.stockMovements)) setStockMovements(data.stockMovements);
      if (data.staffList && Array.isArray(data.staffList)) setStaffList(data.staffList);
      if (data.settings) setSettings(data.settings);
      if (data.auditLogs && Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
      logAudit('ກູ້ຄືນຂໍ້ມູນ (Restore Backup)', 'JSON', 'ກູ້ຄືນຂໍ້ມູນຈາກໄຟລ໌ສຳຮອງສຳເລັດ');
      return true;
    } catch (e) {
      console.error('Failed to import database:', e);
      return false;
    }
  };

  const resetToDefaults = () => {
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setSales(initialSales);
    setIncomeExpenses(initialExpenses);
    setStockMovements(initialStockMovements);
    setStaffList(initialStaff);
    setSettings(initialSettings);
    setAuditLogs(initialAuditLogs);
    setCurrentUser(initialStaff[0]);
    localStorage.clear();
    logAudit('ຣີເຊັດຂໍ້ມູນລະບົບ', 'Default Data', 'ຣີເຊັດເປັນຂໍ້ມູນເລີ່ມຕົ້ນຂອງລະບົບ');
  };

  return (
    <PosContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        payCustomerDebt,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        paySupplierDebt,
        sales,
        completeSale,
        voidSale,
        stockMovements,
        receiveStock,
        adjustStock,
        processStockReturn,
        reconcileAudit,
        incomeExpenses,
        addIncomeExpense,
        deleteIncomeExpense,
        staffList,
        currentUser,
        switchUser,
        setCurrentUserDirectly,
        addStaff,
        updateStaff,
        settings,
        updateSettings,
        selectedCurrency,
        setSelectedCurrency,
        formatMoney,
        auditLogs,
        logAudit,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetToDefaults,
        syncStatus,
        lastSyncTime,
        syncNow,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
};
