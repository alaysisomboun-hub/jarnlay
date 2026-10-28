import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { StaffUser, Role } from '../types';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  KeyRound,
  Lock,
  Edit,
  Trash2,
  CheckCircle,
  X,
  History,
  Shield,
  Clock,
  User,
} from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const { staffList, currentUser, auditLogs, addStaff, updateStaff, switchUser } = usePos();

  const [activeTab, setActiveTab] = useState<'staff' | 'audit'>('staff');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Quick switch modal
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const initialForm = {
    name: '',
    username: '',
    pin: '1234',
    role: 'cashier' as Role,
    permissions: ['pos', 'wholesale', 'customers'],
    active: true,
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: StaffUser) => {
    setEditingId(s.id);
    setFormData({
      name: s.name,
      username: s.username,
      pin: s.pin,
      role: s.role,
      permissions: s.permissions,
      active: s.active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.pin.trim()) {
      alert('ກະລຸນາປ້ອນຊື່ ແລະ ລະຫັດ PIN');
      return;
    }

    if (editingId) {
      updateStaff(editingId, formData);
    } else {
      addStaff(formData);
    }
    setIsModalOpen(false);
  };

  const handleSwitchUserWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = switchUser(pinInput);
    if (success) {
      setPinInput('');
      setPinError(false);
      setIsSwitchModalOpen(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>ຈັດການພະນັກງານ ແລະ ລະບົບສິດທິ (RBAC & Audit Trail)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ພະນັກງານ, ສິດທິ ແລະ ປະຫວັດການດຳເນີນງານ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin, ຜູ້ຈັດການ, ພະນັກງານຂາຍ; ກວດສອບວ່າໃຜເປັນຜູ້ຂາຍ, ແກ້ໄຂລາຄາ, ຍົກເລີກບິນ ຫຼື ປັບສະຕັອກ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSwitchModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span>ປ່ຽນຜູ້ໃຊ້ງານດ້ວຍ PIN</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ເພີ່ມພະນັກງານ</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-3 py-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'staff'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ລາຍຊື່ພະນັກງານ ({staffList.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ປະຫວັດການດຳເນີນງານ (Audit Log - {auditLogs.length})
        </button>
      </div>

      {/* 1. STAFF LIST TAB */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((s) => {
            const isCurrent = s.id === currentUser.id;

            return (
              <div
                key={s.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  isCurrent ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm border border-slate-200">
                        {s.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-slate-900">{s.name}</h3>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded">
                              ກຳລັງໃຊ້ງານ
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">@{s.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Role Badge */}
                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        s.role === 'admin'
                          ? 'bg-purple-50 text-purple-700'
                          : s.role === 'manager'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {s.role === 'admin' && 'ຜູ້ດູແລລະບົບ (Admin)'}
                      {s.role === 'manager' && 'ຜູ້ຈັດການ (Manager)'}
                      {s.role === 'cashier' && 'ພະນັກງານຂາຍ (Cashier)'}
                    </span>
                  </div>

                  {/* Permissions list */}
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 block mb-1">ສິດທິການເຂົ້າເຖິງ:</span>
                    <p className="line-clamp-2">
                      {s.role === 'admin'
                        ? 'ເຂົ້າເຖິງໄດ້ທຸກເມນູ ແລະ ທຸກຟັງຊັນຂອງລະບົບ'
                        : s.permissions.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>PIN: ••••</span>
                  <span>ສະຖານະ: {s.active ? 'ເປີດໃຊ້ງານ' : 'ປິດໃຊ້ງານ'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ວັນທີ-ເວລາ</th>
                  <th className="px-4 py-2.5 font-semibold">ຜູ້ໃຊ້ງານ</th>
                  <th className="px-4 py-2.5 font-semibold">ບົດບາດ</th>
                  <th className="px-4 py-2.5 font-semibold">ການກະທຳ (Action)</th>
                  <th className="px-4 py-2.5 font-semibold">ເປົ້າໝາຍ (Target)</th>
                  <th className="px-4 py-2.5 font-semibold">ລາຍລະອຽດ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('lo-LA')}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{log.userName}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{log.action}</td>
                    <td className="px-4 py-2.5 font-mono text-indigo-700 font-semibold">
                      {log.target}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-md truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT STAFF MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingId ? 'ແກ້ໄຂຂໍ້ມູນພະນັກງານ' : 'ເພີ່ມພະນັກງານໃໝ່'}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຊື່ ແລະ ນາມສະກຸນ *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ເຊັ່ນ: ທ້າວ ສົມສັກ"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ລະຫັດ PIN (4 ຕົວເລກ) *
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono text-center text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ບົດບາດ ແລະ ຕຳແໜ່ງ (Role) *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const r = e.target.value as Role;
                    setFormData({
                      ...formData,
                      role: r,
                      permissions:
                        r === 'admin'
                          ? ['all']
                          : r === 'manager'
                          ? ['pos', 'wholesale', 'products', 'stock', 'customers', 'suppliers', 'expenses', 'reports']
                          : ['pos', 'wholesale', 'customers'],
                    });
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="admin">ຜູ້ດູແລລະບົບ (Admin) - ສິດເຕັມທຸກເມນູ</option>
                  <option value="manager">ຜູ້ຈັດການ (Manager) - ຂາຍ, ສະຕັອກ, ບິນ ແລະ ລາຍງານ</option>
                  <option value="cashier">ພະນັກງານຂາຍ (Cashier) - ໜ້າ POS ຂາຍສົ່ງ ແລະ ຂາຍຍ່ອຍ</option>
                </select>
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

      {/* SWITCH USER WITH PIN MODAL */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                ປ້ອນລະຫັດ PIN ພະນັກງານ
              </h3>
              <button
                onClick={() => setIsSwitchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSwitchUserWithPin} className="p-6 text-center space-y-4">
              <p className="text-xs text-slate-600">
                ກະລຸນາປ້ອນລະຫັດ PIN 4 ຕົວເລກ ເພື່ອສະຫຼັບຜູ້ໃຊ້ງານລະບົບ POS
              </p>

              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="••••"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className="w-36 text-center text-3xl tracking-widest font-mono font-bold px-3 py-2 border-2 border-slate-300 focus:border-indigo-600 rounded-xl mx-auto block"
              />

              {pinError && (
                <p className="text-xs text-red-600 font-semibold">
                  ລະຫັດ PIN ບໍ່ຖືກຕ້ອງ! ກະລຸນາລອງໃໝ່
                </p>
              )}

              <div className="flex justify-center gap-1 text-[11px] text-slate-400 pt-2">
                <span>PIN ຕົວຢ່າງ: Admin=1234, Manager=8888, Cashier=1111</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwitchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                >
                  ເຂົ້າສູ່ລະບົບ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
