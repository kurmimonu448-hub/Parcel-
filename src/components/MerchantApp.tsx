import React, { useMemo, useState } from 'react';
import { Check, CheckCircle2, Clock, Phone, Store, Truck } from 'lucide-react';
import { calculateDeliveryFee, SUBSCRIPTION_PLANS } from '../data/seedNetwork';
import {
  getCategoryLabel,
  getStatusLabel,
  translations,
} from '../i18n/translations';
import {
  DeliveryOrder,
  DeliveryRider,
  Language,
  Merchant,
  OrderStatus,
  PaymentMode,
  PlanTier,
} from '../types/network';
import { RiderAvatar } from './RiderAvatar';
import { ZoneMap } from './ZoneMap';

interface MerchantAppProps {
  merchants: Merchant[];
  riders: DeliveryRider[];
  orders: DeliveryOrder[];
  selectedMerchantId: string;
  onSelectMerchant: (id: string) => void;
  onCreateOrder: (payload: {
    merchantId: string;
    customerName: string;
    customerPhone: string;
    dropAddress: string;
    itemSummary: string;
    distanceKm: number;
    paymentMode: PaymentMode;
    codAmount: number;
  }) => void;
  onUpdatePlan: (merchantId: string, plan: PlanTier) => void;
  lang: Language;
}

