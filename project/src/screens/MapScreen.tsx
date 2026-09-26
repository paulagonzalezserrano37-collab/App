import { useState, useCallback, useEffect } from 'react';
import { useAllStops, useRoutes, useTowns } from '@/hooks/useData';
import type { Screen } from '@/App';
import type { Stop } from '@/types/database';
import { Navigation, MapPin, Crosshair, ChevronRight, Plus, X, Store } from 'lucide-react';
import { deliveryStatusConfig } from '@/lib/helpers';

export function MapScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const { stops, loading } = useAllStops();
  const { routes } = useRoutes();
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { towns } = useTowns(selectedRoute === 'all' ? null : selectedRoute);
  const filteredStops = selectedRoute === 'all'
    ? stops
    : stops.filter(s => towns.some(t => t.id === s.town_id));

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationError('Geolocalización no disponible'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationError(null); },
      err => { setLocationError(err.message); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => { getUserLocation(); }, [getUserLocation]);

  const navigateToStop = (stop: Stop) => {
    if (stop.latitude != null && stop.longitude != null) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`, '_blank');
    } else if (stop.address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.name)}`, '_blank');
    }
  };

  const stopsWithLocation = filteredStops.filter(s => s.latitude != null && s.longitude != null);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      <h1 className="text-xl font-extrabold text-stone-900 mb-4 animate-fade-in">🗺️ Mapa</h1>

      {/* Route filter pills */}
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1 animate-slide-up">
        <button onClick={() => setSelectedRoute('all')}
          className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition active:scale-95 ${selectedRoute === 'all' ? 'bg-green-600 text-white shadow-md shadow-green-600/20' : 'glass text-stone-600'}`}>
          Todas
        </button>
        {routes.map(r => (
          <button key={r.id} onClick={() => setSelectedRoute(r.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition active:scale-95 ${selectedRoute === r.id ? 'bg-green-600 text-white shadow-md shadow-green-600/20' : 'glass text-stone-600'}`}>
            {r.name}
          </button>
        ))}
      </div>

      {/* Map embed */}
      <div className="glass-card overflow-hidden mb-3 animate-slide-up">
        <iframe
          title="Mapa MUNDIFRUT"
          width="100%"
          height="280"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={userLocation
            ? `https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}&z=12&output=embed`
            : `https://maps.google.com/maps?q=Extremadura,Spain&z=8&output=embed`
          }
        />
      </div>

      {/* Floating location button */}
      <div className="flex items-center gap-3 mb-3">
        <button onClick={getUserLocation} className="mf-btn-secondary flex-1">
          <Crosshair size={18} />
          {userLocation ? 'Ubicación activa' : 'Mi ubicación'}
        </button>
        {locationError && <span className="text-xs text-red-500">{locationError}</span>}
      </div>

      {/* Stops with location - bottom sheet style */}
      <div className="glass-card p-4 mb-3 animate-slide-up">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">
          Destinos con ubicación ({stopsWithLocation.length})
        </p>
        {stopsWithLocation.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-stone-400 mb-2">No hay destinos con ubicación guardada</p>
            <p className="text-sm text-stone-500">Abre un destino y pulsa "Guardar ubicación"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stopsWithLocation.map(stop => {
              const ds = deliveryStatusConfig[stop.delivery_status];
              return (
                <div key={stop.id} className="flex items-center gap-3 bg-white/40 rounded-2xl p-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ds.dot} ring-2 ring-white/60`} />
                  <button onClick={() => setSelectedStop(stop)} className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-stone-800 text-sm truncate">{stop.name}</p>
                    {stop.client_name && <p className="text-xs text-stone-500 truncate">{stop.client_name}</p>}
                  </button>
                  {stop.priority === 'urgent' && <span className="text-sm">🚨</span>}
                  <button onClick={() => navigateToStop(stop)} className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center active:scale-90 transition shrink-0">
                    <Navigation size={16} className="text-orange-600" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stops without location */}
      <div className="glass-card p-4 mb-3 animate-slide-up">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">
          Sin ubicación ({filteredStops.filter(s => s.latitude == null).length})
        </p>
        <div className="space-y-2">
          {filteredStops.filter(s => s.latitude == null).slice(0, 10).map(stop => (
            <button key={stop.id} onClick={() => navigate({ name: 'stop', stopId: stop.id })}
              className="w-full flex items-center gap-3 bg-white/40 rounded-2xl p-3 active:scale-[0.98] transition text-left">
              <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-stone-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800 text-sm truncate">{stop.name}</p>
                {stop.client_name && <p className="text-xs text-stone-500 truncate">{stop.client_name}</p>}
              </div>
              <ChevronRight size={16} className="text-stone-300" />
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => navigate({ name: 'addStop' })} className="mf-btn-secondary w-full">
        <Plus size={20} /> Añadir destino
      </button>

      {/* Selected stop bottom sheet */}
      {selectedStop && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedStop(null)}>
          <div className="glass-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                  <Store size={24} className="text-green-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">{selectedStop.name}</h2>
                  {selectedStop.client_name && <p className="text-sm text-stone-600">{selectedStop.client_name}</p>}
                </div>
              </div>
              <button onClick={() => setSelectedStop(null)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"><X size={18} className="text-stone-400" /></button>
            </div>
            {selectedStop.notes && (
              <div className="bg-orange-50/60 rounded-2xl p-3 mb-3 border border-orange-200/40">
                <p className="text-xs text-orange-600 font-bold mb-1">NOTAS</p>
                <p className="text-sm text-stone-800">{selectedStop.notes}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => navigateToStop(selectedStop)} className="mf-btn-nav flex-1">
                <Navigation size={18} /> Navegar
              </button>
              <button onClick={() => { const s = selectedStop; setSelectedStop(null); navigate({ name: 'stop', stopId: s.id }); }}
                className="mf-btn-secondary flex-1">Ver ficha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
