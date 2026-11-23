import React, { useMemo } from 'react';
import {
  CheckCircle2,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Store,
  Truck,
} from 'lucide-react';
import { getCategoryLabel, getStatusLabel, translations } from '../i18n/translations';
import {
  DeliveryOrder,
  DeliveryRider,
  Language,
  Merchant,
  OrderStatus,
  PaymentMode,
  PayoutModel,
} from '../types/network';
import { RiderAvatar } from './RiderAvatar';
import { ZoneMap } from './ZoneMap';

interface DeliveryBoyAppProps {
  merchants: Merchant[];
  riders: DeliveryRider[];
  orders: DeliveryOrder[];
  payoutModel: PayoutModel;
  selectedRiderId: string;
  onSelectRider: (riderId: string) => void;
  onToggleOnline: (riderId: string) => void;
  onAcceptOrder: (orderId: string, riderId: string) => void;
  onAdvanceOrderStatus: (orderId: string, nextStatus: OrderStatus) => void;
  lang: Language;
}

export const DeliveryBoyApp: React.FC<DeliveryBoyAppProps> = ({
  merchants,
  riders,
  orders,
  payoutModel,
  selectedRiderId,
  onSelectRider,
  onToggleOnline,
  onAcceptOrder,
  onAdvanceOrderStatus,
  lang,
}) => {
  const t = translations[lang];
  const currentRider = riders.find((r) => r.id === selectedRiderId) || riders[0];

  const myActiveTrips = useMemo(
    () =>
      orders.filter(
        (o) => o.riderId === currentRider.id && o.status !== OrderStatus.DELIVERED
      ),
    [orders, currentRider.id]
  );

  const myCompletedTrips = useMemo(
    () =>
      orders.filter(
        (o) => o.riderId === currentRider.id && o.status === OrderStatus.DELIVERED
      ),
    [orders, currentRider.id]
  );

  const availableOrders = useMemo(
    () => orders.filter((o) => o.status === OrderStatus.PENDING),
    [orders]
  );

  const primaryTrip = myActiveTrips[0] || null;
  const primaryShop = primaryTrip
    ? merchants.find((m) => m.id === primaryTrip.merchantId)
    : null;

  const riderEarningsToday = useMemo(() => {
    if (payoutModel === PayoutModel.FIXED) {
      return {
        amount: Math.round(12000 / 26),
        note: lang === 'hi' ? 'फिक्स दैनिक हिस्सा (₹12,000/माह)' : 'Fixed daily share (₹12,000/mo)',
      };
    }
    if (payoutModel === PayoutModel.PER_DELIVERY) {
      return {
        amount: currentRider.todayDeliveries * 22,
        note:
          lang === 'hi'
            ? `${currentRider.todayDeliveries} ऑर्डर × ₹22 प्रति डिलीवरी`
            : `${currentRider.todayDeliveries} trips × ₹22/order`,
      };
    }
    // Hybrid
    const baseDaily = Math.round(currentRider.fixedMonthlyPay / 26);
    const incentive = currentRider.todayDeliveries * currentRider.perOrderIncentive;
    return {
      amount: baseDaily + incentive,
      note:
        currentRider.fixedMonthlyPay > 0
          ? lang === 'hi'
            ? `₹${baseDaily} बेस + ${currentRider.todayDeliveries}×₹${currentRider.perOrderIncentive} बोनस`
            : `₹${baseDaily} base + ${currentRider.todayDeliveries}×₹${currentRider.perOrderIncentive} bonus`
          : lang === 'hi'
          ? `फ्लेक्स राइडर: ${currentRider.todayDeliveries}×₹22`
          : `Flex rider: ${currentRider.todayDeliveries}×₹22`,
    };
  }, [payoutModel, currentRider, lang]);

  return (
    <div className="space-y-6">
      {/* Rider Profile Switcher Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <RiderAvatar
            name={currentRider.name}
            avatarUrl={currentRider.avatarUrl}
            sizeClass="w-12 h-12"
          />
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{currentRider.zoneArea}</span>
              <span>·</span>
              <span className="font-mono">{currentRider.vehicleNumber}</span>
            </div>
            <h2 className="text-lg font-display font-bold text-slate-900">
              {currentRider.name}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">{t.riderSelector}:</label>
            <select
              value={currentRider.id}
              onChange={(e) => onSelectRider(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-900"
            >
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.vehicleType})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => onToggleOnline(currentRider.id)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors ${
              currentRider.online
                ? 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {currentRider.online ? t.online : t.offline}
          </button>
        </div>
      </div>

      {/* Main Split: Rider Mobile Companion Frame (Left) + Live Route Map & Completed Trips (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 cols: Mobile Rider Companion Viewport */}
        <div className="lg:col-span-5 space-y-5">
          {/* Today's Earnings Strip */}
          <div className="bg-slate-900 text-white rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-300">{t.todayEarnings}</div>
              <div className="text-2xl font-display font-bold font-mono tabular-nums mt-1">
                ₹{riderEarningsToday.amount.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{riderEarningsToday.note}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-300">
                {lang === 'hi' ? 'आज की डिलीवरी' : 'Trips Today'}
              </div>
              <div className="text-2xl font-display font-bold font-mono tabular-nums mt-1">
                {currentRider.todayDeliveries}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">★ {currentRider.rating}</div>
            </div>
          </div>

          {/* Current Assigned Trip */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                {t.activeTrip} ({myActiveTrips.length})
              </h3>
              {primaryTrip && (
                <span className="font-mono text-xs font-semibold text-blue-700">
                  {primaryTrip.id}
                </span>
              )}
            </div>

            {myActiveTrips.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <Truck className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                {lang === 'hi'
                  ? 'अभी कोई सक्रिय ट्रिप नहीं है। नीचे उपलब्ध ऑर्डर स्वीकार करें।'
                  : 'No active trip assigned. Accept an available zone order below.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {myActiveTrips.map((trip) => {
                  const shop = merchants.find((m) => m.id === trip.merchantId);
                  return (
                    <div key={trip.id} className="p-5 space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-blue-700">
                          {getStatusLabel(trip.status, lang)}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {trip.distanceKm.toFixed(1)} km ·{' '}
                          {trip.paymentMode === PaymentMode.COD
                            ? `Collect COD ₹${trip.codAmount}`
                            : 'Prepaid'}
                        </span>
                      </div>

                      {/* Step 1: Pickup Shop */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <Store className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[11px] font-medium text-slate-500">
                                {lang === 'hi' ? 'पिकअप (दुकान)' : 'PICKUP SHOP'}
                              </div>
                              <div className="text-xs font-semibold text-slate-900">
                                {shop?.name}
                              </div>
                              <div className="text-[11px] text-slate-600 mt-0.5">
                                {shop?.address} · {trip.itemSummary}
                              </div>
                            </div>
                          </div>
                        </div>
                        {shop && (
                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${shop.coords.lat},${shop.coords.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>{lang === 'hi' ? 'दुकान नेविगेशन' : 'Maps to Shop'}</span>
                            </a>
                            <a
                              href={`tel:${shop.phone}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{t.callShop}</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Step 2: Dropoff Customer */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-[11px] font-medium text-slate-500">
                              {lang === 'hi' ? 'ग्राहक का पता (ड्रॉप)' : 'CUSTOMER DROP-OFF'}
                            </div>
                            <div className="text-xs font-semibold text-slate-900">
                              {trip.customerName}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {trip.dropAddress}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${trip.dropCoords.lat},${trip.dropCoords.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>{t.openGoogleMaps}</span>
                          </a>
                          <a
                            href={`tel:${trip.customerPhone}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{t.callCustomer}</span>
                          </a>
                        </div>
                      </div>

                      {/* Primary Action Button */}
                      {trip.status === OrderStatus.ASSIGNED && (
                        <button
                          type="button"
                          onClick={() => onAdvanceOrderStatus(trip.id, OrderStatus.PICKED_UP)}
                          className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>{t.markPickedUp}</span>
                        </button>
                      )}

                      {(trip.status === OrderStatus.PICKED_UP ||
                        trip.status === OrderStatus.IN_TRANSIT) && (
                        <button
                          type="button"
                          onClick={() => onAdvanceOrderStatus(trip.id, OrderStatus.DELIVERED)}
                          className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{t.markDelivered}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Unassigned Zone Orders */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                {t.newRequests} ({availableOrders.length})
              </h3>
              <span className="text-xs text-slate-500">
                {lang === 'hi' ? 'तुरंत स्वीकार करें' : 'Tap to accept'}
              </span>
            </div>

            {availableOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                {lang === 'hi'
                  ? 'अभी कोई नया पेंडिंग ऑर्डर नहीं है।'
                  : 'All zone orders are currently assigned.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {availableOrders.map((order) => {
                  const shop = merchants.find((m) => m.id === order.merchantId);
                  return (
                    <div key={order.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-semibold text-slate-900">{order.id}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-medium text-slate-800 truncate">{shop?.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 truncate">
                          {shop ? getCategoryLabel(shop.category, lang) : ''} · {order.dropAddress} (
                          {order.distanceKm.toFixed(1)} km)
                        </div>
                        <div className="text-[11px] font-mono text-green-700 font-medium mt-1">
                          {payoutModel === PayoutModel.FIXED
                            ? lang === 'hi'
                              ? 'फिक्स सैलरी ट्रिप'
                              : 'Covered under Fixed Salary'
                            : payoutModel === PayoutModel.PER_DELIVERY
                            ? `+₹22 ${lang === 'hi' ? 'कमाई' : 'payout'}`
                            : `+₹${currentRider.perOrderIncentive || 22} ${
                                lang === 'hi' ? 'इंसेंटिव' : 'incentive'
                              }`}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!currentRider.online}
                        onClick={() => onAcceptOrder(order.id, currentRider.id)}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        {t.acceptOrder}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 7 cols: Live Map + Completed History */}
        <div className="lg:col-span-7 space-y-6">
          <ZoneMap
            merchants={merchants}
            riders={riders}
            orders={orders}
            selectedOrderId={primaryTrip?.id || null}
            onSelectOrder={() => {}}
            lang={lang}
          />

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                {lang === 'hi'
                  ? `${currentRider.name} की पूर्ण डिलीवरी`
                  : `Completed Trips by ${currentRider.name}`}{' '}
                ({myCompletedTrips.length})
              </h3>
              {primaryShop && (
                <span className="text-xs text-slate-500">
                  {lang === 'hi' ? 'सक्रिय पिकअप:' : 'Active pickup:'} {primaryShop.name}
                </span>
              )}
            </div>
            <div className="divide-y divide-slate-200 text-xs">
              {myCompletedTrips.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  {lang === 'hi' ? 'आज की पहली ट्रिप पूरी करें' : 'Complete your first trip today'}
                </div>
              ) : (
                myCompletedTrips.map((trip) => {
                  const shop = merchants.find((m) => m.id === trip.merchantId);
                  return (
                    <div key={trip.id} className="px-5 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          <span className="font-mono mr-2">{trip.id}</span>
                          {shop?.name} → {trip.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {trip.dropAddress} · {trip.distanceKm.toFixed(1)} km
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums text-green-700 font-semibold whitespace-nowrap">
                        {lang === 'hi' ? 'पूर्ण' : 'Delivered'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
