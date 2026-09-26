import { useState, useCallback, useEffect } from 'react';
import { useAllStopsInRoute, useTowns } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import type { Screen } from '@/App';
import { ArrowLeft, Navigation, Check, MapPin, AlertCircle, Store, Wallet, Package, Loader2 } from 'lucide-react';
import { deliveryStatusConfig, formatAmount, haversineDistance, formatDistance } from '@/lib/helpers';
import { CircularProgress, StatusDot } from '@/components/ui';

export function DeliveryModeScreen({ routeId, navigate }: { routeId: string; navigate: (s: Screen) => void }) {
  const { stops, loading, refetch } = useAllStopsInRoute(routeId);
  const { towns } = useTowns(routeId);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const sortedStops = [...stops].sort((a, b) => {
    const townA = towns.find(t => t.id === a.town_id);
    const townB = towns.find(t => t.id === b.town_id);
    const posA = (townA?.position || 0) * 1000 + a.position;
    const posB = (townB?.position || 0) * 1000 + b.position;
    return posA - posB;
  });

  const deliveredCount = sortedStops.filter(s => s.delivery_status === 'delivered').length;
  const totalCount = sortedStops.length;
  const currentStop = sortedStops[currentIdx];
  const nextStop = sortedStops.find((s, i) => i >= currentIdx && s.delivery_status !== 'delivered') || null;

  const markDelivered = useCallback(async () => {
    if (!currentStop) return;
    const { error } = await supabase.from('stops').update({ delivery_status: 'delivered' }).eq('id', currentStop.id);
    if (error) { console.error('Error marking delivered:', error); alert('Error al marcar'); return; }
    setArrived(false);
    setCurrentIdx(prev => prev + 1);
    refetch();
  }, [currentStop, refetch]);

  const navigateToMaps = useCallback(() => {
    if (!currentStop) return;
    if (currentStop.location_confirmed && currentStop.latitude != null && currentStop.longitude != null) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}`, '_blank');
    } else if (currentStop.address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentStop.address)}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentStop.name)}`, '_blank');
    }
  }, [currentStop]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="glass-card h-96 animate-pulse" style={{ background: 'rgba(255,255,255,0.4)' }} />
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6">
        <button onClick={() => navigate({ name: 'route', routeId })} className="w-10 h-10 rounded-full glass flex items-center justify-center">
          <ArrowLeft size={20} className="text-stone-700" />
        </button>
        <p className="text-stone-500 mt-4">Sin destinos en esta ruta</p>
      </div>
    );
  }

  if (deliveredCount === totalCount) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="glass-card p-8 text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check size={40} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">¡Ruta completada!</h2>
          <p className="text-stone-500 mb-4">Has entregado en todos los {totalCount} destinos</p>
          <button onClick={() => navigate({ name: 'route', routeId })} className="mf-btn-primary w-full">Volver a la ruta</button>
        </div>
      </div>
    );
  }

  const progress = Math.round((deliveredCount / totalCount) * 100);
  const stop = currentStop || nextStop;

  // Calculate distance to next stop if we have user location
  const distanceToNext = stop && userLocation && stop.latitude != null && stop.longitude != null
    ? haversineDistance(userLocation.lat, userLocation.lng, stop.latitude, stop.longitude)
    : null;

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 animate-fade-in">
        <button onClick={() => navigate({ name: 'route', routeId })} className="w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition shrink-0">
          <ArrowLeft size={20} className="text-stone-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-stone-900">Modo reparto</h1>
        </div>
      </div>

      {/* Large circular progress */}
      <div className="flex flex-col items-center mb-5 animate-slide-up">
        <CircularProgress value={deliveredCount} max={totalCount} size={160} strokeWidth={12}>
          <span className="text-4xl font-extrabold text-stone-900">{deliveredCount}</span>
          <span className="text-lg text-stone-400 font-semibold">/ {totalCount}</span>
          <span className="text-xs text-stone-400 mt-1">paradas completadas</span>
        </CircularProgress>
      </div>

      {/* Arrived view */}
      {arrived && stop ? (
        <div className="glass-card p-5 border-green-300/50 bg-green-50/50 animate-scale-in">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <MapPin size={22} className="text-green-700" />
            </div>
            <h2 className="text-lg font-bold text-green-800">¡Has llegado!</h2>
          </div>
          <p className="text-xl font-extrabold text-stone-900 mb-1">{stop.name}</p>
          {stop.client_name && <p className="text-sm text-stone-600 mb-3">{stop.client_name}</p>}

          {/* Products to unload */}
          <div className="bg-white/60 rounded-2xl p-3 mb-3">
            <p className="text-xs font-bold text-stone-500 mb-2 flex items-center gap-1">
              <Package size={12} /> LO QUE TIENES QUE DESCARGAR
            </p>
            <p className="text-sm text-stone-400">Revisa los productos en la ficha del cliente.</p>
          </div>

          {stop.notes && (
            <div className="bg-white/60 rounded-2xl p-3 mb-3 border border-orange-200/40">
              <p className="text-xs text-orange-600 font-bold mb-1">NOTAS</p>
              <p className="text-sm text-stone-800">{stop.notes}</p>
            </div>
          )}
          {stop.access_notes && (
            <div className="bg-white/60 rounded-2xl p-3 mb-3 border border-blue-200/40">
              <p className="text-xs text-blue-600 font-bold mb-1">ACCESO</p>
              <p className="text-sm text-stone-800">{stop.access_notes}</p>
            </div>
          )}

          {stop.amount > 0 && (
            <div className="bg-white/60 rounded-2xl p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-amber-600" />
                  <span className="text-sm text-stone-500">Cobro</span>
                </div>
                <span className="text-lg font-bold text-stone-900">{formatAmount(stop.amount)}</span>
              </div>
            </div>
          )}

          {stop.priority === 'urgent' && (
            <div className="flex items-center gap-2 mb-3 mf-badge bg-red-100 text-red-700">
              <AlertCircle size={14} /> URGENTE
            </div>
          )}

          <button onClick={markDelivered} className="mf-btn-primary w-full">
            <Check size={22} />
            Finalizar entrega
          </button>
          <button onClick={() => setArrived(false)} className="mf-btn-secondary w-full mt-2">
            Cancelar
          </button>
        </div>
      ) : stop ? (
        <div>
          {/* Next stop card */}
          <div className="glass-card p-5 mb-4 animate-slide-up">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Próxima parada</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                <Store size={24} className="text-green-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-extrabold text-stone-900 truncate">{stop.name}</p>
                {stop.client_name && <p className="text-sm text-stone-500">{stop.client_name}</p>}
              </div>
            </div>

            {/* Location status */}
            {stop.location_confirmed && stop.latitude != null ? (
              distanceToNext != null && (
                <div className="flex items-center gap-2 mb-3 bg-blue-50/60 rounded-xl px-3 py-2 border border-blue-200/40">
                  <Navigation size={14} className="text-blue-600" />
                  <span className="text-sm text-blue-700 font-semibold">{formatDistance(distanceToNext)}</span>
                  <span className="text-xs text-stone-400">desde tu posición</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 mb-3 bg-amber-50/60 rounded-xl px-3 py-2 border border-amber-200/40">
                <AlertCircle size={14} className="text-amber-600" />
                <span className="text-xs text-amber-700">Ubicación sin confirmar</span>
                <button onClick={() => navigate({ name: 'location', stopId: stop.id })}
                  className="text-xs font-semibold text-green-700 ml-auto">Buscar</button>
              </div>
            )}

            {stop.priority === 'urgent' && (
              <div className="flex items-center gap-2 mb-3 mf-badge bg-red-100 text-red-700">
                <AlertCircle size={14} /> URGENTE
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={navigateToMaps} className="mf-btn-nav flex-1">
                <Navigation size={20} />
                Navegar
              </button>
              <button onClick={() => setArrived(true)} className="mf-btn-primary flex-1">
                <MapPin size={20} />
                He llegado
              </button>
            </div>
          </div>

          {/* Stop list */}
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Todas las paradas</p>
          <div className="space-y-2">
            {sortedStops.map((s, i) => {
              const ds = deliveryStatusConfig[s.delivery_status];
              const isCurrent = i === currentIdx;
              const hasLocation = s.location_confirmed && s.latitude != null;
              return (
                <button key={s.id} onClick={() => setCurrentIdx(i)}
                  className={`w-full glass-card p-3 flex items-center gap-3 transition active:scale-[0.98] ${isCurrent ? 'border-green-400/60 bg-green-50/50' : ''} ${s.delivery_status === 'delivered' ? 'opacity-50' : ''}`}>
                  <StatusDot status={s.delivery_status} />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-stone-800 text-sm truncate">{s.name}</p>
                    {s.client_name && <p className="text-xs text-stone-500 truncate">{s.client_name}</p>}
                  </div>
                  {!hasLocation && s.latitude == null && <MapPin size={14} className="text-amber-400" />}
                  {!hasLocation && s.latitude != null && <MapPin size={14} className="text-orange-400" />}
                  {s.priority === 'urgent' && <AlertCircle size={16} className="text-red-500" />}
                  {s.delivery_status === 'delivered' && <Check size={16} className="text-green-600" />}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
