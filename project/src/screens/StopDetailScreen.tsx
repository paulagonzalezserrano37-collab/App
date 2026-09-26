import { useState, useCallback } from 'react';
import { useStop, useStopProducts, useProducts, useTruckZones } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import type { Screen } from '@/App';
import type { DeliveryStatus, PaymentStatus, PaymentMethod } from '@/types/database';
import { ArrowLeft, MapPin, Navigation, Pencil, AlertCircle, Check, Phone, Package, Plus, Trash2, X, Store, Search, type LucideIcon } from 'lucide-react';
import { deliveryStatusConfig, paymentStatusConfig, paymentMethodLabels, formatAmount, formatCoord } from '@/lib/helpers';

export function StopDetailScreen({ stopId, navigate }: { stopId: string; navigate: (s: Screen) => void }) {
  const { stop, loading, refetch } = useStop(stopId);
  const { products: stopProducts, refetch: refetchProducts } = useStopProducts(stopId);
  const { products: catalog } = useProducts();
  const { zones } = useTruckZones();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const updateStop = useCallback(async (updates: Record<string, unknown>) => {
    const { error } = await supabase.from('stops').update(updates).eq('id', stopId);
    if (error) { console.error('Error updating stop:', error); alert('Error al guardar'); }
    else refetch();
  }, [stopId, refetch]);

  const toggleUrgent = useCallback(() => {
    if (!stop) return;
    updateStop({ priority: stop.priority === 'urgent' ? 'normal' : 'urgent' });
  }, [stop, updateStop]);

  const markDelivered = useCallback(() => {
    updateStop({ delivery_status: 'delivered' });
  }, [updateStop]);

  const cycleDeliveryStatus = useCallback(() => {
    if (!stop) return;
    const order: DeliveryStatus[] = ['pending', 'loaded', 'delivered'];
    const next = order[(order.indexOf(stop.delivery_status) + 1) % order.length];
    updateStop({ delivery_status: next });
  }, [stop, updateStop]);

  const navigateToMaps = useCallback(() => {
    if (stop?.latitude != null && stop?.longitude != null && stop.location_confirmed) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`, '_blank');
    } else if (stop?.address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`, '_blank');
    } else {
      const query = encodeURIComponent(`${stop?.name} ${stop?.client_name || ''}`);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
    }
  }, [stop]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="glass-card h-96 animate-pulse" style={{ background: 'rgba(255,255,255,0.4)' }} />
      </div>
    );
  }

  if (!stop) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6">
        <p className="text-stone-500">Destino no encontrado</p>
        <button onClick={() => navigate({ name: 'home' })} className="mf-btn-secondary mt-4">Volver</button>
      </div>
    );
  }

  const ds = deliveryStatusConfig[stop.delivery_status];
  const ps = paymentStatusConfig[stop.payment_status];
  const isUrgent = stop.priority === 'urgent';
  const hasConfirmedLocation = stop.location_confirmed && stop.latitude != null && stop.longitude != null;
  const hasUnconfirmedLocation = !stop.location_confirmed && stop.latitude != null && stop.longitude != null;
  const hasNoLocation = stop.latitude == null || stop.longitude == null;

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 animate-fade-in">
        <button onClick={() => navigate({ name: 'home' })} className="w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition shrink-0">
          <ArrowLeft size={20} className="text-stone-700" />
        </button>
      </div>

      {/* Establishment icon + name */}
      <div className="flex flex-col items-center text-center mb-5 animate-slide-up">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-3 shadow-md shadow-green-200/50">
          <Store size={36} className="text-green-700" />
        </div>
        <h1 className="text-xl font-extrabold text-stone-900 px-4">{stop.name}</h1>
        {stop.client_name && (
          <p className="text-sm text-stone-500 mt-0.5">
            {stop.client_name}{stop.alias ? ` (${stop.alias})` : ''}
          </p>
        )}
      </div>

      {/* Urgent banner */}
      {isUrgent && (
        <div className="mb-3 glass-card p-3 border-red-200/50 bg-red-50/50 flex items-center gap-2 animate-scale-in">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <span className="font-bold text-red-700 text-sm">DESTINO URGENTE</span>
        </div>
      )}

      {/* Status badges */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        <span className={`mf-badge ${ds.badge}`}>{ds.label}</span>
        <span className={`mf-badge ${ps.badge}`}>Pago: {ps.label}</span>
        {stop.payment_method && <span className="mf-badge bg-blue-100 text-blue-700">{paymentMethodLabels[stop.payment_method]}</span>}
      </div>

      {/* Location status card */}
      <div className={`glass-card p-4 mb-3 animate-slide-up ${hasNoLocation ? 'border-amber-200/50 bg-amber-50/40' : ''} ${hasUnconfirmedLocation ? 'border-orange-200/50 bg-orange-50/40' : ''}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasConfirmedLocation ? 'bg-green-100' : hasUnconfirmedLocation ? 'bg-orange-100' : 'bg-amber-100'}`}>
            <MapPin size={20} className={hasConfirmedLocation ? 'text-green-700' : hasUnconfirmedLocation ? 'text-orange-600' : 'text-amber-600'} />
          </div>
          <div className="flex-1 min-w-0">
            {hasConfirmedLocation ? (
              <>
                <p className="font-bold text-green-700 text-sm">Ubicación confirmada</p>
                <p className="text-xs text-stone-500 mt-0.5">{formatCoord(stop.latitude, stop.longitude)}</p>
                {stop.address && <p className="text-xs text-stone-400 mt-0.5 truncate">{stop.address}</p>}
              </>
            ) : hasUnconfirmedLocation ? (
              <>
                <p className="font-bold text-orange-700 text-sm">Ubicación sin confirmar</p>
                <p className="text-xs text-stone-500 mt-1">
                  Las coordenadas existen pero no han sido verificadas. Podrían no ser exactas.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-amber-700 text-sm">Sin ubicación</p>
                <p className="text-xs text-stone-500 mt-1">
                  No hay coordenadas guardadas. Busca la ubicación para navegar con precisión.
                </p>
              </>
            )}
          </div>
        </div>
        <button onClick={() => navigate({ name: 'location', stopId: stop.id })}
          className="mf-btn-secondary w-full mt-3 text-sm">
          <Search size={16} />
          {hasConfirmedLocation ? 'Cambiar ubicación' : 'Buscar ubicación'}
        </button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <InfoCard icon={Phone} label="Teléfono" value={stop.phone} action={stop.phone ? () => window.open(`tel:${stop.phone}`) : undefined} />
        <InfoCard icon={MapPin} label="Dirección" value={stop.address} />
      </div>

      {/* Notes */}
      {stop.notes && (
        <div className="glass-card p-4 mb-3 border-orange-200/40 bg-orange-50/40 animate-slide-up">
          <p className="text-xs text-orange-600 font-bold mb-1 flex items-center gap-1">
            <AlertCircle size={12} /> NOTAS
          </p>
          <p className="text-sm text-stone-800">{stop.notes}</p>
        </div>
      )}
      {stop.access_notes && (
        <div className="glass-card p-4 mb-3 border-blue-200/40 bg-blue-50/40 animate-slide-up">
          <p className="text-xs text-blue-600 font-bold mb-1 flex items-center gap-1">
            <MapPin size={12} /> ACCESO
          </p>
          <p className="text-sm text-stone-800">{stop.access_notes}</p>
        </div>
      )}

      {/* Payment card */}
      <div className="glass-card p-4 mb-3 animate-slide-up">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-stone-800">Pago</span>
          <button onClick={() => setShowPaymentModal(true)} className="text-sm font-semibold text-green-700">Cambiar</button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-stone-900">{formatAmount(stop.amount)}</p>
            <p className="text-sm text-stone-500">{ps.label}{stop.payment_method ? ` · ${paymentMethodLabels[stop.payment_method]}` : ''}</p>
          </div>
        </div>
      </div>

      {/* Products card */}
      <div className="glass-card p-4 mb-3 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-stone-800">Productos</span>
          <button onClick={() => setShowAddProduct(true)} className="flex items-center gap-1 text-sm font-semibold text-green-700">
            <Plus size={16} /> Añadir
          </button>
        </div>
        {stopProducts.length === 0 ? (
          <p className="text-sm text-stone-400">Sin productos asignados</p>
        ) : (
          <div className="space-y-2">
            {stopProducts.map(sp => {
              const spDs = deliveryStatusConfig[sp.status];
              return (
                <div key={sp.id} className="flex items-center gap-3 bg-white/50 rounded-2xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <Package size={16} className="text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 text-sm">{sp.product_name}</p>
                    <p className="text-xs text-stone-500">
                      {sp.quantity > 0 ? `${sp.quantity}` : ''}{sp.unit ? ` ${sp.unit}` : ''}{sp.weight ? ` · ${sp.weight} kg` : ''}
                      {sp.truck_zone ? ` · ${sp.truck_zone.name}` : ''}
                    </p>
                  </div>
                  <span className={`mf-badge ${spDs.badge} text-[10px]`}>{spDs.label}</span>
                  <button onClick={async () => {
                    const order: DeliveryStatus[] = ['pending', 'loaded', 'delivered'];
                    const next = order[(order.indexOf(sp.status) + 1) % order.length];
                    await supabase.from('stop_products').update({ status: next }).eq('id', sp.id);
                    refetchProducts();
                  }} className="p-1.5 rounded-lg hover:bg-white/80 active:scale-90">
                    <span className="text-xs font-bold text-stone-600">→</span>
                  </button>
                  <button onClick={async () => {
                    await supabase.from('stop_products').delete().eq('id', sp.id);
                    refetchProducts();
                  }} className="p-1.5 rounded-lg hover:bg-red-50 active:scale-90">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button onClick={navigateToMaps} className="mf-btn-nav col-span-2 animate-slide-up">
          <Navigation size={20} />
          Navegar
        </button>
        <button onClick={() => navigate({ name: 'editStop', stopId: stop.id })} className="mf-btn-secondary animate-slide-up">
          <Pencil size={18} />
          Editar
        </button>
        <button onClick={toggleUrgent} className={isUrgent ? "mf-btn-urgent animate-slide-up" : "mf-btn-secondary animate-slide-up"}>
          <AlertCircle size={18} />
          {isUrgent ? 'Quitar urgente' : 'Urgente'}
        </button>
        <button onClick={cycleDeliveryStatus} className="mf-btn-secondary animate-slide-up">
          <span className="text-lg">{stop.delivery_status === 'pending' ? '⚪' : stop.delivery_status === 'loaded' ? '🟡' : '🟢'}</span>
          {ds.label}
        </button>
        <button onClick={markDelivered} className="mf-btn-primary animate-slide-up">
          <Check size={18} />
          Entregado
        </button>
      </div>

      {/* Modals */}
      {showAddProduct && (
        <AddProductModal stopId={stopId} catalog={catalog} zones={zones}
          onClose={() => setShowAddProduct(false)} onSaved={() => { setShowAddProduct(false); refetchProducts(); }} />
      )}
      {showPaymentModal && (
        <PaymentModal stop={stop}
          onUpdate={async (amount, status, method) => {
            await updateStop({ amount, payment_status: status, payment_method: method });
            setShowPaymentModal(false);
          }}
          onClose={() => setShowPaymentModal(false)} />
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, action }: { icon: LucideIcon; label: string; value: string | null; action?: () => void }) {
  if (!value) return null;
  return (
    <div className="glass-card p-3 animate-slide-up">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-stone-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-stone-400 font-bold uppercase">{label}</p>
          <p className="text-sm text-stone-800 truncate">{value}</p>
        </div>
        {action && <button onClick={action} className="text-green-700 text-xs font-semibold shrink-0">Abrir</button>}
      </div>
    </div>
  );
}

function AddProductModal({ stopId, catalog, zones, onClose, onSaved }: {
  stopId: string;
  catalog: { id: string; name: string; unit: string | null }[];
  zones: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [productName, setProductName] = useState('');
  const [productId, setProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [weight, setWeight] = useState('');
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!productName.trim() && !productId) { alert('Introduce un nombre de producto'); return; }
    setSaving(true);
    const { error } = await supabase.from('stop_products').insert({
      stop_id: stopId,
      product_id: productId,
      product_name: productName.trim() || catalog.find(p => p.id === productId)?.name || 'Producto',
      quantity: parseFloat(quantity) || 0,
      unit: unit || catalog.find(p => p.id === productId)?.unit || null,
      weight: parseFloat(weight) || null,
      truck_zone_id: zoneId,
      status: 'pending',
    });
    setSaving(false);
    if (error) { console.error('Error adding product:', error); alert('Error al guardar'); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="glass-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900">Añadir producto</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"><X size={18} className="text-stone-400" /></button>
        </div>
        <div className="space-y-3">
          {catalog.length > 0 && (
            <div>
              <label className="mf-label">Producto del catálogo</label>
              <select className="mf-input" value={productId || ''} onChange={e => { setProductId(e.target.value || null); setProductName(''); }}>
                <option value="">- Personalizado -</option>
                {catalog.map(p => <option key={p.id} value={p.id}>{p.name}{p.unit ? ` (${p.unit})` : ''}</option>)}
              </select>
            </div>
          )}
          {!productId && (
            <div>
              <label className="mf-label">Nombre del producto</label>
              <input className="mf-input" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Ej. Naranjas" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mf-label">Cantidad</label>
              <input className="mf-input" type="number" inputMode="decimal" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="mf-label">Unidad</label>
              <input className="mf-input" value={unit} onChange={e => setUnit(e.target.value)} placeholder="kg, caja..." />
            </div>
          </div>
          <div>
            <label className="mf-label">Peso (kg)</label>
            <input className="mf-input" type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0" />
          </div>
          {zones.length > 0 && (
            <div>
              <label className="mf-label">Zona del camión</label>
              <select className="mf-input" value={zoneId || ''} onChange={e => setZoneId(e.target.value || null)}>
                <option value="">Sin asignar</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
          )}
          <button onClick={handleSave} disabled={saving} className="mf-btn-primary w-full mt-2">
            {saving ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ stop, onUpdate, onClose }: {
  stop: { amount: number; payment_status: PaymentStatus; payment_method: PaymentMethod | null };
  onUpdate: (amount: number, status: PaymentStatus, method: PaymentMethod | null) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(stop.amount || ''));
  const [status, setStatus] = useState<PaymentStatus>(stop.payment_status);
  const [method, setMethod] = useState<PaymentMethod | null>(stop.payment_method);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="glass-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900">Editar pago</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"><X size={18} className="text-stone-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mf-label">Importe (€)</label>
            <input className="mf-input" type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="mf-label">Estado de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {(['pending', 'paid', 'no_pay_on_delivery'] as PaymentStatus[]).map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`mf-btn text-sm py-2.5 rounded-full ${status === s ? 'bg-green-600 text-white shadow-md shadow-green-600/20' : 'bg-white/70 text-stone-600 border border-white/60'}`}>
                  {paymentStatusConfig[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mf-label">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'card', 'transfer', 'invoice', 'other'] as PaymentMethod[]).map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`mf-btn text-sm py-2.5 rounded-full ${method === m ? 'bg-green-600 text-white shadow-md shadow-green-600/20' : 'bg-white/70 text-stone-600 border border-white/60'}`}>
                  {paymentMethodLabels[m]}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => onUpdate(parseFloat(amount) || 0, status, method)} className="mf-btn-primary w-full mt-2">Guardar</button>
        </div>
      </div>
    </div>
  );
}
