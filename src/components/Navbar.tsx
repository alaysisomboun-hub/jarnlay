import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { Currency } from '../types';
import {
  Menu,
  Coins,
  Globe,
  KeyRound,
  Store,
  X,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobile: () => void;
  onOpenSettings: () => void;
  language: string;
  onChangeLanguage: (lang: any) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobile,
  onOpenSettings,
  language,
  onChangeLanguage,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
}) => {
  const { settings, selectedCurrency, setSelectedCurrency, currentUser, switchUser } = usePos();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const currencies: Currency[] = ['LAK', 'THB', 'USD', 'VND'];

  const handleSwitchPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (switchUser(pinInput)) {
      setPinInput('');
      setPinError(false);
      setShowPinModal(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Left Side: Collapse/Mobile toggle & Store Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onToggleMobile}
            className="p-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
            title="ເປີດເມນູ"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Toggle Button */}
          {onToggleSidebarCollapse && (
            <button
              onClick={onToggleSidebarCollapse}
              className="hidden lg:flex p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'ຂະຫຍາຍແຖບເມນູ' : 'ຫຍໍ້ແຖບເມນູ'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Store Name & Branch */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 hidden sm:flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm leading-tight">
                  {settings.storeName}
                </span>
                <span className="hidden md:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {settings.storeBranch}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5">
                ລະບົບຂາຍໜ້າຮ້ານ ຄົບວົງຈອນ (ຂາຍສົ່ງ & ຂາຍຍ່ອຍ)
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Currency Switcher, Language, Active Staff */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Multi-Currency Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200/60">
            <Coins className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 hidden sm:inline" />
            {currencies.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCurrency(c)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                  selectedCurrency === c
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200/60">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            {[
              { code: 'lo', label: 'ລາວ' },
              { code: 'th', label: 'ไทย' },
              { code: 'en', label: 'EN' },
              { code: 'vi', label: 'VN' },
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => onChangeLanguage(l.code)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                  language === l.code
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Active Staff User Button */}
          <button
            onClick={() => setShowPinModal(true)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-colors cursor-pointer group"
            title="ປ່ຽນພະນັກງານ (Switch PIN)"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block truncate max-w-[110px] text-xs font-bold text-slate-900 leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium block leading-none">
                {currentUser.role === 'admin' && 'ຜູ້ດູແລ'}
                {currentUser.role === 'manager' && 'ຜູ້ຈັດການ'}
                {currentUser.role === 'cashier' && 'ພະນັກງານຂາຍ'}
              </span>
            </div>
            <KeyRound className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors ml-0.5" />
          </button>
        </div>
      </header>

      {/* QUICK PIN SWITCH MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                ປ້ອນລະຫັດ PIN ພະນັກງານ
              </h3>
              <button
                onClick={() => setShowPinModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSwitchPin} className="p-6 text-center space-y-4">
              <p className="text-xs text-slate-600">
                ກະລຸນາປ້ອນລະຫັດ PIN 4 ຕົວເລກ ເພື່ອສະຫຼັບຜູ້ໃຊ້ງານ
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
                className="w-36 text-center text-3xl tracking-widest font-mono font-bold px-3 py-2 border-2 border-slate-300 focus:border-emerald-600 rounded-xl mx-auto block focus:outline-hidden"
              />

              {pinError && (
                <p className="text-xs text-red-600 font-semibold">
                  ລະຫັດ PIN ບໍ່ຖືກຕ້ອງ! ກະລຸນາລອງໃໝ່
                </p>
              )}

              <div className="flex justify-center gap-1 text-[10px] text-slate-400 pt-1">
                <span>Admin: 1234 | Manager: 8888 | Cashier: 1111</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                >
                  ເຂົ້າສູ່ລະບົບ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
