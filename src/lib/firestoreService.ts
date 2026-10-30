import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
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
} from '../types';
import {
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialStaff,
  initialSettings,
} from './initialData';

/**
 * Seeds initial data into Firestore if collections are empty.
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      console.info('Seeding initial products to Firestore...');
      for (const prod of initialProducts) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
    }

    const customersSnap = await getDocs(collection(db, 'customers'));
    if (customersSnap.empty) {
      console.info('Seeding initial customers to Firestore...');
      for (const cust of initialCustomers) {
        await setDoc(doc(db, 'customers', cust.id), cust);
      }
    }

    const suppliersSnap = await getDocs(collection(db, 'suppliers'));
    if (suppliersSnap.empty) {
      console.info('Seeding initial suppliers to Firestore...');
      for (const sup of initialSuppliers) {
        await setDoc(doc(db, 'suppliers', sup.id), sup);
      }
    }

    const staffSnap = await getDocs(collection(db, 'staff'));
    if (staffSnap.empty) {
      console.info('Seeding initial staff to Firestore...');
      for (const staff of initialStaff) {
        await setDoc(doc(db, 'staff', staff.id), staff);
      }
    }

    const settingsDoc = await getDoc(doc(db, 'settings', 'store'));
    if (!settingsDoc.exists()) {
      console.info('Seeding initial settings to Firestore...');
      await setDoc(doc(db, 'settings', 'store'), initialSettings);
    }
  } catch (error) {
    console.warn('Firestore initial seeding skipped (offline or existing):', error);
  }
}

/**
 * Subscribes to products collection in real time.
 */
export function subscribeProducts(onChange: (products: Product[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Product);
          });
          onChange(list);
        }
      },
      (err) => console.warn('Firestore products listener error:', err)
    );
  } catch {
    return () => {};
  }
}

/**
 * Subscribes to customers collection in real time.
 */
export function subscribeCustomers(onChange: (customers: Customer[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Customer[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Customer);
          });
          onChange(list);
        }
      },
      (err) => console.warn('Firestore customers listener error:', err)
    );
  } catch {
    return () => {};
  }
}

/**
 * Subscribes to suppliers collection in real time.
 */
export function subscribeSuppliers(onChange: (suppliers: Supplier[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'suppliers'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Supplier[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Supplier);
          });
          onChange(list);
        }
      },
      (err) => console.warn('Firestore suppliers listener error:', err)
    );
  } catch {
    return () => {};
  }
}

/**
 * Subscribes to sales collection in real time.
 */
export function subscribeSales(onChange: (sales: SaleOrder[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'sales'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: SaleOrder[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as SaleOrder);
          });
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          onChange(list);
        }
      },
      (err) => console.warn('Firestore sales listener error:', err)
    );
  } catch {
    return () => {};
  }
}

/**
 * Subscribes to stock movements in real time.
 */
export function subscribeStockMovements(onChange: (movements: StockMovement[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'stockMovements'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: StockMovement[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as StockMovement);
          });
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          onChange(list);
        }
      },
      (err) => console.warn('Firestore stockMovements listener error:', err)
    );
  } catch {
    return () => {};
  }
}

/**
 * Subscribes to income/expenses in real time.
 */
export function subscribeIncomeExpenses(onChange: (entries: IncomeExpense[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'incomeExpenses'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: IncomeExpense[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as IncomeExpense);
          });
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          onChange(list);
        }
      },
      (err) => console.warn('Firestore incomeExpenses listener error:', err)
    );
  } catch {
    return () => {};
  }
}

/**
 * Subscribes to staff accounts in real time.
 */
export function subscribeStaff(onChange: (staffList: StaffUser[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'staff'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: StaffUser[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as StaffUser);
          });
          onChange(list);
        }
      },
      (err) => console.warn('Firestore staff listener error:', err)
    );
  } catch {
    return () => {};
  }
}

/**
 * Subscribes to store settings in real time.
 */
export function subscribeSettings(onChange: (settings: AppSettings) => void): () => void {
  try {
    return onSnapshot(
      doc(db, 'settings', 'store'),
      (docSnap) => {
        if (docSnap.exists()) {
          onChange(docSnap.data() as AppSettings);
        }
      },
      (err) => console.warn('Firestore settings listener error:', err)
    );
  } catch {
    return () => {};
  }
}

/**
 * Write helpers to persist updates to Firestore.
 */
export async function syncProductToFirestore(product: Product): Promise<void> {
  try {
    await setDoc(doc(db, 'products', product.id), product);
  } catch (e) {
    console.warn('Failed to sync product to Firestore:', e);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (e) {
    console.warn('Failed to delete product from Firestore:', e);
  }
}

export async function syncCustomerToFirestore(customer: Customer): Promise<void> {
  try {
    await setDoc(doc(db, 'customers', customer.id), customer);
  } catch (e) {
    console.warn('Failed to sync customer to Firestore:', e);
  }
}

export async function syncSupplierToFirestore(supplier: Supplier): Promise<void> {
  try {
    await setDoc(doc(db, 'suppliers', supplier.id), supplier);
  } catch (e) {
    console.warn('Failed to sync supplier to Firestore:', e);
  }
}

export async function syncSaleToFirestore(sale: SaleOrder): Promise<void> {
  try {
    await setDoc(doc(db, 'sales', sale.id), sale);
  } catch (e) {
    console.warn('Failed to sync sale to Firestore:', e);
  }
}

export async function syncStockMovementToFirestore(movement: StockMovement): Promise<void> {
  try {
    await setDoc(doc(db, 'stockMovements', movement.id), movement);
  } catch (e) {
    console.warn('Failed to sync stock movement to Firestore:', e);
  }
}

export async function syncIncomeExpenseToFirestore(entry: IncomeExpense): Promise<void> {
  try {
    await setDoc(doc(db, 'incomeExpenses', entry.id), entry);
  } catch (e) {
    console.warn('Failed to sync income/expense to Firestore:', e);
  }
}

export async function syncStaffToFirestore(staff: StaffUser): Promise<void> {
  try {
    await setDoc(doc(db, 'staff', staff.id), staff);
  } catch (e) {
    console.warn('Failed to sync staff to Firestore:', e);
  }
}

export async function syncSettingsToFirestore(settings: AppSettings): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'store'), settings);
  } catch (e) {
    console.warn('Failed to sync settings to Firestore:', e);
  }
}

export async function syncAuditLogToFirestore(log: AuditLog): Promise<void> {
  try {
    await setDoc(doc(db, 'auditLogs', log.id), log);
  } catch (e) {
    console.warn('Failed to sync audit log to Firestore:', e);
  }
}
