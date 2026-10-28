import React, { useState, useMemo } from 'react';
import { usePos } from '../context/PosContext';
import { Product, StockMovement, Supplier } from '../types';
import {
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Sliders,
  ClipboardCheck,
  Search,
  Plus,
  AlertTriangle,
  History,
  CheckCircle,
  Package,
  Calendar,
  X,
  User,
} from 'lucide-react';

export const StockManagement: React.FC = () => {
  const {
    products,
    suppliers,
    customers,
    stockMovements,
    receiveStock,
    adjustStock,
    processStockReturn,
    reconcileAudit,
    formatMoney,
  } = usePos();

  const [activeTab, setActiveTab] = useState<'overview' | 'inbound' | 'audit' | 'adjust' | 'return' | 'logs'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // ---------------- Inbound State ----------------
  const [inboundSupplierId, setInboundSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [inboundRef, setInboundRef] = useState<string>(`PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`);
  const [inboundItems, setInboundItems] = useState<
    Array<{ productId: string; unit: string; factor: number; qty: number; unitCost: number }>
  >([]);
  const [inboundPaid, setInboundPaid] = useState<number>(0);
  const [inboundNotes, setInboundNotes] = useState<string>('');

  // ---------------- Audit State ----------------
  const [auditCounts, setAuditCounts] = useState<{ [productId: string]: number }>({});
  const [auditNotes, setAuditNotes] = useState<{ [productId: string]: string }>({});

  // ---------------- Adjust State ----------------
  const [adjustProductId, setAdjustProductId] = useState<string>(products[0]?.id || '');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('ສິນຄ້າເສຍຫາຍ/ໝົດອາຍຸ');

  // ---------------- Return State ----------------
  const [returnType, setReturnType] = useState<'customer_return' | 'supplier_return'>('customer_return');
  const [returnProductId, setReturnProductId] = useState<string>(products[0]?.id || '');
  const [returnUnit, setReturnUnit] = useState<string>('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnAmount, setReturnAmount] = useState<number>(0);
  const [returnRef, setReturnRef] = useState<string>(`RET-${Date.now().toString().slice(-6)}`);
  const [returnPartyId, setReturnPartyId] = useState<string>('');
  const [returnNotes, setReturnNotes] = useState<string>('');

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Selected Inbound Supplier
  const selectedSupplier = suppliers.find((s) => s.id === inboundSupplierId);

  // Inbound calculations
  const inboundTotal = useMemo(() => {
    return inboundItems.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
  }, [inboundItems]);

  const addInboundRow = (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return;
    const unit = p.units[0];
    setInboundItems([
      ...inboundItems,
      {
        productId: p.id,
        unit: unit.name,
        factor: unit.factor,
        qty: 1,
        unitCost: p.costPrice * unit.factor,
      },
    ]);
  };

  const handleFinishInbound = (e: React.FormEvent) => {
    e.preventDefault();
    if (inboundItems.length === 0) {
      alert('ກະລຸນາເລືອກສິນຄ້າທີ່ຮັບເຂົ້າຢ່າງໜ້ອຍ 1 ລາຍການ');
      return;
    }

    receiveStock({
      supplierId: inboundSupplierId || undefined,
      supplierName: selectedSupplier?.name,
      items: inboundItems,
      totalAmount: inboundTotal,
      amountPaid: inboundPaid,
      referenceNo: inboundRef,
      notes: inboundNotes,
    });

    alert('ບັນທຶກການຮັບສິນຄ້າເຂົ້າສາງສຳເລັດ!');
    setInboundItems([]);
    setInboundPaid(0);
    setInboundNotes('');
    setInboundRef(`PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`);
    setActiveTab('overview');
  };

  // Handle stock adjustment
  const handleFinishAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === adjustProductId);
    if (!prod) return;

    adjustStock(prod.id, adjustQty, adjustReason);
    alert(`ປັບຍອດສະຕັອກ "${prod.name}" ເປັນ ${adjustQty} ${prod.baseUnit} ສຳເລັດ!`);
    setActiveTab('overview');
  };

  // Handle Physical Audit Reconciliation
  const handleReconcileItem = (p: Product) => {
    const counted = auditCounts[p.id];
    if (counted === undefined || isNaN(counted)) {
      alert('ກະລຸນາປ້ອນຈຳນວນທີ່ນັບໄດ້ຕົວຈິງ');
      return;
    }

    reconcileAudit(p.id, counted, auditNotes[p.id] || 'ກວດນັບສະຕັອກຕົວຈິງ');
    alert(`ປັບຍອດສິນຄ້າ "${p.name}" ໃຫ້ກົງກັບຈຳນວນນັບຕົວຈິງ (${counted} ${p.baseUnit}) ແລ້ວ!`);
  };

  // Handle Return
  const handleFinishReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === returnProductId);
    if (!prod) return;

    const chosenUnit = prod.units.find((u) => u.name === returnUnit) || prod.units[0];

    processStockReturn({
      type: returnType,
      productId: prod.id,
      unit: chosenUnit.name,
      factor: chosenUnit.factor,
      qty: returnQty,
      amount: returnAmount,
      referenceNo: returnRef,
      notes: returnNotes,
      customerId: returnType === 'customer_return' ? returnPartyId : undefined,
      supplierId: returnType === 'supplier_return' ? returnPartyId : undefined,
    });

    alert(`ບັນທຶກການຄືນສິນຄ້າສຳເລັດ!`);
    setReturnNotes('');
    setReturnAmount(0);
    setActiveTab('overview');
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold mb-1">
            <Layers className="w-4 h-4" />
            <span>ລະບົບຈັດການສະຕັອກສິນຄ້າ (Inventory & Stock Control)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ຄັງສິນຄ້າ ແລະ ການເຄື່ອນໄຫວສະຕັອກ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ຮັບສິນຄ້າເຂົ້າສາງ, ກວດນັບສະຕັອກຕົວຈິງ, ປັບຍອດ, ຄືນສິນຄ້າ ແລະ ກວດສອບປະຫວັດການເຄື່ອນໄຫວ (Ledger)
          </p>
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ພາບລວມສະຕັອກ
          </button>
          <button
            onClick={() => setActiveTab('inbound')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'inbound' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>ຮັບສິນຄ້າເຂົ້າ</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>ກວດນັບສະຕັອກຈິງ</span>
          </button>
          <button
            onClick={() => setActiveTab('adjust')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'adjust' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ປັບຍອດສະຕັອກ</span>
          </button>
          <button
            onClick={() => setActiveTab('return')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'return' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ຄືນສິນຄ້າ</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'logs' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>ປະຫວັດເຄື່ອນໄຫວ</span>
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ຄົ້ນຫາສິນຄ້າໃນສະຕັອກ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              ສິນຄ້າທັງໝົດ: <strong className="text-slate-900">{products.length}</strong> ລາຍການ
            </span>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ລະຫັດ & ຊື່ສິນຄ້າ</th>
                    <th className="px-4 py-3 font-semibold">ໝວດໝູ່</th>
                    <th className="px-4 py-3 font-semibold text-right">ສະຕັອກປັດຈຸບັນ</th>
                    <th className="px-4 py-3 font-semibold text-center">ໜ່ວຍບັນຈຸໃຫຍ່</th>
                    <th className="px-4 py-3 font-semibold text-center">ຈຸດເຕືອນຂັ້ນຕ່ຳ</th>
                    <th className="px-4 py-3 font-semibold text-center">ສະຖານະ</th>
                    <th className="px-4 py-3 font-semibold text-right">ມູນຄ່າສະຕັອກ (ທຶນ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProducts.map((p) => {
                    const isOut = p.stockQty <= 0;
                    const isLow = p.stockQty > 0 && p.stockQty <= p.minStockAlert;
                    const stockValue = p.stockQty * p.costPrice;

                    // Breakdown in biggest unit
                    const biggestUnit = p.units.find((u) => u.factor > 1);
                    const breakdown = biggestUnit
                      ? `${Math.floor(p.stockQty / biggestUnit.factor)} ${biggestUnit.name} + ${p.stockQty % biggestUnit.factor} ${p.baseUnit}`
                      : `${p.stockQty} ${p.baseUnit}`;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.code}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{p.category}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                          {p.stockQty.toLocaleString()} {p.baseUnit}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500 font-medium">
                          {breakdown}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-500">
                          {p.minStockAlert} {p.baseUnit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOut
                                ? 'bg-red-50 text-red-700'
                                : isLow
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {isOut ? 'ໝົດສະຕັອກ' : isLow ? 'ໃກ້ໝົດ' : 'ປົກກະຕິ'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatMoney(stockValue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. INBOUND TAB (Receive Inventory from Supplier) */}
      {activeTab === 'inbound' && (
        <form onSubmit={handleFinishInbound} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                ຮັບສິນຄ້າເຂົ້າສາງ (Inbound Receiving)
              </h3>
              <p className="text-xs text-slate-500">
                ເພີ່ມຈຳນວນສະຕັອກສິນຄ້າ, ບັນທຶກຜູ້ສະໜອງ ແລະ ບັນທຶກໜີ້ທີ່ຕ້ອງຈ່າຍ
              </p>
            </div>
          </div>

          {/* Supplier & Reference Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ເລືອກຜູ້ສະໜອງ (Supplier) *
              </label>
              <select
                value={inboundSupplierId}
                onChange={(e) => setInboundSupplierId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ເລກທີໃບສັ່ງຊື້ / ໃບສົ່ງເຄື່ອງ *
              </label>
              <input
                type="text"
                required
                value={inboundRef}
                onChange={(e) => setInboundRef(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ເລືອກສິນຄ້າເພື່ອຮັບເຂົ້າ
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addInboundRow(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full text-xs px-3 py-2 border border-emerald-300 rounded-lg bg-emerald-50 text-emerald-900 font-semibold cursor-pointer"
              >
                <option value="">+ ເລືອກສິນຄ້າເພີ່ມໃສ່ລາຍການ...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inbound Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ລາຍການສິນຄ້າ</th>
                  <th className="px-4 py-2.5 font-semibold">ໜ່ວຍນັບທີ່ຮັບ</th>
                  <th className="px-4 py-2.5 font-semibold text-center">ຈຳນວນ</th>
                  <th className="px-4 py-2.5 font-semibold text-center">ອັດຕາແປງ (x)</th>
                  <th className="px-4 py-2.5 font-semibold text-right">ຕົ້ນທຶນ/ໜ່ວຍ</th>
                  <th className="px-4 py-2.5 font-semibold text-right">ມູນຄ່າລວມ</th>
                  <th className="px-4 py-2.5 text-center">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inboundItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      ຍັງບໍ່ມີລາຍການສິນຄ້າຮັບເຂົ້າ. ກະລຸນາເລືອກສິນຄ້າຂ້າງເທິງ
                    </td>
                  </tr>
                ) : (
                  inboundItems.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.productId);

                    return (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{prod?.name}</td>
                        <td className="px-4 py-2.5">
                          <select
                            value={item.unit}
                            onChange={(e) => {
                              const uName = e.target.value;
                              const uDef = prod?.units.find((u) => u.name === uName);
                              if (uDef) {
                                const updated = [...inboundItems];
                                updated[idx] = {
                                  ...item,
                                  unit: uDef.name,
                                  factor: uDef.factor,
                                  unitCost: (prod?.costPrice || 0) * uDef.factor,
                                };
                                setInboundItems(updated);
                              }
                            }}
                            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-medium"
                          >
                            {prod?.units.map((u, uIdx) => (
                              <option key={uIdx} value={u.name}>
                                {u.name} (x{u.factor})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => {
                              const updated = [...inboundItems];
                              updated[idx].qty = Number(e.target.value) || 1;
                              setInboundItems(updated);
                            }}
                            className="w-16 px-2 py-1 text-center border border-slate-300 rounded font-mono font-bold"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-center text-slate-500 font-mono">
                          x{item.factor} (ລວມ +{item.qty * item.factor} {prod?.baseUnit})
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => {
                              const updated = [...inboundItems];
                              updated[idx].unitCost = Number(e.target.value) || 0;
                              setInboundItems(updated);
                            }}
                            className="w-24 px-2 py-1 text-right border border-slate-300 rounded font-mono font-bold"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                          {formatMoney(item.qty * item.unitCost)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => setInboundItems(inboundItems.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Inbound Payment & Debt */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div>
              <span className="text-xs text-slate-600 block">ມູນຄ່າສິນຄ້າລວມ:</span>
              <span className="text-lg font-extrabold text-slate-900 font-mono">
                {formatMoney(inboundTotal)}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ຈຳນວນເງິນທີ່ຊຳລະແລ້ວ (KIP):
              </label>
              <input
                type="number"
                value={inboundPaid}
                onChange={(e) => setInboundPaid(Number(e.target.value) || 0)}
                className="w-full text-sm font-bold px-3 py-1.5 border border-slate-300 rounded-lg text-right font-mono"
              />
            </div>
            <div>
              <span className="text-xs text-slate-600 block">ຍອດຄ້າງຊຳລະ (ໜີ້ຜູ້ສະໜອງ):</span>
              <span className="text-lg font-bold text-red-700 font-mono">
                {formatMoney(Math.max(0, inboundTotal - inboundPaid))}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={inboundItems.length === 0}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              ຢືນຢັນການຮັບສິນຄ້າເຂົ້າສາງ
            </button>
          </div>
        </form>
      )}

      {/* 3. PHYSICAL AUDIT TAB (ກວດນັບສິນຄ້າຈິງທຽບກັບລະບົບ) */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
              ລະບົບກວດນັບສິນຄ້າຈິງ (Physical Inventory Audit)
            </h3>
            <p className="text-xs text-slate-500">
              ປ້ອນຈຳນວນທີ່ນັບໄດ້ຕົວຈິງໃນສາງ, ລະບົບຈະຄຳນວນຜົນຕ່າງ ແລະ ປັບຍອດສະຕັອກໃຫ້ກົງກັນທັນທີ
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ສິນຄ້າ</th>
                  <th className="px-4 py-2.5 font-semibold text-right">ຍອດໃນລະບົບ</th>
                  <th className="px-4 py-2.5 font-semibold text-center">ຍອດນັບຕົວຈິງ</th>
                  <th className="px-4 py-2.5 font-semibold text-center">ຜົນຕ່າງ</th>
                  <th className="px-4 py-2.5 font-semibold">ໝາຍເຫດ</th>
                  <th className="px-4 py-2.5 text-center">ປັບຍອດໃຫ້ກົງ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const counted = auditCounts[p.id] !== undefined ? auditCounts[p.id] : p.stockQty;
                  const diff = counted - p.stockQty;

                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{p.code}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">
                        {p.stockQty} {p.baseUnit}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="number"
                          value={auditCounts[p.id] !== undefined ? auditCounts[p.id] : ''}
                          placeholder={p.stockQty.toString()}
                          onChange={(e) =>
                            setAuditCounts({ ...auditCounts, [p.id]: Number(e.target.value) || 0 })
                          }
                          className="w-20 px-2 py-1 text-center border border-slate-300 rounded font-mono font-bold"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold">
                        {diff === 0 ? (
                          <span className="text-slate-400">ກົງກັນ (0)</span>
                        ) : diff > 0 ? (
                          <span className="text-emerald-600 font-bold">+{diff} {p.baseUnit}</span>
                        ) : (
                          <span className="text-red-600 font-bold">{diff} {p.baseUnit}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          placeholder="ເຫດຜົນຜົນຕ່າງ..."
                          value={auditNotes[p.id] || ''}
                          onChange={(e) => setAuditNotes({ ...auditNotes, [p.id]: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleReconcileItem(p)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                          ອັບເດດຍອດ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MANUAL ADJUSTMENT TAB */}
      {activeTab === 'adjust' && (
        <form onSubmit={handleFinishAdjust} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs max-w-xl mx-auto space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              ປັບຍອດສິນຄ້າໃນສະຕັອກ (Manual Adjustment)
            </h3>
            <p className="text-xs text-slate-500">ແກ້ໄຂຍອດສະຕັອກກໍລະນີສິນຄ້າເສຍຫາຍ ຫຼື ໝົດອາຍຸ</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ເລືອກສິນຄ້າ *</label>
            <select
              value={adjustProductId}
              onChange={(e) => {
                setAdjustProductId(e.target.value);
                const p = products.find((prod) => prod.id === e.target.value);
                if (p) setAdjustQty(p.stockQty);
              }}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (ສະຕັອກປັດຈຸບັນ: {p.stockQty} {p.baseUnit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ຈຳນວນສະຕັອກໃໝ່ທີ່ຕ້ອງການຕັ້ງ:
            </label>
            <input
              type="number"
              min="0"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value) || 0)}
              className="w-full text-base font-bold px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ເຫດຜົນໃນການປັບ *</label>
            <select
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="ສິນຄ້າເສຍຫາຍ/ແຕກຫັກ">ສິນຄ້າເສຍຫາຍ / ແຕກຫັກ</option>
              <option value="ສິນຄ້າໝົດອາຍຸ">ສິນຄ້າໝົດອາຍຸ</option>
              <option value="ກວດພົບສິນຄ້າເພີ່ມ">ກວດພົບສິນຄ້າເພີ່ມໃນສາງ</option>
              <option value="ແກ້ໄຂຂໍ້ຜິດພາດການຄີຂໍ້ມູນ">ແກ້ໄຂຂໍ້ຜິດພາດການຄີຂໍ້ມູນ</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            ບັນທຶກການປັບຍອດສະຕັອກ
          </button>
        </form>
      )}

      {/* 5. RETURNS TAB (Customer or Supplier) */}
      {activeTab === 'return' && (
        <form onSubmit={handleFinishReturn} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs max-w-xl mx-auto space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-600" />
              ຈັດການການຄືນສິນຄ້າ (Returns Management)
            </h3>
            <p className="text-xs text-slate-500">
              ຄືນສິນຄ້າຈາກລູກຄ້າ (ເຂົ້າສາງ) ຫຼື ສົ່ງສິນຄ້າຄືນໃຫ້ຜູ້ສະໜອງ (ຕັດອອກສາງ)
            </p>
          </div>

          {/* Return Type Selector */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setReturnType('customer_return')}
              className={`p-2.5 rounded-xl border cursor-pointer ${
                returnType === 'customer_return'
                  ? 'border-purple-600 bg-purple-50 text-purple-900'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              ລູກຄ້າຄືນສິນຄ້າ (ເຂົ້າສາງ)
            </button>
            <button
              type="button"
              onClick={() => setReturnType('supplier_return')}
              className={`p-2.5 rounded-xl border cursor-pointer ${
                returnType === 'supplier_return'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              ສົ່ງຄືນໃຫ້ຜູ້ສະໜອງ (ອອກສາງ)
            </button>
          </div>

          {/* Party Selection (Customer or Supplier) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {returnType === 'customer_return' ? 'ເລືອກລູກຄ້າທີ່ສົ່ງຄືນ' : 'ເລືອກຜູ້ສະໜອງທີ່ຮັບຄືນ'}
            </label>
            <select
              value={returnPartyId}
              onChange={(e) => setReturnPartyId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">-- ເລືອກ --</option>
              {returnType === 'customer_return'
                ? customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))
                : suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
            </select>
          </div>

          {/* Product and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ສິນຄ້າທີ່ຄືນ *</label>
              <select
                value={returnProductId}
                onChange={(e) => setReturnProductId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ຈຳນວນຄືນ</label>
              <input
                type="number"
                min="1"
                value={returnQty}
                onChange={(e) => setReturnQty(Number(e.target.value) || 1)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          {/* Amount to refund or deduct */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ມູນຄ່າເງິນຄືນ / ຕັດຍອດໜີ້ (KIP):
            </label>
            <input
              type="number"
              value={returnAmount}
              onChange={(e) => setReturnAmount(Number(e.target.value) || 0)}
              className="w-full text-sm font-bold px-3 py-2 border border-slate-300 rounded-lg text-right font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ເຫດຜົນການຄືນ:</label>
            <input
              type="text"
              placeholder="ເຊັ່ນ: ສິນຄ້າມີຕຳໜິ, ຊື້ຜິດຂະໜາດ..."
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            ຢືນຢັນການບັນທຶກຄືນສິນຄ້າ
          </button>
        </form>
      )}

      {/* 6. STOCK MOVEMENT LOGS TAB (Ledger) */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                ປະຫວັດການເຄື່ອນໄຫວສະຕັອກ (Stock Movement Ledger)
              </h3>
              <p className="text-xs text-slate-500">ບັນທຶກທຸກລາຍການຂາຍອອກ, ຮັບເຂົ້າ, ປັບຍອດ ແລະ ຄືນສິນຄ້າ</p>
            </div>
            <span className="text-xs text-slate-500">{stockMovements.length} ລາຍການ</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ວັນທີ-ເວລາ</th>
                  <th className="px-4 py-2.5 font-semibold">ປະເພດ</th>
                  <th className="px-4 py-2.5 font-semibold">ສິນຄ້າ</th>
                  <th className="px-4 py-2.5 font-semibold text-right">ຈຳນວນປ່ຽນແປງ</th>
                  <th className="px-4 py-2.5 font-semibold text-right">ສະຕັອກຄົງເຫຼືອ</th>
                  <th className="px-4 py-2.5 font-semibold">ເລກອ້າງອີງ & ລາຍລະອຽດ</th>
                  <th className="px-4 py-2.5 font-semibold">ຜູ້ດຳເນີນການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockMovements.map((sm) => (
                  <tr key={sm.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 text-slate-500">
                      {new Date(sm.date).toLocaleString('lo-LA')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sm.type === 'inbound'
                            ? 'bg-emerald-50 text-emerald-700'
                            : sm.type === 'sale'
                            ? 'bg-blue-50 text-blue-700'
                            : sm.type === 'sale_return'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {sm.type === 'inbound' && 'ຮັບເຂົ້າ'}
                        {sm.type === 'sale' && 'ຂາຍອອກ'}
                        {sm.type === 'sale_return' && 'ລູກຄ້າຄືນ'}
                        {sm.type === 'supplier_return' && 'ສົ່ງຄືນຜູ້ສະໜອງ'}
                        {sm.type === 'adjustment' && 'ປັບຍອດ'}
                        {sm.type === 'physical_audit' && 'ກວດນັບຈິງ'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{sm.productName}</td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono font-bold ${
                        sm.qtyChange > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {sm.qtyChange > 0 ? `+${sm.qtyChange}` : sm.qtyChange} {sm.unit}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                      {sm.balanceAfter}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-slate-800 font-semibold">{sm.referenceNo}</span>
                      {sm.note && <p className="text-[10px] text-slate-400">{sm.note}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{sm.operatorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
