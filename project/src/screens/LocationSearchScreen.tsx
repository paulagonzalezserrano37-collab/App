import { useState, useCallback, useEffect } from 'react';
import type { Screen } from '@/App';
import type { SearchResult, LocationSource } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, MapPin, Crosshair, Navigation, X, Store, AlertCircle, Loader2, Check } from 'lucide-react';
import { haversineDistance, formatDistance } from '@/lib/helpers';

export function LocationSearchScreen({ stopId, navigate }: { stopId: string; navigate: (s: Screen) => void }) {
  const [stopName, setStopName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('stops').select('name').eq('id', stopId).maybeSingle();
      if (data?.name) {
        setStopName(data.name);
        setQuery(data.name);
      }
    })();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [stopId]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=es&limit=8&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      if (!response.ok) throw new Error('Error en la búsqueda');
      const data = await response.json();
      const mapped: SearchResult[] = (data || []).map((r: Record<string, unknown>) => {
        const lat = parseFloat(r.lat as string);
        const lng = parseFloat(r.lon as string);
        return {
          displayName: (r.display_name as string) || '',
          address: (r.display_name as string) || '',
          latitude: lat,
          longitude: lng,
          placeId: (r.place_id as string) || null,
          city: (r.address as Record<string, string>)?.town || (r.address as Record<string, string>)?.village || (r.address as Record<string, string>)?.city || null,
          distance: userLocation ? haversineDistance(userLocation.lat, userLocation.lng, lat, lng) : null,
        };
      });
      mapped.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      setResults(mapped);
    } catch {
      alert('Error al buscar. Inténtalo de nuevo.');
    }
    setSearching(false);
  }, [query, userLocation]);

  const handleSelect = useCallback((result: SearchResult) => {
    setSelectedResult(result);
  }, []);

  const handleSave = useCallback(async (result: SearchResult, source: LocationSource) => {
    setSaving(true);
    const { error } = await supabase.from('stops').update({
      latitude: result.latitude,
      longitude: result.longitude,
      address: result.address,
      google_place_id: result.placeId,
      location_saved: true,
      location_confirmed: true,
      location_source: source,
    }).eq('id', stopId);
    setSaving(false);
    if (error) { alert('Error al guardar la ubicación'); return; }
    navigate({ name: 'stop', stopId });
  }, [stopId, navigate]);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 animate-fade-in">
        <button onClick={() => navigate({ name: 'stop', stopId })} className="w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition shrink-0">
          <ArrowLeft size={20} className="text-stone-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-stone-900">Buscar ubicación</h1>
          {stopName && <p className="text-sm text-stone-500 truncate">{stopName}</p>}
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-4 animate-slide-up">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="mf-input pl-10"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Buscar establecimiento..."
          />
        </div>
        <button onClick={handleSearch} disabled={searching} className="mf-btn-primary px-5">
          {searching ? <Loader2 size={20} className="animate-spin" /> : 'Buscar'}
        </button>
      </div>

      {/* Results */}
      {searching && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="glass-card h-20 animate-pulse" style={{ background: 'rgba(255,255,255,0.4)' }} />)}
        </div>
      )}

      {!searching && hasSearched && results.length === 0 && (
        <div className="glass-card p-6 text-center animate-scale-in">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
            <Search size={28} className="text-stone-400" />
          </div>
          <p className="font-semibold text-stone-700 mb-1">Sin resultados</p>
          <p className="text-sm text-stone-400 mb-4">No se encontraron ubicaciones para "{query}"</p>
          <button onClick={() => setShowManual(true)} className="mf-btn-secondary">
            <MapPin size={18} /> Ubicación manual
          </button>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">
            {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((r, i) => (
            <div key={i} className={`glass-card p-4 animate-slide-up stagger-${Math.min(i + 1, 6)} ${selectedResult === r ? 'border-green-400/60 bg-green-50/50' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <Store size={18} className="text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-900 text-sm truncate">
                    {r.city || r.displayName.split(',')[0]}
                  </p>
                  <p className="text-xs text-stone-500 line-clamp-2">{r.address}</p>
                  {r.distance != null && (
                    <div className="flex items-center gap-1 mt-1">
                      <Navigation size={12} className="text-stone-400" />
                      <span className="text-xs text-stone-400">{formatDistance(r.distance)}</span>
                    </div>
                  )}
                </div>
              </div>
              {selectedResult === r ? (
                <button
                  onClick={() => handleSave(r, 'search')}
                  disabled={saving}
                  className="mf-btn-primary w-full mt-3"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Guardar esta ubicación</>}
                </button>
              ) : (
                <button
                  onClick={() => handleSelect(r)}
                  className="mf-btn-secondary w-full mt-3 text-sm"
                >
                  Elegir esta
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No results yet - show options */}
      {!hasSearched && !searching && (
        <div className="glass-card p-5 animate-slide-up">
          <p className="text-sm text-stone-500 mb-4">
            Busca el establecimiento por nombre o dirección. Si no lo encuentras, puedes introducir la ubicación manualmente.
          </p>
          <div className="space-y-2">
            <button onClick={() => setShowManual(true)} className="mf-btn-secondary w-full">
              <MapPin size={18} /> Introducir ubicación manualmente
            </button>
          </div>
        </div>
      )}

      {/* Manual location modal */}
      {showManual && (
        <ManualLocationModal
          onClose={() => setShowManual(false)}
          onSave={async (lat, lng, address, source) => {
            setSaving(true);
            const { error } = await supabase.from('stops').update({
              latitude: lat,
              longitude: lng,
              address: address || null,
              location_saved: true,
              location_confirmed: true,
              location_source: source,
            }).eq('id', stopId);
            setSaving(false);
            if (error) { alert('Error al guardar'); return; }
            navigate({ name: 'stop', stopId });
          }}
          saving={saving}
          stopName={stopName}
        />
      )}
    </div>
  );
}

function ManualLocationModal({ onClose, onSave, saving, stopName }: {
  onClose: () => void;
  onSave: (lat: number, lng: number, address: string, source: LocationSource) => void;
  saving: boolean;
  stopName: string;
}) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) { alert('Geolocalización no disponible'); setGettingLocation(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setGettingLocation(false);
      },
      err => { alert('Error: ' + err.message); setGettingLocation(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="glass-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900">Ubicación manual</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"><X size={18} className="text-stone-400" /></button>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-stone-500">
            ¿No encuentras la ubicación correcta para {stopName || 'este destino'}? Usa una de estas opciones:
          </p>

          {/* GPS button */}
          <button onClick={getCurrentLocation} disabled={gettingLocation} className="mf-btn-nav w-full">
            <Crosshair size={20} />
            {gettingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
          </button>

          {/* Manual coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mf-label">Latitud</label>
              <input className="mf-input" type="number" inputMode="decimal" value={lat} onChange={e => setLat(e.target.value)} placeholder="0.00000" />
            </div>
            <div>
              <label className="mf-label">Longitud</label>
              <input className="mf-input" type="number" inputMode="decimal" value={lng} onChange={e => setLng(e.target.value)} placeholder="0.00000" />
            </div>
          </div>
          <div>
            <label className="mf-label">Dirección (opcional)</label>
            <input className="mf-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección del establecimiento" />
          </div>

          {/* Map link */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stopName || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mf-btn-secondary w-full"
          >
            <MapPin size={18} /> Abrir Google Maps para buscar
          </a>

          <div className="flex items-start gap-2 bg-amber-50/60 rounded-2xl p-3 border border-amber-200/40">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Introduce las coordenadas exactas. Puedes obtenerlas de Google Maps haciendo clic derecho en el mapa.
            </p>
          </div>

          <button
            onClick={() => {
              const latN = parseFloat(lat);
              const lngN = parseFloat(lng);
              if (isNaN(latN) || isNaN(lngN)) { alert('Coordenadas inválidas'); return; }
              onSave(latN, lngN, address, lat ? 'gps' : 'manual');
            }}
            disabled={saving || (!lat && !lng)}
            className="mf-btn-primary w-full"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Guardar ubicación'}
          </button>
        </div>
      </div>
    </div>
  );
}
