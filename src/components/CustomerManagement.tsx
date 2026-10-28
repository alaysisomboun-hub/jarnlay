import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { Customer } from '../types';
import {
  Users,
  Plus,
  Search,
  CreditCard,
  Edit,
  Trash2,
  Phone,
  MapPin,
  CheckCircle,
  History,
  X,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export const CustomerManagement: React.FC = () => {
  const { customers, sales, addCustomer, updateCustomer, deleteCustomer, payCustomerDebt, formatMoney } = usePos();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pay Debt Modal state
  const [payDebtCustomer, setPayDebtCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer'>('cash');
  const [payNotes, setPayNotes] = useState<string>('');

  // History Drawer state
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  const initialForm = {
    code: '',
    name: '',
    phone: '',
    address: '',
    type: 'wholesale' as Customer['type'],
    creditLimit: 10000000,
    currentDebt: 0,
    paymentTermsDays: 15,
    notes: '',
  };

  const [formData, setFormData] = useState(initialForm);

  // Filtered
  const filteredCustomers = customers.filter((c) => {
    const matchType = selectedType === 'all' || c.type === selectedType;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.phone.includes(q);
    return matchType && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      ...initialForm,
      code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingId(c.id);
    setFormData({
      code: c.code,
      name: c.name,
      phone: c.phone,
      address: c.address,
      type: c.type,
      creditLimit: c.creditLimit,
      currentDebt: c.currentDebt,
      paymentTermsDays: c.paymentTermsDays,
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('ກະລຸນາປ້ອນຊື່ລູກຄ້າ');
      return;
    }

    if (editingId) {
      updateCustomer(editingId, formData);
    } else {
      addCustomer(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (c: Customer) => {
    if (c.id === 'cust-walkin') {
      alert('ບໍ່ສາມາດລຶບລູກຄ້າທົ່ວໄປ (Walk-in) ໄດ້!');
      return;
    }
    if (c.currentDebt > 0) {
      alert(`ລູກຄ້າ "${c.name}" ຍັງມີຍອດໜີ້ຄ້າງຊຳລະ ${formatMoney(c.currentDebt)}! ບໍ່ສາມາດລຶບໄດ້`);
      return;
    }
    if (window.confirm(`ຕ້ອງການລຶບລູກຄ້າ "${c.name}" ແທ້ຫຼືບໍ່?`)) {
      deleteCustomer(c.id);
    }
  };

  const handleConfirmPayDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDebtCustomer || payAmount <= 0) {
      alert('ກະລຸນາປ້ອນຈຳນວນເງິນຊຳລະ');
      return;
    }

    payCustomerDebt(payDebtCustomer.id, payAmount, payMethod, payNotes);
    alert(`ບັນທຶກການຊຳລະໜີ້ ${formatMoney(payAmount)} ຈາກ ${payDebtCustomer.name} ສຳເລັດ!`);
    setPayDebtCustomer(null);
    setPayAmount(0);
    setPayNotes('');
  };

  // Customer sales history
  const customerSales = historyCustomer
    ? sales.filter((s) => s.customerId === historyCustomer.id)
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold mb-1">
            <Users className="w-4 h-4" />
            <span>ຈັດການຂໍ້ມູນລູກຄ້າ ແລະ ລູກໜີ້ການຄ້າ</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ຖານຂໍ້ມູນລູກຄ້າ ({customers.length} ລາຍ)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ກຳນົດວົງເງິນສິນເຊື່ອ, ໄລຍະເວລາເຄຣດິດ, ຕິດຕາມຍອດໜີ້ຄ້າງຊຳລະ ແລະ ບັນທຶກການຊຳລະໜີ້
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ເພີ່ມລູກຄ້າໃໝ່</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່, ເບີໂທ ຫຼື ລະຫັດລູກຄ້າ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
              selectedType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            ທັງໝົດ ({customers.length})
          </button>
          <button
            onClick={() => setSelectedType('wholesale')}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
              selectedType === 'wholesale' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            ຂາຍສົ່ງ ({customers.filter((c) => c.type === 'wholesale').length})
          </button>
          <button
            onClick={() => setSelectedType('retail')}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
              selectedType === 'retail' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            ຂາຍຍ່ອຍ ({customers.filter((c) => c.type === 'retail').length})
          </button>
        </div>
      </div>

      {/* Customers Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => {
          const hasDebt = c.currentDebt > 0;
          const availableCredit = Math.max(0, c.creditLimit - c.currentDebt);

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] text-slate-400">{c.code}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                          c.type === 'wholesale'
                            ? 'bg-indigo-50 text-indigo-700'
                            : c.type === 'retail'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {c.type === 'wholesale' ? 'ລູກຄ້າຂາຍສົ່ງ' : c.type === 'retail' ? 'ລູກຄ້າຂາຍຍ່ອຍ' : 'ທົ່ວໄປ'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer"
                      title="ແກ້ໄຂ"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {c.id !== 'cust-walkin' && (
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                        title="ລຶບ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Contact info */}
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.address || '-'}</span>
                  </div>
                </div>

                {/* Credit & Debt Stats */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ວົງເງິນສິນເຊື່ອ:</span>
                    <span className="font-semibold text-slate-900">{formatMoney(c.creditLimit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">ຍອດໜີ້ຄ້າງຊຳລະ:</span>
                    <span
                      className={`font-mono font-bold ${
                        hasDebt ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded' : 'text-slate-700'
                      }`}
                    >
                      {formatMoney(c.currentDebt)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>ໄລຍະໃຫ້ເຄຣດິດ: {c.paymentTermsDays} ວັນ</span>
                    <span>ວົງເງິນເຫຼືອ: {formatMoney(availableCredit)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions: Pay debt & History */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                {hasDebt && (
                  <button
                    onClick={() => {
                      setPayDebtCustomer(c);
                      setPayAmount(c.currentDebt);
                    }}
                    className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-2xs transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>ຊຳລະໜີ້</span>
                  </button>
                )}
                <button
                  onClick={() => setHistoryCustomer(c)}
                  className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>ປະຫວັດບິນ</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingId ? 'ແກ້ໄຂຂໍ້ມູນລູກຄ້າ' : 'ເພີ່ມລູກຄ້າໃໝ່'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ລະຫັດລູກຄ້າ</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ປະເພດລູກຄ້າ</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="wholesale">ລູກຄ້າຂາຍສົ່ງ (Wholesale)</option>
                    <option value="retail">ລູກຄ້າຂາຍຍ່ອຍ (Retail)</option>
                    <option value="general">ລູກຄ້າທົ່ວໄປ (General)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ຊື່ລູກຄ້າ / ຮ້ານຄ້າ *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ເຊັ່ນ: ຮ້ານ ດາວເຮືອງ ມິນິມາດ"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ເບີໂທລະສັບ</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="020 xxxx xxxx"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ກຳນົດຊຳລະ (ວັນ)</label>
                  <input
                    type="number"
                    value={formData.paymentTermsDays}
                    onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ທີ່ຢູ່</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="ບ້ານ, ເມືອງ, ແຂວງ"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ວົງເງິນສິນເຊື່ອສູງສຸດ (KIP)
                </label>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) || 0 })}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg font-mono text-right"
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
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  ບັນທຶກ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAY DEBT MODAL */}
      {payDebtCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                ຮັບຊຳລະໜີ້ຈາກລູກຄ້າ
              </h3>
              <button
                onClick={() => setPayDebtCustomer(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayDebt} className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-800 font-semibold">ລູກຄ້າ: {payDebtCustomer.name}</p>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-xs text-slate-600">ຍອດໜີ້ຄ້າງທັງໝົດ:</span>
                  <span className="text-lg font-extrabold text-amber-900 font-mono">
                    {formatMoney(payDebtCustomer.currentDebt)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຈຳນວນເງິນທີ່ຊຳລະ (KIP) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={payDebtCustomer.currentDebt}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full text-xl font-bold px-3 py-2 border border-slate-300 rounded-lg text-right font-mono"
                />
              </div>

              {/* Payment method */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPayMethod('cash')}
                  className={`p-2 rounded-lg border cursor-pointer ${
                    payMethod === 'cash'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  ເງິນສົດ
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('transfer')}
                  className={`p-2 rounded-lg border cursor-pointer ${
                    payMethod === 'transfer'
                      ? 'border-blue-600 bg-blue-50 text-blue-800'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  ໂອນເງິນ
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ໝາຍເຫດ:</label>
                <input
                  type="text"
                  placeholder="ເລກໃບໂອນ ຫຼື ລາຍລະອຽດ..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayDebtCustomer(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  ບັນທຶກຮັບຊຳລະ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY DRAWER */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">ປະຫວັດການຊື້ ແລະ ໜີ້</h3>
                <p className="text-xs text-slate-500">{historyCustomer.name}</p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {customerSales.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">ຍັງບໍ່ມີປະຫວັດການຊື້</p>
              ) : (
                customerSales.map((s) => (
                  <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span className="font-mono">{s.invoiceNo}</span>
                      <span>{formatMoney(s.total)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ວັນທີ: {new Date(s.date).toLocaleDateString('lo-LA')} | {s.orderType === 'wholesale' ? 'ຂາຍສົ່ງ' : 'ຂາຍຍ່ອຍ'}
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
    </div>
  );
};
