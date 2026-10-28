/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { Language } from './lib/translations';

function MainApp() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('lo');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100/70 text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
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
          language={language}
          onChangeLanguage={setLanguage}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
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
        </main>
      </div>

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
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
