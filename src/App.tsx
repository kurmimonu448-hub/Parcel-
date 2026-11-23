/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Globe, Play, Pause, RotateCcw } from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';
import { BookDeliveryModal } from './components/BookDeliveryModal';
import { DeliveryBoyApp } from './components/DeliveryBoyApp';
import { MerchantApp } from './components/MerchantApp';
import { PayoutEconomics } from './components/PayoutEconomics';
import {
  calculateDeliveryFee,
  DEFAULT_PAYOUT_MODEL,
  INITIAL_MERCHANTS,
  INITIAL_ORDERS,
  INITIAL_RIDERS,
} from './data/seedNetwork';
import { translations } from './i18n/translations';
import {
  ActivePortal,
  DeliveryOrder,
  DeliveryRider,
  Language,
  Merchant,
  OrderStatus,
  PaymentMode,
  PayoutModel,
  PlanTier,
} from './types/network';

const STORAGE_KEY = 'nagarfleet_network_state_v1';

interface PersistedState {
  merchants: Merchant[];
  riders: DeliveryRider[];
  orders: DeliveryOrder[];
  payoutModel: PayoutModel;
  lang: Language;
}

export default function App() {
  const loadInitial = (): PersistedState => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed.merchants?.length && parsed.riders?.length && parsed.orders) {
          return parsed;
        }
      }
    } catch {
      // Fallback to seed data
    }
    return {
      merchants: INITIAL_MERCHANTS,
      riders: INITIAL_RIDERS,
      orders: INITIAL_ORDERS,
      payoutModel: DEFAULT_PAYOUT_MODEL,
      lang: 'hi',
    };
  };

  const initial = loadInitial();
  const [activePortal, setActivePortal] = useState<ActivePortal>('admin');
  const [lang, setLang] = useState<Language>(initial.lang);
  const [merchants, setMerchants] = useState<Merchant[]>(initial.merchants);
  const [riders, setRiders] = useState<DeliveryRider[]>(initial.riders);
  const [orders, setOrders] = useState<DeliveryOrder[]>(initial.orders);
  const [payoutModel, setPayoutModel] = useState<PayoutModel>(initial.payoutModel);

  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(
    initial.merchants[0]?.id || 'M-101'
  );
  const [selectedRiderId, setSelectedRiderId] = useState<string>(
    initial.riders[0]?.id || 'R-01'
  );
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [liveSimEnabled, setLiveSimEnabled] = useState(true);

  const t = translations[lang];

  // Persist network state
  useEffect(() => {
    try {
      const payload: PersistedState = {
        merchants,
        riders,
        orders,
        payoutModel,
        lang,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [merchants, riders, orders, payoutModel, lang]);

  // Live simulation loop advancing active deliveries smoothly on map
  useEffect(() => {
    if (!liveSimEnabled) return;
    const timer = window.setInterval(() => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.status === OrderStatus.PENDING || order.status === OrderStatus.DELIVERED) {
            return order;
          }
          const nextProgress = Math.min(100, order.progress + 5);
          let nextStatus: OrderStatus = order.status;
          let nextEta = Math.max(1, order.etaMinutes - 1);

          if (nextProgress >= 100) {
            nextStatus = OrderStatus.DELIVERED;
            nextEta = 0;
          } else if (nextProgress >= 55) {
            nextStatus = OrderStatus.IN_TRANSIT;
          } else if (nextProgress >= 30) {
            nextStatus = OrderStatus.PICKED_UP;
          }

          return {
            ...order,
            progress: nextProgress,
            status: nextStatus,
            etaMinutes: nextEta,
          };
        })
      );
    }, 3500);

    return () => window.clearInterval(timer);
  }, [liveSimEnabled]);

  const handleAssignRider = (orderId: string, riderId: string) => {
    const rider = riders.find((r) => r.id === riderId);
    if (!rider) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              riderId,
              status: OrderStatus.ASSIGNED,
              progress: 12,
              etaMinutes: Math.max(6, Math.round(o.distanceKm * 4)),
              riderPayout:
                payoutModel === PayoutModel.FIXED
                  ? 0
                  : payoutModel === PayoutModel.PER_DELIVERY
                  ? 22
                  : rider.perOrderIncentive || 22,
            }
          : o
      )
    );
  };

  const handleAutoDispatch = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    const shop = merchants.find((m) => m.id === order?.merchantId);
    const available = riders.filter((r) => r.online);
    if (!order || available.length === 0) return;

    // Pick nearest online rider to the pickup shop
    let bestRider = available[0];
    if (shop) {
      let minDist = Infinity;
      for (const r of available) {
        const dx = r.coords.x - shop.coords.x;
        const dy = r.coords.y - shop.coords.y;
        const d = dx * dx + dy * dy;
        if (d < minDist) {
          minDist = d;
          bestRider = r;
        }
      }
    }
    handleAssignRider(orderId, bestRider.id);
  };

  const handleCreateOrder = (payload: {
    merchantId: string;
    customerName: string;
    customerPhone: string;
    dropAddress: string;
    itemSummary: string;
    distanceKm: number;
    paymentMode: PaymentMode;
    codAmount: number;
  }) => {
    const shop = merchants.find((m) => m.id === payload.merchantId);
    if (!shop) return;

    const fee = calculateDeliveryFee(shop.plan, payload.distanceKm);
    const nextOrderNum = 4095 + orders.length;
    const nowStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Generate deterministic nearby dropoff coordinate within Sector 14 grid
    const angle = (orders.length * 1.7) % (Math.PI * 2);
    const radius = Math.min(28, payload.distanceKm * 6);
    const dropX = Math.max(8, Math.min(92, Math.round(shop.coords.x + Math.cos(angle) * radius)));
    const dropY = Math.max(8, Math.min(92, Math.round(shop.coords.y + Math.sin(angle) * radius)));

    const newOrder: DeliveryOrder = {
      id: `ORD-${nextOrderNum}`,
      merchantId: shop.id,
      riderId: null,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      dropAddress: payload.dropAddress,
      itemSummary: payload.itemSummary,
      distanceKm: payload.distanceKm,
      deliveryFee: fee,
      riderPayout: payoutModel === PayoutModel.FIXED ? 0 : payoutModel === PayoutModel.PER_DELIVERY ? 22 : 10,
      paymentMode: payload.paymentMode,
      codAmount: payload.codAmount,
      status: OrderStatus.PENDING,
      createdAt: nowStr,
      etaMinutes: Math.max(8, Math.round(payload.distanceKm * 5)),
      progress: 0,
      dropCoords: {
        x: dropX,
        y: dropY,
        lat: Number((28.628 + (50 - dropY) * 0.0002).toFixed(4)),
        lng: Number((77.369 + (dropX - 50) * 0.0002).toFixed(4)),
      },
    };

    setOrders((prev) => [newOrder, ...prev]);
    setMerchants((prev) =>
      prev.map((m) =>
        m.id === shop.id ? { ...m, monthlyOrdersCount: m.monthlyOrdersCount + 1 } : m
      )
    );
  };

  const handleAdvanceOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: nextStatus,
          progress:
            nextStatus === OrderStatus.PICKED_UP
              ? 40
              : nextStatus === OrderStatus.IN_TRANSIT
              ? 70
              : nextStatus === OrderStatus.DELIVERED
              ? 100
              : o.progress,
          etaMinutes: nextStatus === OrderStatus.DELIVERED ? 0 : o.etaMinutes,
        };
      })
    );

    if (nextStatus === OrderStatus.DELIVERED && order?.riderId) {
      setRiders((prev) =>
        prev.map((r) =>
          r.id === order.riderId
            ? {
                ...r,
                todayDeliveries: r.todayDeliveries + 1,
                monthDeliveries: r.monthDeliveries + 1,
              }
            : r
        )
      );
    }
  };

  const handleAddMerchant = (
    payload: Omit<Merchant, 'id' | 'joinedDate' | 'monthlyOrdersCount' | 'coords'>
  ) => {
    const idx = merchants.length + 1;
    const x = 16 + ((idx * 19) % 68);
    const y = 18 + ((idx * 23) % 64);
    const newMerchant: Merchant = {
      ...payload,
      id: `M-${101 + merchants.length}`,
      joinedDate: new Date().toISOString().slice(0, 10),
      monthlyOrdersCount: 1,
      coords: {
        x,
        y,
        lat: Number((28.628 + (50 - y) * 0.0002).toFixed(4)),
        lng: Number((77.369 + (x - 50) * 0.0002).toFixed(4)),
      },
    };
    setMerchants((prev) => [...prev, newMerchant]);
  };

  const handleUpdateMerchantPlan = (merchantId: string, plan: PlanTier) => {
    setMerchants((prev) => prev.map((m) => (m.id === merchantId ? { ...m, plan } : m)));
  };

  const handleToggleMerchantActive = (merchantId: string) => {
    setMerchants((prev) =>
      prev.map((m) => (m.id === merchantId ? { ...m, active: !m.active } : m))
    );
  };

  const handleAddRider = (
    payload: Omit<DeliveryRider, 'id' | 'todayDeliveries' | 'monthDeliveries' | 'rating' | 'coords'>
  ) => {
    const idx = riders.length + 1;
    const newRider: DeliveryRider = {
      ...payload,
      id: `R-0${idx}`,
      todayDeliveries: 0,
      monthDeliveries: 0,
      rating: 4.8,
      coords: {
        x: 25 + ((idx * 17) % 55),
        y: 25 + ((idx * 21) % 55),
        lat: 28.6275,
        lng: 77.3685,
      },
    };
    setRiders((prev) => [...prev, newRider]);
  };

  const handleToggleRiderOnline = (riderId: string) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, online: !r.online } : r))
    );
  };

  const handleApplyPayoutModel = (model: PayoutModel) => {
    setPayoutModel(model);
    setRiders((prev) =>
      prev.map((r, index) => {
        if (model === PayoutModel.FIXED) {
          return { ...r, payoutType: 'fixed', fixedMonthlyPay: 12000, perOrderIncentive: 0 };
        }
        if (model === PayoutModel.PER_DELIVERY) {
          return { ...r, payoutType: 'per_delivery', fixedMonthlyPay: 0, perOrderIncentive: 22 };
        }
        // Hybrid: First 2 riders core, remaining flex
        if (index < 2) {
          return { ...r, payoutType: 'hybrid', fixedMonthlyPay: 7000, perOrderIncentive: 10 };
        }
        return { ...r, payoutType: 'per_delivery', fixedMonthlyPay: 0, perOrderIncentive: 22 };
      })
    );
  };

  const handleResetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMerchants(INITIAL_MERCHANTS);
    setRiders(INITIAL_RIDERS);
    setOrders(INITIAL_ORDERS);
    setPayoutModel(DEFAULT_PAYOUT_MODEL);
    setSelectedMerchantId(INITIAL_MERCHANTS[0].id);
    setSelectedRiderId(INITIAL_RIDERS[0].id);
  };

  const navItems: { id: ActivePortal; label: string }[] = [
    { id: 'admin', label: t.navAdmin },
    { id: 'merchant', label: t.navMerchant },
    { id: 'rider', label: t.navRider },
    { id: 'economics', label: t.navEconomics },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActivePortal('admin');
            }}
            className="text-lg font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            {t.brand}
          </a>

          {/* Zone 2: 4 Clean Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activePortal === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePortal(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'text-blue-700 border-blue-700'
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {t.bookDelivery}
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Sub-Toolbar (Language Toggle, Zone Label, Simulation Toggle) */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Mobile Portal Switcher + Desktop Context Label */}
          <div className="flex items-center gap-3 overflow-x-auto">
            <span className="hidden md:inline text-xs font-medium text-slate-500 whitespace-nowrap">
              {t.zoneLabel}
            </span>
            <div className="flex md:hidden items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePortal(item.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                    activePortal === item.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Workspace Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLiveSimEnabled((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              {liveSimEnabled ? (
                <Pause className="w-3 h-3 text-blue-700" />
              ) : (
                <Play className="w-3 h-3 text-slate-600" />
              )}
              <span>{liveSimEnabled ? t.autoSimOn : t.autoSimOff}</span>
            </button>

            <div className="flex items-center p-0.5 bg-slate-100 rounded-md">
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 ${
                  lang === 'hi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>हिंदी</span>
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 ${
                  lang === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetDemo}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0"
              title={t.resetDemo}
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">{t.resetDemo}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activePortal === 'admin' && (
          <AdminPanel
            merchants={merchants}
            riders={riders}
            orders={orders}
            payoutModel={payoutModel}
            lang={lang}
            onAssignRider={handleAssignRider}
            onAutoDispatch={handleAutoDispatch}
            onAddMerchant={handleAddMerchant}
            onUpdateMerchantPlan={handleUpdateMerchantPlan}
            onToggleMerchantActive={handleToggleMerchantActive}
            onAddRider={handleAddRider}
            onToggleRiderOnline={handleToggleRiderOnline}
            onOpenEconomics={() => setActivePortal('economics')}
          />
        )}

        {activePortal === 'merchant' && (
          <MerchantApp
            merchants={merchants}
            riders={riders}
            orders={orders}
            selectedMerchantId={selectedMerchantId}
            onSelectMerchant={setSelectedMerchantId}
            onCreateOrder={handleCreateOrder}
            onUpdatePlan={handleUpdateMerchantPlan}
            lang={lang}
          />
        )}

        {activePortal === 'rider' && (
          <DeliveryBoyApp
            merchants={merchants}
            riders={riders}
            orders={orders}
            payoutModel={payoutModel}
            selectedRiderId={selectedRiderId}
            onSelectRider={setSelectedRiderId}
            onToggleOnline={handleToggleRiderOnline}
            onAcceptOrder={handleAssignRider}
            onAdvanceOrderStatus={handleAdvanceOrderStatus}
            lang={lang}
          />
        )}

        {activePortal === 'economics' && (
          <PayoutEconomics
            activeModel={payoutModel}
            onApplyModel={handleApplyPayoutModel}
            lang={lang}
          />
        )}
      </main>

      {/* Quick Book Delivery Modal */}
      <BookDeliveryModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        merchants={merchants}
        defaultMerchantId={selectedMerchantId}
        onCreateOrder={handleCreateOrder}
        lang={lang}
      />
    </div>
  );
}
