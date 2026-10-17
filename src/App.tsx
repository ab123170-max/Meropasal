/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
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
  LpgCylinder,
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
  getLpgCylinders,
  calculateRealFinancialMetrics,
} from './lib/storage';
import {
  testSupabaseConnection,
  getOwnerSession,
  signOutOwner,
} from './lib/supabase';
import { Header } from './components/Header';
import { BottomNav, OwnerTab } from './components/BottomNav';
import { CustomerOrderingView } from './components/customer/CustomerOrderingView';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { OrdersManager } from './components/owner/OrdersManager';
import { MenuManager } from './components/owner/MenuManager';
import { FinanceDashboard } from './components/owner/FinanceDashboard';
import { StockManager } from './components/owner/StockManager';
import { RecipeCostCalculatorView } from './components/owner/RecipeCostCalculatorView';
import { LpgGasTrackerView } from './components/owner/LpgGasTrackerView';
import { AIAssistantView } from './components/owner/AIAssistantView';
import { ShopSettings } from './components/owner/ShopSettings';
import { MoreMenuView } from './components/owner/MoreMenuView';
import { VoiceEntryModal } from './components/owner/VoiceEntryModal';
import {
  QuickSaleModal,
  QuickExpenseModal,
  QuickWithdrawalModal,
} from './components/owner/QuickActionModals';
import { AuthModal } from './components/owner/AuthModal';
import { CreateShopModal } from './components/owner/CreateShopModal';
import { DatabaseErrorScreen } from './components/DatabaseErrorScreen';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PlusCircle, Store } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<'owner' | 'customer'>('owner');
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('home');

  // Supabase & Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateShopOpen, setIsCreateShopOpen] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Core Business Data State
  const [shop, setShop] = useState<Shop | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [withdrawals, setWithdrawals] = useState<HouseholdWithdrawal[]>([]);
  const [credits, setCredits] = useState<CustomerCredit[]>([]);
  const [lpgCylinders, setLpgCylinders] = useState<LpgCylinder[]>([]);

  // Quick Action Modals
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [isQuickWithdrawalOpen, setIsQuickWithdrawalOpen] = useState(false);

  // Load all data from real Supabase database
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      // 1. Test Supabase connectivity first
      const conn = await testSupabaseConnection();
      if (!conn.ok) {
        setDbError(conn.error || 'डाटाबेस जडान हुन सकेन।');
        setIsLoading(false);
        return;
      }

      // 2. Fetch current auth session
      const session = await getOwnerSession();
      setCurrentUser(session?.user || null);

      // 3. Fetch default or first registered shop
      const s = await getShop();
      if (!s) {
        setShop(null);
        setIsLoading(false);
        return;
      }
      setShop(s);

      // 4. Fetch all relational data for this shop in parallel
      const [c, p, i, o, e, w, cr, lpg] = await Promise.all([
        getCategories(s.id),
        getProductsWithVariants(s.id),
        getIngredients(s.id),
        getOrders(s.id),
        getExpenses(s.id),
        getHouseholdWithdrawals(s.id),
        getCustomerCredits(s.id),
        getLpgCylinders(s.id),
      ]);

      setCategories(c);
      setProducts(p);
      setIngredients(i);
      setOrders(o);
      setExpenses(e);
      setWithdrawals(w);
      setCredits(cr);
      setLpgCylinders(lpg);
    } catch (err: any) {
      console.error('Error loading Supabase data:', err);
      setDbError(err.message || 'डाटाबेसबाट विवरण लोड गर्न सकिएन।');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleSignOut = async () => {
    await signOutOwner();
    setCurrentUser(null);
    loadAllData();
  };

  // If database connection error occurred (Supabase unconfigured or down)
  if (dbError) {
    return (
      <DatabaseErrorScreen
        errorMessage={dbError}
        onRetry={loadAllData}
        isRetrying={isLoading}
      />
    );
  }

  // Initial loading state
  if (isLoading && !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF9] font-['Mukta',sans-serif]">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 text-white flex items-center justify-center text-2xl font-black mx-auto shadow-lg animate-pulse">
            म
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900">मीठो पसल (MeethoPasal AI)</h2>
            <p className="text-xs text-gray-500 mt-0.5">डाटाबेसबाट विवरण लोड हुँदैछ...</p>
          </div>
        </div>
      </div>
    );
  }

  // If database is connected but no shop has been created yet
  if (!shop) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] text-gray-900 flex flex-col font-['Mukta',sans-serif]">
        <Header
          shop={null}
          currentMode={mode}
          onChangeMode={(newMode) => setMode(newMode)}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 max-w-md mx-auto p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
            <Store className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-gray-900">तपाईंको पसल दर्ता छैन</h2>
            <p className="text-xs text-gray-600">
              Supabase डाटाबेस सफलतापूर्वक जडान भएको छ। नयाँ पसल दर्ता गरी खानाको मेनु र अर्डर व्यवस्थापन सुरु गर्नुहोस्।
            </p>
          </div>
          <button
            onClick={() => setIsCreateShopOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-black shadow-md flex items-center justify-center gap-2 active:scale-98 transition"
          >
            <PlusCircle className="w-5 h-5" />
            <span>नयाँ पसल दर्ता गर्नुहोस् (Create Shop)</span>
          </button>
        </main>

        <CreateShopModal
          isOpen={isCreateShopOpen}
          userId={currentUser?.id || '00000000-0000-0000-0000-000000000000'}
          onShopCreated={(newShop) => {
            setShop(newShop);
            setIsCreateShopOpen(false);
            loadAllData();
          }}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={loadAllData}
        />
      </div>
    );
  }

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const lowStockCount = ingredients.filter((i) => i.quantity_available <= i.min_threshold).length;
  const metrics: FinancialMetrics = calculateRealFinancialMetrics(
    orders,
    expenses,
    withdrawals,
    credits,
    'day'
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#172B4D] flex flex-col font-['Mukta',sans-serif]">
      {/* Offline Connectivity Toast */}
      <OfflineIndicator />

      {/* Persistent Header */}
      <Header
        shop={shop}
        currentMode={mode}
        onChangeMode={(newMode) => setMode(newMode)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        onOpenSettings={() => setOwnerTab('settings')}
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
                shopId={shop.id}
                orders={orders}
                onOrderUpdated={() => loadAllData()}
              />
            )}

            {ownerTab === 'menu' && (
              <MenuManager
                shopId={shop.id}
                products={products}
                categories={categories}
                ingredients={ingredients}
                onMenuUpdated={() => loadAllData()}
              />
            )}

            {(ownerTab === 'finance' || ownerTab === 'reports') && (
              <FinanceDashboard
                shopId={shop.id}
                orders={orders}
                expenses={expenses}
                withdrawals={withdrawals}
                credits={credits}
                onDataChanged={() => loadAllData()}
                onOpenAddExpense={() => setIsQuickExpenseOpen(true)}
                onOpenAddWithdrawal={() => setIsQuickWithdrawalOpen(true)}
              />
            )}

            {ownerTab === 'more' && (
              <MoreMenuView
                shop={shop}
                onNavigate={(tab) => setOwnerTab(tab)}
                onOpenAuth={() => setIsAuthOpen(true)}
                onSignOut={handleSignOut}
                isLoggedIn={!!currentUser}
              />
            )}

            {ownerTab === 'stock' && (
              <StockManager
                shopId={shop.id}
                ingredients={ingredients}
                onStockUpdated={() => loadAllData()}
              />
            )}

            {ownerTab === 'calculator' && (
              <RecipeCostCalculatorView shop={shop} />
            )}

            {ownerTab === 'gas' && (
              <LpgGasTrackerView
                shop={shop}
                cylinders={lpgCylinders}
                onGasUpdated={() => loadAllData()}
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
        shopId={shop.id}
        products={products}
        onSaleSaved={() => loadAllData()}
      />

      <QuickExpenseModal
        isOpen={isQuickExpenseOpen}
        onClose={() => setIsQuickExpenseOpen(false)}
        shopId={shop.id}
        onExpenseSaved={() => loadAllData()}
      />

      <QuickWithdrawalModal
        isOpen={isQuickWithdrawalOpen}
        onClose={() => setIsQuickWithdrawalOpen(false)}
        shopId={shop.id}
        onWithdrawalSaved={() => loadAllData()}
      />

      <VoiceEntryModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        shopId={shop.id}
        onEntrySaved={() => loadAllData()}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={loadAllData}
      />

      <CreateShopModal
        isOpen={isCreateShopOpen}
        userId={currentUser?.id || '00000000-0000-0000-0000-000000000000'}
        onShopCreated={(newShop) => {
          setShop(newShop);
          setIsCreateShopOpen(false);
          loadAllData();
        }}
      />
    </div>
  );
}
