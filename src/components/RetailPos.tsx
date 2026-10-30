import React, { useState, useMemo, useRef } from 'react';
import { usePos } from '../context/PosContext';
import { Product, CartItem, PaymentMethod, SaleOrder } from '../types';
import { ReceiptPrint } from './ReceiptPrint';
import { BarcodeCameraScanner } from './BarcodeCameraScanner';
import { getCategoryMeta } from '../lib/categories';
import {
  Search,
  Barcode,
  Camera,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  QrCode,
  CreditCard,
  Printer,
  CheckCircle,
  Tag,
  User,
  ShoppingBag,
  Layers,
  X,
  AlertTriangle,
  Truck,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export const RetailPos: React.FC = () => {
  const {
    products,
    customers,
    currentUser,
    settings,
    addProduct,
    completeSale,
    formatMoney,
  } = usePos();

  // Price Mode: Retail (ຂາຍຍ່ອຍ) vs Wholesale (ຂາຍສົ່ງ)
  const [saleMode, setSaleMode] = useState<'retail' | 'wholesale'>('retail');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-walkin');
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Checkout modal states
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitTransfer, setSplitTransfer] = useState<number>(0);
  const [completedSale, setCompletedSale] = useState<SaleOrder | null>(null);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);

  // Quick Add Product when barcode scanned is not in system
  const [unmatchedBarcode, setUnmatchedBarcode] = useState<string | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    barcode: '',
    category: 'ທົ່ວໄປ',
    retailPrice: 10000,
    wholesalePrice: 8500,
    stockQty: 20,
    baseUnit: 'ອັນ',
  });

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Selected Customer details
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Auto-switch to wholesale mode when a wholesale customer is selected
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find((c) => c.id === customerId);
    if (cust && cust.type === 'wholesale') {
      setSaleMode('wholesale');
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products based on search & category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.includes(q);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add product to cart with chosen unit and current pricing mode
  const addToCart = (product: Product, unitName?: string, overrideWholesale?: boolean) => {
    if (product.stockQty <= 0) {
      alert(`ສິນຄ້າ "${product.name}" ໝົດສະຕັອກແລ້ວ! ບໍ່ສາມາດຂາຍໄດ້`);
      return;
    }

    const isWholesale = overrideWholesale !== undefined ? overrideWholesale : saleMode === 'wholesale';

    // Find unit definition
    const unitDef = unitName
      ? product.units.find((u) => u.name === unitName) || product.units[0]
      : isWholesale
      ? product.units.find((u) => u.factor > 1) || product.units[0]
      : product.units[0] || {
          name: product.baseUnit,
          factor: 1,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice,
        };

    const factor = unitDef.factor || 1;
    // Calculate effective unit price according to sale mode
    const baseUnitPrice = isWholesale
      ? unitDef.wholesalePrice || (product.wholesalePrice * factor)
      : unitDef.retailPrice || (product.retailPrice * factor);

    // Check existing in cart
    const existingIndex = cart.findIndex(
      (item) => item.productId === product.id && item.selectedUnit === unitDef.name
    );

    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      const newQty = existing.qty + 1;
      const newBaseQty = newQty * factor;

      // Check stock limit across ALL items in cart for this product
      const totalCartBaseQtyForProduct =
        cart
          .filter((i, idx) => i.productId === product.id && idx !== existingIndex)
          .reduce((sum, i) => sum + i.baseQty, 0) + newBaseQty;

      if (totalCartBaseQtyForProduct > product.stockQty) {
        alert(`ຈຳນວນໃນກະຕ່າເກີນສະຕັອກທີ່ມີ (${product.stockQty} ${product.baseUnit})`);
        return;
      }

      // Check volume price tiers
      let effectivePrice = baseUnitPrice;
      if (product.volumePrices && product.volumePrices.length > 0) {
        const sortedTiers = [...product.volumePrices].sort((a, b) => b.minQty - a.minQty);
        for (const tier of sortedTiers) {
          if (newBaseQty >= tier.minQty) {
            effectivePrice = tier.unitPrice * factor;
            break;
          }
        }
      }

      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existing,
        qty: newQty,
        baseQty: newBaseQty,
        unitPrice: effectivePrice,
        subtotal: newQty * effectivePrice - existing.discount,
      };
      setCart(updatedCart);
    } else {
      if (factor > product.stockQty) {
        alert(
          `ສະຕັອກບໍ່ພໍສຳລັບ 1 ${unitDef.name} (ຕ້ອງການ ${factor} ${product.baseUnit}, ແຕ່ມີພຽງ ${product.stockQty})`
        );
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
        unitPrice: baseUnitPrice,
        costPrice: product.costPrice * factor,
        discount: 0,
        subtotal: baseUnitPrice,
        wholesaleApplied: isWholesale,
      };
      setCart([...cart, newItem]);
    }
  };

  // Handle barcode scanning via physical scanner input
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const found = products.find(
      (p) => p.barcode === code || p.code === code || p.units.some((u) => u.barcode === code)
    );

    if (found) {
      const matchedUnit = found.units.find((u) => u.barcode === code);
      addToCart(found, matchedUnit?.name);
      setBarcodeInput('');
    } else {
      setUnmatchedBarcode(code);
      setQuickAddForm({
        name: '',
        barcode: code,
        category: 'ທົ່ວໄປ',
        retailPrice: 10000,
        wholesalePrice: 8500,
        stockQty: 20,
        baseUnit: 'ອັນ',
      });
      setShowQuickAddModal(true);
      setBarcodeInput('');
    }
  };

  // Handle camera barcode scan
  const handleCameraScan = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    const found = products.find(
      (p) => p.barcode === cleanCode || p.code === cleanCode || p.units.some((u) => u.barcode === cleanCode)
    );

    if (found) {
      const matchedUnit = found.units.find((u) => u.barcode === cleanCode);
      addToCart(found, matchedUnit?.name);
    } else {
      setUnmatchedBarcode(cleanCode);
      setQuickAddForm({
        name: '',
        barcode: cleanCode,
        category: 'ທົ່ວໄປ',
        retailPrice: 10000,
        wholesalePrice: 8500,
        stockQty: 20,
        baseUnit: 'ອັນ',
      });
      setShowQuickAddModal(true);
    }
  };

  // Submit Quick Add Product directly from POS
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

      addToCart(newProd);
      setShowQuickAddModal(false);
      setUnmatchedBarcode(null);
    } catch (err: any) {
      alert('ເກີດຂໍ້ຜິດພາດ: ' + (err.message || 'ບໍ່ສາມາດເພີ່ມສິນຄ້າໄດ້'));
    }
  };

  // Update item quantity
  const updateQty = (index: number, delta: number) => {
    const item = cart[index];
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    const newBaseQty = newQty * item.factor;

    // Check stock limit
    const otherCartBaseQty = cart
      .filter((_, idx) => idx !== index && _.productId === item.productId)
      .reduce((sum, i) => sum + i.baseQty, 0);

    if (otherCartBaseQty + newBaseQty > product.stockQty) {
      alert(`ສະຕັອກມີພຽງ ${product.stockQty} ${product.baseUnit}`);
      return;
    }

    // Check volume price tiers
    let unitPrice = item.unitPrice;
    if (product.volumePrices && product.volumePrices.length > 0) {
      const sortedTiers = [...product.volumePrices].sort((a, b) => b.minQty - a.minQty);
      for (const tier of sortedTiers) {
        if (newBaseQty >= tier.minQty) {
          unitPrice = tier.unitPrice * item.factor;
          break;
        }
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

  // Change item unit
  const changeItemUnit = (index: number, newUnitName: string) => {
    const item = cart[index];
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;

    const unitDef = product.units.find((u) => u.name === newUnitName) || product.units[0];
    const factor = unitDef.factor || 1;
    const isWholesale = item.wholesaleApplied || saleMode === 'wholesale';
    const unitPrice = isWholesale
      ? unitDef.wholesalePrice || (product.wholesalePrice * factor)
      : unitDef.retailPrice || (product.retailPrice * factor);

    const newBaseQty = item.qty * factor;

    // Check stock
    const otherCartBase = cart
      .filter((_, idx) => idx !== index && _.productId === item.productId)
      .reduce((sum, i) => sum + i.baseQty, 0);

    if (otherCartBase + newBaseQty > product.stockQty) {
      alert(`ສະຕັອກບໍ່ພໍສຳລັບໜ່ວຍນັບ ${unitDef.name}`);
      return;
    }

    const updated = [...cart];
    updated[index] = {
      ...item,
      selectedUnit: unitDef.name,
      factor,
      unitPrice,
      costPrice: product.costPrice * factor,
      baseQty: newBaseQty,
      subtotal: item.qty * unitPrice - item.discount,
    };
    setCart(updated);
  };

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  // Cart calculations
  const subtotal = useMemo(() => cart.reduce((acc, i) => acc + i.subtotal, 0), [cart]);
  const grandTotal = Math.max(0, subtotal - orderDiscount);

  // Change calculation
  const change = useMemo(() => {
    if (paymentMethod === 'cash') {
      return Math.max(0, cashReceived - grandTotal);
    }
    if (paymentMethod === 'split') {
      const totalGiven = splitCash + splitTransfer;
      return Math.max(0, totalGiven - grandTotal);
    }
    return 0;
  }, [paymentMethod, cashReceived, splitCash, splitTransfer, grandTotal]);

  // Open checkout modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashReceived(grandTotal);
    setSplitCash(grandTotal / 2);
    setSplitTransfer(grandTotal / 2);
    setShowCheckout(true);
  };

  // Submit sale
  const handleFinishSale = () => {
    if (paymentMethod === 'cash' && cashReceived < grandTotal) {
      alert('ຈຳນວນເງິນສົດທີ່ຮັບ ຕ້ອງເທົ່າກັບ ຫຼື ຫຼາຍກວ່າຍອດລວມ!');
      return;
    }
    if (paymentMethod === 'split' && splitCash + splitTransfer < grandTotal) {
      alert('ຍອດເງິນສົດ + ເງິນໂອນ ຕ້ອງເທົ່າກັບຍອດລວມ!');
      return;
    }

    const createdSale = completeSale({
      orderType: saleMode === 'wholesale' ? 'wholesale' : 'retail',
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerType: selectedCustomer.type,
      items: cart,
      subtotal,
      discount: orderDiscount,
      total: grandTotal,
      paymentMethod,
      splitDetails:
        paymentMethod === 'split' ? { cash: splitCash, transfer: splitTransfer } : undefined,
      amountPaid:
        paymentMethod === 'cash'
          ? cashReceived
          : paymentMethod === 'split'
          ? splitCash + splitTransfer
          : grandTotal,
      change,
      debtAmount: 0,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      notes: orderNotes,
    });

    setCompletedSale(createdSale);
    setShowCheckout(false);
    setCart([]);
    setOrderDiscount(0);
    setOrderNotes('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-125px)] min-h-[620px]">
      {/* ======================================================== */}
      {/* LEFT COLUMN: Product Catalog (Clean 65% Workspace)       */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Top Header: Price Mode Switcher & Search Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/80 bg-slate-50/70 space-y-3">
          {/* Row 1: Sale Mode Switcher (Retail vs Wholesale) + Quick Stats */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => setSaleMode('retail')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  saleMode === 'retail'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>ຂາຍຍ່ອຍ (Retail Price)</span>
              </button>

              <button
                type="button"
                onClick={() => setSaleMode('wholesale')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  saleMode === 'wholesale'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>ຂາຍສົ່ງ (Wholesale Price)</span>
              </button>
            </div>

            {/* Current Mode Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                  saleMode === 'retail'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                <span>
                  ລາຄາປັດຈຸບັນ: <strong>{saleMode === 'retail' ? 'ຂາຍຍ່ອຍ' : 'ຂາຍສົ່ງ'}</strong>
                </span>
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                ({filteredProducts.length} ລາຍການ)
              </span>
            </div>
          </div>

          {/* Row 2: Search Input & Fast Barcode & Camera Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Barcode Fast Scan Input */}
            <form onSubmit={handleBarcodeSubmit} className="relative sm:w-64">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="ຍິງບາໂຄດສິນຄ້າ..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono shadow-2xs placeholder:text-slate-400"
              />
            </form>

            {/* Camera Scan Button */}
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
              title="ເປີດກ້ອງສະແກນບາໂຄດ"
            >
              <Camera className="w-4 h-4" />
              <span>ກ້ອງສະແກນ</span>
            </button>

            {/* Large Text Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, ລະຫັດສິນຄ້າ, ບາໂຄດ (Lao / Eng)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories Visual Bar */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-50/50">
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

        {/* Product Cards Grid */}
        <div className="p-3.5 sm:p-4 flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 bg-slate-50/30">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-sm font-semibold text-slate-700">ບໍ່ພົບລາຍການສິນຄ້າໃນໝວດນີ້</p>
              <p className="text-xs text-slate-400 mt-1">
                ກະລຸນາລອງເລືອກ "ທຸກໝວດໝູ່" ຫຼື ພິມຄຳຄົ້ນຫາໃໝ່
              </p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isOutOfStock = p.stockQty <= 0;
              const isLowStock = p.stockQty > 0 && p.stockQty <= p.minStockAlert;
              const catMeta = getCategoryMeta(p.category);
              const CatIcon = catMeta.icon;

              // Price depending on current saleMode
              const displayedPrice = saleMode === 'wholesale' ? p.wholesalePrice : p.retailPrice;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && addToCart(p)}
                  className={`bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all group select-none ${
                    isOutOfStock
                      ? 'opacity-60 border-slate-200 bg-slate-50/70 cursor-not-allowed'
                      : 'border-slate-200/90 hover:border-emerald-500 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div>
                    {/* Uniform Square Thumbnail Container */}
                    <div className="w-full aspect-square rounded-xl bg-slate-100 overflow-hidden mb-2.5 relative flex items-center justify-center border border-slate-100">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 text-slate-400">
                          <ShoppingBag className="w-9 h-9 stroke-1 text-slate-300" />
                          <span className="text-[10px] text-slate-400 mt-1 font-mono">
                            {p.baseUnit}
                          </span>
                        </div>
                      )}

                      {/* Stock Badge Top Right */}
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs ${
                          isOutOfStock
                            ? 'bg-red-600 text-white'
                            : isLowStock
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-900/80 text-white'
                        }`}
                      >
                        {isOutOfStock ? 'ໝົດ' : `${p.stockQty} ${p.baseUnit}`}
                      </span>

                      {/* Pricing Mode Badge Top Left */}
                      {saleMode === 'wholesale' && (
                        <span className="absolute top-2 left-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                          ລາຄາສົ່ງ
                        </span>
                      )}
                    </div>

                    {/* Category Label */}
                    <div className="flex items-center gap-1 mb-1 text-[10px] font-semibold">
                      <CatIcon className={`w-3 h-3 ${catMeta.color} shrink-0`} />
                      <span className={`${catMeta.color} truncate`}>{p.category}</span>
                    </div>

                    {/* Product Name */}
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      {p.code}
                    </p>
                  </div>

                  {/* Price & Multi-Unit Buttons */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span
                          className={`text-sm sm:text-base font-black tracking-tight ${
                            saleMode === 'wholesale' ? 'text-blue-700' : 'text-emerald-700'
                          }`}
                        >
                          {formatMoney(displayedPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">/{p.baseUnit}</span>
                      </div>

                      {/* Retail price comparison in wholesale mode */}
                      {saleMode === 'wholesale' && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatMoney(p.retailPrice)}
                        </span>
                      )}
                    </div>

                    {/* Multi-unit quick buttons (ອັນ, ແພັກ, ລັງ, ແກັດ) */}
                    {p.units.length > 1 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.units.map((u, idx) => {
                          const unitPrice =
                            saleMode === 'wholesale'
                              ? u.wholesalePrice || (p.wholesalePrice * u.factor)
                              : u.retailPrice || (p.retailPrice * u.factor);

                          return (
                            <button
                              key={idx}
                              type="button"
                              title={`ກົດເພີ່ມ 1 ${u.name} (1 ${u.name} = ${u.factor} ${p.baseUnit})`}
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(p, u.name);
                              }}
                              className="flex-1 min-w-[50px] px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-md cursor-pointer border border-slate-200 transition-colors flex items-center justify-center gap-0.5"
                            >
                              <span>+{u.name}</span>
                              <span className="text-[9px] opacity-70">
                                ({formatMoney(unitPrice)})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: POS Cart & Checkout (Clean 35% Panel)       */}
      {/* ======================================================== */}
      <div className="w-full lg:w-[390px] xl:w-[420px] flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden shrink-0">
        {/* Cart Top Header: Customer Selector & Clear Button */}
        <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>ກະຕ່າຂາຍສິນຄ້າ ({cart.reduce((a, b) => a + b.qty, 0)})</span>
            </div>

            <button
              type="button"
              onClick={() => setCart([])}
              disabled={cart.length === 0}
              className="text-[11px] text-slate-400 hover:text-red-600 disabled:opacity-40 cursor-pointer transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ລ້າງກະຕ່າ</span>
            </button>
          </div>

          {/* Customer Selection Dropdown */}
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 cursor-pointer shadow-2xs"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'wholesale' ? 'ລູກຄ້າຂາຍສົ່ງ' : 'ທົ່ວໄປ'})
                  {c.currentDebt > 0 ? ` · ໜີ້: ${c.currentDebt.toLocaleString()} ₭` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Debt & Credit Warning if any */}
          {selectedCustomer && selectedCustomer.currentDebt > 0 && (
            <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-between text-[11px]">
              <span className="text-amber-800 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                ໜີ້ຄ້າງຊຳລະ:
              </span>
              <span className="font-bold text-amber-900 font-mono">
                {formatMoney(selectedCustomer.currentDebt)}
              </span>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
                <ShoppingBag className="w-8 h-8 stroke-1" />
              </div>
              <p className="text-xs font-bold text-slate-700">ຍັງບໍ່ມີສິນຄ້າໃນກະຕ່າ</p>
              <p className="text-[11px] text-slate-400 mt-1 text-center max-w-[200px]">
                ກົດເລືອກສິນຄ້າດ້ານຊ້າຍ ຫຼື ຍິງບາໂຄດເພື່ອເລີ່ມການຂາຍ
              </p>
            </div>
          ) : (
            cart.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);

              return (
                <div key={index} className="py-2.5 first:pt-0 last:pb-0 space-y-2">
                  {/* Item Row Top: Name, Unit Dropdown, Subtotal */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.productName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Unit selector dropdown */}
                        {product && product.units.length > 1 ? (
                          <select
                            value={item.selectedUnit}
                            onChange={(e) => changeItemUnit(index, e.target.value)}
                            className="text-[11px] bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-800 font-semibold cursor-pointer"
                          >
                            {product.units.map((u, uIdx) => (
                              <option key={uIdx} value={u.name}>
                                {u.name} (x{u.factor} {product.baseUnit})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.selectedUnit}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 font-mono">
                          @{item.unitPrice.toLocaleString()} ₭
                        </span>

                        {item.wholesaleApplied && (
                          <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1 rounded">
                            ສົ່ງ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Line total & Delete */}
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900 font-mono block">
                        {formatMoney(item.subtotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className="text-slate-400 hover:text-red-600 block ml-auto mt-1 cursor-pointer p-0.5 transition-colors"
                        title="ລຶບລາຍການນີ້"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity Controller (+ / -) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateQty(index, -1)}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                        title="ຫຼຸດຈຳນວນ"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-0.5 text-xs font-black text-slate-900 font-mono min-w-[28px] text-center">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(index, 1)}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                        title="ເພີ່ມຈຳນວນ"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium">
                      ຕັດສະຕັອກ: <strong>{item.baseQty}</strong> {product?.baseUnit}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between text-xs text-slate-600">
            <span>ມູນຄ່າລວມ ({cart.reduce((a, b) => a + b.qty, 0)} ໜ່ວຍ):</span>
            <span className="font-bold text-slate-900 font-mono">{formatMoney(subtotal)}</span>
          </div>

          {/* Discount input */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1 font-medium">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              ສ່ວນຫຼຸດພິເສດ:
            </span>
            <div className="flex items-center gap-1 w-32">
              <input
                type="number"
                min="0"
                value={orderDiscount === 0 ? '' : orderDiscount}
                placeholder="0"
                onChange={(e) => setOrderDiscount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full text-right px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 font-bold">₭</span>
            </div>
          </div>

          {/* Grand Total Display (Large & Prominent) */}
          <div className="pt-2 border-t border-slate-200/80 bg-emerald-50/60 -mx-4 px-4 py-2.5 flex items-baseline justify-between rounded-xl">
            <div>
              <span className="text-xs font-bold text-slate-700 block">ຍອດຊຳລະສຸດທິ:</span>
              <span className="text-[10px] text-emerald-800">
                {saleMode === 'wholesale' ? 'ລາຄາຂາຍສົ່ງ' : 'ລາຄາຂາຍຍ່ອຍ'}
              </span>
            </div>
            <span className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
              {formatMoney(grandTotal)}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            type="button"
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed group"
          >
            <DollarSign className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>ຄິດເງິນ / ຊຳລະ ({formatMoney(grandTotal)})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CHECKOUT PAYMENT MODAL                                   */}
      {/* ======================================================== */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {saleMode === 'wholesale' ? 'ຊຳລະເງິນຂາຍສົ່ງ' : 'ຊຳລະເງິນຂາຍຍ່ອຍ'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ລູກຄ້າ: {selectedCustomer.name} · {cart.length} ລາຍການ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Grand Total Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">
                  ຍອດທີ່ຕ້ອງຊຳລະທັງໝົດ
                </span>
                <div className="text-3xl font-black text-emerald-700 tracking-tight font-mono mt-1">
                  {formatMoney(grandTotal)}
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>ເງິນສົດ (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'transfer'
                      ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span>ໂອນເງິນ / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('split')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'split'
                      ? 'border-purple-500 bg-purple-50 text-purple-800 ring-2 ring-purple-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>ຊຳລະຮ່ວມ (Split)</span>
                </button>
              </div>

              {/* Cash payment section */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ຈຳນວນເງິນສົດທີ່ຮັບມາ (KIP):
                    </label>
                    <input
                      type="number"
                      autoFocus
                      value={cashReceived === 0 ? '' : cashReceived}
                      onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                      className="w-full text-2xl font-black text-slate-900 px-3.5 py-2.5 border-2 border-slate-300 rounded-xl text-right font-mono focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  {/* Quick Kip Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'ພໍດີ', val: grandTotal },
                      { label: '50,000', val: 50000 },
                      { label: '100,000', val: 100000 },
                      { label: '200,000', val: 200000 },
                      { label: '500,000', val: 500000 },
                      { label: '1,000,000', val: 1000000 },
                    ].map((btn, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashReceived(btn.val)}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg cursor-pointer font-mono transition-colors"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Change display */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">ເງິນທອນທີ່ຕ້ອງສົ່ງ:</span>
                    <span
                      className={`text-xl font-black font-mono ${
                        change >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {change.toLocaleString()} ₭
                    </span>
                  </div>
                </div>
              )}

              {/* Transfer payment section with QR */}
              {paymentMethod === 'transfer' && (
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-slate-800">
                    ສະແກນ QR ໂອນຜ່ານ BCEL One / ທະນາຄານ
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=LAO-QR-PAY|ACC:${settings.qrAccountNumber}|AMT:${grandTotal}`}
                      alt="BCEL One QR"
                      className="w-36 h-36 border border-slate-300 rounded-xl p-1 bg-white shadow-xs"
                    />
                  </div>
                  <div className="text-xs text-slate-600">
                    <p className="font-mono font-bold text-slate-900 text-sm">{settings.qrAccountNumber}</p>
                    <p className="text-[11px] text-slate-500">{settings.qrAccountName}</p>
                  </div>
                </div>
              )}

              {/* Split payment section */}
              {paymentMethod === 'split' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ຊຳລະດ້ວຍເງິນສົດ:
                    </label>
                    <input
                      type="number"
                      value={splitCash === 0 ? '' : splitCash}
                      onChange={(e) => setSplitCash(Number(e.target.value) || 0)}
                      className="w-full text-base font-bold text-slate-900 px-3 py-2 border border-slate-300 rounded-xl text-right font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ຊຳລະດ້ວຍໂອນເງິນ / QR:
                    </label>
                    <input
                      type="number"
                      value={splitTransfer === 0 ? '' : splitTransfer}
                      onChange={(e) => setSplitTransfer(Number(e.target.value) || 0)}
                      className="w-full text-base font-bold text-slate-900 px-3 py-2 border border-slate-300 rounded-xl text-right font-mono"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 px-1 font-semibold">
                    <span>ລວມທີ່ຮັບ: {(splitCash + splitTransfer).toLocaleString()} ₭</span>
                    <span className="text-amber-700">
                      ຍອດຂາດ: {Math.max(0, grandTotal - (splitCash + splitTransfer)).toLocaleString()} ₭
                    </span>
                  </div>
                </div>
              )}

              {/* Order note input */}
              <div>
                <input
                  type="text"
                  placeholder="ໝາຍເຫດເພີ່ມເຕີມໃນໃບບິນ (ຖ້າມີ)..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handleFinishSale}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                <span>ຢືນຢັນການຊຳລະ & ອອກໃບບິນ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Sale Receipt Modal */}
      {completedSale && (
        <ReceiptPrint
          sale={completedSale}
          settings={settings}
          formatMoney={formatMoney}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {/* Quick Add Product Modal when barcode not found */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">ເພີ່ມສິນຄ້າໃໝ່ດ່ວນ (Quick Add)</h3>
                  <p className="text-[10px] text-slate-400">ສິນຄ້າບໍ່ທັນມີໃນລະບົບ - ໃສ່ຂໍ້ມູນແລ້ວຂາຍໄດ້ທັນທີ</p>
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
                  placeholder="ເຊັ່ນ: ເຂົ້າໜົມ, ນ້ຳຫວານ, ຢາ..."
                  value={quickAddForm.name}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-emerald-500"
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
                    ໜ່ວຍນັບ
                  </label>
                  <input
                    type="text"
                    value={quickAddForm.baseUnit}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, baseUnit: e.target.value })}
                    placeholder="ອັນ, ຂວດ, ຖົງ..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-700 mb-1">
                    ລາຄາຂາຍຍ່ອຍ (KIP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={quickAddForm.retailPrice}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, retailPrice: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-bold text-emerald-800 px-3 py-1.5 border border-emerald-300 rounded-lg text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-700 mb-1">
                    ລາຄາຂາຍສົ່ງ (KIP)
                  </label>
                  <input
                    type="number"
                    value={quickAddForm.wholesalePrice}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, wholesalePrice: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-bold text-indigo-800 px-3 py-1.5 border border-indigo-300 rounded-lg text-right font-mono"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>ບັນທຶກ & ເພີ່ມໃສ່ກະຕ່າ</span>
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
        title="ກ້ອງສະແກນບາໂຄດສິນຄ້າ (Camera Scanner)"
        sampleBarcodes={products.slice(0, 6).map((p) => ({ code: p.barcode, name: p.name }))}
      />
    </div>
  );
};
