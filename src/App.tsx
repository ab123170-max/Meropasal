/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shop,
  Category,
  Product,
  Ingredient,
  Order,
  Expense,
  HouseholdWithdrawal,
  CustomerCredit,
  FinancialMetrics,
} from './types';
import {
  getShop,
  getCategories,
  getProductsWithVariants,
  getIngredients,
  getOrders,
  getExpenses,
  getHouseholdWithdrawals,
  getCustomerCredits,
  calculateFinancialSummary,
  initLocalStorageDemo,
} from './lib/storage';
import { Header } from './components/Header';
import { BottomNav, OwnerTab } from './components/BottomNav';
import { CustomerOrderingView } from './components/customer/CustomerOrderingView';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { OrdersManager } from './components/owner/OrdersManager';
import { MenuManager } from './components/owner/MenuManager';
import { FinanceDashboard } from './components/owner/FinanceDashboard';
import { StockManager } from './components/owner/StockManager';
import { AIAssistantView } from './components/owner/AIAssistantView';
import { ShopSettings } from './components/owner/ShopSettings';
import { VoiceEntryModal } from './components/owner/VoiceEntryModal';
import {
  QuickSaleModal,
  QuickExpenseModal,
  QuickWithdrawalModal,
} from './components/owner/QuickActionModals';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [mode, setMode] = useState<'owner' | 'customer'>('owner');
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('home');

  // Core Data State
  const [shop, setShop] = useState<Shop | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [withdrawals, setWithdrawals] = useState<HouseholdWithdrawal[]>([]);
  const [credits, setCredits] = useState<CustomerCredit[]>([]);

  // Modals state
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [isQuickWithdrawalOpen, setIsQuickWithdrawalOpen] = useState(false);

  // Load all data
  const loadAllData = useCallback(async () => {
    initLocalStorageDemo();
    const [s, c, p, i, o, e, w, cr] = await Promise.all([
      getShop(),
      getCategories(),
      getProductsWithVariants(),
      getIngredients(),
      getOrders(),
      getExpenses(),
      getHouseholdWithdrawals(),
      getCustomerCredits(),
    ]);

    setShop(s);
    setCategories(c);
    setProducts(p);
    setIngredients(i);
    setOrders(o);
    setExpenses(e);
    setWithdrawals(w);
    setCredits(cr);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF9]">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center text-xl font-bold mx-auto animate-pulse">
            म
          </div>
          <p className="text-sm font-bold text-gray-700">मीठो पसल खुल्दैछ...</p>
        </div>
      </div>
    );
  }

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const lowStockCount = ingredients.filter((i) => i.quantity_available <= i.min_threshold).length;
  const metrics: FinancialMetrics = calculateFinancialSummary('day');

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-gray-900 flex flex-col font-['Mukta',sans-serif]">
      {/* Offline Connectivity Toast */}
      <OfflineIndicator />

      {/* Persistent Header */}
      <Header
        shop={shop}
        currentMode={mode}
        onChangeMode={(newMode) => setMode(newMode)}
        onOpenSettings={() => {
          setMode('owner');
          setOwnerTab('settings');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {mode === 'customer' ? (
          /* Public Customer Food Ordering View */
          <CustomerOrderingView
            shop={shop}
            categories={categories}
            products={products}
            onOrderCreated={() => {
              loadAllData();
            }}
          />
        ) : (
          /* Owner Management Modules */
          <>
            {ownerTab === 'home' && (
              <OwnerDashboard
                shop={shop}
                metrics={metrics}
                orders={orders}
                ingredients={ingredients}
                onOpenQuickSale={() => setIsQuickSaleOpen(true)}
                onOpenQuickExpense={() => setIsQuickExpenseOpen(true)}
                onOpenVoiceEntry={() => setIsVoiceOpen(true)}
                onOpenWithdrawal={() => setIsQuickWithdrawalOpen(true)}
                onNavigateToTab={(tab) => setOwnerTab(tab as OwnerTab)}
              />
            )}

            {ownerTab === 'orders' && (
              <OrdersManager
                orders={orders}
                onOrderUpdated={() => loadAllData()}
              />
            )}

            {ownerTab === 'menu' && (
              <MenuManager
                products={products}
                categories={categories}
                ingredients={ingredients}
                onMenuUpdated={() => loadAllData()}
              />
            )}

            {ownerTab === 'finance' && (
              <FinanceDashboard
                expenses={expenses}
                withdrawals={withdrawals}
                credits={credits}
                onDataChanged={() => loadAllData()}
                onOpenAddExpense={() => setIsQuickExpenseOpen(true)}
                onOpenAddWithdrawal={() => setIsQuickWithdrawalOpen(true)}
              />
            )}

            {ownerTab === 'stock' && (
              <StockManager
                ingredients={ingredients}
                onStockUpdated={() => loadAllData()}
              />
            )}

            {ownerTab === 'ai' && (
              <AIAssistantView
                shop={shop}
                metrics={metrics}
                products={products}
                ingredients={ingredients}
                orders={orders}
              />
            )}

            {ownerTab === 'settings' && (
              <ShopSettings
                shop={shop}
                onShopUpdated={() => loadAllData()}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation (Shown in Owner Mode) */}
      {mode === 'owner' && (
        <BottomNav
          currentTab={ownerTab}
          onChangeTab={(tab) => setOwnerTab(tab)}
          pendingOrdersCount={pendingOrdersCount}
          lowStockCount={lowStockCount}
        />
      )}

      {/* Quick Action Modals */}
      <QuickSaleModal
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        products={products}
        onSaleSaved={() => loadAllData()}
      />

      <QuickExpenseModal
        isOpen={isQuickExpenseOpen}
        onClose={() => setIsQuickExpenseOpen(false)}
        onExpenseSaved={() => loadAllData()}
      />

      <QuickWithdrawalModal
        isOpen={isQuickWithdrawalOpen}
        onClose={() => setIsQuickWithdrawalOpen(false)}
        onWithdrawalSaved={() => loadAllData()}
      />

      <VoiceEntryModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onEntrySaved={() => loadAllData()}
      />
    </div>
  );
}
