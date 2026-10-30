/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PosProvider, usePos } from './context/PosContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { RetailPos } from './components/RetailPos';
import { WholesalePos } from './components/WholesalePos';
import { ProductManagement } from './components/ProductManagement';
import { StockManagement } from './components/StockManagement';
import { CustomerManagement } from './components/CustomerManagement';
import { SupplierManagement } from './components/SupplierManagement';
import { IncomeExpenseManagement } from './components/IncomeExpenseManagement';
import { Reports } from './components/Reports';
import { StaffManagement } from './components/StaffManagement';
import { SettingsModal } from './components/SettingsModal';
import { StaffSwitchModal } from './components/StaffSwitchModal';
import { Language } from './lib/translations';
import { hasMenuAccess, getDefaultTabForRole, ROLE_DEFINITIONS } from './lib/rbac';
import { ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';

function MainApp() {
  const { currentUser } = usePos();
  const [activeTab, setActiveTab] = useState<string>(() => getDefaultTabForRole(currentUser?.role || 'cashier'));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('lo');

  // RBAC Guard: If the current role cannot access the selected tab, automatically switch to their default allowed tab
  useEffect(() => {
    if (!hasMenuAccess(currentUser, activeTab)) {
      const defaultTab = getDefaultTabForRole(currentUser.role);
      setActiveTab(defaultTab);
    }
  }, [currentUser]);

  const isTabAllowed = hasMenuAccess(currentUser, activeTab);
  const roleDef = ROLE_DEFINITIONS[currentUser?.role || 'cashier'];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100/70 text-slate-800">
      {/* Sidebar Navigation (Filtered by RBAC) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSwitchUser={() => setIsSwitchUserOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onToggleMobile={() => setIsMobileSidebarOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSwitchUser={() => setIsSwitchUserOpen(true)}
          language={language}
          onChangeLanguage={setLanguage}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Viewport Content with RBAC Access Protection */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          {!isTabAllowed ? (
            <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-red-200/80 p-8 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  ບໍ່ມີສິດທິເຂົ້າເຖິງໜ້ານີ້ (Access Restricted)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ຕຳແໜ່ງ <span className="font-bold text-slate-800">{roleDef?.nameLao}</span> ຂອງທ່ານບໍ່ໄດ້ຮັບອະນຸຍາດໃຫ້ເຂົ້າເຖິງເມນູນີ້.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => setActiveTab(getDefaultTabForRole(currentUser.role))}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ກັບໄປໜ້າຫຼັກຂອງທ່ານ</span>
                </button>
                <button
                  onClick={() => setIsSwitchUserOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>ສະຫຼັບຜູ້ໃຊ້</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
              {activeTab === 'retail-pos' && <RetailPos />}
              {activeTab === 'wholesale-pos' && <WholesalePos />}
              {activeTab === 'products' && <ProductManagement />}
              {activeTab === 'stock' && <StockManagement />}
              {activeTab === 'customers' && <CustomerManagement />}
              {activeTab === 'suppliers' && <SupplierManagement />}
              {activeTab === 'finance' && <IncomeExpenseManagement />}
              {activeTab === 'reports' && <Reports />}
              {activeTab === 'staff' && <StaffManagement />}
            </>
          )}
        </main>
      </div>

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Staff Switch & Role Simulator Modal */}
      <StaffSwitchModal
        isOpen={isSwitchUserOpen}
        onClose={() => setIsSwitchUserOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <PosProvider>
      <MainApp />
    </PosProvider>
  );
}