export const MerchantApp: React.FC<MerchantAppProps> = ({
  merchants,
  riders,
  orders,
  selectedMerchantId,
  onSelectMerchant,
  onCreateOrder,
  onUpdatePlan,
  lang,
}) => {
  const t = translations[lang];
  const currentMerchant =
    merchants.find((m) => m.id === selectedMerchantId) || merchants[0];

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [itemSummary, setItemSummary] = useState('');
  const [distanceKm, setDistanceKm] = useState(2.0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(PaymentMode.COD);
  const [codAmount, setCodAmount] = useState(450);
  const [bookedFeedback, setBookedFeedback] = useState<string | null>(null);

  const merchantOrders = useMemo(
    () => orders.filter((o) => o.merchantId === currentMerchant.id),
    [orders, currentMerchant.id]
  );

  const activeMerchantOrders = merchantOrders.filter(
    (o) => o.status !== OrderStatus.DELIVERED
  );
  const completedMerchantOrders = merchantOrders.filter(
    (o) => o.status === OrderStatus.DELIVERED
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    activeMerchantOrders[0]?.id || merchantOrders[0]?.id || null
  );

  const currentPlan = SUBSCRIPTION_PLANS[currentMerchant.plan];
  const estimatedFee = calculateDeliveryFee(currentMerchant.plan, distanceKm);

  const monthlyBilling = useMemo(() => {
    const subFee = currentPlan.monthlyFee;
    const orderCharges = currentMerchant.monthlyOrdersCount * currentPlan.perDeliveryFee;
    const totalBill = subFee + orderCharges;
    const dedicatedRiderCost = 12000;
    const savings = dedicatedRiderCost - totalBill;
    return { subFee, orderCharges, totalBill, dedicatedRiderCost, savings };
  }, [currentPlan, currentMerchant.monthlyOrdersCount]);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !dropAddress.trim()) return;
    onCreateOrder({
      merchantId: currentMerchant.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '+91 98100 11223',
      dropAddress: dropAddress.trim(),
      itemSummary: itemSummary.trim() || 'Customer Order Parcel',
      distanceKm,
      paymentMode,
      codAmount: paymentMode === PaymentMode.COD ? codAmount : 0,
    });
    setCustomerName('');
    setCustomerPhone('');
    setDropAddress('');
    setItemSummary('');
    setBookedFeedback(
      lang === 'hi'
        ? 'ऑर्डर सफलतापूर्वक डिस्पैच किया गया!'
        : 'Delivery request dispatched to zone riders!'
    );
    setTimeout(() => setBookedFeedback(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Merchant Context Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{getCategoryLabel(currentMerchant.category, lang)}</span>
              <span>·</span>
              <span>{currentMerchant.address}</span>
            </div>
            <h2 className="text-lg font-display font-bold text-slate-900">
              {currentMerchant.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-600">{t.merchantSelector}:</label>
          <select
            value={currentMerchant.id}
            onChange={(e) => onSelectMerchant(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({getCategoryLabel(m.category, lang)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split: Book Delivery Form + Live Tracking & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 cols: Book Delivery Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{t.bookNewOrder}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'hi'
                  ? 'दुकान पर आया ऑर्डर यहाँ डालें, नजदीकी राइडर तुरंत आ जाएगा'
                  : 'Enter order details to summon the nearest available rider'}
              </p>
            </div>
          </div>

          {bookedFeedback && (
            <div className="mb-4 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-xs font-medium text-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{bookedFeedback}</span>
            </div>
          )}

          <form onSubmit={handleBook} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.customerName}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={lang === 'hi' ? 'ग्राहक का नाम' : 'e.g. Ritu Verma'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.customerPhone}
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98110 22334"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t.dropAddress}
              </label>
              <input
                type="text"
                required
                value={dropAddress}
                onChange={(e) => setDropAddress(e.target.value)}
                placeholder={
                  lang === 'hi'
                    ? 'मकान नं 18, सेक्टर 14, पार्क के पास'
                    : 'House 18, Sector 14, Near Park'
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t.itemSummary}
              </label>
              <input
                type="text"
                value={itemSummary}
                onChange={(e) => setItemSummary(e.target.value)}
                placeholder={
                  lang === 'hi' ? 'किराना / दवाई / मिठाई पैकेट' : 'e.g. Grocery bag, Prescription'
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.distanceKm}
                </label>
                <input
                  type="number"
                  min={0.5}
                  max={currentPlan.maxRadiusKm}
                  step={0.5}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.paymentMode}
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value={PaymentMode.COD}>COD</option>
                  <option value={PaymentMode.PREPAID}>Prepaid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {paymentMode === PaymentMode.COD ? 'COD ₹' : 'Paid'}
                </label>
                <input
                  type="number"
                  disabled={paymentMode === PaymentMode.PREPAID}
                  value={paymentMode === PaymentMode.COD ? codAmount : 0}
                  onChange={(e) => setCodAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                {t.estimatedFee} ({lang === 'hi' ? currentPlan.nameHi : currentPlan.nameEn})
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                ₹{estimatedFee}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
            >
              {t.confirmBooking}
            </button>
          </form>
        </div>

        {/* Right 7 cols: Live Active Deliveries + Zone Map */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                {t.activeDeliveries} ({activeMerchantOrders.length})
              </h3>
              <span className="text-xs text-slate-500">
                {lang === 'hi' ? 'लाइव राइडर और ETA' : 'Live rider info & ETA'}
              </span>
            </div>

            {activeMerchantOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                {lang === 'hi'
                  ? 'इस दुकान का कोई ऑर्डर अभी रास्ते में नहीं है। बाईं ओर से नया ऑर्डर बुक करें।'
                  : 'No active deliveries right now for this shop. Book a new delivery on the left.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {activeMerchantOrders.map((order) => {
                  const rider = riders.find((r) => r.id === order.riderId);
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedOrderId === order.id ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono font-semibold text-slate-900">
                              {order.id}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="font-medium text-slate-800">{order.customerName}</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono tabular-nums text-slate-500">
                              {order.distanceKm.toFixed(1)} km
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            {order.itemSummary} — {order.dropAddress}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">
                            {order.status === OrderStatus.PENDING ? (
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <Truck className="w-3.5 h-3.5" />
                            )}
                            <span
                              className={
                                order.status === OrderStatus.PENDING
                                  ? 'text-amber-700'
                                  : 'text-blue-700'
                              }
                            >
                              {getStatusLabel(order.status, lang)}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono tabular-nums text-slate-500 mt-0.5">
                            {order.etaMinutes > 0 ? `ETA ${order.etaMinutes} min` : 'Done'}
                          </div>
                        </div>
                      </div>

                      {rider && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <RiderAvatar
                              name={rider.name}
                              avatarUrl={rider.avatarUrl}
                              sizeClass="w-8 h-8"
                            />
                            <div className="text-xs">
                              <div className="font-medium text-slate-900">{rider.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {rider.vehicleType} · {rider.vehicleNumber}
                              </div>
                            </div>
                          </div>
                          <a
                            href={`tel:${rider.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{rider.phone}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <ZoneMap
            merchants={merchants}
            riders={riders}
            orders={merchantOrders}
            selectedOrderId={selectedOrderId}
            onSelectOrder={setSelectedOrderId}
            lang={lang}
            compact
          />
        </div>
      </div>

      {/* Billing Summary + Subscription Plans + Delivery History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Bill & Savings */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{t.monthlyBillTitle}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'hi'
                ? 'सब्सक्रिप्शन + प्रति डिलीवरी शुल्क का पारदर्शी हिसाब'
                : 'Transparent Subscription + Per-Delivery billing breakdown'}
            </p>

            <div className="mt-4 divide-y divide-slate-200 text-xs border border-slate-200 rounded-lg">
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-slate-600">
                  {lang === 'hi' ? currentPlan.nameHi : currentPlan.nameEn}
                </span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  ₹{monthlyBilling.subFee}
                </span>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-slate-600">
                  {currentMerchant.monthlyOrdersCount} deliveries × ₹{currentPlan.perDeliveryFee}
                </span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  ₹{monthlyBilling.orderCharges.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="px-3.5 py-2.5 bg-slate-50 flex items-center justify-between font-semibold text-sm">
                <span>{lang === 'hi' ? 'कुल मासिक खर्च' : 'Total Monthly Spend'}</span>
                <span className="font-mono tabular-nums text-slate-900">
                  ₹{monthlyBilling.totalBill.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3.5">
            <div className="text-xs font-medium text-green-800">{t.savedVsDedicated}</div>
            <div className="text-xl font-display font-bold font-mono tabular-nums text-green-900 mt-1">
              ₹{monthlyBilling.savings.toLocaleString('en-IN')} {lang === 'hi' ? 'मासिक बचत' : 'saved / month'}
            </div>
          </div>
        </div>

        {/* Subscription Plans Matrix */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{t.subscriptionPlans}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'hi'
                  ? 'अपनी दुकान के रोज़ाना ऑर्डर के हिसाब से प्लान चुनें'
                  : 'Choose a monthly plan matched to your shop delivery volume'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
              const isCurrent = currentMerchant.plan === plan.tier;
              return (
                <div
                  key={plan.tier}
                  className={`border rounded-xl p-4 flex flex-col justify-between ${
                    isCurrent ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium text-slate-500">
                      {lang === 'hi' ? plan.nameHi : plan.nameEn}
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="text-2xl font-display font-bold font-mono tabular-nums text-slate-900">
                        ₹{plan.monthlyFee}
                      </span>
                      <span className="text-xs text-slate-500">/mo</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                      {lang === 'hi' ? plan.audienceHi : plan.audienceEn}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-700">
                      <div className="flex justify-between">
                        <span>{lang === 'hi' ? 'प्रति डिलीवरी:' : 'Per delivery:'}</span>
                        <span className="font-mono font-semibold tabular-nums">
                          ₹{plan.perDeliveryFee}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{lang === 'hi' ? 'प्रायोरिटी सीमा:' : 'Priority cap:'}</span>
                        <span className="font-mono tabular-nums">{plan.includedPriorityLimit}/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{lang === 'hi' ? 'अधिकतम दूरी:' : 'Max radius:'}</span>
                        <span className="font-mono tabular-nums">{plan.maxRadiusKm} km</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => onUpdatePlan(currentMerchant.id, plan.tier)}
                    className={`mt-4 w-full py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? 'bg-blue-700 text-white cursor-default'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {isCurrent && <Check className="w-3.5 h-3.5" />}
                    <span>{isCurrent ? t.currentPlan : t.switchPlan}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delivery History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            {t.deliveryHistory} ({completedMerchantOrders.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-medium text-slate-500 bg-slate-50">
                <th className="py-2.5 px-5">Order ID</th>
                <th className="py-2.5 px-4">{lang === 'hi' ? 'ग्राहक व पता' : 'Customer & Address'}</th>
                <th className="py-2.5 px-4">{lang === 'hi' ? 'सामान' : 'Items'}</th>
                <th className="py-2.5 px-4">{lang === 'hi' ? 'पेमेंट' : 'Payment'}</th>
                <th className="py-2.5 px-5 text-right">{lang === 'hi' ? 'डिलीवरी फीस' : 'Delivery Fee'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {completedMerchantOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    {lang === 'hi' ? 'अभी कोई पूर्ण डिलीवरी नहीं है' : 'No completed deliveries yet'}
                  </td>
                </tr>
              ) : (
                completedMerchantOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="py-3 px-5 font-mono font-semibold text-slate-900">{order.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500">{order.dropAddress}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{order.itemSummary}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {order.paymentMode === PaymentMode.COD ? `COD ₹${order.codAmount}` : 'Prepaid'}
                    </td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ₹{order.deliveryFee}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
