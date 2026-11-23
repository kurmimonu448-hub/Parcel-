export type Language = 'en' | 'hi';

export type ActivePortal = 'admin' | 'merchant' | 'rider' | 'economics';

export enum ShopCategory {
  KIRANA = 'kirana',
  VEGETABLE = 'vegetable',
  MEDICAL = 'medical',
  FAST_FOOD = 'fast_food',
  CLOTHING = 'clothing',
  ELECTRONICS = 'electronics',
  SWEETS = 'sweets',
}

export enum PlanTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum PayoutModel {
  FIXED = 'fixed',
  PER_DELIVERY = 'per_delivery',
  HYBRID = 'hybrid',
}

export enum OrderStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
}

export enum PaymentMode {
  PREPAID = 'prepaid',
  COD = 'cod',
}

export interface Coordinates {
  x: number; // 0 to 100 on zone grid
  y: number; // 0 to 100 on zone grid
  lat: number;
  lng: number;
}

export interface SubscriptionPlan {
  tier: PlanTier;
  nameEn: string;
  nameHi: string;
  monthlyFee: number;
  perDeliveryFee: number;
  includedPriorityLimit: number;
  maxRadiusKm: number;
  audienceEn: string;
  audienceHi: string;
}

export interface Merchant {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  category: ShopCategory;
  address: string;
  plan: PlanTier;
  active: boolean;
  joinedDate: string;
  monthlyOrdersCount: number;
  coords: Coordinates;
}

export interface DeliveryRider {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: 'Bike' | 'EV Scooter' | 'Scooter';
  avatarUrl?: string;
  online: boolean;
  payoutType: 'fixed' | 'per_delivery' | 'hybrid';
  fixedMonthlyPay: number;
  perOrderIncentive: number;
  todayDeliveries: number;
  monthDeliveries: number;
  rating: number;
  zoneArea: string;
  coords: Coordinates;
}

export interface DeliveryOrder {
  id: string;
  merchantId: string;
  riderId: string | null;
  customerName: string;
  customerPhone: string;
  dropAddress: string;
  itemSummary: string;
  distanceKm: number;
  deliveryFee: number;
  riderPayout: number;
  paymentMode: PaymentMode;
  codAmount: number;
  status: OrderStatus;
  createdAt: string;
  etaMinutes: number;
  progress: number; // 0 to 100 for live map simulation
  dropCoords: Coordinates;
}
