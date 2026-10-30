import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { ROLE_DEFINITIONS, getAllowedMenus } from '../lib/rbac';
import { StaffUser } from '../types';
import {
  Lock,
  X,
  KeyRound,
  Shield,
  CheckCircle,
  Users,
  ChevronRight,
  Eye,
  Sparkles,
} from 'lucide-react';

interface StaffSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffSwitchModal: React.FC<StaffSwitchModalProps> = ({ isOpen, onClose }) => {
  const { staffList, currentUser, switchUser, setCurrentUserDirectly, logAudit } = usePos();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [selectedStaffForPin, setSelectedStaffForPin] = useState<StaffUser | null>(null);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    const success = switchUser(pinInput.trim());
    if (success) {
      setPinInput('');
      setPinError(false);
      onClose();
    } else {
      setPinError(true);
    }
  };

  const handleSelectStaffDirect = (staff: StaffUser) => {
    setCurrentUserDirectly(staff);
    logAudit(
      'ສະຫຼັບພະນັກງານ (Switch Staff)',
      staff.name,
      `ປ່ຽນຜູ້ໃຊ້ງານເປັນ ${staff.name} (${staff.role})`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                ສະຫຼັບຜູ້ໃຊ້ງານ & ທົດສອບສິດທິ (RBAC)
              </h3>
              <p className="text-[11px] text-slate-400">
                ເລືອກພະນັກງານ ຫຼື ປ້ອນລະຫັດ PIN ເພື່ອກວດສອບເມນູຕາມຕຳແໜ່ງ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Quick PIN Entry Form */}
          <form
            onSubmit={handlePinSubmit}
            className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-center space-y-3"
          >
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>ປ້ອນລະຫັດ PIN ພະນັກງານ (4-6 ຕົວເລກ)</span>
            </div>

            <div className="flex justify-center items-center gap-2">
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
                className="w-36 text-center text-2xl tracking-widest font-mono font-bold px-3 py-2 border-2 border-slate-300 focus:border-emerald-600 rounded-xl bg-white shadow-xs focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                ເຂົ້າສູ່ລະບົບ
              </button>
            </div>

            {pinError && (
              <p className="text-xs text-red-600 font-semibold animate-shake">
                ລະຫັດ PIN ບໍ່ຖືກຕ້ອງ! ກະລຸນາກວດສອບ ຫຼື ເລືອກລາຍຊື່ດ້ານລຸ່ມ
              </p>
            )}
          </form>

          {/* 2. Staff Profile Selector / Role Simulator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  ລາຍຊື່ພະນັກງານໃນຮ້ານ ({staffList.length} ທ່ານ)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                ກົດເພື່ອສະຫຼັບສິດທິທັນທີ
              </span>
            </div>

            <div className="space-y-2.5">
              {staffList.map((staff) => {
                const isCurrent = staff.id === currentUser.id;
                const roleDef = ROLE_DEFINITIONS[staff.role] || ROLE_DEFINITIONS.cashier;
                const allowedMenus = getAllowedMenus(staff);

                return (
                  <div
                    key={staff.id}
                    onClick={() => handleSelectStaffDirect(staff)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                      isCurrent
                        ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-slate-50/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs ${
                          staff.role === 'admin'
                            ? 'bg-purple-600'
                            : staff.role === 'manager'
                            ? 'bg-blue-600'
                            : staff.role === 'stock'
                            ? 'bg-amber-600'
                            : staff.role === 'accountant'
                            ? 'bg-cyan-600'
                            : 'bg-emerald-600'
                        }`}
                      >
                        {staff.name.slice(0, 1)}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {staff.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.2 rounded-full">
                              ກຳລັງໃຊ້ງານ
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {/* Role Badge */}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleDef.badgeBg} ${roleDef.badgeText} ${roleDef.badgeBorder}`}
                          >
                            {roleDef.nameLao}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            PIN: {staff.pin}
                          </span>
                        </div>

                        {/* Visible Menu preview */}
                        <p className="text-[10px] text-slate-500 mt-1 truncate">
                          <span className="font-semibold text-slate-600">ເມນູທີ່ເຫັນ ({allowedMenus.length}):</span>{' '}
                          {staff.role === 'admin'
                            ? 'ທຸກເມນູ (Admin Super User)'
                            : allowedMenus.join(', ')}
                        </p>
                      </div>
                    </div>

                    {/* Right button */}
                    <div className="shrink-0 flex items-center">
                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-700'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>ເລືອກຢູ່</span>
                          </>
                        ) : (
                          <>
                            <span>ສະຫຼັບ</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>ລະບົບຈະປັບປ່ຽນເມນູໃນ Sidebar ໃຫ້ອັດຕະໂນມັດຕາມຕຳແໜ່ງທີ່ເລືອກ</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            ປິດ
          </button>
        </div>
      </div>
    </div>
  );
};
