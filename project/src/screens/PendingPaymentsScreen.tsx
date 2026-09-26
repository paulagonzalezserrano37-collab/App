import { usePendingPayments } from '@/hooks/useData';
import type { Screen } from '@/App';
import { Wallet, Check, ArrowLeft, Store } from 'lucide-react';
import { formatAmount, paymentStatusConfig, paymentMethodLabels } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';
import { useCallback } from 'react';

export function PendingPaymentsScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const { stops, loading, refetch } = usePendingPayments();

  const totalPending = stops.reduce((sum, s) => sum + (s.amount || 0), 0);

  const markPaid = useCallback(async (id: string) => {
    const { error } = await supabase.from('stops').update({ payment_status: 'paid' }).eq('id', id);
    if (error) { alert('Error al marcar'); return; }
    refetch();
  }, [refetch]);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-5 animate-fade-in">
        <button onClick={() => navigate({ name: 'more' })} className="w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition shrink-0">
          <ArrowLeft size={20} className="text-stone-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-stone-900">💰 Cobros pendientes</h1>
        </div>
      </div>

      {/* Total card */}
      <div className="glass-card p-5 mb-4 border-amber-200/50 bg-amber-50/50 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">Total pendiente</p>
            <p className="text-3xl font-extrabold text-amber-900">{formatAmount(totalPending)}</p>
            <p className="text-sm text-amber-700 mt-1">{stops.length} cliente{stops.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Wallet size={32} className="text-amber-600" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="glass-card h-20 animate-pulse" style={{ background: 'rgba(255,255,255,0.4)' }} />)}
        </div>
      ) : stops.length === 0 ? (
        <div className="glass-card p-8 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Check size={32} className="text-green-600" />
          </div>
          <p className="text-stone-500 font-semibold">No hay cobros pendientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stops.map((stop, i) => {
            const ps = paymentStatusConfig[stop.payment_status];
            return (
              <div key={stop.id} className={`glass-card p-4 animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <Store size={20} className="text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => navigate({ name: 'stop', stopId: stop.id })}>
                    <p className="font-bold text-stone-900 truncate">{stop.name}</p>
                    {stop.client_name && <p className="text-sm text-stone-500 truncate">{stop.client_name}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`mf-badge ${ps.badge}`}>{ps.label}</span>
                      {stop.payment_method && <span className="text-xs text-stone-500">{paymentMethodLabels[stop.payment_method]}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-extrabold text-stone-900">{formatAmount(stop.amount)}</p>
                    <button onClick={() => markPaid(stop.id)} className="mt-1 flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md shadow-green-600/20 active:scale-90 transition">
                      <Check size={14} /> Cobrado
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
