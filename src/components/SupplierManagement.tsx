import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { Supplier } from '../types';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Edit,
  Trash2,
  DollarSign,
  CheckCircle,
  X,
  History,
} from 'lucide-react';

export const SupplierManagement: React.FC = () => {
  const { suppliers, stockMovements, addSupplier, updateSupplier, deleteSupplier, paySupplierDebt, formatMoney } = usePos();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pay Payable Modal
  const [payModalSupplier, setPayModalSupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer'>('transfer');
  const [payNotes, setPayNotes] = useState<string>('');

  const initialForm = {
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    totalPayable: 0,
    notes: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.phone.includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      ...initialForm,
      code: `SUP-${Math.floor(100 + Math.random() * 900)}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingId(s.id);
    setFormData({
      code: s.code,
      name: s.name,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email || '',
      address: s.address,
      totalPayable: s.totalPayable,
      notes: s.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('ກະລຸນາປ້ອນຊື່ຜູ້ສະໜອງ');
      return;
    }

    if (editingId) {
      updateSupplier(editingId, formData);
    } else {
      addSupplier(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (s: Supplier) => {
    if (s.totalPayable > 0) {
      alert(`ຍັງມີຍອດໜີ້ຄ້າງຈ່າຍໃຫ້ຜູ້ສະໜອງ ${formatMoney(s.totalPayable)}! ບໍ່ສາມາດລຶບໄດ້`);
      return;
    }
    if (window.confirm(`ຕ້ອງການລຶບຜູ້ສະໜອງ "${s.name}" ແທ້ຫຼືບໍ່?`)) {
      deleteSupplier(s.id);
    }
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalSupplier || payAmount <= 0) {
      alert('ກະລຸນາປ້ອນຈຳນວນເງິນ');
      return;
    }

    paySupplierDebt(payModalSupplier.id, payAmount, payMethod, payNotes);
    alert(`ບັນທຶກການຊຳລະໜີ້ ${formatMoney(payAmount)} ໃຫ້ ${payModalSupplier.name} ສຳເລັດ!`);
    setPayModalSupplier(null);
    setPayAmount(0);
    setPayNotes('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold mb-1">
            <Building2 className="w-4 h-4" />
            <span>ຈັດການຜູ້ສະໜອງສິນຄ້າ (Suppliers & Vendors)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ລາຍຊື່ຜູ້ສະໜອງສິນຄ້າ ({suppliers.length} ບໍລິສັດ)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ບັນທຶກການສັ່ງຊື້, ຕິດຕາມໜີ້ທີ່ຕ້ອງຈ່າຍໃຫ້ຜູ້ສະໜອງ ແລະ ບັນທຶກປະຫວັດການຮັບເຄື່ອງ
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ເພີ່ມຜູ້ສະໜອງໃໝ່</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຜູ້ສະໜອງ, ເບີໂທ, ຜູ້ຕິດຕໍ່..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => {
          const hasDebt = s.totalPayable > 0;

          return (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{s.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] text-slate-400">{s.code}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        ຕິດຕໍ່: {s.contactPerson}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer"
                      title="ແກ້ໄຂ"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                      title="ລຶບ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                  {s.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{s.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </div>
                </div>

                {/* Payable Debt */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">ໜີ້ທີ່ຕ້ອງຈ່າຍ:</span>
                  <span
                    className={`font-mono font-bold ${
                      hasDebt ? 'text-red-700 bg-red-50 px-2 py-0.5 rounded' : 'text-slate-700'
                    }`}
                  >
                    {formatMoney(s.totalPayable)}
                  </span>
                </div>
              </div>

              {/* Bottom Pay Button */}
              {hasDebt && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setPayModalSupplier(s);
                      setPayAmount(s.totalPayable);
                    }}
                    className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-2xs transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>ຊຳລະໜີ້ຜູ້ສະໜອງ</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingId ? 'ແກ້ໄຂຂໍ້ມູນຜູ້ສະໜອງ' : 'ເພີ່ມຜູ້ສະໜອງໃໝ່'}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ລະຫັດຜູ້ສະໜອງ</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ຊື່ຜູ້ຕິດຕໍ່</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="ເຊັ່ນ: ທ່ານ ສົມຫວັງ"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ຊື່ບໍລິສັດ / ຜູ້ສະໜອງ *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ເຊັ່ນ: ບໍລິສັດ ເບຍລາວ ຈຳກັດ"
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
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ອີເມວ</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ທີ່ຢູ່</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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

      {/* PAY SUPPLIER MODAL */}
      {payModalSupplier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-400" />
                ຊຳລະໜີ້ໃຫ້ຜູ້ສະໜອງ
              </h3>
              <button
                onClick={() => setPayModalSupplier(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPay} className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-red-800 font-semibold">ຜູ້ສະໜອງ: {payModalSupplier.name}</p>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-xs text-slate-600">ໜີ້ທີ່ຕ້ອງຈ່າຍ:</span>
                  <span className="text-lg font-extrabold text-red-900 font-mono">
                    {formatMoney(payModalSupplier.totalPayable)}
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
                  max={payModalSupplier.totalPayable}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full text-xl font-bold px-3 py-2 border border-slate-300 rounded-lg text-right font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ໝາຍເຫດ:</label>
                <input
                  type="text"
                  placeholder="ເລກໃບໂອນ ຫຼື ໃບຮັບເງິນ..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalSupplier(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  ຢືນຢັນການຊຳລະ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
