import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { StaffUser, Role, MenuPermission, ActionPermission } from '../types';
import {
  ROLE_DEFINITIONS,
  MENU_PERMISSIONS_LIST,
  ACTION_PERMISSIONS_LIST,
  getAllowedMenus,
  hasMenuAccess,
  hasActionPermission,
} from '../lib/rbac';
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
  Sliders,
  Check,
  Ban,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const { staffList, currentUser, auditLogs, addStaff, updateStaff, switchUser, setCurrentUserDirectly, logAudit } = usePos();

  const [activeTab, setActiveTab] = useState<'staff' | 'matrix' | 'audit'>('staff');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Quick switch modal
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  interface StaffFormState {
    name: string;
    username: string;
    pin: string;
    role: Role;
    permissions: string[];
    active: boolean;
  }

  const initialForm: StaffFormState = {
    name: '',
    username: '',
    pin: '1234',
    role: 'cashier',
    permissions: [
      ...ROLE_DEFINITIONS.cashier.defaultMenus,
      ...ROLE_DEFINITIONS.cashier.defaultActions,
    ] as string[],
    active: true,
  };

  const [formData, setFormData] = useState<StaffFormState>(initialForm);

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
      permissions: [...s.permissions],
      active: s.active,
    });
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: Role) => {
    const roleDef = ROLE_DEFINITIONS[newRole];
    const defaultPerms: string[] = [
      ...roleDef.defaultMenus,
      ...roleDef.defaultActions,
    ];
    setFormData({
      ...formData,
      role: newRole,
      permissions:
        newRole === 'admin'
          ? ['all', ...defaultPerms]
          : defaultPerms,
    });
  };

  const togglePermission = (permId: string) => {
    let next: string[];
    if (formData.permissions.includes(permId)) {
      next = formData.permissions.filter((p) => p !== permId && p !== 'all');
    } else {
      next = [...formData.permissions.filter((p) => p !== 'all'), permId];
    }
    setFormData({ ...formData, permissions: next });
  };

  const selectAllPermissions = () => {
    const all: string[] = [
      'all',
      ...MENU_PERMISSIONS_LIST.map((m) => m.id),
      ...ACTION_PERMISSIONS_LIST.map((a) => a.id),
    ];
    setFormData({ ...formData, permissions: all });
  };

  const resetRoleDefaultPermissions = () => {
    const def = ROLE_DEFINITIONS[formData.role];
    const defaultPerms: string[] = [
      ...def.defaultMenus,
      ...def.defaultActions,
    ];
    setFormData({
      ...formData,
      permissions:
        formData.role === 'admin'
          ? ['all', ...defaultPerms]
          : defaultPerms,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.pin.trim()) {
      alert('ກະລຸນາປ້ອນຊື່ ແລະ ລະຫັດ PIN');
      return;
    }

    if (editingId) {
      updateStaff(editingId, formData);
      logAudit('ແກ້ໄຂສິດທິພະນັກງານ', formData.name, `ອັບເດດຕຳແໜ່ງເປັນ ${formData.role}`);
    } else {
      addStaff(formData);
      logAudit('ເພີ່ມພະນັກງານໃໝ່', formData.name, `ສ້າງບັນຊີໃໝ່ ຕຳແໜ່ງ ${formData.role}`);
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

  const handleQuickSwitchToStaff = (s: StaffUser) => {
    setCurrentUserDirectly(s);
    logAudit('ທົດລອງສິດທິຜູ້ໃຊ້', s.name, `ສະຫຼັບໄປໃຊ້ງານເປັນ ${s.name} (${s.role})`);
  };

  const rolesList: Role[] = ['admin', 'manager', 'cashier', 'stock', 'accountant'];

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ລະບົບກຳນົດສິດການເຂົ້າເຖິງ (Role-Based Access Control - RBAC)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ຈັດການພະນັກງານ, ສິດການເຫັນເມນູ ແລະ ປະຫວັດການດຳເນີນງານ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ກຳນົດສິດໃຫ້ແຕ່ລະຕຳແໜ່ງ (Admin, ຜູ້ຈັດການ, ພະນັກງານຂາຍ, ສາງ, ບັນຊີ) ສາມາດເຫັນເມນູທີ່ແຕກຕ່າງກັນ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSwitchModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>ປ່ຽນຜູ້ໃຊ້ງານດ້ວຍ PIN</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
          className={`px-3 py-2 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'staff'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>ລາຍຊື່ພະນັກງານ ({staffList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3 py-2 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'matrix'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>ຕາຕະລາງສິດທິ RBAC Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ປະຫວັດການດຳເນີນງານ ({auditLogs.length})</span>
        </button>
      </div>

      {/* 1. STAFF LIST TAB */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((s) => {
              const isCurrent = s.id === currentUser.id;
              const roleDef = ROLE_DEFINITIONS[s.role] || ROLE_DEFINITIONS.cashier;
              const allowedMenus = getAllowedMenus(s);

              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all relative ${
                    isCurrent ? 'border-emerald-500 ring-2 ring-emerald-50' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-xs shrink-0 ${
                            s.role === 'admin'
                              ? 'bg-purple-600'
                              : s.role === 'manager'
                              ? 'bg-blue-600'
                              : s.role === 'stock'
                              ? 'bg-amber-600'
                              : s.role === 'accountant'
                              ? 'bg-cyan-600'
                              : 'bg-emerald-600'
                          }`}
                        >
                          {s.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm text-slate-900 truncate">{s.name}</h3>
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                                ບັນຊີປັດຈຸບັນ
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">@{s.username} • PIN: {s.pin}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors"
                        title="ແກ້ໄຂສິດທິພະນັກງານ"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Role Badge */}
                    <div className="mt-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${roleDef.badgeBg} ${roleDef.badgeText} ${roleDef.badgeBorder}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${roleDef.dotColor}`} />
                        {roleDef.nameLao}
                      </span>
                    </div>

                    {/* Permitted Menus List */}
                    <div className="mt-3 pt-3 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-slate-700">
                          ເມນູທີ່ສາມາດເຂົ້າເຖິງ: ({allowedMenus.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {s.role === 'admin' ? (
                          <span className="bg-purple-50 text-purple-700 border border-purple-200/60 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                            ເຂົ້າເຖິງໄດ້ທຸກເມນູ (Super Admin)
                          </span>
                        ) : (
                          allowedMenus.map((menuId) => {
                            const menuItem = MENU_PERMISSIONS_LIST.find((m) => m.id === menuId);
                            return (
                              <span
                                key={menuId}
                                className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-medium"
                              >
                                {menuItem?.labelLao || menuId}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      ສະຖານະ: {s.active ? 'ເປີດໃຊ້ງານ' : 'ປິດໃຊ້ງານ'}
                    </span>
                    <button
                      onClick={() => handleQuickSwitchToStaff(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700'
                      }`}
                      title="ທົດລອງສິດທິຂອງພະນັກງານທ່ານນີ້"
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>ກຳລັງໃຊ້</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:text-white" />
                          <span>ທົດລອງສິດນີ້</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. RBAC MATRIX TAB */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                ຕາຕະລາງສິດທິການເຂົ້າເຖິງແຕ່ລະຕຳແໜ່ງ (Role Matrix)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ປຽບທຽບສິດການເຫັນເມນູ ແລະ ຟັງຊັນສຳຄັນຂອງແຕ່ລະບົດບາດໃນຮ້ານຄ້າ
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <Check className="w-4 h-4 text-emerald-600" /> ມີສິດ
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-400 ml-2">
                <Ban className="w-3.5 h-3.5 text-slate-300" /> ບໍ່ມີສິດ
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="p-3 font-bold sticky left-0 bg-slate-50 min-w-[200px]">
                    ເມນູ / ຟັງຊັນການເຮັດວຽກ
                  </th>
                  {rolesList.map((r) => {
                    const def = ROLE_DEFINITIONS[r];
                    return (
                      <th key={r} className="p-3 text-center min-w-[130px]">
                        <span className={`inline-block px-2.5 py-1 rounded-lg font-bold ${def.badgeBg} ${def.badgeText} border ${def.badgeBorder}`}>
                          {def.nameLao.split(' (')[0]}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* 1. Menus Category */}
                <tr className="bg-slate-100/60">
                  <td colSpan={6} className="px-3 py-1.5 font-bold text-[11px] text-slate-600 uppercase tracking-wider">
                    ເມນູໃນແຖບຂ້າງ (Sidebar Menus)
                  </td>
                </tr>
                {MENU_PERMISSIONS_LIST.map((menu) => (
                  <tr key={menu.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-medium sticky left-0 bg-white">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{menu.labelLao}</span>
                        <span className="text-[10px] text-slate-400">{menu.labelEn}</span>
                      </div>
                    </td>
                    {rolesList.map((r) => {
                      const def = ROLE_DEFINITIONS[r];
                      const isAllowed = r === 'admin' || def.defaultMenus.includes(menu.id);
                      return (
                        <td key={r} className="p-3 text-center">
                          {isAllowed ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300">
                              <Ban className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* 2. Special Actions Category */}
                <tr className="bg-slate-100/60">
                  <td colSpan={6} className="px-3 py-1.5 font-bold text-[11px] text-slate-600 uppercase tracking-wider">
                    ສິດພິເສດ ແລະ ການດຳເນີນງານ (Special Operations)
                  </td>
                </tr>
                {ACTION_PERMISSIONS_LIST.map((action) => (
                  <tr key={action.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-medium sticky left-0 bg-white">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{action.labelLao}</span>
                        <span className="text-[10px] text-slate-400">{action.description}</span>
                      </div>
                    </td>
                    {rolesList.map((r) => {
                      const def = ROLE_DEFINITIONS[r];
                      const isAllowed = r === 'admin' || def.defaultActions.includes(action.id);
                      return (
                        <td key={r} className="p-3 text-center">
                          {isAllowed ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300">
                              <Ban className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">ປະຫວັດການດຳເນີນງານໃນລະບົບ (Audit Trail)</h3>
              <p className="text-xs text-slate-500">ບັນທຶກທຸກການເຄື່ອນໄຫວ, ຜູ້ຂາຍ, ການຍົກເລີກບິນ, ຫຼື ປັບລາຄາ</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {auditLogs.length} ລາຍການ
            </span>
          </div>
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
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase font-bold">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{log.action}</td>
                    <td className="px-4 py-2.5 font-mono text-emerald-700 font-semibold">
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

      {/* ADD / EDIT STAFF MODAL WITH GRANULAR PERMISSIONS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {editingId ? 'ແກ້ໄຂຂໍ້ມູນ & ສິດທິພະນັກງານ' : 'ເພີ່ມພະນັກງານໃໝ່'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ກຳນົດຕຳແໜ່ງ, ລະຫັດ PIN ແລະ ເລືອກເມນູທີ່ອະນຸຍາດໃຫ້ເຂົ້າເຖິງ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ເຊັ່ນ: somsak"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ລະຫັດ PIN (4-6 ຕົວເລກ) *
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono text-center text-lg font-bold focus:border-emerald-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">ໃຊ້ສຳລັບສະຫຼັບບັນຊີດ່ວນໜ້າ POS</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ຕຳແໜ່ງ ແລະ ບົດບາດ (Role) *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as Role)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="admin">ຜູ້ດູແລລະບົບ (Admin) - ສິດເຕັມທຸກເມນູ</option>
                    <option value="manager">ຜູ້ຈັດການ (Manager) - ຂາຍ, ສາງ, ລູກຄ້າ ແລະ ລາຍງານ</option>
                    <option value="cashier">ພະນັກງານຂາຍ (Cashier) - ຂາຍຍ່ອຍ & ຂາຍສົ່ງ</option>
                    <option value="stock">ພະນັກງານສາງ (Stock) - ນັບສະຕັອກ & ຮັບເຄື່ອງ</option>
                    <option value="accountant">ພະນັກງານບັນຊີ (Accountant) - ລາຍຮັບ-ລາຍຈ່າຍ & ລາຍງານ</option>
                  </select>
                </div>
              </div>

              {/* Granular Menu Permissions Selector */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900">
                    ສິດທິການເຫັນເມນູ (Menu Access Permissions)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={resetRoleDefaultPermissions}
                      className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                    >
                      ຕັ້ງຄ່າຕາມຕຳແໜ່ງ
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      ເລືອກທັງໝົດ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/90">
                  {MENU_PERMISSIONS_LIST.map((menu) => {
                    const isChecked =
                      formData.permissions.includes('all') ||
                      formData.permissions.includes(menu.id);

                    return (
                      <label
                        key={menu.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(menu.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="truncate">
                          <span className="block truncate">{menu.labelLao}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{menu.category}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Special Action Permissions */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  ສິດພິເສດໃນການດຳເນີນງານ (Special Action Permissions)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ACTION_PERMISSIONS_LIST.map((action) => {
                    const isChecked =
                      formData.permissions.includes('all') ||
                      formData.permissions.includes(action.id);

                    return (
                      <label
                        key={action.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(action.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 cursor-pointer"
                        />
                        <div>
                          <span className="block font-semibold">{action.labelLao}</span>
                          <span className="text-[10px] text-slate-500">{action.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>ບັນທຶກສິດທິ</span>
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
                ກະລຸນາປ້ອນລະຫັດ PIN 4-6 ຕົວເລກ ເພື່ອສະຫຼັບຜູ້ໃຊ້ງານລະບົບ POS
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
                className="w-36 text-center text-3xl tracking-widest font-mono font-bold px-3 py-2 border-2 border-slate-300 focus:border-emerald-600 rounded-xl mx-auto block"
              />

              {pinError && (
                <p className="text-xs text-red-600 font-semibold">
                  ລະຫັດ PIN ບໍ່ຖືກຕ້ອງ! ກະລຸນາລອງໃໝ່
                </p>
              )}

              <div className="text-[11px] text-slate-400 pt-1 space-y-0.5">
                <p>PIN ຕົວຢ່າງ: Admin=1234, Manager=8888</p>
                <p>Cashier=1111, Stock=2222, Accountant=3333</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwitchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
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
