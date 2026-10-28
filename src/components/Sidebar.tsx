import React from 'react';
import { usePos } from '../context/PosContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Layers,
  Users,
  Building2,
  DollarSign,
  BarChart3,
  ShieldCheck,
  Settings,
  AlertTriangle,
  LogOut,
  Store,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSettings: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { products, customers, currentUser, settings } = usePos();

  const lowStockCount = products.filter(
    (p) => p.stockQty > 0 && p.stockQty <= p.minStockAlert
  ).length;
  const outOfStockCount = products.filter((p) => p.stockQty <= 0).length;
  const totalStockAlerts = lowStockCount + outOfStockCount;

  const debtorsCount = customers.filter((c) => c.currentDebt > 0).length;

  const menuItems = [
    { id: 'dashboard', label: 'ໜ້າຫຼັກ (Dashboard)', icon: LayoutDashboard },
    { id: 'retail-pos', label: 'ຂາຍຍ່ອຍ (Retail POS)', icon: ShoppingCart, highlight: true },
    { id: 'wholesale-pos', label: 'ຂາຍສົ່ງ (Wholesale POS)', icon: Truck, highlight: true },
    { id: 'products', label: 'ຈັດການສິນຄ້າ', icon: Package },
    {
      id: 'stock',
      label: 'ສະຕັອກສິນຄ້າ',
      icon: Layers,
      badge: totalStockAlerts > 0 ? totalStockAlerts : undefined,
      badgeColor: 'bg-red-500',
    },
    {
      id: 'customers',
      label: 'ລູກຄ້າ & ລູກໜີ້',
      icon: Users,
      badge: debtorsCount > 0 ? debtorsCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    { id: 'suppliers', label: 'ຜູ້ສະໜອງ & ໜີ້ສິນ', icon: Building2 },
    { id: 'finance', label: 'ລາຍຮັບ - ລາຍຈ່າຍ', icon: DollarSign },
    { id: 'reports', label: 'ລາຍງານການເງິນ', icon: BarChart3 },
    { id: 'staff', label: 'ພະນັກງານ & ສິດທິ', icon: ShieldCheck },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Brand */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-md font-bold text-base shrink-0">
              LP
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-sm text-white truncate tracking-tight">
                LaoPOS Pro
              </h1>
              <p className="text-[10px] text-slate-400 truncate">
                {settings.storeName}
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & Settings */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-1">
          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>ຕັ້ງຄ່າລະບົບ</span>
          </button>

          {/* Current Staff info */}
          <div className="px-3 py-2 flex items-center justify-between text-xs border-t border-slate-800/80 pt-2.5">
            <div className="truncate pr-2">
              <p className="font-semibold text-white truncate text-[11px]">{currentUser.name}</p>
              <p className="text-[10px] text-indigo-400 capitalize">
                {currentUser.role === 'admin' && 'ຜູ້ດູແລ (Admin)'}
                {currentUser.role === 'manager' && 'ຜູ້ຈັດການ'}
                {currentUser.role === 'cashier' && 'ພະນັກງານຂາຍ'}
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          </div>
        </div>
      </aside>
    </>
  );
};
