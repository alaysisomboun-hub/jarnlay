import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Truck,
  AlertTriangle,
  PackageX,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Store,
  Calendar,
  Layers,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { products, sales, incomeExpenses, customers, suppliers, formatMoney, selectedCurrency } = usePos();
  const [chartView, setChartView] = useState<'day' | 'month' | 'year'>('day');

  // Filter valid non-voided sales
  const validSales = sales.filter((s) => s.status !== 'voided');

  // Today, Month, Year date helpers
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMonthStr = now.toISOString().slice(0, 7);
  const currentYearStr = now.getFullYear().toString();

  // Calculations
  const todaySalesList = validSales.filter((s) => s.date.slice(0, 10) === todayStr);
  const monthSalesList = validSales.filter((s) => s.date.slice(0, 7) === currentMonthStr);
  const yearSalesList = validSales.filter((s) => s.date.slice(0, 4) === currentYearStr);

  const todayTotal = todaySalesList.reduce((acc, s) => acc + s.total, 0);
  const monthTotal = monthSalesList.reduce((acc, s) => acc + s.total, 0);
  const yearTotal = yearSalesList.reduce((acc, s) => acc + s.total, 0);

  // Wholesale vs Retail
  const wholesaleSalesTotal = validSales
    .filter((s) => s.orderType === 'wholesale')
    .reduce((acc, s) => acc + s.total, 0);

  const retailSalesTotal = validSales
    .filter((s) => s.orderType === 'retail')
    .reduce((acc, s) => acc + s.total, 0);

  // Gross profit & Net profit
  const totalGrossProfit = validSales.reduce((acc, s) => acc + (s.profit || 0), 0);
  
  // Total expenses
  const totalExpenses = incomeExpenses
    .filter((e) => e.type === 'expense')
    .reduce((acc, e) => acc + e.amount, 0);

  const otherIncome = incomeExpenses
    .filter((e) => e.type === 'income' && !e.category.includes('ຊຳລະໜີ້'))
    .reduce((acc, e) => acc + e.amount, 0);

  const netProfit = totalGrossProfit + otherIncome - totalExpenses;

  // Debtors & Payables
  const totalDebtors = customers.reduce((acc, c) => acc + (c.currentDebt || 0), 0);
  const totalPayables = suppliers.reduce((acc, s) => acc + (s.totalPayable || 0), 0);

  // Stock status
  const lowStockProducts = products.filter((p) => p.stockQty > 0 && p.stockQty <= p.minStockAlert);
  const outOfStockProducts = products.filter((p) => p.stockQty <= 0);

  // Chart data generation
  const getChartData = () => {
    if (chartView === 'day') {
      // Last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().slice(0, 10);
        const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
        const daySales = validSales.filter((s) => s.date.slice(0, 10) === dStr);
        const retail = daySales.filter((s) => s.orderType === 'retail').reduce((a, b) => a + b.total, 0);
        const wholesale = daySales.filter((s) => s.orderType === 'wholesale').reduce((a, b) => a + b.total, 0);
        days.push({ label: dayLabel, retail, wholesale, total: retail + wholesale });
      }
      return days;
    } else if (chartView === 'month') {
      // 12 months of current year
      const months = [];
      const monthNames = ['ມ.ກ', 'ກ.ພ', 'ມີ.ນາ', 'ເມ.ສາ', 'ພ.ພ', 'ມິ.ຖຸ', 'ກ.ລ', 'ສ.ຫ', 'ກ.ຍ', 'ຕ.ລ', 'ພ.ຈ', 'ທ.ວ'];
      for (let m = 0; m < 12; m++) {
        const mKey = `${currentYearStr}-${String(m + 1).padStart(2, '0')}`;
        const mSales = validSales.filter((s) => s.date.slice(0, 7) === mKey);
        const retail = mSales.filter((s) => s.orderType === 'retail').reduce((a, b) => a + b.total, 0);
        const wholesale = mSales.filter((s) => s.orderType === 'wholesale').reduce((a, b) => a + b.total, 0);
        months.push({ label: monthNames[m], retail, wholesale, total: retail + wholesale });
      }
      return months;
    } else {
      // Last 3 years
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let y = currentYear - 2; y <= currentYear; y++) {
        const yKey = y.toString();
        const ySales = validSales.filter((s) => s.date.slice(0, 4) === yKey);
        const retail = ySales.filter((s) => s.orderType === 'retail').reduce((a, b) => a + b.total, 0);
        const wholesale = ySales.filter((s) => s.orderType === 'wholesale').reduce((a, b) => a + b.total, 0);
        years.push({ label: `ປີ ${y}`, retail, wholesale, total: retail + wholesale });
      }
      return years;
    }
  };

  const chartData = getChartData();
  const maxChartVal = Math.max(...chartData.map((d) => d.total), 100000);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-medium mb-1">
              <Store className="w-4 h-4" />
              <span>ພາບລວມການດຳເນີນທຸລະກິດມື້ນີ້</span>
              <span aria-hidden="true">·</span>
              <span>{new Date().toLocaleDateString('lo-LA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              ແຜງຄວບຄຸມລະບົບ POS (Dashboard)
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              ຕິດຕາມຍອດຂາຍສົ່ງ, ຂາຍຍ່ອຍ, ສະຕັອກ, ລູກໜີ້ ແລະ ຜົນກຳໄລໄດ້ແບບ Real-time
            </p>
          </div>

          {/* Quick POS action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('retail-pos')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>ຂາຍຍ່ອຍ (Retail POS)</span>
            </button>
            <button
              onClick={() => onNavigate('wholesale-pos')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>ຂາຍສົ່ງ (Wholesale POS)</span>
            </button>
            <button
              onClick={() => onNavigate('stock')}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>ຮັບສິນຄ້າເຂົ້າ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Primary Sales Metrics Cards (Today, Month, Year, Net Profit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ຍອດຂາຍມື້ນີ້</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatMoney(todayTotal)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>{todaySalesList.length} ບິນຂາຍມື້ນີ້</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-600 font-medium">
                {todaySalesList.filter((s) => s.orderType === 'wholesale').length} ຂາຍສົ່ງ
              </span>
            </div>
          </div>
        </div>

        {/* Month Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ຍອດຂາຍເດືອນນີ້</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatMoney(monthTotal)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span>{monthSalesList.length} ບິນໃນເດືອນປັດຈຸບັນ</span>
            </div>
          </div>
        </div>

        {/* Year Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ຍອດຂາຍປີນີ້ ({currentYearStr})</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatMoney(yearTotal)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span>ລວມທັງໝົດ {validSales.length} ບິນ</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ກຳໄລສຸດທິ (Net Profit)</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {netProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
          </div>
          <div>
            <div className={`text-2xl font-bold tracking-tight ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatMoney(netProfit)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>ກຳໄລຂັ້ນຕົ້ນ {formatMoney(totalGrossProfit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Indicators: Wholesale vs Retail, Debtors & Payables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Retail Sales Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              ຍອດຂາຍຍ່ອຍລວມ
            </span>
            <span className="text-[11px] text-slate-400">
              {validSales.length > 0 ? Math.round((retailSalesTotal / (retailSalesTotal + wholesaleSalesTotal || 1)) * 100) : 0}%
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {formatMoney(retailSalesTotal)}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{
                width: `${validSales.length > 0 ? Math.round((retailSalesTotal / (retailSalesTotal + wholesaleSalesTotal || 1)) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Wholesale Sales Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-indigo-600" />
              ຍອດຂາຍສົ່ງລວມ
            </span>
            <span className="text-[11px] text-slate-400">
              {validSales.length > 0 ? Math.round((wholesaleSalesTotal / (retailSalesTotal + wholesaleSalesTotal || 1)) * 100) : 0}%
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {formatMoney(wholesaleSalesTotal)}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{
                width: `${validSales.length > 0 ? Math.round((wholesaleSalesTotal / (retailSalesTotal + wholesaleSalesTotal || 1)) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Accounts Receivable (ລູກໜີ້) */}
        <div
          onClick={() => onNavigate('customers')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-600 text-xs mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
              ລູກໜີ້ຄ້າງຊຳລະ (Receivable)
            </span>
            <span className="text-[11px] text-amber-700 font-medium">ກົດເບິ່ງ</span>
          </div>
          <div className="text-lg font-bold text-amber-700">
            {formatMoney(totalDebtors)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {customers.filter((c) => c.currentDebt > 0).length} ລູກຄ້າຄ້າງຊຳລະ
          </div>
        </div>

        {/* Accounts Payable (ໜີ້ຜູ້ສະໜອງ) */}
        <div
          onClick={() => onNavigate('suppliers')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-red-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-600 text-xs mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-red-600" />
              ໜີ້ຕ້ອງຈ່າຍຜູ້ສະໜອງ (Payable)
            </span>
            <span className="text-[11px] text-red-600 font-medium">ກົດເບິ່ງ</span>
          </div>
          <div className="text-lg font-bold text-red-700">
            {formatMoney(totalPayables)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {suppliers.filter((s) => s.totalPayable > 0).length} ຜູ້ສະໜອງທີ່ຕ້ອງຈ່າຍ
          </div>
        </div>
      </div>

      {/* Row 3: Inventory Alerts & Interactive Sales Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ກຣາຟສະແດງຍອດຂາຍ (Sales Trend)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ແຍກຕາມຂາຍຍ່ອຍ (ສີຂຽວ) ແລະ ຂາຍສົ່ງ (ສີມ່ວງ)
              </p>
            </div>

            {/* Segmented control for Day / Month / Year */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setChartView('day')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  chartView === 'day' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 ວັນຜ່ານມາ
              </button>
              <button
                onClick={() => setChartView('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  chartView === 'month' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                12 ເດືອນ
              </button>
              <button
                onClick={() => setChartView('year')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  chartView === 'year' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ລາຍປີ
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-100">
            {chartData.map((item, index) => {
              const retailHeight = (item.retail / maxChartVal) * 100;
              const wholesaleHeight = (item.wholesale / maxChartVal) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md shadow-lg whitespace-nowrap">
                    <p className="font-semibold">{item.label}</p>
                    <p>ຍ່ອຍ: {item.retail.toLocaleString()} ₭</p>
                    <p>ສົ່ງ: {item.wholesale.toLocaleString()} ₭</p>
                    <p className="border-t border-slate-700 pt-0.5 mt-0.5 font-bold">ລວມ: {item.total.toLocaleString()} ₭</p>
                  </div>

                  {/* Bars Stack */}
                  <div className="w-full max-w-[32px] flex flex-col-reverse justify-start rounded-t-md overflow-hidden bg-slate-50 transition-all">
                    <div
                      className="w-full bg-emerald-500 hover:bg-emerald-600 transition-all"
                      style={{ height: `${retailHeight}%`, minHeight: item.retail > 0 ? '4px' : '0' }}
                    />
                    <div
                      className="w-full bg-indigo-500 hover:bg-indigo-600 transition-all"
                      style={{ height: `${wholesaleHeight}%`, minHeight: item.wholesale > 0 ? '4px' : '0' }}
                    />
                  </div>

                  {/* X-axis Label */}
                  <span className="text-[11px] text-slate-500 mt-2 truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
                <span>ຂາຍຍ່ອຍ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-indigo-500"></span>
                <span>ຂາຍສົ່ງ</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">ສະແດງຕາມ {selectedCurrency}</span>
          </div>
        </div>

        {/* Stock Alerts Column (1 col) */}
        <div className="space-y-4">
          {/* Low Stock Warning */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-sm font-bold text-slate-900">ສິນຄ້າໃກ້ໝົດສະຕັອກ</h3>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                {lowStockProducts.length} ລາຍການ
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">ບໍ່ມີສິນຄ້າໃກ້ໝົດສະຕັອກ</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto pr-1">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <p className="font-medium text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.code}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="font-bold text-amber-700">{p.stockQty}</span>
                      <span className="text-slate-400 text-[10px] ml-1">{p.baseUnit}</span>
                      <p className="text-[9px] text-slate-400">ຂັ້ນຕ່ຳ {p.minStockAlert}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => onNavigate('stock')}
              className="mt-3 w-full py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium text-center border-t border-slate-100 cursor-pointer block"
            >
              ຈັດການສະຕັອກ &gt;
            </button>
          </div>

          {/* Out of Stock Warning */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-red-600">
                <PackageX className="w-4 h-4" />
                <h3 className="text-sm font-bold text-slate-900">ສິນຄ້າໝົດສະຕັອກ</h3>
              </div>
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                {outOfStockProducts.length} ລາຍການ
              </span>
            </div>

            {outOfStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">ບໍ່ມີສິນຄ້າໝົດສະຕັອກ</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto pr-1">
                {outOfStockProducts.map((p) => (
                  <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <p className="font-medium text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.code}</p>
                    </div>
                    <span className="font-bold text-red-600 text-[11px] whitespace-nowrap">
                      ໝົດສະຕັອກ (0)
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => onNavigate('stock')}
              className="mt-3 w-full py-1.5 text-xs text-red-600 hover:text-red-800 font-medium text-center border-t border-slate-100 cursor-pointer block"
            >
              ສັ່ງຊື້ສິນຄ້າເຂົ້າ &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">ລາຍການຂາຍຫຼ້າສຸດ</h3>
            <p className="text-xs text-slate-500">ໃບບິນຂາຍສົ່ງ ແລະ ຂາຍຍ່ອຍທີ່ບັນທຶກເຂົ້າລະບົບ</p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            ເບິ່ງລາຍງານທັງໝົດ &gt;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">ເລກທີບິນ</th>
                <th className="px-4 py-3 font-semibold">ວັນທີ-ເວລາ</th>
                <th className="px-4 py-3 font-semibold">ປະເພດ</th>
                <th className="px-4 py-3 font-semibold">ລູກຄ້າ</th>
                <th className="px-4 py-3 font-semibold text-right">ມູນຄ່າລວມ</th>
                <th className="px-4 py-3 font-semibold text-center">ວິທີຊຳລະ</th>
                <th className="px-4 py-3 font-semibold text-center">ສະຖານະ</th>
                <th className="px-4 py-3 font-semibold">ພະນັກງານ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {validSales.slice(0, 5).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-900">{sale.invoiceNo}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(sale.date).toLocaleString('lo-LA')}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${
                        sale.orderType === 'wholesale'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {sale.orderType === 'wholesale' ? 'ຂາຍສົ່ງ' : 'ຂາຍຍ່ອຍ'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{sale.customerName}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatMoney(sale.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-slate-600 text-[11px]">
                      {sale.paymentMethod === 'cash' && 'ເງິນສົດ'}
                      {sale.paymentMethod === 'transfer' && 'ໂອນເງິນ'}
                      {sale.paymentMethod === 'credit' && 'ເງິນເຊື່ອ'}
                      {sale.paymentMethod === 'split' && 'ຊຳລະຮ່ວມ'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {sale.status === 'completed' ? (
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                        ຊຳລະແລ້ວ
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                        ຄ້າງຊຳລະ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{sale.cashierName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
