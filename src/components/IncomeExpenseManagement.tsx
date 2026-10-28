import React, { useState, useMemo } from 'react';
import { usePos } from '../context/PosContext';
import { IncomeExpense } from '../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Calendar,
  Filter,
  CheckCircle,
  X,
  CreditCard,
  PieChart,
} from 'lucide-react';

export const IncomeExpenseManagement: React.FC = () => {
  const { incomeExpenses, sales, addIncomeExpense, deleteIncomeExpense, formatMoney } = usePos();

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<string>('ຄ່າຂົນສົ່ງ');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const expenseCategories = [
    'ຄ່າຂົນສົ່ງ',
    'ຄ່າໄຟຟ້າ & ນ້ຳປະປາ',
    'ຄ່າເຊົ່າຮ້ານ/ສາງ',
    'ເງິນເດືອນພະນັກງານ',
    'ຄ່າຫຸ້ມຫໍ່/ຖົງ/ລັງ',
    'ຄ່າຊ່ອມແປງ',
    'ຄ່າອາຫານ & ຕ້ອນຮັບ',
    'ຊຳລະໜີ້ຜູ້ສະໜອງ',
    'ລາຍຈ່າຍອື່ນໆ',
  ];

  const incomeCategories = [
    'ຂາຍລັງເຈ້ຍ/ແກ້ວເປົ່າ',
    'ລາຍຮັບຄ່າຂົນສົ່ງ',
    'ດອກເບ້ຍຮັບ',
    'ຮັບຊຳລະໜີ້ລູກຄ້າ',
    'ລາຍຮັບອື່ນໆ',
  ];

  // Financial Summary
  const validSales = sales.filter((s) => s.status !== 'voided');
  const totalSalesRevenue = validSales.reduce((acc, s) => acc + s.total, 0);
  const totalGrossProfit = validSales.reduce((acc, s) => acc + s.profit, 0);

  const totalOtherIncome = incomeExpenses
    .filter((e) => e.type === 'income')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalExpenses = incomeExpenses
    .filter((e) => e.type === 'expense')
    .reduce((acc, e) => acc + e.amount, 0);

  const netProfit = totalGrossProfit + totalOtherIncome - totalExpenses;

  // Breakdown cash vs transfer in expenses
  const cashExpenses = incomeExpenses
    .filter((e) => e.type === 'expense' && e.paymentMethod === 'cash')
    .reduce((acc, e) => acc + e.amount, 0);

  const transferExpenses = incomeExpenses
    .filter((e) => e.type === 'expense' && e.paymentMethod === 'transfer')
    .reduce((acc, e) => acc + e.amount, 0);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return incomeExpenses.filter((e) => {
      if (filterType === 'all') return true;
      return e.type === filterType;
    });
  }, [incomeExpenses, filterType]);

  const handleOpenAdd = (type: 'income' | 'expense') => {
    setEntryType(type);
    setCategory(type === 'expense' ? expenseCategories[0] : incomeCategories[0]);
    setAmount(0);
    setReference('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('ກະລຸນາປ້ອນຈຳນວນເງິນ');
      return;
    }

    addIncomeExpense({
      type: entryType,
      category,
      amount,
      paymentMethod,
      reference,
      notes,
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold mb-1">
            <DollarSign className="w-4 h-4" />
            <span>ບັນຊີລາຍຮັບ - ລາຍຈ່າຍ ແລະ ກຳໄລສຸດທິ</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ການເງິນ ແລະ ຄ່າໃຊ້ຈ່າຍໃນການດຳເນີນທຸລະກິດ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ບັນທຶກຄ່າຂົນສົ່ງ, ຄ່າເຊົ່າ, ຄ່າໄຟຟ້າ, ເງິນເດືອນ ແລະ ລາຍຮັບອື່ນໆ ເພື່ອຄຳນວນກຳໄລສຸດທິ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAdd('income')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ ບັນທຶກລາຍຮັບ</span>
          </button>
          <button
            onClick={() => handleOpenAdd('expense')}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>- ບັນທຶກລາຍຈ່າຍ</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">ລາຍຮັບຈາກການຂາຍ</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatMoney(totalSalesRevenue)}
          </div>
          <span className="text-[10px] text-slate-400">ຍອດຂາຍສົ່ງ ແລະ ຂາຍຍ່ອຍ</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">ກຳໄລຂັ້ນຕົ້ນ (Gross Profit)</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            {formatMoney(totalGrossProfit)}
          </div>
          <span className="text-[10px] text-slate-400">ຍອດຂາຍ - ຕົ້ນທຶນສິນຄ້າ</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">ລາຍຈ່າຍທັງໝົດ (Expenses)</span>
          <div className="text-xl font-bold text-red-700 mt-1">
            {formatMoney(totalExpenses)}
          </div>
          <div className="text-[10px] text-slate-400 flex gap-2 mt-0.5">
            <span>ສົດ: {formatMoney(cashExpenses)}</span>
            <span>·</span>
            <span>ໂອນ: {formatMoney(transferExpenses)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-700">ກຳໄລສຸດທິ (Net Profit)</span>
          <div
            className={`text-xl font-extrabold mt-1 tracking-tight ${
              netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {formatMoney(netProfit)}
          </div>
          <span className="text-[10px] text-slate-400">ກຳໄລຂັ້ນຕົ້ນ + ລາຍຮັບອື່ນ - ລາຍຈ່າຍ</span>
        </div>
      </div>

      {/* Filter Selector */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            ທັງໝົດ ({incomeExpenses.length})
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
              filterType === 'expense' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            ລາຍຈ່າຍ ({incomeExpenses.filter((e) => e.type === 'expense').length})
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
              filterType === 'income' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            ລາຍຮັບ ({incomeExpenses.filter((e) => e.type === 'income').length})
          </button>
        </div>

        <span className="text-xs text-slate-500">
          ລວມລາຍການທີ່ສະແດງ: <strong>{filteredEntries.length}</strong>
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">ວັນທີ-ເວລາ</th>
                <th className="px-4 py-3 font-semibold">ປະເພດ</th>
                <th className="px-4 py-3 font-semibold">ໝວດໝູ່</th>
                <th className="px-4 py-3 font-semibold text-right">ຈຳນວນເງິນ</th>
                <th className="px-4 py-3 font-semibold text-center">ວິທີຊຳລະ</th>
                <th className="px-4 py-3 font-semibold">ເລກອ້າງອີງ & ໝາຍເຫດ</th>
                <th className="px-4 py-3 font-semibold">ຜູ້ບັນທຶກ</th>
                <th className="px-4 py-3 font-semibold text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    ບໍ່ມີລາຍການບັນທຶກ
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(e.date).toLocaleString('lo-LA')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          e.type === 'income'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {e.type === 'income' ? '+ ລາຍຮັບ' : '- ລາຍຈ່າຍ'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{e.category}</td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-bold ${
                        e.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {e.type === 'income' ? '+' : '-'}{formatMoney(e.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-slate-600 font-medium">
                        {e.paymentMethod === 'cash' ? 'ເງິນສົດ' : 'ໂອນເງິນ'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-700 font-medium">{e.reference || '-'}</span>
                      {e.notes && <p className="text-[10px] text-slate-400">{e.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{e.createdBy}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteIncomeExpense(e.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        title="ລຶບ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {entryType === 'income' ? 'ບັນທຶກລາຍຮັບ' : 'ບັນທຶກລາຍຈ່າຍ'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ໝວດໝູ່ *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  {(entryType === 'expense' ? expenseCategories : incomeCategories).map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຈຳນວນເງິນ (KIP) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount === 0 ? '' : amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="w-full text-xl font-bold px-3 py-2 border border-slate-300 rounded-lg text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ວິທີຊຳລະ</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2 rounded-lg border cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    ເງິນສົດ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-2 rounded-lg border cursor-pointer ${
                      paymentMethod === 'transfer'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    ໂອນເງິນ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເລກທີໃບຮັບເງິນ / ເອກະສານອ້າງອີງ
                </label>
                <input
                  type="text"
                  placeholder="ເຊັ່ນ: INV-2026-001, EDL-102"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ໝາຍເຫດ</label>
                <input
                  type="text"
                  placeholder="ຄຳອະທິບາຍເພີ່ມເຕີມ..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer ${
                    entryType === 'income' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  ບັນທຶກ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
