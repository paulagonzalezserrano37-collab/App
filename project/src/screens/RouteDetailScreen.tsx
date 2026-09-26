import { useState, useCallback } from 'react';
import { useTowns, useAllStopsInRoute, useRoutes, useStopProducts } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import type { Screen } from '@/App';
import type { Stop, Town } from '@/types/database';
import { ArrowLeft, ChevronRight, AlertCircle, Truck, Plus, ArrowUp, ArrowDown, Trash2, MapPin, Lock, Navigation, Loader2, Check, X } from 'lucide-react';
import { deliveryStatusConfig, haversineDistance, formatDistance } from '@/lib/helpers';
import { CircularProgress, StatusDot } from '@/components/ui';

export function RouteDetailScreen({ routeId, navigate, goHome }: { routeId: string; navigate: (s: Screen) => void; goHome: () => void }) {
  const { towns, loading: townsLoading } = useTowns(routeId);
  const { stops: allRouteStops, refetch: refetchStops } = useAllStopsInRoute(routeId);
  const { routes, refetch: refetchRoutes } = useRoutes();
  const route = routes.find(r => r.id === routeId);
  const routeName = route?.name || 'Ruta';
  const [expandedTown, setExpandedTown] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [showOptimize, setShowOptimize] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const handleStartDelivery = () => {
    navigate({ name: 'delivery', routeId });
  };

  const moveStop = useCallback(async (stop: Stop, direction: 'up' | 'down') => {
    const townStops = allRouteStops.filter(s => s.town_id === stop.town_id).sort((a, b) => a.position - b.position);
    const idx = townStops.findIndex(s => s.id === stop.id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === townStops.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const swapStop = townStops[swapIdx];
    await supabase.from('stops').update({ position: swapStop.position }).eq('id', stop.id);
    await supabase.from('stops').update({ position: stop.position }).eq('id', swapStop.id);
    refetchStops();
  }, [allRouteStops, refetchStops]);

  const deleteStop = useCallback(async (stopId: string) => {
    if (!confirm('¿Eliminar este destino?')) return;
    await supabase.from('stops').delete().eq('id', stopId);
    refetchStops();
  }, [refetchStops]);

  const totalStops = allRouteStops.length;
  const deliveredCount = allRouteStops.filter(s => s.delivery_status === 'delivered').length;
  const urgentStops = allRouteStops.filter(s => s.priority === 'urgent');
  const progressPct = totalStops > 0 ? Math.round((deliveredCount / totalStops) * 100) : 0;

  // Sort stops by habitual order (town position, then stop position)
  const habitualOrder = [...allRouteStops].sort((a, b) => {
    const townA = towns.find(t => t.id === a.town_id);
    const townB = towns.find(t => t.id === b.town_id);
    const posA = (townA?.position || 0) * 1000 + a.position;
    const posB = (townB?.position || 0) * 1000 + b.position;
    return posA - posB;
  });

  // Stops with confirmed locations for optimization
  const stopsForOptimization = habitualOrder.filter(s =>
    s.delivery_status !== 'delivered' &&
    s.location_confirmed &&
    s.latitude != null &&
    s.longitude != null
  );

  const handleOptimize = useCallback(async () => {
    setOptimizing(true);
    // Simple nearest-neighbor optimization using haversine distance
    // Only optimize stops that have confirmed locations and aren't delivered
    const toOptimize = stopsForOptimization.slice();
    if (toOptimize.length <= 1) {
      setOptimizing(false);
      setShowOptimize(true);
      return;
    }

    // Start from first stop
    const ordered: typeof toOptimize = [toOptimize[0]];
    const remaining = toOptimize.slice(1);

    while (remaining.length > 0) {
      const last = ordered[ordered.length - 1];
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < remaining.length; i++) {
        const d = haversineDistance(
          last.latitude!, last.longitude!,
          remaining[i].latitude!, remaining[i].longitude!
        );
        if (d < minDist) { minDist = d; minIdx = i; }
      }
      ordered.push(remaining.splice(minIdx, 1)[0]);
    }

    // Calculate total distance
    let totalDist = 0;
    for (let i = 1; i < ordered.length; i++) {
      totalDist += haversineDistance(
        ordered[i - 1].latitude!, ordered[i - 1].longitude!,
        ordered[i].latitude!, ordered[i].longitude!
      );
    }

    // Save optimized positions
    const updates = ordered.map((stop, idx) => ({
      id: stop.id,
      optimized_position: idx + 1,
    }));

    for (const u of updates) {
      await supabase.from('stops').update({
        optimized_position: u.optimized_position,
      }).eq('id', u.id);
    }

    // Mark route as optimized
    await supabase.from('routes').update({
      is_optimized: true,
      optimized_at: new Date().toISOString(),
    }).eq('id', routeId);

    setOptimizing(false);
    setShowOptimize(true);
    refetchStops();
    refetchRoutes();
  }, [stopsForOptimization, routeId, refetchStops, refetchRoutes]);

  const handleApplyOptimized = useCallback(async () => {
    // Apply optimized positions as the new habitual positions
    const optimizedStops = allRouteStops.filter(s => s.optimized_position != null);
    for (const stop of optimizedStops) {
      await supabase.from('stops').update({
        position: stop.optimized_position!,
        optimized_position: null,
      }).eq('id', stop.id);
    }
    await supabase.from('routes').update({
      is_optimized: false,
      optimized_at: null,
    }).eq('id', routeId);
    refetchStops();
    refetchRoutes();
    setShowOptimize(false);
  }, [allRouteStops, routeId, refetchStops, refetchRoutes]);

  const handleKeepHabitual = useCallback(async () => {
    // Clear optimized positions
    await supabase.from('stops').update({ optimized_position: null }).in('id', allRouteStops.map(s => s.id));
    await supabase.from('routes').update({
      is_optimized: false,
      optimized_at: null,
    }).eq('id', routeId);
    refetchStops();
    refetchRoutes();
    setShowOptimize(false);
  }, [allRouteStops, routeId, refetchStops, refetchRoutes]);

  const optimizedStops = allRouteStops
    .filter(s => s.optimized_position != null)
    .sort((a, b) => (a.optimized_position! - b.optimized_position!));

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 animate-fade-in">
        <button onClick={goHome} className="w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition shrink-0">
          <ArrowLeft size={20} className="text-stone-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-stone-900">{routeName}</h1>
          <p className="text-sm text-stone-500">{totalStops} destinos · {deliveredCount} entregados</p>
        </div>
        {route?.is_optimized && (
          <span className="mf-badge bg-blue-100 text-blue-700 text-[10px]">
            <Navigation size={10} /> Optimizada
          </span>
        )}
      </div>

      {/* Progress card */}
      <div className="glass-card p-5 mb-4 flex items-center gap-5 animate-slide-up">
        <CircularProgress value={deliveredCount} max={totalStops} size={90} strokeWidth={7}>
          <span className="text-xl font-extrabold text-stone-900">{deliveredCount}/{totalStops}</span>
        </CircularProgress>
        <div>
          <p className="text-sm font-semibold text-stone-500">Progreso de la ruta</p>
          <p className="text-2xl font-extrabold text-green-700">{progressPct}%</p>
          <p className="text-xs text-stone-400">completado</p>
        </div>
      </div>

      {/* Urgent stops */}
      {urgentStops.length > 0 && (
        <div className="glass-card p-3 mb-4 border-red-200/50 bg-red-50/50 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-red-500" />
            <span className="font-bold text-red-700 text-sm">Destinos urgentes ({urgentStops.length})</span>
          </div>
          <div className="space-y-1.5">
            {urgentStops.map(s => (
              <button key={s.id} onClick={() => navigate({ name: 'stop', stopId: s.id })}
                className="w-full flex items-center justify-between bg-white/70 rounded-xl px-3 py-2 active:scale-95 transition">
                <span className="font-semibold text-stone-800 text-sm">{s.name}</span>
                <ChevronRight size={16} className="text-stone-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mb-4">
        <button onClick={handleStartDelivery} className="mf-btn-primary flex-1 animate-slide-up">
          <Truck size={20} />
          Modo reparto
        </button>
        <button onClick={() => setReordering(!reordering)} className="mf-btn-secondary px-4 animate-slide-up">
          {reordering ? '✓ Listo' : '↕ Reordenar'}
        </button>
      </div>

      {/* Route order section */}
      <div className="glass-card p-4 mb-4 animate-slide-up">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={16} className="text-stone-500" />
          <p className="font-bold text-stone-800 text-sm">Orden de ruta fijo</p>
        </div>
        <p className="text-xs text-stone-500 mb-3">
          Este es el orden habitual. No se cambia automáticamente.
        </p>

        {/* Town order preview */}
        <div className="space-y-1.5 mb-3">
          {towns.map((town, idx) => (
            <div key={town.id} className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {idx + 1}
              </div>
              <span className="text-stone-700 font-medium">{town.name}</span>
              {town.notes && <span className="text-xs text-orange-500">· {town.notes}</span>}
            </div>
          ))}
        </div>

        {/* Optimize button */}
        <button
          onClick={handleOptimize}
          disabled={optimizing || stopsForOptimization.length < 2}
          className="mf-btn-secondary w-full text-sm"
        >
          {optimizing ? <><Loader2 size={16} className="animate-spin" /> Calculando...</> : <><Navigation size={16} /> Optimizar ruta</>}
        </button>
        {stopsForOptimization.length < 2 && (
          <p className="text-xs text-stone-400 mt-2">
            Necesitas al menos 2 destinos con ubicación confirmada para optimizar.
          </p>
        )}
      </div>

      {/* Optimization proposal */}
      {showOptimize && optimizedStops.length > 0 && (
        <div className="glass-card p-4 mb-4 border-blue-200/50 bg-blue-50/40 animate-scale-in">
          <div className="flex items-center gap-2 mb-3">
            <Navigation size={18} className="text-blue-600" />
            <p className="font-bold text-blue-700 text-sm">Ruta propuesta</p>
          </div>
          <p className="text-xs text-stone-500 mb-3">
            {optimizedStops.length} destinos con mercancía y ubicación confirmada.
            No se han modificado las restricciones de carretera.
          </p>
          <div className="space-y-1.5 mb-3">
            {optimizedStops.map((stop, idx) => (
              <div key={stop.id} className="flex items-center gap-2 text-sm bg-white/60 rounded-lg px-3 py-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <span className="text-stone-700 font-medium truncate">{stop.name}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleApplyOptimized} className="mf-btn-primary flex-1 text-sm">
              <Check size={16} /> Usar ruta propuesta
            </button>
            <button onClick={handleKeepHabitual} className="mf-btn-secondary flex-1 text-sm">
              <X size={16} /> Mantener habitual
            </button>
          </div>
        </div>
      )}

      {/* Towns timeline */}
      {townsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="glass-card h-16 animate-pulse" style={{ background: 'rgba(255,255,255,0.4)' }} />)}
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-green-300 via-green-200 to-transparent" />

          <div className="space-y-3">
            {towns.map((town, idx) => (
              <TownSection
                key={town.id}
                town={town}
                townNumber={idx + 1}
                expanded={expandedTown === town.id}
                onToggle={() => setExpandedTown(expandedTown === town.id ? null : town.id)}
                stops={allRouteStops.filter(s => s.town_id === town.id).sort((a, b) => a.position - b.position)}
                navigate={navigate}
                reordering={reordering}
                onMoveStop={moveStop}
                onDeleteStop={deleteStop}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add stop */}
      <button onClick={() => navigate({ name: 'addStop' })} className="mf-btn-secondary w-full mt-4">
        <Plus size={20} />
        Añadir destino
      </button>
    </div>
  );
}

function TownSection({ town, townNumber, expanded, onToggle, stops, navigate, reordering, onMoveStop, onDeleteStop }: {
  town: Town;
  townNumber: number;
  expanded: boolean;
  onToggle: () => void;
  stops: Stop[];
  navigate: (s: Screen) => void;
  reordering: boolean;
  onMoveStop: (stop: Stop, dir: 'up' | 'down') => void;
  onDeleteStop: (id: string) => void;
}) {
  const deliveredCount = stops.filter(s => s.delivery_status === 'delivered').length;
  const urgentCount = stops.filter(s => s.priority === 'urgent').length;

  return (
    <div className="relative pl-12">
      {/* Timeline dot */}
      <div className="absolute left-3 top-4 w-5 h-5 rounded-full bg-green-600 ring-4 ring-green-100 flex items-center justify-center z-10">
        <span className="text-[9px] font-bold text-white">{townNumber}</span>
      </div>

      <div className="glass-card overflow-hidden">
        <button onClick={onToggle} className="w-full p-4 flex items-center gap-3 active:bg-white/50 transition text-left">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-stone-900">{town.name}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {stops.length > 0 && (
                <span className="text-xs text-stone-500">{stops.length} destinos · {deliveredCount} ✓</span>
              )}
              {town.notes && <span className="text-xs text-orange-500 font-medium">· {town.notes}</span>}
              {urgentCount > 0 && <span className="text-xs text-red-500 font-bold">· {urgentCount} 🚨</span>}
            </div>
          </div>
          <ChevronRight size={20} className={`text-stone-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {expanded && (
          <div className="border-t border-white/40">
            {stops.length === 0 ? (
              <p className="px-4 py-3 text-sm text-stone-400">Sin destinos en este pueblo</p>
            ) : (
              <div className="divide-y divide-white/30">
                {stops.map((stop, sIdx) => {
                  const ds = deliveryStatusConfig[stop.delivery_status];
                  const hasLocation = stop.location_confirmed && stop.latitude != null;
                  return (
                    <div key={stop.id} className="flex items-center">
                      {reordering ? (
                        <div className="flex-1 flex items-center gap-2 px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => onMoveStop(stop, 'up')} disabled={sIdx === 0}
                              className="p-1 rounded-lg hover:bg-white/50 disabled:opacity-30 active:scale-90">
                              <ArrowUp size={16} className="text-stone-600" />
                            </button>
                            <button onClick={() => onMoveStop(stop, 'down')} disabled={sIdx === stops.length - 1}
                              className="p-1 rounded-lg hover:bg-white/50 disabled:opacity-30 active:scale-90">
                              <ArrowDown size={16} className="text-stone-600" />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-stone-800 text-sm truncate">{stop.name}</p>
                            {stop.client_name && <p className="text-xs text-stone-500 truncate">{stop.client_name}</p>}
                          </div>
                          <button onClick={() => onDeleteStop(stop.id)} className="p-2 active:scale-90">
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => navigate({ name: 'stop', stopId: stop.id })}
                          className="flex-1 flex items-center gap-3 px-4 py-3 active:bg-white/50 transition text-left">
                          <StatusDot status={stop.delivery_status} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-stone-800 text-sm truncate">{stop.name}</p>
                            {stop.client_name && <p className="text-xs text-stone-500 truncate">{stop.client_name}</p>}
                          </div>
                          {!hasLocation && stop.latitude == null && <MapPin size={14} className="text-amber-400 shrink-0" />}
                          {!hasLocation && stop.latitude != null && <MapPin size={14} className="text-orange-400 shrink-0" />}
                          {stop.priority === 'urgent' && <AlertCircle size={16} className="text-red-500 shrink-0" />}
                          <ChevronRight size={16} className="text-stone-300" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
