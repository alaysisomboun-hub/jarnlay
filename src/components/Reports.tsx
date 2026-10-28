import React, { useState, useMemo } from 'react';
import { usePos } from '../context/PosContext';
import { SaleOrder } from '../types';
import { ReceiptPrint } from './ReceiptPrint';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Users,
  Building2,
  FileText,
  AlertCircle,
  X,
  RotateCcw,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { products, sales, customers, suppliers, settings, voidSale, formatMoney } = usePos();

  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [reportTab, setReportTab] = useState<'sales' | 'products' | 'margins' | 'debts' | 'invoices'>('sales');
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<SaleOrder | null>(null);

  // Void Modal State
  const [voidModalSale, setVoidModalSale] = useState<SaleOrder | null>(null);
  const [voidReason, setVoidReason] = useState<string>('ລູກຄ້າຍົກເລີກການສັ່ງຊື້');

  // Filter Sales by Date Range
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return sales.filter((s) => {
      const saleDate = s.date.slice(0, 10);

      if (dateRange === 'today') return saleDate === todayStr;
      if (dateRange === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return saleDate === y.toISOString().slice(0, 10);
      }
      if (dateRange === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return saleDate >= d.toISOString().slice(0, 10);
      }
      if (dateRange === 'month') {
        return saleDate.slice(0, 7) === now.toISOString().slice(0, 7);
      }
      if (dateRange === 'year') {
        return saleDate.slice(0, 4) === now.getFullYear().toString();
      }
      if (dateRange === 'custom') {
        return saleDate >= customStart && saleDate <= customEnd;
      }
      return true;
    });
  }, [sales, dateRange, customStart, customEnd]);

  const validSales = filteredSales.filter((s) => s.status !== 'voided');

  // Summary Metrics
  const totalSalesAmount = validSales.reduce((acc, s) => acc + s.total, 0);
  const totalCost = validSales.reduce((acc, s) => acc + s.costTotal, 0);
  const totalProfit = validSales.reduce((acc, s) => acc + s.profit, 0);
  const profitMarginPercent = totalSalesAmount > 0 ? (totalProfit / totalSalesAmount) * 100 : 0;

  const retailTotal = validSales
    .filter((s) => s.orderType === 'retail')
    .reduce((acc, s) => acc + s.total, 0);

  const wholesaleTotal = validSales
    .filter((s) => s.orderType === 'wholesale')
    .reduce((acc, s) => acc + s.total, 0);

  // Product Sales Aggregates (Best selling vs slow moving)
  const productPerformance = useMemo(() => {
    const map = new Map<
      string,
      {
        product: (typeof products)[0] | undefined;
        name: string;
        code: string;
        baseQtySold: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    >();

    // Initialize with all products (so slow moving with 0 sales show up)
    products.forEach((p) => {
      map.set(p.id, {
        product: p,
        name: p.name,
        code: p.code,
        baseQtySold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      });
    });

    validSales.forEach((s) => {
      s.items.forEach((item) => {
        const existing = map.get(item.productId);
        if (existing) {
          existing.baseQtySold += item.baseQty;
          existing.revenue += item.subtotal;
          const cost = (existing.product?.costPrice || 0) * item.baseQty;
          existing.cost += cost;
          existing.profit += item.subtotal - cost;
        }
      });
    });

    return Array.from(map.values());
  }, [products, validSales]);

  // Sort best selling
  const bestSellers = [...productPerformance].sort((a, b) => b.revenue - a.revenue);
  // Sort slow moving
  const slowMovers = [...productPerformance].sort((a, b) => a.baseQtySold - b.baseQtySold);

  // Debt reports
  const customersWithDebt = customers.filter((c) => c.currentDebt > 0);
  const suppliersWithDebt = suppliers.filter((s) => s.totalPayable > 0);

  // Export Report to CSV with UTF-8 BOM
  const handleExportReportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportTab === 'sales' || reportTab === 'invoices') {
      headers = ['ເລກທີບິນ', 'ວັນທີ', 'ປະເພດ', 'ລູກຄ້າ', 'ຍອດລວມ (LAK)', 'ຕົ້ນທຶນ (LAK)', 'ກຳໄລ (LAK)', 'ວິທີຊຳລະ', 'ສະຖານະ', 'ພະນັກງານ'];
      rows = filteredSales.map((s) => [
        `"${s.invoiceNo}"`,
        `"${new Date(s.date).toLocaleDateString('lo-LA')}"`,
        `"${s.orderType === 'wholesale' ? 'ຂາຍສົ່ງ' : 'ຂາຍຍ່ອຍ'}"`,
        `"${s.customerName}"`,
        s.total,
        s.costTotal,
        s.profit,
        s.paymentMethod,
        s.status,
        `"${s.cashierName}"`,
      ]);
    } else if (reportTab === 'products' || reportTab === 'margins') {
      headers = ['ລະຫັດສິນຄ້າ', 'ຊື່ສິນຄ້າ', 'ຈຳນວນຂາຍອອກ', 'ຍອດຂາຍລວມ (LAK)', 'ຕົ້ນທຶນລວມ (LAK)', 'ກຳໄລ (LAK)', '% ກຳໄລ'];
      rows = bestSellers.map((p) => [
        `"${p.code}"`,
        `"${p.name}"`,
        p.baseQtySold,
        p.revenue,
        p.cost,
        p.profit,
        p.revenue > 0 ? `${((p.profit / p.revenue) * 100).toFixed(1)}%` : '0%',
      ]);
    } else {
      headers = ['ປະເພດ', 'ລະຫັດ', 'ຊື່', 'ເບີໂທ', 'ຍອດໜີ້ (LAK)'];
      rows = [
        ...customersWithDebt.map((c) => ['ລູກໜີ້', `"${c.code}"`, `"${c.name}"`, `"${c.phone}"`, c.currentDebt]),
        ...suppliersWithDebt.map((s) => ['ໜີ້ຜູ້ສະໜອງ', `"${s.code}"`, `"${s.name}"`, `"${s.phone}"`, s.totalPayable]),
      ];
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laopos-report-${reportTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Void Sale Confirmation
  const handleConfirmVoid = () => {
    if (!voidModalSale) return;
    if (!voidReason.trim()) {
      alert('ກະລຸນາລະບຸເຫດຜົນໃນການຍົກເລີກບິນ');
      return;
    }

    const success = voidSale(voidModalSale.id, voidReason);
    if (success) {
      alert(`ຍົກເລີກໃບບິນ ${voidModalSale.invoiceNo} ສຳເລັດ! ສິນຄ້າຖືກສົ່ງຄືນສະຕັອກແລ້ວ.`);
      setVoidModalSale(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>ລາຍງານການເງິນ ແລະ ສະຖິຕິການຂາຍ (Financial & Sales Analytics)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ລາຍງານຜົນການດຳເນີນງານ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ຍອດຂາຍປະຈຳວັນ, ເດືອນ, ປີ; ປຽບທຽບຂາຍສົ່ງ vs ຂາຍຍ່ອຍ; ສິນຄ້າຂາຍດີ; ຜົນກຳໄລ ແລະ ບິນຄ້າງຊຳລະ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ສົ່ງອອກ Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>ພິມລາຍງານ</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setDateRange('today')}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
              dateRange === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            ມື້ນີ້
          </button>
          <button
            onClick={() => setDateRange('yesterday')}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
              dateRange === 'yesterday' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            ມື້ວານນີ້
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
              dateRange === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            7 ວັນຫຼ້າສຸດ
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
              dateRange === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            ເດືອນນີ້
          </button>
          <button
            onClick={() => setDateRange('year')}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
              dateRange === 'year' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            ປີນີ້
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
              dateRange === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            ກຳນົດເອງ
          </button>
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">ຈາກ:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded font-mono"
            />
            <span className="text-slate-500">ຫາ:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded font-mono"
            />
          </div>
        )}
      </div>

      {/* Primary Financial Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">ຍອດຂາຍລວມທັງໝົດ</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatMoney(totalSalesAmount)}
          </div>
          <span className="text-[10px] text-slate-400">{validSales.length} ບິນຂາຍທີ່ສຳເລັດ</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">ຕົ້ນທຶນສິນຄ້າທີ່ຂາຍ (COGS)</span>
          <div className="text-xl font-bold text-slate-700 mt-1">
            {formatMoney(totalCost)}
          </div>
          <span className="text-[10px] text-slate-400">ຄິດໄລ່ຕາມຕົ້ນທຶນຕົວຈິງ</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">ກຳໄລຂັ້ນຕົ້ນ</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            {formatMoney(totalProfit)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">
            ອັດຕາກຳໄລ: {profitMarginPercent.toFixed(1)}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">ຂາຍສົ່ງ ທຽບກັບ ຂາຍຍ່ອຍ</span>
          <div className="text-xs font-semibold text-slate-800 mt-1 space-y-0.5">
            <div className="flex justify-between">
              <span>ຂາຍສົ່ງ:</span>
              <span className="text-indigo-700 font-bold">{formatMoney(wholesaleTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>ຂາຍຍ່ອຍ:</span>
              <span className="text-emerald-700 font-bold">{formatMoney(retailTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1 text-xs font-semibold">
        <button
          onClick={() => setReportTab('sales')}
          className={`px-3 py-2 border-b-2 cursor-pointer transition-colors ${
            reportTab === 'sales'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ຍອດຂາຍ & ກຳໄລ
        </button>
        <button
          onClick={() => setReportTab('products')}
          className={`px-3 py-2 border-b-2 cursor-pointer transition-colors ${
            reportTab === 'products'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ສິນຄ້າຂາຍດີ & ຂາຍຊ້າ
        </button>
        <button
          onClick={() => setReportTab('margins')}
          className={`px-3 py-2 border-b-2 cursor-pointer transition-colors ${
            reportTab === 'margins'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ກຳໄລແຍກຕາມສິນຄ້າ
        </button>
        <button
          onClick={() => setReportTab('debts')}
          className={`px-3 py-2 border-b-2 cursor-pointer transition-colors ${
            reportTab === 'debts'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ລູກໜີ້ & ໜີ້ຜູ້ສະໜອງ
        </button>
        <button
          onClick={() => setReportTab('invoices')}
          className={`px-3 py-2 border-b-2 cursor-pointer transition-colors ${
            reportTab === 'invoices'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ລາຍການໃບບິນ & ຍົກເລີກບິນ ({filteredSales.length})
        </button>
      </div>

      {/* 1. SALES OVERVIEW REPORT */}
      {reportTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">
            ພາບລວມການຂາຍຕາມຊ່ວງເວລາທີ່ເລືອກ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-700">ແຍກຕາມວິທີການຊຳລະເງິນ:</h4>
              {['cash', 'transfer', 'credit', 'split'].map((method) => {
                const total = validSales
                  .filter((s) => s.paymentMethod === method)
                  .reduce((sum, s) => sum + s.total, 0);
                const count = validSales.filter((s) => s.paymentMethod === method).length;

                return (
                  <div key={method} className="flex justify-between items-center text-xs py-1">
                    <span className="text-slate-600">
                      {method === 'cash' && 'ເງິນສົດ (Cash)'}
                      {method === 'transfer' && 'ໂອນເງິນ / QR'}
                      {method === 'credit' && 'ເງິນເຊື່ອ (Credit)'}
                      {method === 'split' && 'ຊຳລະຮ່ວມ (Split)'}
                      <span className="text-slate-400 text-[10px] ml-1">({count} ບິນ)</span>
                    </span>
                    <span className="font-bold text-slate-900 font-mono">{formatMoney(total)}</span>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-700">ສະຫຼຸບຍອດຂາຍສົ່ງ ແລະ ຂາຍຍ່ອຍ:</h4>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-600">ຂາຍຍ່ອຍ (Retail):</span>
                <span className="font-bold text-emerald-700 font-mono">{formatMoney(retailTotal)}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-600">ຂາຍສົ່ງ (Wholesale):</span>
                <span className="font-bold text-indigo-700 font-mono">{formatMoney(wholesaleTotal)}</span>
              </div>
              <div className="border-t border-slate-200 pt-1 flex justify-between text-xs font-bold">
                <span>ຍອດລວມ:</span>
                <span className="font-mono text-slate-900">{formatMoney(totalSalesAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BEST SELLING & SLOW MOVING */}
      {reportTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Selling */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 text-emerald-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              10 ອັນດັບສິນຄ້າຂາຍດີທີ່ສຸດ
            </h3>
            <div className="divide-y divide-slate-100">
              {bestSellers.slice(0, 10).map((p, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-800">{idx + 1}. {p.name}</span>
                    <p className="text-[10px] text-slate-400 font-mono">{p.code}</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="font-bold text-slate-900 font-mono">{formatMoney(p.revenue)}</span>
                    <p className="text-[10px] text-slate-500">
                      ຂາຍໄດ້: {p.baseQtySold} {p.product?.baseUnit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slow Moving */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 text-amber-700 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" />
              ສິນຄ້າຂາຍຊ້າ (Slow Moving)
            </h3>
            <div className="divide-y divide-slate-100">
              {slowMovers.slice(0, 10).map((p, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      ສະຕັອກຄົງເຫຼືອ: {p.product?.stockQty} {p.product?.baseUnit}
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-[11px] text-slate-500">
                      ຂາຍໄດ້ພຽງ: <strong className="text-slate-900 font-mono">{p.baseQtySold}</strong> {p.product?.baseUnit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. PRODUCT MARGINS */}
      {reportTab === 'margins' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">
              ລາຍງານກຳໄລແຍກຕາມສິນຄ້າ (Product Profit Margin Analysis)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ສິນຄ້າ</th>
                  <th className="px-4 py-2.5 font-semibold text-center">ຈຳນວນຂາຍ</th>
                  <th className="px-4 py-2.5 font-semibold text-right">ຍອດຂາຍລວມ</th>
                  <th className="px-4 py-2.5 font-semibold text-right">ຕົ້ນທຶນລວມ</th>
                  <th className="px-4 py-2.5 font-semibold text-right">ກຳໄລຂັ້ນຕົ້ນ</th>
                  <th className="px-4 py-2.5 font-semibold text-center">% ກຳໄລ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bestSellers.map((p, idx) => {
                  const marginPct = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 font-bold text-slate-900">{p.name}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-slate-700">
                        {p.baseQtySold} {p.product?.baseUnit}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatMoney(p.revenue)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                        {formatMoney(p.cost)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                        {formatMoney(p.profit)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            marginPct >= 20
                              ? 'bg-emerald-50 text-emerald-700'
                              : marginPct > 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {marginPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DEBT REPORTS */}
      {reportTab === 'debts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customers Debt */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 text-amber-800 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              ລູກຄ້າຄ້າງຊຳລະ (Accounts Receivable)
            </h3>
            <div className="divide-y divide-slate-100">
              {customersWithDebt.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">ບໍ່ມີລູກຄ້າຄ້າງຊຳລະ</p>
              ) : (
                customersWithDebt.map((c) => (
                  <div key={c.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{c.name}</span>
                      <p className="text-[10px] text-slate-400 font-mono">ໂທ: {c.phone}</p>
                    </div>
                    <span className="font-mono font-bold text-amber-700 text-sm">
                      {formatMoney(c.currentDebt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Suppliers Debt */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 text-red-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              ໜີ້ທີ່ຕ້ອງຈ່າຍໃຫ້ຜູ້ສະໜອງ (Accounts Payable)
            </h3>
            <div className="divide-y divide-slate-100">
              {suppliersWithDebt.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">ບໍ່ມີໜີ້ຄ້າງຈ່າຍຜູ້ສະໜອງ</p>
              ) : (
                suppliersWithDebt.map((s) => (
                  <div key={s.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <p className="text-[10px] text-slate-400 font-mono">ຕິດຕໍ່: {s.contactPerson}</p>
                    </div>
                    <span className="font-mono font-bold text-red-700 text-sm">
                      {formatMoney(s.totalPayable)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. INVOICES & VOID LOG */}
      {reportTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ເລກທີບິນ</th>
                  <th className="px-4 py-2.5 font-semibold">ວັນທີ-ເວລາ</th>
                  <th className="px-4 py-2.5 font-semibold">ປະເພດ</th>
                  <th className="px-4 py-2.5 font-semibold">ລູກຄ້າ</th>
                  <th className="px-4 py-2.5 font-semibold text-right">ມູນຄ່າລວມ</th>
                  <th className="px-4 py-2.5 font-semibold text-center">ສະຖານະ</th>
                  <th className="px-4 py-2.5 font-semibold">ພະນັກງານ</th>
                  <th className="px-4 py-2.5 font-semibold text-center">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => {
                  const isVoided = s.status === 'voided';

                  return (
                    <tr key={s.id} className={`hover:bg-slate-50/70 ${isVoided ? 'bg-red-50/40 opacity-70' : ''}`}>
                      <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{s.invoiceNo}</td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {new Date(s.date).toLocaleString('lo-LA')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-slate-700">
                          {s.orderType === 'wholesale' ? 'ຂາຍສົ່ງ' : 'ຂາຍຍ່ອຍ'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{s.customerName}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatMoney(s.total)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isVoided
                              ? 'bg-red-100 text-red-800'
                              : s.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isVoided ? 'ຍົກເລີກແລ້ວ' : s.status === 'completed' ? 'ສຳເລັດ' : 'ຄ້າງຊຳລະ'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{s.cashierName}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedInvoiceForView(s)}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded cursor-pointer"
                            title="ເບິ່ງ/ພິມໃບບິນ"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {!isVoided && (
                            <button
                              onClick={() => setVoidModalSale(s)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                              title="ຍົກເລີກບິນ"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VOID BILL MODAL */}
      {voidModalSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="bg-red-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-red-300" />
                ຍົກເລີກໃບບິນ (Void Invoice)
              </h3>
              <button
                onClick={() => setVoidModalSale(null)}
                className="p-1 text-red-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-900">
                <p className="font-bold">ເລກທີບິນ: {voidModalSale.invoiceNo}</p>
                <p>ຍອດເງິນ: {formatMoney(voidModalSale.total)}</p>
                <p className="mt-1 text-[11px] text-red-700">
                  * ເມື່ອຍົກເລີກ: ສິນຄ້າທັງໝົດໃນບິນຈະຖືກສົ່ງຄືນສະຕັອກ ແລະ ຍອດໜີ້ (ຖ້າມີ) ຈະຖືກຍົກເລີກ.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເຫດຜົນໃນການຍົກເລີກບິນ *
                </label>
                <select
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ລູກຄ້າຍົກເລີກການສັ່ງຊື້">ລູກຄ້າຍົກເລີກການສັ່ງຊື້</option>
                  <option value="ຄິດໄລ່ລາຄາຜິດພາດ">ຄິດໄລ່ລາຄາຜິດພາດ / ໃສ່ຈຳນວນຜິດ</option>
                  <option value="ລູກຄ້າບໍ່ມີເງິນຊຳລະ">ລູກຄ້າບໍ່ມີເງິນຊຳລະ</option>
                  <option value="ສິນຄ້າມີບັນຫາ">ສິນຄ້າມີບັນຫາ</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVoidModalSale(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ເຊົາ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVoid}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                >
                  ຢືນຢັນຍົກເລີກບິນ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW RECEIPT MODAL */}
      {selectedInvoiceForView && (
        <ReceiptPrint
          sale={selectedInvoiceForView}
          settings={settings}
          formatMoney={formatMoney}
          onClose={() => setSelectedInvoiceForView(null)}
        />
      )}
    </div>
  );
};
