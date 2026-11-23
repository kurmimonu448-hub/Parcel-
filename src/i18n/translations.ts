import { Language, OrderStatus, PayoutModel, PlanTier, ShopCategory } from '../types/network';

export const translations = {
  en: {
    brand: 'NagarFleet',
    navAdmin: 'Admin Panel',
    navMerchant: 'Merchant App',
    navRider: 'Delivery App',
    navEconomics: 'Payout Model',
    bookDelivery: 'Book Delivery',
    zoneLabel: 'Sector 14 · Main Market Cluster',
    autoSimOn: 'Live Simulation: On',
    autoSimOff: 'Live Simulation: Off',
    resetDemo: 'Reset Data',
    activeShops: 'Subscribed Shops',
    monthlySubMrr: 'Monthly Subscription MRR',
    activeRiders: 'Network Riders',
    todayOrders: 'Today Orders',
    deliveryFeeRev: 'Delivery Fee Earned',
    netMargin: 'Estimated Monthly Net',
    dispatchQueue: 'Live Order Dispatch Queue',
    zoneRadar: 'Neighborhood Zone Dispatch Map',
    allStatuses: 'All',
    pending: 'Pending',
    assigned: 'Assigned',
    pickedUp: 'Picked Up',
    inTransit: 'In Transit',
    delivered: 'Delivered',
    autoDispatch: 'Auto-Dispatch Nearest',
    assignRider: 'Assign Rider',
    unassigned: 'Waiting for Rider',
    merchantsDirectory: 'Merchants & Subscriptions',
    addMerchant: 'Register Shop',
    ridersDirectory: 'Delivery Partner Fleet',
    addRider: 'Add Rider',
    financialLedger: 'Monthly Revenue & Expense Ledger',
    subRevenue: 'Subscription Revenue',
    perOrderRevenue: 'Per-Delivery Charges',
    riderPayoutExpense: 'Rider Payout Expense',
    opsBuffer: 'Ops & Support Buffer',
    netProfit: 'Projected Monthly Profit',
    noUnlimitedBannerTitle: 'Unit Economics Guardrail Active',
    noUnlimitedBannerBody:
      'Plans never promise unlimited free deliveries on ₹499. Every shop pays a low monthly subscription plus a ₹10–₹20 per-delivery fee so network margins stay positive as volume grows.',
    merchantSelector: 'Active Merchant View',
    bookNewOrder: 'Book New Delivery',
    customerName: 'Customer Name',
    customerPhone: 'Customer Phone',
    dropAddress: 'Delivery Address / Landmark',
    itemSummary: 'Order Items (e.g. 2kg Atta, Medicines)',
    distanceKm: 'Distance (km)',
    paymentMode: 'Payment Mode',
    codAmount: 'COD Cash to Collect (₹)',
    estimatedFee: 'Delivery Charge',
    confirmBooking: 'Dispatch Delivery Request',
    activeDeliveries: 'Live Shop Deliveries',
    deliveryHistory: 'Completed History & Billing',
    monthlyBillTitle: 'Current Month Shop Bill',
    savedVsDedicated: 'Saved vs Hiring Dedicated Rider (₹12,000/mo)',
    subscriptionPlans: 'Subscription Plans',
    currentPlan: 'Current Plan',
    switchPlan: 'Switch Plan',
    riderSelector: 'Active Rider Profile',
    dutyStatus: 'Duty Status',
    online: 'Online',
    offline: 'On Break',
    newRequests: 'Available Zone Orders',
    activeTrip: 'Current Assigned Trip',
    acceptOrder: 'Accept Order',
    markPickedUp: 'Mark Picked Up',
    markDelivered: 'Mark Delivered',
    openGoogleMaps: 'Navigate in Google Maps',
    callCustomer: 'Call Customer',
    callShop: 'Call Shop',
    todayEarnings: 'Today Rider Earnings',
    payoutModelTitle: 'Delivery Boy Payout Architecture',
    payoutModelSubtitle:
      'Compare Fixed Salary, Per-Delivery, and Hybrid models to decide how riders work in your local network.',
    applyModelBtn: 'Apply Model to Fleet',
    modelAppliedToast: 'Fleet payout model updated across active riders.',
  },
  hi: {
    brand: 'NagarFleet',
    navAdmin: 'एडमिन पैनल',
    navMerchant: 'दुकानदार ऐप',
    navRider: 'डिलीवरी बॉय ऐप',
    navEconomics: 'कमाई और मॉडल',
    bookDelivery: 'नया ऑर्डर बुक करें',
    zoneLabel: 'सेक्टर 14 · मुख्य बाजार नेटवर्क',
    autoSimOn: 'लाइव ट्रैकिंग: चालू',
    autoSimOff: 'लाइव ट्रैकिंग: रुकी हुई',
    resetDemo: 'डेटा रीसेट',
    activeShops: 'जुड़े हुए दुकानदार',
    monthlySubMrr: 'मासिक सब्सक्रिप्शन कमाई',
    activeRiders: 'डिलीवरी बॉय नेटवर्क',
    todayOrders: 'आज के ऑर्डर',
    deliveryFeeRev: 'प्रति-डिलीवरी चार्ज कमाई',
    netMargin: 'अनुमानित मासिक मुनाफा',
    dispatchQueue: 'लाइव ऑर्डर डिस्पैच कतार',
    zoneRadar: 'इलाके का लाइव डिलीवरी मैप',
    allStatuses: 'सभी',
    pending: 'पेंडिंग',
    assigned: 'राइडर तय',
    pickedUp: 'सामान उठाया',
    inTransit: 'रास्ते में',
    delivered: 'डिलीवर हुआ',
    autoDispatch: 'नजदीकी राइडर जोड़ें',
    assignRider: 'राइडर चुनें',
    unassigned: 'राइडर की प्रतीक्षा',
    merchantsDirectory: 'सभी दुकानदार और सब्सक्रिप्शन',
    addMerchant: 'नई दुकान जोड़ें',
    ridersDirectory: 'डिलीवरी बॉय नेटवर्क सूची',
    addRider: 'नया राइडर जोड़ें',
    financialLedger: 'मासिक कमाई और खर्च का हिसाब',
    subRevenue: 'सब्सक्रिप्शन से कमाई',
    perOrderRevenue: 'प्रति डिलीवरी से कमाई',
    riderPayoutExpense: 'डिलीवरी बॉय सैलरी/भुगतान',
    opsBuffer: 'ऑपरेशन और सपोर्ट खर्च',
    netProfit: 'अनुमानित शुद्ध मासिक मुनाफा',
    noUnlimitedBannerTitle: 'बिजनेस सुरक्षा नियम लागू',
    noUnlimitedBannerBody:
      '₹499 में अनलिमिटेड फ्री डिलीवरी का वादा नहीं किया जाता। हर दुकानदार मासिक प्लान + प्रति डिलीवरी ₹10–₹20 चार्ज देता है, जिससे कंपनी को नुकसान न हो।',
    merchantSelector: 'दुकान चुनें',
    bookNewOrder: 'नई डिलीवरी बुक करें',
    customerName: 'ग्राहक का नाम',
    customerPhone: 'ग्राहक का मोबाइल नंबर',
    dropAddress: 'ग्राहक का पता / लैंडमार्क',
    itemSummary: 'सामान का विवरण (जैसे: किराना, दवाई)',
    distanceKm: 'दूरी (किमी)',
    paymentMode: 'पेमेंट तरीका',
    codAmount: 'कैश ऑन डिलीवरी राशि (₹)',
    estimatedFee: 'डिलीवरी शुल्क',
    confirmBooking: 'डिलीवरी ऑर्डर भेजें',
    activeDeliveries: 'दुकान के लाइव ऑर्डर',
    deliveryHistory: 'डिलीवरी हिस्ट्री और बिल',
    monthlyBillTitle: 'इस महीने का दुकान बिल',
    savedVsDedicated: 'खुद का डिलीवरी बॉय रखने (₹12,000/माह) से बचत',
    subscriptionPlans: 'सब्सक्रिप्शन प्लान',
    currentPlan: 'मौजूदा प्लान',
    switchPlan: 'प्लान बदलें',
    riderSelector: 'डिलीवरी बॉय चुनें',
    dutyStatus: 'ड्यूटी स्टेटस',
    online: 'ऑनलाइन (उपलब्ध)',
    offline: 'ब्रेक पर',
    newRequests: 'इलाके के नए ऑर्डर',
    activeTrip: 'मौजूदा डिलीवरी ट्रिप',
    acceptOrder: 'ऑर्डर स्वीकार करें',
    markPickedUp: 'दुकान से सामान उठाया',
    markDelivered: 'ग्राहक को डिलीवर किया',
    openGoogleMaps: 'Google Maps में रास्ता देखें',
    callCustomer: 'ग्राहक को कॉल करें',
    callShop: 'दुकानदार को कॉल करें',
    todayEarnings: 'आज की राइडर कमाई',
    payoutModelTitle: 'डिलीवरी बॉय पेमेंट मॉडल तुलना',
    payoutModelSubtitle:
      'तय करें कि आपकी कंपनी में डिलीवरी बॉय Fixed Salary, Per Delivery या Hybrid Model पर कैसे काम करेंगे।',
    applyModelBtn: 'यह मॉडल नेटवर्क पर लागू करें',
    modelAppliedToast: 'सभी राइडर्स पर नया पेमेंट मॉडल लागू हो गया।',
  },
} as const;

