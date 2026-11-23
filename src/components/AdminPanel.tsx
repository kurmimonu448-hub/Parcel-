import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Navigation,
  Package,
  Plus,
  Search,
  ShieldAlert,
  Truck,
  UserPlus,
  Zap,
} from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../data/seedNetwork';
import {
  getCategoryLabel,
  getPlanLabel,
  getStatusLabel,
  translations,
} from '../i18n/translations';
import {
  DeliveryOrder,
  DeliveryRider,
  Language,
  Merchant,
  OrderStatus,
  PayoutModel,
  PlanTier,
  ShopCategory,
} from '../types/network';
import { RiderAvatar } from './RiderAvatar';
import { ZoneMap } from './ZoneMap';

interface AdminPanelProps {
  merchants: Merchant[];
  riders: DeliveryRider[];
  orders: DeliveryOrder[];
  payoutModel: PayoutModel;
  lang: Language;
  onAssignRider: (orderId: string, riderId: string) => void;
  onAutoDispatch: (orderId: string) => void;
  onAddMerchant: (merchant: Omit<Merchant, 'id' | 'joinedDate' | 'monthlyOrdersCount' | 'coords'>) => void;
  onUpdateMerchantPlan: (merchantId: string, plan: PlanTier) => void;
  onToggleMerchantActive: (merchantId: string) => void;
  onAddRider: (rider: Omit<DeliveryRider, 'id' | 'todayDeliveries' | 'monthDeliveries' | 'rating' | 'coords'>) => void;
  onToggleRiderOnline: (riderId: string) => void;
  onOpenEconomics: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  merchants,
  riders,
  orders,
  payoutModel,
  lang,
  onAssignRider,
  onAutoDispatch,
  onAddMerchant,
  onUpdateMerchantPlan,
  onToggleMerchantActive,
  onAddRider,
  onToggleRiderOnline,
  onOpenEconomics,
}) => {
  const t = translations[lang];
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orders[0]?.id || null);
  const [adminTab, setAdminTab] = useState<'merchants' | 'riders' | 'ledger'>('merchants');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Add Merchant Form State
  const [showAddMerchant, setShowAddMerchant] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newShopCategory, setNewShopCategory] = useState<ShopCategory>(ShopCategory.KIRANA);
  const [newShopPlan, setNewShopPlan] = useState<PlanTier>(PlanTier.STANDARD);

  // Add Rider Form State
  const [showAddRider, setShowAddRider] = useState(false);
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [newRiderVehicle, setNewRiderVehicle] = useState('');
  const [newRiderZone, setNewRiderZone] = useState('Sector 14 Central');

  const activeMerchants = merchants.filter((m) => m.active);
  const onlineRiders = riders.filter((r) => r.online);

  // Financial Calculations
  const metrics = useMemo(() => {
    const monthlySubRevenue = activeMerchants.reduce(
      (sum, m) => sum + SUBSCRIPTION_PLANS[m.plan].monthlyFee,
      0
    );

    const monthlyOrderCount = activeMerchants.reduce((sum, m) => sum + m.monthlyOrdersCount, 0);
    const avgPerDeliveryFee =
      activeMerchants.length > 0
        ? activeMerchants.reduce((sum, m) => sum + SUBSCRIPTION_PLANS[m.plan].perDeliveryFee, 0) /
          activeMerchants.length
        : 15;
    const monthlyDeliveryRevenue = Math.round(monthlyOrderCount * avgPerDeliveryFee);
    const todayDeliveryFeeRev = orders.reduce((sum, o) => sum + o.deliveryFee, 0);

    const riderExpense = riders.reduce((sum, r) => {
      if (payoutModel === PayoutModel.FIXED) {
        return sum + (r.fixedMonthlyPay > 0 ? 12000 : 10500);
      }
      if (payoutModel === PayoutModel.PER_DELIVERY) {
        return sum + r.monthDeliveries * 22;
      }
      // Hybrid
      return sum + r.fixedMonthlyPay + r.monthDeliveries * r.perOrderIncentive;
    }, 0);

    const opsBuffer = 2200;
    const totalRevenue = monthlySubRevenue + monthlyDeliveryRevenue;
    const netProfit = totalRevenue - riderExpense - opsBuffer;

    return {
      monthlySubRevenue,
      monthlyDeliveryRevenue,
      monthlyOrderCount,
      todayDeliveryFeeRev,
      riderExpense,
      opsBuffer,
      totalRevenue,
      netProfit,
    };
  }, [activeMerchants, orders, riders, payoutModel]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const shop = merchants.find((m) => m.id === order.merchantId);
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
          ? order.status === OrderStatus.PENDING
          : statusFilter === 'active'
          ? order.status === OrderStatus.ASSIGNED ||
            order.status === OrderStatus.PICKED_UP ||
            order.status === OrderStatus.IN_TRANSIT
          : order.status === OrderStatus.DELIVERED;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        (shop?.name.toLowerCase().includes(q) ?? false);

      return matchesStatus && matchesSearch;
    });
  }, [orders, merchants, statusFilter, searchQuery]);

  const filteredMerchants = useMemo(() => {
    if (categoryFilter === 'all') return merchants;
    return merchants.filter((m) => m.category === categoryFilter);
  }, [merchants, categoryFilter]);

  const handleCreateMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim() || !newOwnerName.trim()) return;
    onAddMerchant({
      name: newShopName.trim(),
      ownerName: newOwnerName.trim(),
      phone: newShopPhone.trim() || '+91 98100 12345',
      address: newShopAddress.trim() || 'Main Market, Sector 14',
      category: newShopCategory,
      plan: newShopPlan,
      active: true,
    });
    setNewShopName('');
    setNewOwnerName('');
    setNewShopPhone('');
    setNewShopAddress('');
    setShowAddMerchant(false);
  };

  const handleCreateRider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiderName.trim()) return;
    onAddRider({
      name: newRiderName.trim(),
      phone: newRiderPhone.trim() || '+91 91112 90000',
      vehicleNumber: newRiderVehicle.trim() || 'DL 4S XX 1029',
      vehicleType: 'Bike',
      online: true,
      payoutType: payoutModel === PayoutModel.FIXED ? 'fixed' : payoutModel === PayoutModel.PER_DELIVERY ? 'per_delivery' : 'hybrid',
      fixedMonthlyPay: payoutModel === PayoutModel.FIXED ? 12000 : payoutModel === PayoutModel.HYBRID ? 7000 : 0,
      perOrderIncentive: payoutModel === PayoutModel.FIXED ? 0 : payoutModel === PayoutModel.HYBRID ? 10 : 22,
      zoneArea: newRiderZone.trim() || 'Sector 14',
    });
    setNewRiderName('');
    setNewRiderPhone('');
    setNewRiderVehicle('');
    setShowAddRider(false);
  };

  const renderStatus = (status: OrderStatus) => {
    const label = getStatusLabel(status, lang);
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{label}</span>
          </span>
        );
      case OrderStatus.ASSIGNED:
      case OrderStatus.PICKED_UP:
      case OrderStatus.IN_TRANSIT:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>{label}</span>
          </span>
        );
      case OrderStatus.DELIVERED:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{label}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">{t.activeShops}</div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-display font-bold tabular-nums text-slate-900">
              {activeMerchants.length} / 50
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-600">
              ₹{metrics.monthlySubRevenue.toLocaleString('en-IN')}/mo
            </span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            {lang === 'hi' ? '1 इलाके का लक्ष्य: 50 दुकानें' : 'Zone target: 50 shops per 3 riders'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">{t.activeRiders}</div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-display font-bold tabular-nums text-slate-900">
              {onlineRiders.length} / {riders.length}
            </span>
            <span className="text-xs text-green-700 font-medium">
              {lang === 'hi' ? 'ऑनलाइन' : 'Available'}
            </span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            {lang === 'hi'
              ? 'साझा पूल · सभी दुकानों के लिए'
              : 'Shared neighborhood fleet pool'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">{t.todayOrders}</div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-display font-bold tabular-nums text-slate-900">
              {orders.length}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-600">
              ₹{metrics.todayDeliveryFeeRev} {lang === 'hi' ? 'फीस' : 'fees'}
            </span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            {orders.filter((o) => o.status === OrderStatus.PENDING).length}{' '}
            {lang === 'hi' ? 'राइडर की प्रतीक्षा में' : 'awaiting dispatch'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">{t.netMargin}</div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span
              className={`text-2xl font-display font-bold tabular-nums ${
                metrics.netProfit >= 0 ? 'text-green-700' : 'text-red-600'
              }`}
            >
              ₹{metrics.netProfit.toLocaleString('en-IN')}
            </span>
            <button
              type="button"
              onClick={onOpenEconomics}
              className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
            >
              {lang === 'hi' ? 'मॉडल देखें' : 'Simulate'}
            </button>
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            {lang === 'hi'
              ? 'सब्सक्रिप्शन + प्रति डिलीवरी - राइडर खर्च'
              : 'Subscriptions + Delivery fees - Payouts'}
          </div>
        </div>
      </div>

      {/* Dispatch Queue + Live Zone Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Dispatch Queue Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{t.dispatchQueue}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'hi'
                  ? 'ऑर्डर पर क्लिक करके मैप पर रूट देखें या राइडर असाइन करें'
                  : 'Click an order to inspect on map or assign nearest available rider'}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['all', 'pending', 'active', 'delivered'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'all'
                    ? t.allStatuses
                    : tab === 'pending'
                    ? t.pending
                    : tab === 'active'
                    ? t.inTransit
                    : t.delivered}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'hi'
                  ? 'ऑर्डर ID, दुकान या ग्राहक का नाम खोजें...'
                  : 'Search order ID, shop name, or customer...'
              }
              className="w-full text-xs bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-medium text-slate-500 bg-slate-50">
                  <th className="py-2.5 px-4">Order</th>
                  <th className="py-2.5 px-4">{lang === 'hi' ? 'दुकान → ग्राहक' : 'Shop → Customer'}</th>
                  <th className="py-2.5 px-4">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
                  <th className="py-2.5 px-4 text-right">{lang === 'hi' ? 'चार्ज' : 'Fee'}</th>
                  <th className="py-2.5 px-4 text-right">{lang === 'hi' ? 'राइडर' : 'Rider'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      <Package className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                      {lang === 'hi' ? 'इस फ़िल्टर में कोई ऑर्डर नहीं है' : 'No matching orders found'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const shop = merchants.find((m) => m.id === order.merchantId);
                    const assignedRider = riders.find((r) => r.id === order.riderId);
                    const isSelected = selectedOrderId === order.id;

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 align-top">
                          <div className="font-mono font-semibold text-slate-900">{order.id}</div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                            {order.createdAt}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top max-w-[220px]">
                          <div className="font-medium text-slate-900 truncate">
                            {shop?.name || 'Unknown Shop'}
                          </div>
                          <div className="text-slate-500 truncate mt-0.5">
                            {order.customerName} · {order.distanceKm.toFixed(1)} km
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top whitespace-nowrap">
                          {renderStatus(order.status)}
                        </td>
                        <td className="py-3 px-4 align-top text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                          ₹{order.deliveryFee}
                          {order.paymentMode === 'cod' && (
                            <div className="text-[11px] text-amber-700">COD ₹{order.codAmount}</div>
                          )}
                        </td>
                        <td
                          className="py-3 px-4 align-top text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {order.status === OrderStatus.PENDING ? (
                            <div className="flex flex-col items-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onAutoDispatch(order.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors whitespace-nowrap shrink-0"
                              >
                                <Zap className="w-3 h-3" />
                                <span>{t.autoDispatch}</span>
                              </button>
                              <select
                                aria-label="Manual assign rider"
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) onAssignRider(order.id, e.target.value);
                                }}
                                className="text-[11px] border border-slate-300 rounded px-2 py-1 bg-white text-slate-700"
                              >
                                <option value="">{t.assignRider}...</option>
                                {onlineRiders.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="text-right">
                              <div className="font-medium text-slate-900 whitespace-nowrap">
                                {assignedRider?.name || '—'}
                              </div>
                              <div className="text-[11px] text-slate-500 whitespace-nowrap">
                                {assignedRider?.vehicleType}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zone Map */}
        <div className="lg:col-span-5">
          <ZoneMap
            merchants={merchants}
            riders={riders}
            orders={orders}
            selectedOrderId={selectedOrderId}
            onSelectOrder={setSelectedOrderId}
            lang={lang}
          />
        </div>
      </div>

      {/* Bottom Management Workspace: Merchants / Riders / Revenue Ledger */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setAdminTab('merchants')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                adminTab === 'merchants'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.merchantsDirectory} ({merchants.length})
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('riders')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                adminTab === 'riders'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.ridersDirectory} ({riders.length})
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('ledger')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                adminTab === 'ledger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.financialLedger}
            </button>
          </div>

          {adminTab === 'merchants' && (
            <div className="flex items-center gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
              >
                <option value="all">{lang === 'hi' ? 'सभी श्रेणियां' : 'All Categories'}</option>
                {Object.values(ShopCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat, lang)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddMerchant((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addMerchant}</span>
              </button>
            </div>
          )}

          {adminTab === 'riders' && (
            <button
              type="button"
              onClick={() => setShowAddRider((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.addRider}</span>
            </button>
          )}
        </div>

        {/* Merchants Tab */}
        {adminTab === 'merchants' && (
          <div>
            {showAddMerchant && (
              <form
                onSubmit={handleCreateMerchant}
                className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
              >
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {lang === 'hi' ? 'दुकान का नाम' : 'Shop Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    placeholder="e.g. Verma Kirana"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {lang === 'hi' ? 'दुकानदार का नाम' : 'Owner Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="e.g. Mohan Verma"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {lang === 'hi' ? 'श्रेणी' : 'Category'}
                  </label>
                  <select
                    value={newShopCategory}
                    onChange={(e) => setNewShopCategory(e.target.value as ShopCategory)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    {Object.values(ShopCategory).map((c) => (
                      <option key={c} value={c}>
                        {getCategoryLabel(c, lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {lang === 'hi' ? 'सब्सक्रिप्शन प्लान' : 'Plan'}
                  </label>
                  <select
                    value={newShopPlan}
                    onChange={(e) => setNewShopPlan(e.target.value as PlanTier)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    {Object.values(PlanTier).map((p) => (
                      <option key={p} value={p}>
                        {getPlanLabel(p, lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {lang === 'hi' ? 'पता' : 'Address'}
                  </label>
                  <input
                    type="text"
                    value={newShopAddress}
                    onChange={(e) => setNewShopAddress(e.target.value)}
                    placeholder="Market Road"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                  >
                    {lang === 'hi' ? 'जोड़ें' : 'Save Shop'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMerchant(false)}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    {lang === 'hi' ? 'रद्द' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-medium text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-5">{lang === 'hi' ? 'दुकान' : 'Shop'}</th>
                    <th className="py-2.5 px-4">{lang === 'hi' ? 'श्रेणी' : 'Category'}</th>
                    <th className="py-2.5 px-4">{lang === 'hi' ? 'प्लान' : 'Subscription Plan'}</th>
                    <th className="py-2.5 px-4 text-right">
                      {lang === 'hi' ? 'मासिक ऑर्डर' : 'Month Orders'}
                    </th>
                    <th className="py-2.5 px-4 text-right">
                      {lang === 'hi' ? 'कुल बिल' : 'Est. Monthly Bill'}
                    </th>
                    <th className="py-2.5 px-5 text-right">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredMerchants.map((merchant) => {
                    const plan = SUBSCRIPTION_PLANS[merchant.plan];
                    const bill = plan.monthlyFee + merchant.monthlyOrdersCount * plan.perDeliveryFee;
                    return (
                      <tr key={merchant.id} className="hover:bg-slate-50">
                        <td className="py-3 px-5">
                          <div className="font-medium text-slate-900">{merchant.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {merchant.ownerName} · {merchant.phone}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {getCategoryLabel(merchant.category, lang)}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            aria-label={`Change plan for ${merchant.name}`}
                            value={merchant.plan}
                            onChange={(e) =>
                              onUpdateMerchantPlan(merchant.id, e.target.value as PlanTier)
                            }
                            className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white text-slate-800"
                          >
                            {Object.values(PlanTier).map((tier) => (
                              <option key={tier} value={tier}>
                                {getPlanLabel(tier, lang)} (+₹{SUBSCRIPTION_PLANS[tier].perDeliveryFee}/order)
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {merchant.monthlyOrdersCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                          ₹{bill.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => onToggleMerchantActive(merchant.id)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-md border transition-colors ${
                              merchant.active
                                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {merchant.active
                              ? lang === 'hi'
                                ? 'सक्रिय'
                                : 'Active'
                              : lang === 'hi'
                              ? 'रोका गया'
                              : 'Paused'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Riders Tab */}
        {adminTab === 'riders' && (
          <div>
            {showAddRider && (
              <form
                onSubmit={handleCreateRider}
                className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
              >
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {lang === 'hi' ? 'राइडर का नाम' : 'Rider Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newRiderName}
                    onChange={(e) => setNewRiderName(e.target.value)}
                    placeholder="e.g. Suresh Yadav"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {lang === 'hi' ? 'मोबाइल नंबर' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={newRiderPhone}
                    onChange={(e) => setNewRiderPhone(e.target.value)}
                    placeholder="+91 91112 45000"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {lang === 'hi' ? 'गाड़ी नंबर' : 'Vehicle No.'}
                  </label>
                  <input
                    type="text"
                    value={newRiderVehicle}
                    onChange={(e) => setNewRiderVehicle(e.target.value)}
                    placeholder="DL 4S AB 9120"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {lang === 'hi' ? 'इलाका' : 'Zone Area'}
                  </label>
                  <input
                    type="text"
                    value={newRiderZone}
                    onChange={(e) => setNewRiderZone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                  >
                    {lang === 'hi' ? 'राइडर जोड़ें' : 'Add Rider'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddRider(false)}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    {lang === 'hi' ? 'रद्द' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-medium text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-5">{lang === 'hi' ? 'राइडर' : 'Rider'}</th>
                    <th className="py-2.5 px-4">{lang === 'hi' ? 'इलाका और गाड़ी' : 'Zone & Vehicle'}</th>
                    <th className="py-2.5 px-4">{lang === 'hi' ? 'पेमेंट प्रकार' : 'Payout Structure'}</th>
                    <th className="py-2.5 px-4 text-right">{lang === 'hi' ? 'आज / माह' : 'Today / Month'}</th>
                    <th className="py-2.5 px-5 text-right">{lang === 'hi' ? 'ड्यूटी' : 'Duty'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {riders.map((rider) => (
                    <tr key={rider.id} className="hover:bg-slate-50">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <RiderAvatar name={rider.name} avatarUrl={rider.avatarUrl} sizeClass="w-9 h-9" />
                          <div>
                            <div className="font-medium text-slate-900">{rider.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{rider.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{rider.zoneArea}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {rider.vehicleType} · {rider.vehicleNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-mono tabular-nums">
                        {rider.fixedMonthlyPay > 0
                          ? `₹${rider.fixedMonthlyPay.toLocaleString('en-IN')}/mo + ₹${rider.perOrderIncentive}/order`
                          : `₹${rider.perOrderIncentive}/delivery`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                        {rider.todayDeliveries} / {rider.monthDeliveries}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => onToggleRiderOnline(rider.id)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-md border transition-colors ${
                            rider.online
                              ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                              : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {rider.online ? t.online : t.offline}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Financial Ledger Tab */}
        {adminTab === 'ledger' && (
          <div className="p-6 space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-900">
                  {t.noUnlimitedBannerTitle}
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  {t.noUnlimitedBannerBody}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 text-sm">
                <div className="px-4 py-3 bg-slate-50 font-semibold text-slate-900">
                  {lang === 'hi' ? 'मासिक आय (Revenue)' : 'Monthly Network Income'}
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-slate-600">
                    {t.subRevenue} ({activeMerchants.length} shops)
                  </span>
                  <span className="font-mono tabular-nums font-medium text-slate-900">
                    ₹{metrics.monthlySubRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-slate-600">
                    {t.perOrderRevenue} ({metrics.monthlyOrderCount} orders)
                  </span>
                  <span className="font-mono tabular-nums font-medium text-slate-900">
                    ₹{metrics.monthlyDeliveryRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="px-4 py-3 bg-slate-50 flex items-center justify-between font-semibold">
                  <span>{lang === 'hi' ? 'कुल मासिक कमाई' : 'Total Gross Revenue'}</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    ₹{metrics.totalRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 text-sm">
                <div className="px-4 py-3 bg-slate-50 font-semibold text-slate-900">
                  {lang === 'hi' ? 'मासिक खर्च और मुनाफा (Expenses & Net)' : 'Monthly Expenses & Profit'}
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-slate-600">
                    {t.riderPayoutExpense} ({riders.length} riders)
                  </span>
                  <span className="font-mono tabular-nums font-medium text-red-700">
                    -₹{metrics.riderExpense.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-slate-600">{t.opsBuffer}</span>
                  <span className="font-mono tabular-nums font-medium text-red-700">
                    -₹{metrics.opsBuffer.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="px-4 py-3 bg-slate-50 flex items-center justify-between font-semibold">
                  <span>{t.netProfit}</span>
                  <span
                    className={`font-mono tabular-nums ${
                      metrics.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    ₹{metrics.netProfit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
