import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Screen } from '@/App';
import type { PaymentMethod, PaymentStatus, Priority } from '@/types/database';
import { ArrowLeft, Save, Store, User, MapPin, Phone, FileText, Truck, Wallet } from 'lucide-react';
import { paymentMethodLabels, paymentStatusConfig } from '@/lib/helpers';

export function AddStopScreen({ navigate, stopId }: { navigate: (s: Screen) => void; stopId?: string }) {
  const isEdit = !!stopId;
  const [saving, setSaving] = useState(false);
  const [routes, setRoutes] = useState<{ id: string; name: string }[]>([]);
  const [towns, setTowns] = useState<{ id: string; name: string; route_id: string }[]>([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedTown, setSelectedTown] = useState('');

  const [form, setForm] = useState({
    name: '',
    client_name: '',
    alias: '',
    phone: '',
    address: '',
    notes: '',
    access_notes: '',
    priority: 'normal' as Priority,
    payment_status: 'pending' as PaymentStatus,
    payment_method: 'cash' as PaymentMethod,
    amount: '',
  });

  useEffect(() => {
    (async () => {
      const { data: r } = await supabase.from('routes').select('id, name').order('name');
      setRoutes(r || []);
      const { data: t } = await supabase.from('towns').select('id, name, route_id').order('name');
      setTowns(t || []);
      if (stopId) {
        const { data: stop } = await supabase.from('stops').select('*').eq('id', stopId).maybeSingle();
        if (stop) {
          setForm({
            name: stop.name || '',
            client_name: stop.client_name || '',
            alias: stop.alias || '',
            phone: stop.phone || '',
            address: stop.address || '',
            notes: stop.notes || '',
            access_notes: stop.access_notes || '',
            priority: stop.priority || 'normal',
            payment_status: stop.payment_status || 'pending',
            payment_method: stop.payment_method || 'cash',
            amount: stop.amount ? String(stop.amount) : '',
          });
          const town = (t || []).find(tw => tw.id === stop.town_id);
          if (town) {
            setSelectedRoute(town.route_id);
            setSelectedTown(town.id);
          }
        }
      }
    })();
  }, [stopId]);

  const filteredTowns = selectedRoute ? towns.filter(t => t.route_id === selectedRoute) : towns;

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) { alert('Introduce el nombre del establecimiento'); return; }
    if (!selectedTown) { alert('Selecciona una localidad'); return; }
    setSaving(true);

    const payload = {
      town_id: selectedTown,
      name: form.name.trim(),
      client_name: form.client_name.trim() || null,
      alias: form.alias.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
      access_notes: form.access_notes.trim() || null,
      priority: form.priority,
      payment_status: form.payment_status,
      payment_method: form.payment_method,
      amount: parseFloat(form.amount) || 0,
    };

    if (isEdit && stopId) {
      const { error } = await supabase.from('stops').update(payload).eq('id', stopId);
      setSaving(false);
      if (error) { alert('Error al guardar'); return; }
      navigate({ name: 'stop', stopId });
    } else {
      const { data: existing } = await supabase.from('stops').select('position').eq('town_id', selectedTown).order('position', { ascending: false }).limit(1);
      const nextPos = (existing && existing.length > 0 ? existing[0].position : 0) + 1;
      const { error } = await supabase.from('stops').insert({ ...payload, position: nextPos });
      setSaving(false);
      if (error) { alert('Error al guardar'); return; }
      navigate({ name: 'home' });
    }
  }, [form, selectedTown, isEdit, stopId, navigate]);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 animate-fade-in">
        <button onClick={() => navigate({ name: 'home' })} className="w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition shrink-0">
          <ArrowLeft size={20} className="text-stone-700" />
        </button>
        <h1 className="text-xl font-extrabold text-stone-900">{isEdit ? 'Editar destino' : 'Añadir destino'}</h1>
      </div>

      {/* Section: Establecimiento */}
      <div className="glass-card p-4 mb-3 animate-slide-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <Store size={16} className="text-green-700" />
          </div>
          <p className="mf-section-title">Establecimiento</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mf-label">Nombre del establecimiento *</label>
            <input className="mf-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Supermercado..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mf-label">Ruta</label>
              <select className="mf-input" value={selectedRoute} onChange={e => { setSelectedRoute(e.target.value); setSelectedTown(''); }}>
                <option value="">Selecciona</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mf-label">Localidad *</label>
              <select className="mf-input" value={selectedTown} onChange={e => setSelectedTown(e.target.value)}>
                <option value="">Selecciona</option>
                {filteredTowns.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Contacto */}
      <div className="glass-card p-4 mb-3 animate-slide-up stagger-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
          <p className="mf-section-title">Contacto</p>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mf-label">Cliente</label>
              <input className="mf-input" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Persona de contacto" />
            </div>
            <div>
              <label className="mf-label">Alias</label>
              <input className="mf-input" value={form.alias} onChange={e => setForm({ ...form, alias: e.target.value })} placeholder="Alias" />
            </div>
          </div>
          <div>
            <label className="mf-label">Teléfono</label>
            <input className="mf-input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Teléfono" />
          </div>
        </div>
      </div>

      {/* Section: Ubicación */}
      <div className="glass-card p-4 mb-3 animate-slide-up stagger-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <MapPin size={16} className="text-orange-600" />
          </div>
          <p className="mf-section-title">Ubicación</p>
        </div>
        <div>
          <label className="mf-label">Dirección</label>
          <input className="mf-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Dirección" />
        </div>
      </div>

      {/* Section: Notas */}
      <div className="glass-card p-4 mb-3 animate-slide-up stagger-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <FileText size={16} className="text-amber-600" />
          </div>
          <p className="mf-section-title">Notas</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mf-label">Notas del cliente</label>
            <textarea className="mf-input min-h-[70px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ej. Entrada por arriba" />
          </div>
          <div>
            <label className="mf-label">Notas de acceso para el camión</label>
            <textarea className="mf-input min-h-[70px]" value={form.access_notes} onChange={e => setForm({ ...form, access_notes: e.target.value })} placeholder="Ej. Entrar por detrás, no calle estrecha..." />
          </div>
        </div>
      </div>

      {/* Section: Pago */}
      <div className="glass-card p-4 mb-3 animate-slide-up stagger-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <Wallet size={16} className="text-green-700" />
          </div>
          <p className="mf-section-title">Pago</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mf-label">Importe (€)</label>
            <input className="mf-input" type="number" inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" />
          </div>
          <div>
            <label className="mf-label">Estado de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {(['pending', 'paid', 'no_pay_on_delivery'] as PaymentStatus[]).map(s => (
                <button key={s} onClick={() => setForm({ ...form, payment_status: s })}
                  className={`mf-btn text-xs py-2.5 rounded-full ${form.payment_status === s ? 'bg-green-600 text-white shadow-md shadow-green-600/20' : 'bg-white/70 text-stone-600 border border-white/60'}`}>
                  {paymentStatusConfig[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mf-label">Método de pago</label>
            <select className="mf-input" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value as PaymentMethod })}>
              {(['cash', 'card', 'transfer', 'invoice', 'other'] as PaymentMethod[]).map(m => (
                <option key={m} value={m}>{paymentMethodLabels[m]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section: Prioridad */}
      <div className="glass-card p-4 mb-4 animate-slide-up stagger-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <Truck size={16} className="text-red-600" />
          </div>
          <p className="mf-section-title">Prioridad</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setForm({ ...form, priority: 'normal' })}
            className={`mf-btn text-sm py-3 rounded-full ${form.priority === 'normal' ? 'bg-stone-700 text-white' : 'bg-white/70 text-stone-600 border border-white/60'}`}>
            Normal
          </button>
          <button onClick={() => setForm({ ...form, priority: 'urgent' })}
            className={`mf-btn text-sm py-3 rounded-full ${form.priority === 'urgent' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-white/70 text-stone-600 border border-white/60'}`}>
            🚨 Urgente
          </button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="mf-btn-primary w-full animate-slide-up">
        <Save size={20} />
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
}
