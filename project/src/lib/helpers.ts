import type { DeliveryStatus, PaymentStatus, Priority, PaymentMethod } from '@/types/database';

export const deliveryStatusConfig: Record<DeliveryStatus, { label: string; dot: string; badge: string }> = {
  pending: { label: 'Pendiente', dot: 'bg-stone-400', badge: 'bg-stone-100 text-stone-600' },
  loaded: { label: 'Cargado', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700' },
  delivered: { label: 'Entregado', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
};

export const paymentStatusConfig: Record<PaymentStatus, { label: string; badge: string }> = {
  pending: { label: 'Pendiente', badge: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Pagado', badge: 'bg-green-100 text-green-700' },
  no_pay_on_delivery: { label: 'No paga en entrega', badge: 'bg-stone-100 text-stone-600' },
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  invoice: 'Factura',
  other: 'Otro',
};

export const priorityConfig: Record<Priority, { label: string; badge: string }> = {
  normal: { label: 'Normal', badge: 'bg-stone-100 text-stone-600' },
  urgent: { label: 'Urgente', badge: 'bg-red-100 text-red-700' },
};

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

export function formatCoord(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) return 'Sin ubicación';
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}min` : `${hours}h`;
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
