import type { Screen } from '@/App';
import { Package, Wallet, Plus, ArrowLeft } from 'lucide-react';
import { IconCircle } from '@/components/ui';

export function MoreScreen({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      <h1 className="text-2xl font-extrabold text-stone-900 mb-6">Más</h1>

      <div className="space-y-3">
        <button
          onClick={() => navigate({ name: 'products' })}
          className="glass-card w-full p-4 flex items-center gap-4 active:scale-[0.98] transition text-left animate-slide-up"
        >
          <IconCircle icon={Package} size="md" color="green" />
          <div className="flex-1">
            <p className="font-bold text-stone-900">Productos</p>
            <p className="text-sm text-stone-500">Catálogo de productos</p>
          </div>
          <span className="text-stone-300 text-lg">›</span>
        </button>

        <button
          onClick={() => navigate({ name: 'payments' })}
          className="glass-card w-full p-4 flex items-center gap-4 active:scale-[0.98] transition text-left animate-slide-up stagger-1"
        >
          <IconCircle icon={Wallet} size="md" color="amber" />
          <div className="flex-1">
            <p className="font-bold text-stone-900">Cobros pendientes</p>
            <p className="text-sm text-stone-500">Ver importes pendientes</p>
          </div>
          <span className="text-stone-300 text-lg">›</span>
        </button>

        <button
          onClick={() => navigate({ name: 'addStop' })}
          className="glass-card w-full p-4 flex items-center gap-4 active:scale-[0.98] transition text-left animate-slide-up stagger-2"
        >
          <IconCircle icon={Plus} size="md" color="orange" />
          <div className="flex-1">
            <p className="font-bold text-stone-900">Añadir destino</p>
            <p className="text-sm text-stone-500">Crear nuevo destino</p>
          </div>
          <span className="text-stone-300 text-lg">›</span>
        </button>
      </div>
    </div>
  );
}
