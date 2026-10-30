import React from 'react';
import { usePos } from '../context/PosContext';
import { hasMenuAccess, ROLE_DEFINITIONS, getAllowedMenus } from '../lib/rbac';
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
  ChevronLeft,
  ChevronRight,
  Store,
  LucideIcon,
  Lock,
  KeyRound,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenSwitchUser?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface MenuGroup {
  groupTitle: string;
  items: {
    id: string;
    label: string;
    shortLabel: string;
    icon: LucideIcon;
    badge?: number;
    badgeColor?: string;
    accentColor?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenSwitchUser,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { products, customers, currentUser, settings } = usePos();

  const lowStockCount = products.filter(
    (p) => p.stockQty > 0 && p.stockQty <= p.minStockAlert
  ).length;
  const outOfStockCount = products.filter((p) => p.stockQty <= 0).length;
  const totalStockAlerts = lowStockCount + outOfStockCount;

  const debtorsCount = customers.filter((c) => c.currentDebt > 0).length;

  const menuGroups: MenuGroup[] = [
    {
      groupTitle: 'ລະບົບຂາຍສິນຄ້າ (Point of Sale)',
      items: [
        {
          id: 'retail-pos',
          label: 'ຂາຍຍ່ອຍ (Retail POS)',
          shortLabel: 'ຂາຍຍ່ອຍ',
          icon: ShoppingCart,
          accentColor: 'text-emerald-400',
        },
        {
          id: 'wholesale-pos',
          label: 'ຂາຍສົ່ງ (Wholesale POS)',
          shortLabel: 'ຂາຍສົ່ງ',
          icon: Truck,
          accentColor: 'text-blue-400',
        },
        {
          id: 'dashboard',
          label: 'ໜ້າຫຼັກ (Dashboard)',
          shortLabel: 'ພາບລວມ',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupTitle: 'ສິນຄ້າ & ສະຕັອກ (Inventory)',
      items: [
        {
          id: 'products',
          label: 'ຈັດການສິນຄ້າ',
          shortLabel: 'ສິນຄ້າ',
          icon: Package,
        },
        {
          id: 'stock',
          label: 'ສະຕັອກສິນຄ້າ',
          shortLabel: 'ສະຕັອກ',
          icon: Layers,
          badge: totalStockAlerts > 0 ? totalStockAlerts : undefined,
          badgeColor: 'bg-red-500',
        },
      ],
    },
    {
      groupTitle: 'ລູກຄ້າ & ຄູ່ຄ້າ (CRM)',
      items: [
        {
          id: 'customers',
          label: 'ລູກຄ້າ & ລູກໜີ້',
          shortLabel: 'ລູກຄ້າ',
          icon: Users,
          badge: debtorsCount > 0 ? debtorsCount : undefined,
          badgeColor: 'bg-amber-500',
        },
        {
          id: 'suppliers',
          label: 'ຜູ້ສະໜອງ & ໜີ້ສິນ',
          shortLabel: 'ຜູ້ສະໜອງ',
          icon: Building2,
        },
      ],
    },
    {
      groupTitle: 'ການເງິນ & ບົດລາຍງານ (Finance)',
      items: [
        {
          id: 'finance',
          label: 'ລາຍຮັບ - ລາຍຈ່າຍ',
          shortLabel: 'ລາຍຮັບ-ຈ່າຍ',
          icon: DollarSign,
        },
        {
          id: 'reports',
          label: 'ລາຍງານການເງິນ',
          shortLabel: 'ລາຍງານ',
          icon: BarChart3,
        },
      ],
    },
    {
      groupTitle: 'ລະບົບ & ຄວາມປອດໄພ (System)',
      items: [
        {
          id: 'staff',
          label: 'ພະນັກງານ & ສິດທິ',
          shortLabel: 'ພະນັກງານ',
          icon: ShieldCheck,
        },
      ],
    },
  ];

  // RBAC: Filter menu groups to only show permitted items for the current user's role
  const visibleMenuGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasMenuAccess(currentUser, item.id)),
    }))
    .filter((group) => group.items.length > 0);

  const canAccessSettings = hasMenuAccess(currentUser, 'settings');
  const roleDef = ROLE_DEFINITIONS[currentUser?.role || 'cashier'];
  const allowedMenusCount = getAllowedMenus(currentUser).length;

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
        className={`fixed lg:static top-0 left-0 z-40 h-screen bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-all duration-200 ease-in-out select-none ${
          isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo & Brand Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md font-extrabold text-sm shrink-0 tracking-wider ring-1 ring-emerald-400/30">
                LP
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <h1 className="font-bold text-sm text-white truncate tracking-tight flex items-center gap-1.5">
                    LaoPOS Pro
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                      v2.5
                    </span>
                  </h1>
                  <p className="text-[10px] text-slate-400 truncate">
                    {settings.storeName}
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle Button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title={isCollapsed ? 'ຂະຫຍາຍເມນູ (Expand)' : 'ຫຍໍ້ເມນູ (Collapse)'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Grouped Navigation Items (Filtered by RBAC) */}
          <nav className="flex-1 p-2.5 space-y-4 overflow-y-auto scrollbar-none">
            {visibleMenuGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {/* Section Header */}
                {!isCollapsed ? (
                  <div className="px-2.5 pt-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    {group.groupTitle}
                  </div>
                ) : (
                  <div className="h-px bg-slate-800 mx-2 my-2" />
                )}

                {/* Items in Group */}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                      } rounded-xl text-xs font-semibold transition-all cursor-pointer relative group ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/20'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className={`flex items-center gap-2.5 truncate ${isCollapsed ? 'justify-center' : ''}`}>
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                            isActive
                              ? 'text-white'
                              : item.accentColor
                              ? item.accentColor
                              : 'text-slate-400'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {/* Badge Counter */}
                      {item.badge !== undefined && (
                        <span
                          className={`${
                            isCollapsed
                              ? 'absolute -top-1 -right-1 min-w-[16px] h-4 text-[9px]'
                              : 'text-[10px] px-1.5 py-0.2'
                          } font-bold text-white rounded-full flex items-center justify-center ${item.badgeColor || 'bg-red-500'}`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip on collapsed desktop */}
                      {isCollapsed && (
                        <span className="hidden lg:group-hover:flex absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-700 pointer-events-none items-center gap-1.5">
                          {item.label}
                          {item.badge !== undefined && (
                            <span className="bg-red-500 text-white text-[9px] px-1 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom User & Settings */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/40 space-y-1.5">
          {/* Settings button - conditionally rendered or locked based on RBAC */}
          {canAccessSettings ? (
            <button
              onClick={() => {
                onOpenSettings();
                onCloseMobile();
              }}
              title={isCollapsed ? 'ຕັ້ງຄ່າລະບົບ (Settings)' : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
              } rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer group relative`}
            >
              <Settings className="w-4 h-4 text-slate-400 group-hover:rotate-45 transition-transform shrink-0" />
              {!isCollapsed && <span>ຕັ້ງຄ່າຮ້ານຄ້າ & ລະບົບ</span>}
              {isCollapsed && (
                <span className="hidden lg:group-hover:block absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-700 pointer-events-none">
                  ຕັ້ງຄ່າຮ້ານຄ້າ
                </span>
              )}
            </button>
          ) : (
            !isCollapsed && (
              <div
                title="ສະເພາະ Admin ຫຼື ຜູ້ຈັດການ ທີ່ມີສິດເຂົ້າເຖິງການຕັ້ງຄ່າ"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 bg-slate-900/40 border border-slate-800/60"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">ຕັ້ງຄ່າຮ້ານ (ລັອກຕາມສິດ)</span>
              </div>
            )
          )}

          {/* Current Staff info & Quick PIN Switcher */}
          <div
            onClick={onOpenSwitchUser}
            title="ກົດເພື່ອປ່ຽນຜູ້ໃຊ້ງານ ຫຼື ປ້ອນລະຫັດ PIN"
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-1.5' : 'justify-between px-3 py-2'
            } text-xs border-t border-slate-800/80 pt-2 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer group`}
          >
            {!isCollapsed ? (
              <div className="flex-1 truncate pr-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white truncate text-[11px] flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${roleDef?.dotColor || 'bg-emerald-500'} inline-block shrink-0 animate-pulse`}></span>
                    {currentUser.name}
                  </p>
                  <KeyRound className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
                      : currentUser.role === 'manager'
                      ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50'
                      : currentUser.role === 'stock'
                      ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                      : currentUser.role === 'accountant'
                      ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-700/50'
                      : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                  }`}>
                    {currentUser.role === 'admin' && 'Admin'}
                    {currentUser.role === 'manager' && 'Manager'}
                    {currentUser.role === 'cashier' && 'Cashier'}
                    {currentUser.role === 'stock' && 'Stock'}
                    {currentUser.role === 'accountant' && 'Accountant'}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    ({allowedMenusCount} ເມນູ)
                  </span>
                </div>
              </div>
            ) : (
              <div
                title={`${currentUser.name} (${currentUser.role}) - ກົດເພື່ອປ່ຽນ PIN`}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ring-2 ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-600 text-white ring-purple-400/40'
                    : currentUser.role === 'manager'
                    ? 'bg-blue-600 text-white ring-blue-400/40'
                    : currentUser.role === 'stock'
                    ? 'bg-amber-600 text-white ring-amber-400/40'
                    : currentUser.role === 'accountant'
                    ? 'bg-cyan-600 text-white ring-cyan-400/40'
                    : 'bg-emerald-600 text-white ring-emerald-400/40'
                }`}
              >
                {currentUser.name.slice(0, 1)}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
