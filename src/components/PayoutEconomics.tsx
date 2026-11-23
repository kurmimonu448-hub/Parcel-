import React, { useMemo, useState } from 'react';
import { Check, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { getPayoutModelLabel, translations } from '../i18n/translations';
import { Language, PayoutModel } from '../types/network';

interface PayoutEconomicsProps {
  activeModel: PayoutModel;
  onApplyModel: (model: PayoutModel) => void;
  lang: Language;
}

export const PayoutEconomics: React.FC<PayoutEconomicsProps> = ({
  activeModel,
  onApplyModel,
  lang,
}) => {
  const t = translations[lang];

  // Interactive Financial Simulator State (Defaults match user's 100 shops * 499 example)
  const [simShops, setSimShops] = useState(100);
  const [avgMonthlyPlan, setAvgMonthlyPlan] = useState(499);
  const [avgOrdersPerShopDay, setAvgOrdersPerShopDay] = useState(3);
  const [customerPerDeliveryFee, setCustomerPerDeliveryFee] = useState(15);
  const [simModel, setSimModel] = useState<PayoutModel>(activeModel);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const sim = useMemo(() => {
    const daysPerMonth = 30;
    const totalMonthlyOrders = simShops * avgOrdersPerShopDay * daysPerMonth;
    const ordersPerDay = simShops * avgOrdersPerShopDay;

    // 1 rider handles roughly 18-22 local hyperlocal deliveries per day comfortably
    const ridersNeeded = Math.max(2, Math.ceil(ordersPerDay / 20));
    const coreRiders = Math.max(2, Math.ceil(ridersNeeded * 0.7));
    const flexRiders = Math.max(0, ridersNeeded - coreRiders);

    const subscriptionRevenue = simShops * avgMonthlyPlan;
    const deliveryFeeRevenue = totalMonthlyOrders * customerPerDeliveryFee;
    const totalRevenue = subscriptionRevenue + deliveryFeeRevenue;

    let riderCost = 0;
    if (simModel === PayoutModel.FIXED) {
      riderCost = ridersNeeded * 12000;
    } else if (simModel === PayoutModel.PER_DELIVERY) {
      riderCost = totalMonthlyOrders * 22;
    } else {
      // Hybrid: Core riders get ₹7,000 fixed + ₹10/order; Flex riders handle remaining 30% peak orders at ₹22/order
      const coreShareOrders = Math.round(totalMonthlyOrders * 0.75);
      const flexShareOrders = totalMonthlyOrders - coreShareOrders;
      riderCost = coreRiders * 7000 + coreShareOrders * 10 + flexShareOrders * 22;
    }

    const opsAndSupport = Math.round(simShops * 65 + 2500);
    const netProfit = totalRevenue - riderCost - opsAndSupport;
    const marginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    return {
      totalMonthlyOrders,
      ordersPerDay,
      ridersNeeded,
      coreRiders,
      flexRiders,
      subscriptionRevenue,
      deliveryFeeRevenue,
      totalRevenue,
      riderCost,
      opsAndSupport,
      netProfit,
      marginPercent,
    };
  }, [simShops, avgMonthlyPlan, avgOrdersPerShopDay, customerPerDeliveryFee, simModel]);

  const modelsMeta = [
    {
      id: PayoutModel.FIXED,
      title: lang === 'hi' ? '1. फिक्स सैलरी मॉडल' : '1. Fixed Salary Model',
      rate: lang === 'hi' ? '₹11,000–₹13,000 / माह प्रति राइडर' : '₹11,000–₹13,000 / mo per rider',
      bestFor:
        lang === 'hi'
          ? 'जब एक इलाके में प्रति राइडर 25+ ऑर्डर रोज़ पक्के हों'
          : 'When daily volume is guaranteed at 25+ orders per rider',
      pros:
        lang === 'hi'
          ? 'राइडर पूरी शिफ्ट उपलब्ध रहते हैं और कोई ऑर्डर मना नहीं करते'
          : 'Guaranteed rider availability; zero order rejection',
      cons:
        lang === 'hi'
          ? 'शुरुआत में ऑर्डर कम होने पर भी पूरी सैलरी देनी पड़ती है (नुकसान का खतरा)'
          : 'High fixed burn during launch weeks if order density is low',
    },
    {
      id: PayoutModel.PER_DELIVERY,
      title: lang === 'hi' ? '2. प्रति डिलीवरी मॉडल' : '2. Per-Delivery Model',
      rate: lang === 'hi' ? '₹20–₹25 प्रति डिलीवरी' : '₹20–₹25 per completed order',
      bestFor:
        lang === 'hi'
          ? 'शुरुआती टेस्टिंग (पहले 10–25 दुकानें)'
          : 'Early pilot testing with 10–25 shops and unpredictable demand',
      pros:
        lang === 'hi'
          ? 'जीरो फिक्स खर्च — ऑर्डर आएगा तभी पैसा देना होगा'
          : 'Zero fixed payroll; cost scales strictly with real deliveries',
      cons:
        lang === 'hi'
          ? 'कम कमाई पर राइडर दूसरी ऐप पर जा सकते हैं या दूर का ऑर्डर छोड़ सकते हैं'
          : 'Riders may churn or reject low-distance/off-peak orders',
    },
    {
      id: PayoutModel.HYBRID,
      title: lang === 'hi' ? '3. हाइब्रिड मॉडल (सबसे बेहतर)' : '3. Hybrid Model (Recommended)',
      rate:
        lang === 'hi'
          ? 'कोर राइडर: ₹7,000 + ₹10/ऑर्डर · फ्लेक्स: ₹22/ऑर्डर'
          : 'Core: ₹7,000/mo + ₹10/order · Flex: ₹22/order',
      bestFor:
        lang === 'hi'
          ? '50 दुकानों / 3 राइडर वाले साझा नेटवर्क के लिए सर्वोत्तम'
          : 'Optimal for 50 shops / 3 core riders + peak-hour scaling',
      pros:
        lang === 'hi'
          ? 'कम फिक्स खर्च + ज्यादा ऑर्डर पर राइडर को अच्छी कमाई + भरोसेमंद सेवा'
          : '40% lower fixed burn than full salary while keeping riders loyal',
      cons:
        lang === 'hi'
          ? 'हिसाब रखने के लिए ऐप ट्रैकिंग जरूरी (जो यह सिस्टम खुद करता है)'
          : 'Requires automated trip tracking (handled by NagarFleet)',
    },
  ];

  const handleApply = () => {
    onApplyModel(simModel);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Recommendation */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-3xl">
          <h2 className="text-xl font-display font-bold text-slate-900">{t.payoutModelTitle}</h2>
          <p className="text-sm text-slate-600 mt-1">{t.payoutModelSubtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {lang === 'hi' ? 'वर्तमान सक्रिय मॉडल:' : 'Live Fleet Model:'}{' '}
            <strong className="text-slate-900">{getPayoutModelLabel(activeModel, lang)}</strong>
          </span>
        </div>
      </div>

      {/* 3-Column Payout Model Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {modelsMeta.map((model) => {
          const isSelected = simModel === model.id;
          const isRecommended = model.id === PayoutModel.HYBRID;
          return (
            <div
              key={model.id}
              onClick={() => setSimModel(model.id)}
              className={`cursor-pointer border rounded-xl p-5 transition-colors flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{model.title}</h3>
                  {isRecommended && (
                    <span className="text-[11px] font-semibold text-green-700">
                      {lang === 'hi' ? 'सुझावित' : 'Recommended'}
                    </span>
                  )}
                </div>

                <div className="mt-2 font-mono text-xs font-semibold text-blue-700">
                  {model.rate}
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <div className="font-medium text-slate-500">
                      {lang === 'hi' ? 'कब चुनें:' : 'Best When:'}
                    </div>
                    <div className="text-slate-800 mt-0.5">{model.bestFor}</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-700">
                      {lang === 'hi' ? 'फायदा:' : 'Advantage:'}
                    </div>
                    <div className="text-slate-700 mt-0.5">{model.pros}</div>
                  </div>
                  <div>
                    <div className="font-medium text-amber-700">
                      {lang === 'hi' ? 'जोखिम / ध्यान दें:' : 'Trade-off:'}
                    </div>
                    <div className="text-slate-700 mt-0.5">{model.cons}</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSimModel(model.id);
                }}
                className={`mt-5 w-full py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>
                  {isSelected
                    ? lang === 'hi'
                      ? 'सिमुलेशन में चयनित'
                      : 'Selected in Simulator'
                    : lang === 'hi'
                    ? 'इस मॉडल को टेस्ट करें'
                    : 'Test This Model'}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Interactive Business & Profit Simulator */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {lang === 'hi'
                ? 'लाइव बिजनेस और मुनाफा कैलकुलेटर (100 दुकानें = ₹49,900+)'
                : 'Interactive Network Unit Economics Simulator'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'hi'
                ? 'दुकानों की संख्या, प्लान और प्रति डिलीवरी चार्ज बदलकर कंपनी की असली कमाई देखें'
                : 'Adjust shops, subscription mix, daily orders, and rider model to forecast monthly profit'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {appliedNotice && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.modelAppliedToast}</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {t.applyModelBtn} ({getPayoutModelLabel(simModel, lang)})
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 6 cols: Sliders */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-slate-700">
                  {lang === 'hi' ? 'जुड़ी हुई दुकानें (Subscribed Shops)' : 'Subscribed Shops'}
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {simShops} {lang === 'hi' ? 'दुकानें' : 'shops'}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={250}
                step={5}
                value={simShops}
                onChange={(e) => setSimShops(Number(e.target.value))}
                className="w-full accent-blue-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-slate-700">
                  {lang === 'hi' ? 'औसत मासिक सब्सक्रिप्शन प्लान' : 'Average Monthly Plan'}
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  ₹{avgMonthlyPlan}/mo
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[299, 499, 999].map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => setAvgMonthlyPlan(price)}
                    className={`py-2 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                      avgMonthlyPlan === price
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ₹{price}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-slate-700">
                  {lang === 'hi' ? 'प्रति दुकान रोज़ाना ऑर्डर' : 'Avg Orders / Shop / Day'}
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {avgOrdersPerShopDay} orders/day ({sim.ordersPerDay} total/day)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={avgOrdersPerShopDay}
                onChange={(e) => setAvgOrdersPerShopDay(Number(e.target.value))}
                className="w-full accent-blue-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-slate-700">
                  {lang === 'hi'
                    ? 'प्रति डिलीवरी अतिरिक्त चार्ज (₹10–₹25)'
                    : 'Per-Delivery Fee Charged (₹10–₹25)'}
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  ₹{customerPerDeliveryFee} / delivery
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={25}
                step={1}
                value={customerPerDeliveryFee}
                onChange={(e) => setCustomerPerDeliveryFee(Number(e.target.value))}
                className="w-full accent-blue-700"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>
                  {lang === 'hi'
                    ? 'महत्वपूर्ण नियम: कभी अनलिमिटेड फ्री डिलीवरी न दें!'
                    : 'Critical Rule: Never offer unlimited free deliveries!'}
                </strong>{' '}
                {lang === 'hi'
                  ? `यदि आप प्रति डिलीवरी ₹${customerPerDeliveryFee} नहीं लेते, तो ${sim.totalMonthlyOrders.toLocaleString('en-IN')} ऑर्डर पर कंपनी को ₹${(
                      sim.subscriptionRevenue -
                      sim.riderCost -
                      sim.opsAndSupport
                    ).toLocaleString('en-IN')} का भारी घाटा होगा।`
                  : `Without the ₹${customerPerDeliveryFee} per-delivery fee, handling ${sim.totalMonthlyOrders.toLocaleString(
                      'en-IN'
                    )} orders on subscriptions alone would lose ₹${Math.abs(
                      sim.subscriptionRevenue - sim.riderCost - sim.opsAndSupport
                    ).toLocaleString('en-IN')}/mo.`}
              </div>
            </div>
          </div>

          {/* Right 6 cols: P&L Output */}
          <div className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">
                  {lang === 'hi' ? 'मासिक सब्सक्रिप्शन कमाई' : 'Subscription Revenue'}
                </div>
                <div className="text-xl font-display font-bold font-mono tabular-nums text-slate-900 mt-1">
                  ₹{sim.subscriptionRevenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {simShops} × ₹{avgMonthlyPlan}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">
                  {lang === 'hi' ? 'प्रति डिलीवरी कमाई' : 'Per-Delivery Revenue'}
                </div>
                <div className="text-xl font-display font-bold font-mono tabular-nums text-slate-900 mt-1">
                  ₹{sim.deliveryFeeRevenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {sim.totalMonthlyOrders.toLocaleString('en-IN')} × ₹{customerPerDeliveryFee}
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 text-xs">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-slate-600">
                  {lang === 'hi' ? 'कुल मासिक कमाई (Gross Revenue)' : 'Total Monthly Revenue'}
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  ₹{sim.totalRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-slate-600">
                  {lang === 'hi'
                    ? `राइडर नेटवर्क जरूरत (${sim.ridersNeeded} राइडर: ${sim.coreRiders} कोर + ${sim.flexRiders} फ्लेक्स)`
                    : `Rider Payouts (${sim.ridersNeeded} riders: ${sim.coreRiders} core + ${sim.flexRiders} flex)`}
                </span>
                <span className="font-mono tabular-nums font-medium text-red-700">
                  -₹{sim.riderCost.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-slate-600">
                  {lang === 'hi' ? 'ऐप, सपोर्ट और ऑपरेशन खर्च' : 'Platform Ops & Support'}
                </span>
                <span className="font-mono tabular-nums font-medium text-red-700">
                  -₹{sim.opsAndSupport.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="px-4 py-4 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t.netProfit}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {lang === 'hi' ? 'मार्जिन:' : 'Margin:'} {sim.marginPercent}%
                  </div>
                </div>
                <div
                  className={`text-2xl font-display font-bold font-mono tabular-nums ${
                    sim.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  ₹{sim.netProfit.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                {lang === 'hi'
                  ? 'निष्कर्ष: Hybrid Model में आपके मुख्य 3–5 राइडर रोज़ाना के बेस ऑर्डर संभालते हैं और शाम/रविवार के पीक समय में अतिरिक्त फ्लेक्स राइडर जुड़ जाते हैं। इससे कम खर्च में 100% डिलीवरी पूरी होती है।'
                  : 'Takeaway: With a Hybrid Model, your core riders cover reliable daily routes on a lower base retainer + per-order bonus, while flex riders absorb evening/weekend peaks without permanent payroll overhead.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
