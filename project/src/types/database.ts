export type DeliveryStatus = 'pending' | 'loaded' | 'delivered';
export type PaymentStatus = 'pending' | 'paid' | 'no_pay_on_delivery';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'invoice' | 'other';
export type Priority = 'normal' | 'urgent';
export type LocationSource = 'manual' | 'gps' | 'search' | 'map';

export interface Route {
  id: string;
  name: string;
  description: string | null;
  is_optimized: boolean;
  optimized_at: string | null;
  created_at: string;
}

export interface Town {
  id: string;
  route_id: string;
  name: string;
  position: number;
  notes: string | null;
  created_at: string;
}

export interface Stop {
  id: string;
  town_id: string;
  name: string;
  client_name: string | null;
  alias: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  access_notes: string | null;
  priority: Priority;
  delivery_status: DeliveryStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  amount: number;
  latitude: number | null;
  longitude: number | null;
  location_saved: boolean;
  location_confirmed: boolean;
  location_source: LocationSource;
  google_place_id: string | null;
  optimized_position: number | null;
  optimized_town_position: number | null;
  position: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string | null;
  created_at: string;
}

export interface TruckZone {
  id: string;
  name: string;
  description: string | null;
  is_temporary: boolean;
  created_at: string;
}

export interface StopProduct {
  id: string;
  stop_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit: string | null;
  weight: number | null;
  truck_zone_id: string | null;
  status: DeliveryStatus;
  created_at: string;
}

export interface StopWithTown extends Stop {
  town?: Town;
}

export interface StopProductWithZone extends StopProduct {
  truck_zone?: TruckZone | null;
  product?: Product | null;
}

export interface SearchResult {
  displayName: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId: string | null;
  city: string | null;
  distance: number | null;
}
