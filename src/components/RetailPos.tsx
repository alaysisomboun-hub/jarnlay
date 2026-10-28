import React, { useState, useMemo, useRef } from 'react';
import { usePos } from '../context/PosContext';
import { Product, CartItem, PaymentMethod, SaleOrder } from '../types';
import { ReceiptPrint } from './ReceiptPrint';
import {
  Search,
  Barcode,
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
  AlertCircle,
} from 'lucide-react';

export const RetailPos: React.FC = () => {
  const {
    products,
    customers,
    currentUser,
    settings,
    completeSale,
    formatMoney,
  } = usePos();

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

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products
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

  // Selected Customer
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Add product to cart
  const addToCart = (product: Product, unitName?: string) => {
    if (product.stockQty <= 0) {
      alert(`ສິນຄ້າ "${product.name}" ໝົດສະຕັອກແລ້ວ! ບໍ່ສາມາດຂາຍໄດ້`);
      return;
    }

    const unitDef = unitName
      ? product.units.find((u) => u.name === unitName) || product.units[0]
      : product.units[0] || {
          name: product.baseUnit,
          factor: 1,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice,
        };

    const factor = unitDef.factor || 1;
    const unitPrice = unitDef.retailPrice || product.retailPrice;

    // Check existing in cart
    const existingIndex = cart.findIndex(
      (item) => item.productId === product.id && item.selectedUnit === unitDef.name
    );

    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      const newQty = existing.qty + 1;
      const newBaseQty = newQty * factor;

      // Check stock limit across ALL items in cart for this product
      const totalCartBaseQtyForProduct = cart
        .filter((i, idx) => i.productId === product.id && idx !== existingIndex)
        .reduce((sum, i) => sum + i.baseQty, 0) + newBaseQty;

      if (totalCartBaseQtyForProduct > product.stockQty) {
        alert(`ຈຳນວນໃນກະຕ່າເກີນສະຕັອກທີ່ມີ (${product.stockQty} ${product.baseUnit})`);
        return;
      }

      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existing,
        qty: newQty,
        baseQty: newBaseQty,
        subtotal: newQty * existing.unitPrice - existing.discount,
      };
      setCart(updatedCart);
    } else {
      if (factor > product.stockQty) {
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
      };
      setCart([...cart, newItem]);
    }
  };

  // Handle barcode scanning (pressing Enter in barcode input)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // Search barcode in product or unit barcodes
    const found = products.find(
      (p) => p.barcode === code || p.code === code || p.units.some((u) => u.barcode === code)
    );

    if (found) {
      // If matched a specific unit barcode, use that unit
      const matchedUnit = found.units.find((u) => u.barcode === code);
      addToCart(found, matchedUnit?.name);
      setBarcodeInput('');
    } else {
      alert(`ບໍ່ພົບສິນຄ້າທີ່ມີບາໂຄດ: ${code}`);
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

    const updated = [...cart];
    updated[index] = {
      ...item,
      qty: newQty,
      baseQty: newBaseQty,
      subtotal: newQty * item.unitPrice - item.discount,
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
    const unitPrice = unitDef.retailPrice || product.retailPrice;
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
      orderType: 'retail',
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
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-130px)] min-h-[650px]">
      {/* LEFT COLUMN: Product Catalog (65%) */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Top Search & Barcode Bar */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50/50">
          {/* Barcode Fast Scan Input */}
          <form onSubmit={handleBarcodeSubmit} className="relative sm:w-64">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="ສະແກນບາໂຄດ (Enter)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono shadow-2xs"
            />
          </form>

          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, ລະຫັດສິນຄ້າ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-white">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'all' ? 'ທຸກໝວດໝູ່' : cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="p-4 flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 bg-slate-50/30">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">ບໍ່ພົບລາຍການສິນຄ້າ</p>
              <p className="text-xs text-slate-400 mt-1">ລອງຄົ້ນຫາດ້ວຍຄຳສັບອື່ນ ຫຼື ສະແກນບາໂຄດໃໝ່</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isOutOfStock = p.stockQty <= 0;
              const isLowStock = p.stockQty > 0 && p.stockQty <= p.minStockAlert;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-xl border p-3 flex flex-col justify-between transition-all group ${
                    isOutOfStock
                      ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-200 hover:border-emerald-400 hover:shadow-sm cursor-pointer'
                  }`}
                  onClick={() => !isOutOfStock && addToCart(p)}
                >
                  <div>
                    {/* Image / Icon container */}
                    <div className="w-full h-28 rounded-lg bg-slate-100 overflow-hidden mb-2 relative flex items-center justify-center">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                      )}

                      {/* Stock badge */}
                      <span
                        className={`absolute top-1.5 right-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md shadow-xs ${
                          isOutOfStock
                            ? 'bg-red-600 text-white'
                            : isLowStock
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-900/80 text-white backdrop-blur-xs'
                        }`}
                      >
                        {isOutOfStock ? 'ໝົດ' : `${p.stockQty} ${p.baseUnit}`}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.code}</p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-700">
                        {formatMoney(p.retailPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        /{p.baseUnit}
                      </span>
                    </div>

                    {/* Quick unit add if multi units */}
                    {p.units.length > 1 && (
                      <div className="flex gap-1">
                        {p.units.slice(1).map((u, idx) => (
                          <button
                            key={idx}
                            title={`ເພີ່ມ ${u.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p, u.name);
                            }}
                            className="px-1.5 py-0.5 text-[9px] font-medium bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-sm cursor-pointer border border-slate-200"
                          >
                            +{u.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: POS Cart & Checkout (35%) */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Customer Header in Cart */}
        <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 mr-2">
            <User className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full text-xs font-medium bg-transparent border-none focus:outline-hidden text-slate-800 truncate cursor-pointer"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.currentDebt > 0 ? `(ໜີ້: ${c.currentDebt.toLocaleString()} ₭)` : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setCart([])}
            disabled={cart.length === 0}
            className="text-[11px] text-slate-400 hover:text-red-600 disabled:opacity-40 cursor-pointer transition-colors"
          >
            ລ້າງກະຕ່າ
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <ShoppingBag className="w-10 h-10 text-slate-200 mb-2 stroke-1" />
              <p className="text-xs font-medium">ກະຕ່າຍັງວ່າງເປົ່າ</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ກົດເລືອກສິນຄ້າ ຫຼື ສະແກນບາໂຄດເພື່ອຂາຍ
              </p>
            </div>
          ) : (
            cart.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);

              return (
                <div key={index} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {item.productName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Unit selector dropdown */}
                        {product && product.units.length > 1 ? (
                          <select
                            value={item.selectedUnit}
                            onChange={(e) => changeItemUnit(index, e.target.value)}
                            className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-slate-700 font-medium"
                          >
                            {product.units.map((u, uIdx) => (
                              <option key={uIdx} value={u.name}>
                                {u.name} (x{u.factor})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {item.selectedUnit}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          @{item.unitPrice.toLocaleString()} ₭
                        </span>
                      </div>
                    </div>

                    {/* Line total */}
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900">
                        {formatMoney(item.subtotal)}
                      </span>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-slate-400 hover:text-red-600 block ml-auto mt-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity Controller & Item Discount */}
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateQty(index, -1)}
                        className="p-1 hover:bg-slate-200 text-slate-600 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-bold text-slate-800 font-mono">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(index, 1)}
                        className="p-1 hover:bg-slate-200 text-slate-600 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      ຕັດສະຕັອກ: {item.baseQty} {product?.baseUnit}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
          <div className="flex justify-between text-xs text-slate-600">
            <span>ມູນຄ່າລວມ ({cart.reduce((a, b) => a + b.qty, 0)} ລາຍການ):</span>
            <span className="font-semibold text-slate-900">{formatMoney(subtotal)}</span>
          </div>

          {/* Discount input */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              ສ່ວນຫຼຸດພິເສດ:
            </span>
            <div className="flex items-center gap-1 w-28">
              <input
                type="number"
                min="0"
                value={orderDiscount === 0 ? '' : orderDiscount}
                placeholder="0"
                onChange={(e) => setOrderDiscount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full text-right px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400">₭</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-900">ຍອດຊຳລະສຸດທິ:</span>
            <span className="text-xl font-extrabold text-emerald-700 tracking-tight">
              {formatMoney(grandTotal)}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <DollarSign className="w-4 h-4" />
            <span>ຄິດເງິນ / ຊຳລະ ({formatMoney(grandTotal)})</span>
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">ຊຳລະເງິນ (Retail Checkout)</h3>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Grand Total Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-xs text-emerald-800 font-medium">ຍອດທີ່ຕ້ອງຊຳລະທັງໝົດ</span>
                <div className="text-3xl font-extrabold text-emerald-700 tracking-tight mt-0.5">
                  {formatMoney(grandTotal)}
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>ເງິນສົດ (Cash)</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('transfer')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'transfer'
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>ໂອນເງິນ / QR</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('split')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'split'
                      ? 'border-purple-500 bg-purple-50 text-purple-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>ຊຳລະຮ່ວມ (Split)</span>
                </button>
              </div>

              {/* Cash payment section */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ຈຳນວນເງິນສົດທີ່ຮັບມາ (KIP):
                    </label>
                    <input
                      type="number"
                      value={cashReceived === 0 ? '' : cashReceived}
                      onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                      className="w-full text-xl font-bold text-slate-900 px-3 py-2 border border-slate-300 rounded-lg text-right font-mono focus:ring-2 focus:ring-emerald-500"
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
                        onClick={() => setCashReceived(btn.val)}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer font-mono"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Change display */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">ເງິນທອນ:</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      {change.toLocaleString()} ₭
                    </span>
                  </div>
                </div>
              )}

              {/* Transfer payment section with QR */}
              {paymentMethod === 'transfer' && (
                <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-slate-800">
                    ສະແກນ QR ໂອນຜ່ານ BCEL One / ທະນາຄານ
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=LAO-QR-PAY|ACC:${settings.qrAccountNumber}|AMT:${grandTotal}`}
                      alt="BCEL One QR"
                      className="w-32 h-32 border border-slate-300 rounded-lg p-1 bg-white shadow-xs"
                    />
                  </div>
                  <div className="text-xs text-slate-600">
                    <p className="font-mono font-bold text-slate-800">{settings.qrAccountNumber}</p>
                    <p className="text-[11px] text-slate-500">{settings.qrAccountName}</p>
                  </div>
                </div>
              )}

              {/* Split payment section */}
              {paymentMethod === 'split' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ຊຳລະດ້ວຍເງິນສົດ:
                    </label>
                    <input
                      type="number"
                      value={splitCash === 0 ? '' : splitCash}
                      onChange={(e) => setSplitCash(Number(e.target.value) || 0)}
                      className="w-full text-sm font-bold text-slate-900 px-3 py-1.5 border border-slate-300 rounded-lg text-right font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ຊຳລະດ້ວຍໂອນເງິນ / QR:
                    </label>
                    <input
                      type="number"
                      value={splitTransfer === 0 ? '' : splitTransfer}
                      onChange={(e) => setSplitTransfer(Number(e.target.value) || 0)}
                      className="w-full text-sm font-bold text-slate-900 px-3 py-1.5 border border-slate-300 rounded-lg text-right font-mono"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 px-1">
                    <span>ລວມທີ່ຮັບ: {(splitCash + splitTransfer).toLocaleString()} ₭</span>
                    <span>ຍອດຂາດ: {Math.max(0, grandTotal - (splitCash + splitTransfer)).toLocaleString()} ₭</span>
                  </div>
                </div>
              )}

              {/* Order note input */}
              <div>
                <input
                  type="text"
                  placeholder="ໝາຍເຫດເພີ່ມເຕີມ (ຖ້າມີ)..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowCheckout(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={handleFinishSale}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                ຢືນຢັນການຊຳລະ & ອອກບິນ
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
    </div>
  );
};
