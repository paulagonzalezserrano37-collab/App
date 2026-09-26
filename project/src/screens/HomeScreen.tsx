import { useRoutes, usePendingPayments, useAllStops } from '@/hooks/useData';
import type { Screen } from '@/App';
import { Truck, MapPin, Plus, Package, Map, Wallet, AlertCircle, ChevronRight, type LucideIcon } from 'lucide-react';
import { formatAmount } from '@/lib/helpers';
import { IconCircle } from '@/components/ui';

export function HomeScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const { routes, loading } = useRoutes();
  const { stops: pendingStops } = usePendingPayments();
  const { stops: allStops } = useAllStops();

  const totalPending = pendingStops.reduce((sum, s) => sum + (s.amount || 0), 0);
  const urgentCount = allStops.filter(s => s.priority === 'urgent').length;
  const deliveredCount = allStops.filter(s => s.delivery_status === 'delivered').length;

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            <span className="mr-1">🍊</span>MUNDIFRUT
          </h1>
          <p className="text-sm text-stone-500 font-medium">Tu asistente de reparto</p>
        </div>
        <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-stone-600">En ruta</span>
        </div>
      </div>

      {/* Greeting */}
      <div className="mb-5 animate-slide-up">
        <h2 className="text-xl font-bold text-stone-800">Buenos días 👋</h2>
        <p className="text-stone-500">¿Qué ruta hacemos hoy?</p>
      </div>

      {/* Route cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="glass-card h-24 animate-pulse" style={{ background: 'rgba(255,255,255,0.4)' }} />)}
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((route, i) => (
            <button
              key={route.id}
              onClick={() => navigate({ name: 'route', routeId: route.id })}
              className={`glass-card w-full p-4 flex items-center gap-4 active:scale-[0.98] transition text-left animate-slide-up stagger-${i + 1}`}
            >
              <IconCircle icon={Truck} size="lg" color="green" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-stone-900 text-base">{route.name}</p>
                {route.description && <p className="text-sm text-stone-500 truncate">{route.description}</p>}
              </div>
              <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                <ChevronRight size={18} className="text-stone-400" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Day summary */}
      <div className="glass-card p-4 mb-4 mt-5 animate-slide-up">
        <p className="mf-section-title mb-3">Resumen del día</p>
        <div className="grid grid-cols-4 gap-2">
          <StatItem icon={MapPin} value={allStops.length} label="Paradas" color="green" />
          <StatItem icon={Package} value={deliveredCount} label="Entreg." color="orange" />
          <StatItem icon={Wallet} value={pendingStops.length} label="Cobros" color="amber" />
          <StatItem icon={AlertCircle} value={urgentCount} label="Urgent." color="red" />
        </div>
      </div>

      {/* Quick actions */}
      <p className="mf-section-title mb-3 mt-5">Acciones rápidas</p>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <QuickAction icon={Map} label="Mapa" color="green" onClick={() => navigate({ name: 'map' })} />
        <QuickAction icon={Truck} label="Carga" color="orange" onClick={() => navigate({ name: 'truck' })} />
        <QuickAction icon={Plus} label="Añadir" color="blue" onClick={() => navigate({ name: 'addStop' })} />
        <QuickAction icon={Wallet} label="Cobros" color="amber" onClick={() => navigate({ name: 'payments' })} />
      </div>

      {/* Pending payments summary */}
      {totalPending > 0 && (
        <div className="glass-card p-4 border-amber-200/60 bg-amber-50/60 mb-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-800">Total pendiente de cobro</p>
              <p className="text-2xl font-extrabold text-amber-900">{formatAmount(totalPending)}</p>
            </div>
            <IconCircle icon={Wallet} size="md" color="amber" />
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ icon: Icon, value, label, color }: { icon: LucideIcon; value: number; label: string; color: 'green' | 'orange' | 'amber' | 'red' }) {
  const colors = {
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center`}>
        <Icon size={18} />
      </div>
      <span className="text-lg font-extrabold text-stone-900">{value}</span>
      <span className="text-[10px] font-semibold text-stone-400">{label}</span>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }: { icon: LucideIcon; label: string; color: 'green' | 'orange' | 'blue' | 'amber'; onClick: () => void }) {
  const colors = {
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 active:scale-95 transition">
      <div className={`w-14 h-14 rounded-2xl ${colors[color]} flex items-center justify-center shadow-sm`}>
        <Icon size={24} />
      </div>
      <span className="text-xs font-semibold text-stone-600">{label}</span>
    </button>
  );
}