export function getCategoryLabel(category: ShopCategory, lang: Language): string {
  const map: Record<ShopCategory, { en: string; hi: string }> = {
    [ShopCategory.KIRANA]: { en: 'Kirana Store', hi: 'किराना स्टोर' },
    [ShopCategory.VEGETABLE]: { en: 'Vegetable Shop', hi: 'सब्जी की दुकान' },
    [ShopCategory.MEDICAL]: { en: 'Medical Store', hi: 'मेडिकल स्टोर' },
    [ShopCategory.FAST_FOOD]: { en: 'Fast Food', hi: 'फास्ट फूड की दुकान' },
    [ShopCategory.CLOTHING]: { en: 'Clothing Shop', hi: 'कपड़ों की दुकान' },
    [ShopCategory.ELECTRONICS]: { en: 'Mobile & Electronics', hi: 'मोबाइल व इलेक्ट्रॉनिक्स' },
    [ShopCategory.SWEETS]: { en: 'Sweet Shop (Mithai)', hi: 'मिठाई की दुकान' },
  };
  return map[category][lang];
}

export function getStatusLabel(status: OrderStatus, lang: Language): string {
  const t = translations[lang];
  switch (status) {
    case OrderStatus.PENDING:
      return t.pending;
    case OrderStatus.ASSIGNED:
      return t.assigned;
    case OrderStatus.PICKED_UP:
      return t.pickedUp;
    case OrderStatus.IN_TRANSIT:
      return t.inTransit;
    case OrderStatus.DELIVERED:
      return t.delivered;
  }
}

export function getPlanLabel(plan: PlanTier, lang: Language): string {
  const map: Record<PlanTier, { en: string; hi: string }> = {
    [PlanTier.BASIC]: { en: 'Basic ₹299', hi: 'बेसिक ₹299' },
    [PlanTier.STANDARD]: { en: 'Standard ₹499', hi: 'स्टैंडर्ड ₹499' },
    [PlanTier.PREMIUM]: { en: 'Premium ₹999', hi: 'प्रीमियम ₹999' },
  };
  return map[plan][lang];
}

export function getPayoutModelLabel(model: PayoutModel, lang: Language): string {
  const map: Record<PayoutModel, { en: string; hi: string }> = {
    [PayoutModel.FIXED]: { en: 'Fixed Salary', hi: 'फिक्स सैलरी' },
    [PayoutModel.PER_DELIVERY]: { en: 'Per Delivery', hi: 'प्रति डिलीवरी' },
    [PayoutModel.HYBRID]: { en: 'Hybrid Model', hi: 'हाइब्रिड मॉडल' },
  };
  return map[model][lang];
}
