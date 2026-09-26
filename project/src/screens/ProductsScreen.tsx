import { useState, useCallback } from 'react';
import { useProducts } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, X, Package, ArrowLeft } from 'lucide-react';
import type { Screen } from '@/App';

export function ProductsScreen({ navigate }: { navigate?: (s: Screen) => void }) {
  const { products, loading, refetch } = useProducts();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; unit: string } | null>(null);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { console.error('Error deleting product:', error); alert('Error al eliminar'); return; }
    refetch();
  }, [refetch]);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-5 animate-fade-in">
        {navigate && (
          <button onClick={() => navigate({ name: 'more' })} className="w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition shrink-0">
            <ArrowLeft size={20} className="text-stone-700" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-stone-900">📦 Productos</h1>
          <p className="text-sm text-stone-500">Catálogo de productos</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center shadow-md shadow-green-600/20 active:scale-90 transition">
          <Plus size={20} className="text-white" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="glass-card h-16 animate-pulse" style={{ background: 'rgba(255,255,255,0.4)' }} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card p-8 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
            <Package size={32} className="text-stone-300" />
          </div>
          <p className="text-stone-500 font-semibold mb-1">No hay productos</p>
          <p className="text-sm text-stone-400">Añade productos para asignarlos a los destinos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p, i) => (
            <div key={p.id} className={`glass-card p-3 flex items-center gap-3 animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <Package size={20} className="text-green-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800 truncate">{p.name}</p>
                {p.unit && <p className="text-xs text-stone-500">Unidad: {p.unit}</p>}
              </div>
              <button onClick={() => { setEditing({ id: p.id, name: p.name, unit: p.unit || '' }); setShowModal(true); }}
                className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center active:scale-90 transition">
                <Pencil size={16} className="text-stone-500" />
              </button>
              <button onClick={() => handleDelete(p.id)} className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center active:scale-90 transition">
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProductModal editing={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); refetch(); }} />
      )}
    </div>
  );
}

function ProductModal({ editing, onClose, onSaved }: {
  editing: { id: string; name: string; unit: string } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name || '');
  const [unit, setUnit] = useState(editing?.unit || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { alert('Introduce un nombre'); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('products').update({ name: name.trim(), unit: unit.trim() || null }).eq('id', editing.id);
      if (error) { alert('Error al guardar'); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('products').insert({ name: name.trim(), unit: unit.trim() || null });
      if (error) { alert('Error al guardar'); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="glass-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"><X size={18} className="text-stone-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mf-label">Nombre</label>
            <input className="mf-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Naranjas" />
          </div>
          <div>
            <label className="mf-label">Unidad</label>
            <input className="mf-input" value={unit} onChange={e => setUnit(e.target.value)} placeholder="kg, caja, unidad..." />
          </div>
          <button onClick={handleSave} disabled={saving} className="mf-btn-primary w-full">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
