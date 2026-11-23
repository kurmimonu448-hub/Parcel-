import React, { useState } from 'react';
import { X } from 'lucide-react';
import { calculateDeliveryFee, SUBSCRIPTION_PLANS } from '../data/seedNetwork';
import { getCategoryLabel, getPlanLabel, translations } from '../i18n/translations';
import { Language, Merchant, PaymentMode } from '../types/network';

interface BookDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchants: Merchant[];
  defaultMerchantId?: string;
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
  lang: Language;
}

export const BookDeliveryModal: React.FC<BookDeliveryModalProps> = ({
  isOpen,
  onClose,
  merchants,
  defaultMerchantId,
  onCreateOrder,
  lang,
}) => {
  const t = translations[lang];
  const activeMerchants = merchants.filter((m) => m.active);
  const [merchantId, setMerchantId] = useState(
    defaultMerchantId || activeMerchants[0]?.id || ''
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [itemSummary, setItemSummary] = useState('');
  const [distanceKm, setDistanceKm] = useState(2.0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(PaymentMode.COD);
  const [codAmount, setCodAmount] = useState(350);

  if (!isOpen) return null;

  const selectedMerchant =
    merchants.find((m) => m.id === merchantId) || activeMerchants[0];
  const estimatedFee = selectedMerchant
    ? calculateDeliveryFee(selectedMerchant.plan, distanceKm)
    : 15;
  const planInfo = selectedMerchant ? SUBSCRIPTION_PLANS[selectedMerchant.plan] : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant || !customerName.trim() || !dropAddress.trim()) return;
    onCreateOrder({
      merchantId: selectedMerchant.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '+91 98100 00000',
      dropAddress: dropAddress.trim(),
      itemSummary: itemSummary.trim() || 'Local Shop Parcel',
      distanceKm,
      paymentMode,
      codAmount: paymentMode === PaymentMode.COD ? codAmount : 0,
    });
    setCustomerName('');
    setCustomerPhone('');
    setDropAddress('');
    setItemSummary('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{t.bookNewOrder}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'hi'
                ? 'दुकान चुनें और नजदीकी राइडर के लिए ऑर्डर भेजें'
                : 'Select shop and dispatch to the nearest shared rider'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              {t.merchantSelector}
            </label>
            <select
              value={selectedMerchant?.id || ''}
              onChange={(e) => setMerchantId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {activeMerchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({getCategoryLabel(m.category, lang)} · {getPlanLabel(m.plan, lang)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {t.customerName}
              </label>
              <input
                type="text"
                required
                placeholder={lang === 'hi' ? 'जैसे: अनिल शर्मा' : 'e.g. Anil Sharma'}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {t.customerPhone}
              </label>
              <input
                type="tel"
                placeholder="+91 98110 45210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              {t.dropAddress}
            </label>
            <input
              type="text"
              required
              placeholder={
                lang === 'hi'
                  ? 'मकान नं 42, ब्लॉक सी, शास्त्री नगर'
                  : 'House 42, Block C, Shastri Nagar'
              }
              value={dropAddress}
              onChange={(e) => setDropAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              {t.itemSummary}
            </label>
            <input
              type="text"
              placeholder={
                lang === 'hi' ? 'जैसे: 2 किलो दाल, तेल, बिस्किट' : 'e.g. 2kg Dal, Cooking Oil, Medicine'
              }
              value={itemSummary}
              onChange={(e) => setItemSummary(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {t.distanceKm}
              </label>
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.5}
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {t.paymentMode}
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value={PaymentMode.COD}>COD (Cash)</option>
                <option value={PaymentMode.PREPAID}>Prepaid / UPI</option>
              </select>
            </div>

            {paymentMode === PaymentMode.COD && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {t.codAmount}
                </label>
                <input
                  type="number"
                  min={0}
                  value={codAmount}
                  onChange={(e) => setCodAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              <span>{t.estimatedFee}</span>
              {planInfo && (
                <span className="text-slate-400 ml-2">
                  ({lang === 'hi' ? planInfo.nameHi : planInfo.nameEn}: ₹{planInfo.perDeliveryFee} base)
                </span>
              )}
            </div>
            <div className="text-base font-mono font-semibold tabular-nums text-slate-900">
              ₹{estimatedFee}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {t.confirmBooking}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
