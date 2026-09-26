import { useTruckZones } from '@/hooks/useData';
import { Truck, AlertTriangle, Package, Plus, X, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Screen } from '@/App';

export function TruckLoadScreen({ navigate }: { navigate?: (s: Screen) => void }) {
  const { zones, loading, refetch } = useTruckZones();
  const [showAddZone, setShowAddZone] = useState(false);

  type ZoneItem = { product_name: string; stop_name: string; quantity: number; unit: string | null; weight: number | null };
  const [zoneProducts, setZoneProducts] = useState<Record<string, ZoneItem[]>>({});

  const loadZoneProducts = useCallback(async () => {
    const { data } = await supabase.from('stop_products').select('*, stop:stops(name)').order('created_at');
    const map: Record<string, ZoneItem[]> = {};
    (data || []).forEach((sp) => {
      if (sp.truck_zone_id) {
        if (!map[sp.truck_zone_id]) map[sp.truck_zone_id] = [];
        map[sp.truck_zone_id].push({
          product_name: sp.product_name,
          stop_name: sp.stop?.name || 'Sin destino',
          quantity: sp.quantity,
          unit: sp.unit,
          weight: sp.weight,
        });
      }
    });
    setZoneProducts(map);
  }, []);

  useEffect(() => { loadZoneProducts(); }, [loadZoneProducts]);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-5 animate-fade-in">
        {navigate && (
          <button onClick={() => navigate({ name: 'more' })} className="w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition shrink-0">
            <ArrowLeft size={20} className="text-stone-700" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-stone-900">📦 Carga del camión</h1>
        </div>
      </div>

      {/* Warning */}
      <div className="glass-card p-4 mb-4 border-amber-200/50 bg-amber-50/50 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Distribución provisional</p>
            <p className="text-xs text-amber-700 mt-1">
              Las zonas físicas del camión se configurarán cuando se proporcionen fotografías y medidas reales.
            </p>
          </div>
        </div>
      </div>

      {/* Truck info */}
      <div className="glass-card p-4 mb-4 animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
            <Truck size={24} className="text-green-700" />
          </div>
          <div>
            <p className="font-bold text-stone-800">Camión MUNDIFRUT</p>
            <p className="text-xs text-stone-500">Apertura lateral y trasera · Palets traseros (patatas)</p>
          </div>
        </div>
        <div className="bg-white/40 rounded-2xl p-3">
          <p className="text-xs text-stone-500">
            La distribución exacta se configurará con: ancho, largo, alto, aperturas, palets, capacidad y posición de las cajas.
          </p>
        </div>
      </div>

      {/* Zones */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="glass-card h-24 animate-pulse" style={{ background: 'rgba(255,255,255,0.4)' }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {zones.map((zone, i) => {
            const items = zoneProducts[zone.id] || [];
            return (
              <div key={zone.id} className={`glass-card p-4 animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-green-600/20">
                    {zone.name.replace('Zona ', '')}
                  </div>
                  <div>
                    <p className="font-bold text-stone-800 text-sm">{zone.name}</p>
                    {zone.is_temporary && <span className="text-[10px] text-amber-600 font-semibold">Provisional</span>}
                  </div>
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-stone-400">Sin productos</p>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/40 rounded-lg p-2">
                        <Package size={12} className="text-stone-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-stone-800 truncate">{item.product_name}</p>
                          <p className="text-[10px] text-stone-500 truncate">→ {item.stop_name}</p>
                        </div>
                        <span className="text-[10px] text-stone-600 shrink-0">
                          {item.quantity > 0 ? `${item.quantity}` : ''}{item.unit ? ` ${item.unit}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => setShowAddZone(true)} className="mf-btn-secondary w-full mt-4">
        <Plus size={18} /> Añadir zona
      </button>

      {showAddZone && (
        <AddZoneModal onClose={() => setShowAddZone(false)} onSaved={() => { setShowAddZone(false); refetch(); }} />
      )}
    </div>
  );
}

function AddZoneModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { alert('Introduce un nombre'); return; }
    setSaving(true);
    const { error } = await supabase.from('truck_zones').insert({ name: name.trim(), description: description.trim() || null, is_temporary: true });
    setSaving(false);
    if (error) { alert('Error al guardar'); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="glass-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900">Nueva zona</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"><X size={18} className="text-stone-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mf-label">Nombre</label>
            <input className="mf-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Zona E" />
          </div>
          <div>
            <label className="mf-label">Descripción</label>
            <input className="mf-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción de la zona" />
          </div>
          <button onClick={handleSave} disabled={saving} className="mf-btn-primary w-full">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
