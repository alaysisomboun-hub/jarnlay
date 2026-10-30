import React, { useState, useMemo } from 'react';
import { usePos } from '../context/PosContext';
import { Product, Customer, CartItem, SaleOrder, PaymentMethod } from '../types';
import { ReceiptPrint } from './ReceiptPrint';
import { BarcodeCameraScanner } from './BarcodeCameraScanner';
import { getCategoryMeta } from '../lib/categories';
import {
  Truck,
  User,
  Search,
  Camera,
  Plus,
  Minus,
  Trash2,
  FileText,
  DollarSign,
  AlertTriangle,
  History,
  CheckCircle,
  CreditCard,
  Building2,
  Calendar,
  X,
  Printer,
  Package,
} from 'lucide-react';

export const WholesalePos: React.FC = () => {
  const {
    products,
    customers,
    sales,
    currentUser,
    settings,
    addProduct,
    completeSale,
    formatMoney,
  } = usePos();

  // Selected wholesale customer
  const wholesaleCustomers = customers.filter((c) => c.type === 'wholesale' || c.type === 'general');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    wholesaleCustomers[0]?.id || customers[0]?.id
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });

  // Quotation mode vs Sale mode
  const [isQuotationMode, setIsQuotationMode] = useState<boolean>(false);
  const [quotationPreview, setQuotationPreview] = useState<SaleOrder | null>(null);

  // Checkout modal
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [paymentType, setPaymentType] = useState<'full_cash' | 'full_transfer' | 'partial' | 'full_credit'>('partial');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [completedSale, setCompletedSale] = useState<SaleOrder | null>(null);

  // Customer history drawer
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);

  // Quick Add Product state
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    barcode: '',
    category: 'ທົ່ວໄປ',
    retailPrice: 10000,
    wholesalePrice: 8500,
    stockQty: 50,
    baseUnit: 'ອັນ',
  });

  // Active customer
  const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Customer credit stats
  const creditAvailable = Math.max(0, (customer?.creditLimit || 0) - (customer?.currentDebt || 0));

  // Past purchases for this customer
  const customerPastSales = useMemo(() => {
    if (!customer) return [];
    return sales.filter((s) => s.customerId === customer.id && s.status !== 'voided');
  }, [sales, customer]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.includes(q);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add bulk product to wholesale cart
  const addToWholesaleCart = (product: Product, preferredUnitName?: string) => {
    // Pick wholesale unit (prefer carton/pack over base piece)
    const unitDef = preferredUnitName
      ? product.units.find((u) => u.name === preferredUnitName) || product.units[0]
      : product.units.find((u) => u.factor > 1) || product.units[0];

    const factor = unitDef.factor || 1;
    // Wholesale price preference
    const unitPrice = unitDef.wholesalePrice || (product.wholesalePrice * factor);

    const existingIndex = cart.findIndex(
      (item) => item.productId === product.id && item.selectedUnit === unitDef.name
    );

    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      const newQty = existing.qty + 1;
      const newBaseQty = newQty * factor;

      if (!isQuotationMode) {
        const totalCartBase = cart
          .filter((_, idx) => idx !== existingIndex && _.productId === product.id)
          .reduce((sum, i) => sum + i.baseQty, 0) + newBaseQty;

        if (totalCartBase > product.stockQty) {
          alert(`ສະຕັອກສິນຄ້າບໍ່ພຽງພໍ (ມີພຽງ ${product.stockQty} ${product.baseUnit})`);
          return;
        }
      }

      // Check tiered volume price
      let effectivePrice = unitPrice;
      if (product.volumePrices && product.volumePrices.length > 0) {
        const sortedTiers = [...product.volumePrices].sort((a, b) => b.minQty - a.minQty);
        for (const tier of sortedTiers) {
          if (newBaseQty >= tier.minQty) {
            effectivePrice = tier.unitPrice * factor;
            break;
          }
        }
      }

      const updated = [...cart];
      updated[existingIndex] = {
        ...existing,
        qty: newQty,
        baseQty: newBaseQty,
        unitPrice: effectivePrice,
        subtotal: newQty * effectivePrice - existing.discount,
        wholesaleApplied: true,
      };
      setCart(updated);
    } else {
      if (!isQuotationMode && factor > product.stockQty) {
        alert(`ສະຕັອກບໍ່ພໍສຳລັບ 1 ${unitDef.name} (ຕ້ອງການ ${factor} ${product.baseUnit}, ແຕ່ມີພຽງ ${product.stockQty})`);
        return;
      }

      const newItem: CartItem = {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        selectedUnit: unitDef.name,
        factor,
        qty: 1,
        baseQty: factor,
        unitPrice,
        costPrice: product.costPrice * factor,
        discount: 0,
        subtotal: unitPrice,
        wholesaleApplied: true,
      };
      setCart([...cart, newItem]);
    }
  };

  const handleCameraScan = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    const found = products.find(
      (p) => p.barcode === cleanCode || p.code === cleanCode || p.units.some((u) => u.barcode === cleanCode)
    );

    if (found) {
      const matchedUnit = found.units.find((u) => u.barcode === cleanCode);
      addToWholesaleCart(found, matchedUnit?.name);
    } else {
      setQuickAddForm({
        name: '',
        barcode: cleanCode,
        category: 'ທົ່ວໄປ',
        retailPrice: 10000,
        wholesalePrice: 8500,
        stockQty: 50,
        baseUnit: 'ອັນ',
      });
      setShowQuickAddModal(true);
    }
  };

  const handleQuickAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddForm.name.trim()) {
      alert('ກະລຸນາປ້ອນຊື່ສິນຄ້າ');
      return;
    }

    try {
      const newProd = addProduct({
        code: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: quickAddForm.barcode,
        name: quickAddForm.name.trim(),
        category: quickAddForm.category || 'ທົ່ວໄປ',
        baseUnit: quickAddForm.baseUnit || 'ອັນ',
        costPrice: Math.round(quickAddForm.retailPrice * 0.75),
        retailPrice: quickAddForm.retailPrice,
        wholesalePrice: quickAddForm.wholesalePrice,
        wholesaleMinQty: 5,
        stockQty: quickAddForm.stockQty,
        minStockAlert: 5,
        units: [
          {
            name: quickAddForm.baseUnit || 'ອັນ',
            factor: 1,
            retailPrice: quickAddForm.retailPrice,
            wholesalePrice: quickAddForm.wholesalePrice,
            isBase: true,
          },
        ],
        volumePrices: [],
      });

      addToWholesaleCart(newProd);
      setShowQuickAddModal(false);
    } catch (err: any) {
      alert('ເກີດຂໍ້ຜິດພາດ: ' + (err.message || 'ບໍ່ສາມາດເພີ່ມສິນຄ້າໄດ້'));
    }
  };

  const updateWholesaleQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter((_, idx) => idx !== index));
      return;
    }

    const item = cart[index];
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;

    const newBaseQty = newQty * item.factor;

    if (!isQuotationMode) {
      const otherBase = cart
        .filter((_, idx) => idx !== index && _.productId === item.productId)
        .reduce((sum, i) => sum + i.baseQty, 0);

      if (otherBase + newBaseQty > product.stockQty) {
        alert(`ສະຕັອກມີພຽງ ${product.stockQty} ${product.baseUnit}`);
        return;
      }
    }

    // Check volume price tiers
    let unitPrice = item.unitPrice;
    if (product.volumePrices && product.volumePrices.length > 0) {
      const sortedTiers = [...product.volumePrices].sort((a, b) => b.minQty - a.minQty);
      let matched = false;
      for (const tier of sortedTiers) {
        if (newBaseQty >= tier.minQty) {
          unitPrice = tier.unitPrice * item.factor;
          matched = true;
          break;
        }
      }
      if (!matched) {
        const uDef = product.units.find((u) => u.name === item.selectedUnit);
        unitPrice = uDef?.wholesalePrice || (product.wholesalePrice * item.factor);
      }
    }

    const updated = [...cart];
    updated[index] = {
      ...item,
      qty: newQty,
      baseQty: newBaseQty,
      unitPrice,
      subtotal: newQty * unitPrice - item.discount,
    };
    setCart(updated);
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    const item = cart[index];
    const updated = [...cart];
    updated[index] = {
      ...item,
      unitPrice: newPrice,
      subtotal: item.qty * newPrice - item.discount,
    };
    setCart(updated);
  };

  // Calculations
  const subtotal = useMemo(() => cart.reduce((acc, i) => acc + i.subtotal, 0), [cart]);
  const grandTotal = Math.max(0, subtotal - orderDiscount);

  // Handle open checkout
  const handleOpenWholesaleCheckout = () => {
    if (cart.length === 0) return;
    setAmountPaid(0);
    setPaymentType('partial');
    setShowCheckout(true);
  };

  // Create Quotation
  const handleCreateQuotation = () => {
    if (cart.length === 0) return;
    const dateFormatted = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const quotationNo = `QT-${dateFormatted}-${randomSuffix}`;

    const quotationOrder: SaleOrder = {
      id: `qt-${Date.now()}`,
      invoiceNo: quotationNo,
      orderType: 'wholesale',
      customerId: customer.id,
      customerName: customer.name,
      customerType: customer.type,
      date: new Date().toISOString(),
      items: cart,
      subtotal,
      discount: orderDiscount,
      total: grandTotal,
      costTotal: 0,
      profit: 0,
      paymentMethod: 'credit',
      amountPaid: 0,
      change: 0,
      debtAmount: grandTotal,
      status: 'pending_credit',
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      notes: orderNotes || 'ໃບສະເໜີລາຄາ (Quotation - ມີຜົນບັງຄັບໃຊ້ 15 ວັນ)',
      dueDate,
    };

    setQuotationPreview(quotationOrder);
  };

  // Finalize wholesale sale
  const handleFinishWholesaleSale = () => {
    let method: PaymentMethod = 'credit';
    let paid = 0;
    let debt = grandTotal;

    if (paymentType === 'full_cash') {
      method = 'cash';
      paid = grandTotal;
      debt = 0;
    } else if (paymentType === 'full_transfer') {
      method = 'transfer';
      paid = grandTotal;
      debt = 0;
    } else if (paymentType === 'partial') {
      method = 'credit';
      paid = amountPaid;
      debt = Math.max(0, grandTotal - amountPaid);
    } else {
      // Full credit
      method = 'credit';
      paid = 0;
      debt = grandTotal;
    }

    // Check credit limit exceeded warning
    if (debt > 0 && customer.creditLimit > 0 && customer.currentDebt + debt > customer.creditLimit) {
      const confirmProceed = window.confirm(
        `ແຈ້ງເຕືອນ: ລູກຄ້າຈະມີໜີ້ລວມ ${(customer.currentDebt + debt).toLocaleString()} ₭ ເຊິ່ງເກີນວົງເງິນສິນເຊື່ອ (${customer.creditLimit.toLocaleString()} ₭)!\nທ່ານຕ້ອງການຢືນຢັນຂາຍຕໍ່ຫຼືບໍ່?`
      );
      if (!confirmProceed) return;
    }

    const created = completeSale({
      orderType: 'wholesale',
      customerId: customer.id,
      customerName: customer.name,
      customerType: customer.type,
      items: cart,
      subtotal,
      discount: orderDiscount,
      total: grandTotal,
      paymentMethod: method,
      amountPaid: paid,
      change: 0,
      debtAmount: debt,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      notes: orderNotes,
      dueDate: debt > 0 ? dueDate : undefined,
    });

    setCompletedSale(created);
    setShowCheckout(false);
    setCart([]);
    setOrderDiscount(0);
    setOrderNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Customer Wholesale Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Customer Selection */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 max-w-md">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                ເລືອກລູກຄ້າຂາຍສົ່ງ (Wholesale Customer)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full mt-0.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 cursor-pointer focus:ring-2 focus:ring-indigo-500"
              >
                {wholesaleCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - ໂທ: {c.phone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Credit Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 block text-[10px]">ວົງເງິນສິນເຊື່ອ</span>
              <span className="font-bold text-slate-900">
                {formatMoney(customer?.creditLimit || 0)}
              </span>
            </div>

            <div className="bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200 text-xs">
              <span className="text-amber-800 block text-[10px]">ໜີ້ຄ້າງຊຳລະປັດຈຸບັນ</span>
              <span className="font-bold text-amber-900">
                {formatMoney(customer?.currentDebt || 0)}
              </span>
            </div>

            <div className="bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-xs">
              <span className="text-emerald-800 block text-[10px]">ວົງເງິນທີ່ໃຊ້ໄດ້</span>
              <span className="font-bold text-emerald-900">
                {formatMoney(creditAvailable)}
              </span>
            </div>

            <button
              onClick={() => setShowHistoryDrawer(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>ປະຫວັດການຊື້ ({customerPastSales.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Wholesale Workspace */}
      <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-210px)] min-h-[580px]">
        {/* Left: Product Selection for Wholesale (Cartons, Packs, Wholesale Rates) */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ຄົ້ນຫາສິນຄ້າຂາຍສົ່ງ (ຊື່, ລະຫັດ, ບາໂຄດ)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                title="ເປີດກ້ອງສະແກນບາໂຄດ"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ກ້ອງສະແກນ</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">ຮູບແບບ:</span>
              <div className="flex items-center bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setIsQuotationMode(false)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    !isQuotationMode ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  ອອກບິນຂາຍສົ່ງ
                </button>
                <button
                  onClick={() => setIsQuotationMode(true)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    isQuotationMode ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  ໃບສະເໜີລາຄາ
                </button>
              </div>
            </div>
          </div>

          {/* Visual Category Bar */}
          <div className="px-3.5 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-50/70">
            {categories.map((cat) => {
              const count =
                cat === 'all'
                  ? products.length
                  : products.filter((p) => p.category === cat).length;
              const meta = getCategoryMeta(cat);
              const Icon = meta.icon;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? meta.activeBgColor + ' border-transparent'
                      : `${meta.bgColor} ${meta.borderColor} ${meta.color}`
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : meta.color}`} />
                  <span>{cat === 'all' ? 'ທຸກໝວດໝູ່' : cat}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : `${meta.badgeBg} ${meta.badgeText}`
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Wholesale Product Table / Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                <Package className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
                <p className="text-xs font-medium">ບໍ່ພົບສິນຄ້າຂາຍສົ່ງໃນໝວດນີ້</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ລອງເລືອກ "ທຸກໝວດໝູ່" ຫຼື ສະແກນບາໂຄດສິນຄ້າ
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredProducts.map((p) => {
                  const bulkUnits = p.units.filter((u) => u.factor > 1);
                  const hasBulk = bulkUnits.length > 0;
                  const isOutOfStock = p.stockQty <= 0;
                  const catMeta = getCategoryMeta(p.category);
                  const CatIcon = catMeta.icon;

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition-all group"
                    >
                      <div>
                        {/* Image Thumbnail Container */}
                        <div className="w-full h-28 rounded-xl bg-slate-100 overflow-hidden mb-2.5 relative flex items-center justify-center border border-slate-100">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 text-slate-400">
                              <Package className="w-8 h-8 stroke-1 text-slate-300" />
                              <span className="text-[10px] text-slate-400 mt-1 font-mono">{p.baseUnit}</span>
                            </div>
                          )}

                          {/* Stock badge */}
                          <span
                            className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs ${
                              isOutOfStock
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-900/80 text-white'
                            }`}
                          >
                            {isOutOfStock ? 'ໝົດ' : `${p.stockQty} ${p.baseUnit}`}
                          </span>

                          <span className="absolute top-2 left-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                            ຂາຍສົ່ງ
                          </span>
                        </div>

                        {/* Category badge */}
                        <div className="flex items-center gap-1 mb-1 text-[10px] font-semibold">
                          <CatIcon className={`w-3 h-3 ${catMeta.color} shrink-0`} />
                          <span className={`${catMeta.color} truncate`}>{p.category}</span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
                              {p.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">{p.code}</span>
                          </div>
                        </div>

                        {/* Wholesale pricing details */}
                        <div className="mt-2.5 bg-indigo-50/60 rounded-lg p-2 text-[11px] text-indigo-900 space-y-1">
                          <div className="flex justify-between font-medium">
                            <span>ລາຄາສົ່ງພື້ນຖານ:</span>
                            <span className="font-bold">{formatMoney(p.wholesalePrice)}/{p.baseUnit}</span>
                          </div>
                          {p.wholesaleMinQty > 1 && (
                            <div className="text-[10px] text-indigo-700">
                              * ຂັ້ນຕ່ຳຂາຍສົ່ງ: {p.wholesaleMinQty} {p.baseUnit}
                            </div>
                          )}
                          {/* Volume tiers */}
                          {p.volumePrices && p.volumePrices.length > 0 && (
                            <div className="text-[10px] text-slate-600 border-t border-indigo-100 pt-1 mt-1">
                              {p.volumePrices.map((t, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>ຊື້ {t.minQty}+ {p.baseUnit}:</span>
                                  <span className="font-semibold text-indigo-800">{t.unitPrice.toLocaleString()} ₭</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Unit add buttons */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {p.units.map((u, uIdx) => (
                          <button
                            key={uIdx}
                            disabled={!isQuotationMode && p.stockQty < u.factor}
                            onClick={() => addToWholesaleCart(p, u.name)}
                            className="flex-1 py-1 px-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-2xs transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{u.name}</span>
                            <span className="text-[10px] opacity-80">
                              ({formatMoney(u.wholesalePrice)})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Wholesale Order Items & Checkout Panel */}
        <div className="w-full lg:w-[420px] flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">
                {isQuotationMode ? 'ລາຍການໃບສະເໜີລາຄາ' : 'ລາຍການສັ່ງຊື້ຂາຍສົ່ງ'}
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              {cart.length} ລາຍການ ({cart.reduce((a, b) => a + b.qty, 0)} ໜ່ວຍ)
            </span>
          </div>

          {/* Cart Table */}
          <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Truck className="w-10 h-10 text-slate-200 mb-2 stroke-1" />
                <p className="text-xs font-medium">ຍັງບໍ່ມີລາຍການສິນຄ້າຂາຍສົ່ງ</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ເລືອກສິນຄ້າຂ້າງເທິງເພື່ອເພີ່ມລັງ, ແພັກ ຫຼື ກ່ອງ
                </p>
              </div>
            ) : (
              cart.map((item, index) => {
                const prod = products.find((p) => p.id === item.productId);

                return (
                  <div key={index} className="py-2.5 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900">{item.productName}</p>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                            {item.selectedUnit} (x{item.factor} {prod?.baseUnit})
                          </span>
                          <span>ຕັດສະຕັອກ: {item.baseQty} {prod?.baseUnit}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setCart(cart.filter((_, i) => i !== index))}
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quantity & Unit Wholesale Price Editor */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* Qty controller */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateWholesaleQty(index, item.qty - 1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateWholesaleQty(index, Number(e.target.value) || 1)}
                          className="w-12 text-center text-xs font-bold bg-transparent border-none font-mono focus:outline-hidden"
                        />
                        <button
                          onClick={() => updateWholesaleQty(index, item.qty + 1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Custom Price edit */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">ລາຄາ/ໜ່ວຍ:</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItemPrice(index, Number(e.target.value) || 0)}
                          className="w-24 text-right px-1.5 py-0.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded font-mono"
                        />
                      </div>

                      {/* Line total */}
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {formatMoney(item.subtotal)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Panel */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>ມູນຄ່າລວມ:</span>
              <span className="font-semibold text-slate-900">{formatMoney(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">ສ່ວນຫຼຸດພິເສດ:</span>
              <input
                type="number"
                min="0"
                value={orderDiscount === 0 ? '' : orderDiscount}
                placeholder="0"
                onChange={(e) => setOrderDiscount(Number(e.target.value) || 0)}
                className="w-28 text-right px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                ກຳນົດຊຳລະ:
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs px-2 py-1 bg-white border border-slate-300 rounded font-mono"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">ຍອດລວມສຸດທິ:</span>
              <span className="text-xl font-extrabold text-indigo-700 tracking-tight">
                {formatMoney(grandTotal)}
              </span>
            </div>

            {/* Actions */}
            {isQuotationMode ? (
              <button
                onClick={handleCreateQuotation}
                disabled={cart.length === 0}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>ອອກໃບສະເໜີລາຄາ (Quotation)</span>
              </button>
            ) : (
              <button
                onClick={handleOpenWholesaleCheckout}
                disabled={cart.length === 0}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Truck className="w-4 h-4" />
                <span>ດຳເນີນການຂາຍສົ່ງ & ອອກໃບບິນ ({formatMoney(grandTotal)})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* WHOLESALE CHECKOUT MODAL (Credit / Partial Payment / Debt) */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">ຊຳລະເງິນຂາຍສົ່ງ & ບັນທຶກລູກໜີ້</h3>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Grand Total */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                <span className="text-xs text-indigo-800 font-medium">ຍອດລວມໃບບິນຂາຍສົ່ງ</span>
                <div className="text-3xl font-extrabold text-indigo-800 tracking-tight mt-0.5">
                  {formatMoney(grandTotal)}
                </div>
              </div>

              {/* Payment Type Selection */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  onClick={() => { setPaymentType('full_cash'); setAmountPaid(grandTotal); }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    paymentType === 'full_cash'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>ຊຳລະຄົບ (ເງິນສົດ)</span>
                </button>

                <button
                  onClick={() => { setPaymentType('full_transfer'); setAmountPaid(grandTotal); }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    paymentType === 'full_transfer'
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>ຊຳລະຄົບ (ໂອນເງິນ)</span>
                </button>

                <button
                  onClick={() => { setPaymentType('partial'); setAmountPaid(grandTotal / 2); }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    paymentType === 'partial'
                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>ຊຳລະບາງສ່ວນ + ຕິດໜີ້</span>
                </button>

                <button
                  onClick={() => { setPaymentType('full_credit'); setAmountPaid(0); }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    paymentType === 'full_credit'
                      ? 'border-red-500 bg-red-50 text-red-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>ເຊື່ອ 100% (ຄ້າງຊຳລະ)</span>
                </button>
              </div>

              {/* Partial Payment Amount Input */}
              {paymentType === 'partial' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    ຈຳນວນເງິນທີ່ຊຳລະກ່ອນ (KIP):
                  </label>
                  <input
                    type="number"
                    value={amountPaid === 0 ? '' : amountPaid}
                    onChange={(e) => setAmountPaid(Math.min(grandTotal, Number(e.target.value) || 0))}
                    className="w-full text-lg font-bold text-slate-900 px-3 py-2 border border-slate-300 rounded-lg text-right font-mono"
                  />
                  <div className="flex justify-between text-xs p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 font-semibold">
                    <span>ຍອດທີ່ຈະບັນທຶກເຂົ້າບັນຊີລູກໜີ້:</span>
                    <span>{formatMoney(Math.max(0, grandTotal - amountPaid))}</span>
                  </div>
                </div>
              )}

              {/* Full Credit Info */}
              {paymentType === 'full_credit' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  <p className="font-bold">ບັນທຶກເປັນລູກໜີ້ເຕັມຈຳນວນ: {formatMoney(grandTotal)}</p>
                  <p className="text-[11px] mt-0.5">ກຳນົດຊຳລະພາຍໃນວັນທີ: {dueDate}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ໝາຍເຫດ:</label>
                <input
                  type="text"
                  placeholder="ໝາຍເຫດການຈັດສົ່ງ, ເລກທະບຽນລົດຂົນສົ່ງ..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowCheckout(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={handleFinishWholesaleSale}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                ຢືນຢັນການຂາຍສົ່ງ & ອອກໃບບິນ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Purchase History Drawer */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">ປະຫວັດການຊື້ສິນຄ້າ</h3>
                <p className="text-xs text-slate-500">{customer?.name}</p>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {customerPastSales.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">ຍັງບໍ່ມີປະຫວັດການສັ່ງຊື້</p>
              ) : (
                customerPastSales.map((s) => (
                  <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span className="font-mono">{s.invoiceNo}</span>
                      <span>{formatMoney(s.total)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ວັນທີ: {new Date(s.date).toLocaleDateString('lo-LA')}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      ລາຍການ: {s.items.map((i) => `${i.productName} (${i.qty} ${i.selectedUnit})`).join(', ')}
                    </div>
                    {s.debtAmount > 0 && (
                      <div className="text-[11px] text-amber-700 font-bold bg-amber-50 p-1 rounded">
                        ຄ້າງຊຳລະ: {formatMoney(s.debtAmount)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt / Invoice Print Modal */}
      {(completedSale || quotationPreview) && (
        <ReceiptPrint
          sale={completedSale || quotationPreview!}
          settings={settings}
          formatMoney={formatMoney}
          onClose={() => {
            setCompletedSale(null);
            setQuotationPreview(null);
          }}
        />
      )}

      {/* Quick Add Product Modal when barcode not found */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm">ເພີ່ມສິນຄ້າໃໝ່ (Quick Add ສິນຄ້າຂາຍສົ່ງ)</h3>
                  <p className="text-[10px] text-slate-400">ສິນຄ້າບໍ່ທັນມີໃນລະບົບ - ໃສ່ຂໍ້ມູນແລ້ວຂາຍສົ່ງໄດ້ທັນທີ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddProduct} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ລະຫັດບາໂຄດ
                </label>
                <input
                  type="text"
                  required
                  value={quickAddForm.barcode}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, barcode: e.target.value })}
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຊື່ສິນຄ້າ *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="ເຊັ່ນ: ນ້ຳດື່ມ, ເບຍ, ນ້ຳອັດລົມ, ໝີ່..."
                  value={quickAddForm.name}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ໝວດໝູ່
                  </label>
                  <input
                    type="text"
                    value={quickAddForm.category}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ໜ່ວຍນັບຫຼັກ
                  </label>
                  <input
                    type="text"
                    value={quickAddForm.baseUnit}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, baseUnit: e.target.value })}
                    placeholder="ອັນ, ແພັກ, ລັງ..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-700 mb-1">
                    ລາຄາຂາຍສົ່ງ (KIP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={quickAddForm.wholesalePrice}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, wholesalePrice: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-bold text-indigo-800 px-3 py-1.5 border border-indigo-300 rounded-lg text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-700 mb-1">
                    ລາຄາຂາຍຍ່ອຍ (KIP)
                  </label>
                  <input
                    type="number"
                    value={quickAddForm.retailPrice}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, retailPrice: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-bold text-emerald-800 px-3 py-1.5 border border-emerald-300 rounded-lg text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຈຳນວນສະຕັອກເບື້ອງຕົ້ນ ({quickAddForm.baseUnit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={quickAddForm.stockQty}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, stockQty: Number(e.target.value) || 1 })}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl text-right font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>ບັນທຶກ & ເພີ່ມໃສ່ກະຕ່າສົ່ງ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Camera Scanner Modal */}
      <BarcodeCameraScanner
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleCameraScan}
        title="ກ້ອງສະແກນບາໂຄດ (Wholesale Scanner)"
        sampleBarcodes={products.slice(0, 6).map((p) => ({ code: p.barcode, name: p.name }))}
      />
    </div>
  );
};
