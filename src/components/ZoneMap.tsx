import React from 'react';
import { DeliveryOrder, DeliveryRider, Language, Merchant, OrderStatus } from '../types/network';
import { MapPin, Navigation, Store } from 'lucide-react';

interface ZoneMapProps {
  merchants: Merchant[];
  riders: DeliveryRider[];
  orders: DeliveryOrder[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  lang: Language;
  compact?: boolean;
}

export const ZoneMap: React.FC<ZoneMapProps> = ({
  merchants,
  riders,
  orders,
  selectedOrderId,
  onSelectOrder,
  lang,
  compact = false,
}) => {
  const activeOrders = orders.filter((o) => o.status !== OrderStatus.DELIVERED);
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || activeOrders[0] || null;

  const getMerchant = (id: string) => merchants.find((m) => m.id === id);

  // Interpolate rider coordinate along active order route for realistic live movement
  const getRiderMapCoords = (rider: DeliveryRider) => {
    const activeTrip = orders.find(
      (o) =>
        o.riderId === rider.id &&
        (o.status === OrderStatus.ASSIGNED ||
          o.status === OrderStatus.PICKED_UP ||
          o.status === OrderStatus.IN_TRANSIT)
    );
    if (!activeTrip) return rider.coords;

    const shop = getMerchant(activeTrip.merchantId);
    if (!shop) return rider.coords;

    if (activeTrip.status === OrderStatus.ASSIGNED) {
      // Moving toward shop
      const t = Math.min(1, activeTrip.progress / 30);
      return {
        x: rider.coords.x + (shop.coords.x - rider.coords.x) * t,
        y: rider.coords.y + (shop.coords.y - rider.coords.y) * t,
      };
    }

    // Moving from shop to customer
    const t = Math.max(0, Math.min(1, (activeTrip.progress - 30) / 70));
    return {
      x: shop.coords.x + (activeTrip.dropCoords.x - shop.coords.x) * t,
      y: shop.coords.y + (activeTrip.dropCoords.y - shop.coords.y) * t,
    };
  };

  const selectedShop = selectedOrder ? getMerchant(selectedOrder.merchantId) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {lang === 'hi' ? 'सेक्टर 14 लाइव डिस्पैच मैप' : 'Sector 14 Live Dispatch Grid'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'hi'
              ? `${merchants.filter((m) => m.active).length} दुकानें · ${riders.filter((r) => r.online).length} ऑनलाइन राइडर · ${activeOrders.length} सक्रिय ऑर्डर`
              : `${merchants.filter((m) => m.active).length} Shops · ${riders.filter((r) => r.online).length} Online Riders · ${activeOrders.length} Active Trips`}
          </p>
        </div>

        {selectedOrder && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.dropCoords.lat},${selectedOrder.dropCoords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'Google Maps' : 'Google Maps'}</span>
          </a>
        )}
      </div>

      {/* Architectural Neighborhood Vector Map */}
      <div className={`relative w-full bg-slate-50 ${compact ? 'h-64' : 'h-80 lg:h-[360px]'}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full block">
          {/* Urban city blocks */}
          <rect x="4" y="4" width="18" height="22" rx="1.5" fill="#F1F5F9" />
          <rect x="26" y="4" width="24" height="22" rx="1.5" fill="#F1F5F9" />
          <rect x="54" y="4" width="20" height="22" rx="1.5" fill="#F1F5F9" />
          <rect x="78" y="4" width="18" height="22" rx="1.5" fill="#F1F5F9" />

          <rect x="4" y="32" width="18" height="26" rx="1.5" fill="#F1F5F9" />
          <rect x="26" y="32" width="24" height="26" rx="1.5" fill="#F1F5F9" />
          <rect x="54" y="32" width="20" height="26" rx="1.5" fill="#F1F5F9" />
          <rect x="78" y="32" width="18" height="26" rx="1.5" fill="#F1F5F9" />

          <rect x="4" y="64" width="18" height="30" rx="1.5" fill="#F1F5F9" />
          <rect x="26" y="64" width="24" height="30" rx="1.5" fill="#F1F5F9" />
          <rect x="54" y="64" width="20" height="30" rx="1.5" fill="#F1F5F9" />
          <rect x="78" y="64" width="18" height="30" rx="1.5" fill="#F1F5F9" />

          {/* Main Arterial Roads */}
          <line x1="0" y1="29" x2="100" y2="29" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="0" y1="61" x2="100" y2="61" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="24" y1="0" x2="24" y2="100" stroke="#CBD5E1" strokeWidth="1.1" />
          <line x1="52" y1="0" x2="52" y2="100" stroke="#CBD5E1" strokeWidth="1.4" />
          <line x1="76" y1="0" x2="76" y2="100" stroke="#CBD5E1" strokeWidth="1.1" />

          {/* Gol Chakkar Roundabout */}
          <circle cx="52" cy="44" r="3.4" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />

          {/* Road Labels */}
          <text x="6" y="28" fontSize="2.4" fill="#64748B" fontWeight="500">
            Main Bazaar Rd
          </text>
          <text x="55" y="28" fontSize="2.4" fill="#64748B" fontWeight="500">
            Hospital Chowk
          </text>
          <text x="27" y="60" fontSize="2.4" fill="#64748B" fontWeight="500">
            Sabji Mandi Lane
          </text>
          <text x="55" y="60" fontSize="2.4" fill="#64748B" fontWeight="500">
            Station Road
          </text>

          {/* Active Order Route Paths */}
          {activeOrders.map((order) => {
            const shop = getMerchant(order.merchantId);
            if (!shop) return null;
            const isSelected = selectedOrder?.id === order.id;
            return (
              <g key={order.id} onClick={() => onSelectOrder(order.id)} className="cursor-pointer">
                <line
                  x1={shop.coords.x}
                  y1={shop.coords.y}
                  x2={order.dropCoords.x}
                  y2={order.dropCoords.y}
                  stroke={isSelected ? '#1D4ED8' : '#94A3B8'}
                  strokeWidth={isSelected ? '1.1' : '0.6'}
                  strokeDasharray={order.status === OrderStatus.PENDING ? '1.5 1.5' : 'none'}
                  opacity={isSelected ? 0.95 : 0.45}
                />
                {/* Customer Dropoff Marker */}
                <circle
                  cx={order.dropCoords.x}
                  cy={order.dropCoords.y}
                  r={isSelected ? 2.1 : 1.5}
                  fill={order.status === OrderStatus.PENDING ? '#D97706' : '#1D4ED8'}
                  stroke="#FFFFFF"
                  strokeWidth="0.6"
                />
              </g>
            );
          })}

          {/* Subscribed Shop Markers */}
          {merchants.map((merchant) => {
            const isSelectedShop = selectedShop?.id === merchant.id;
            return (
              <g key={merchant.id}>
                <rect
                  x={merchant.coords.x - (isSelectedShop ? 1.8 : 1.3)}
                  y={merchant.coords.y - (isSelectedShop ? 1.8 : 1.3)}
                  width={isSelectedShop ? 3.6 : 2.6}
                  height={isSelectedShop ? 3.6 : 2.6}
                  rx="0.6"
                  fill={merchant.active ? '#0F172A' : '#94A3B8'}
                  stroke="#FFFFFF"
                  strokeWidth="0.5"
                />
              </g>
            );
          })}

          {/* Delivery Rider Live Pins */}
          {riders.map((rider) => {
            const pos = getRiderMapCoords(rider);
            const isAssignedToSelected = selectedOrder?.riderId === rider.id;
            return (
              <g key={rider.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isAssignedToSelected ? 3.2 : 2.5}
                  fill={rider.online ? '#16A34A' : '#64748B'}
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                />
                <text
                  x={pos.x}
                  y={pos.y + 0.85}
                  textAnchor="middle"
                  fontSize="2.2"
                  fill="#FFFFFF"
                  fontWeight="700"
                >
                  {rider.name.charAt(0)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Clean Corner Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg px-3 py-1.5 flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-900 inline-block" />
            {lang === 'hi' ? 'दुकान' : 'Shop'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" />
            {lang === 'hi' ? 'राइडर' : 'Rider'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-700 inline-block" />
            {lang === 'hi' ? 'ग्राहक पता' : 'Drop-off'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
            {lang === 'hi' ? 'पेंडिंग' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Selected Order Route Strip */}
      {selectedOrder && selectedShop && (
        <div className="px-4 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono font-semibold text-slate-900 shrink-0">{selectedOrder.id}</span>
            <span className="text-slate-400 shrink-0">·</span>
            <span className="inline-flex items-center gap-1 text-slate-700 truncate">
              <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{selectedShop.name}</span>
            </span>
            <span className="text-slate-400 shrink-0">→</span>
            <span className="inline-flex items-center gap-1 text-slate-700 truncate">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{selectedOrder.dropAddress}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono tabular-nums text-slate-600 shrink-0">
            <span>{selectedOrder.distanceKm.toFixed(1)} km</span>
            <span className="text-slate-300">/</span>
            <span>
              {selectedOrder.etaMinutes > 0
                ? `ETA ${selectedOrder.etaMinutes} min`
                : lang === 'hi'
                ? 'पहुँच गया'
                : 'Completed'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
