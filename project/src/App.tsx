import { useState, useCallback } from 'react';
import { Home, Map, Truck, Route, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { HomeScreen } from '@/screens/HomeScreen';
import { RouteDetailScreen } from '@/screens/RouteDetailScreen';
import { StopDetailScreen } from '@/screens/StopDetailScreen';
import { DeliveryModeScreen } from '@/screens/DeliveryModeScreen';
import { MapScreen } from '@/screens/MapScreen';
import { ProductsScreen } from '@/screens/ProductsScreen';
import { TruckLoadScreen } from '@/screens/TruckLoadScreen';
import { PendingPaymentsScreen } from '@/screens/PendingPaymentsScreen';
import { AddStopScreen } from '@/screens/AddStopScreen';
import { MoreScreen } from '@/screens/MoreScreen';
import { LocationSearchScreen } from '@/screens/LocationSearchScreen';

export type Screen =
  | { name: 'home' }
  | { name: 'route'; routeId: string }
  | { name: 'stop'; stopId: string }
  | { name: 'delivery'; routeId: string }
  | { name: 'map' }
  | { name: 'products' }
  | { name: 'truck' }
  | { name: 'payments' }
  | { name: 'addStop' }
  | { name: 'editStop'; stopId: string }
  | { name: 'location'; stopId: string }
  | { name: 'more' };

export type NavTab = 'home' | 'route' | 'map' | 'truck' | 'more';

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [navTab, setNavTab] = useState<NavTab>('home');

  const navigate = useCallback((s: Screen) => {
    setScreen(s);
    if (s.name === 'home') setNavTab('home');
    else if (s.name === 'map') setNavTab('map');
    else if (s.name === 'truck') setNavTab('truck');
    else if (s.name === 'more' || s.name === 'products' || s.name === 'payments') setNavTab('more');
  }, []);

  const goHome = useCallback(() => {
    setScreen({ name: 'home' });
    setNavTab('home');
  }, []);

  const showBottomNav = screen.name !== 'stop' && screen.name !== 'delivery' && screen.name !== 'location';

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Decorative background blobs */}
      <div className="mf-bg-blob mf-bg-blob-1" />
      <div className="mf-bg-blob mf-bg-blob-2" />
      <div className="mf-bg-blob mf-bg-blob-3" />

      <div className="relative z-10" style={{ paddingBottom: showBottomNav ? '96px' : 0 }}>
        {screen.name === 'home' && <HomeScreen navigate={navigate} />}
        {screen.name === 'route' && <RouteDetailScreen routeId={screen.routeId} navigate={navigate} goHome={goHome} />}
        {screen.name === 'stop' && <StopDetailScreen stopId={screen.stopId} navigate={navigate} />}
        {screen.name === 'delivery' && <DeliveryModeScreen routeId={screen.routeId} navigate={navigate} />}
        {screen.name === 'map' && <MapScreen navigate={navigate} />}
        {screen.name === 'products' && <ProductsScreen navigate={navigate} />}
        {screen.name === 'truck' && <TruckLoadScreen navigate={navigate} />}
        {screen.name === 'payments' && <PendingPaymentsScreen navigate={navigate} />}
        {screen.name === 'addStop' && <AddStopScreen navigate={navigate} />}
        {screen.name === 'editStop' && <AddStopScreen navigate={navigate} stopId={screen.stopId} />}
        {screen.name === 'location' && <LocationSearchScreen stopId={screen.stopId} navigate={navigate} />}
        {screen.name === 'more' && <MoreScreen navigate={navigate} />}
      </div>

      {showBottomNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
        >
          <div className="glass-nav rounded-full px-3 py-2 flex items-center gap-1 w-full max-w-sm justify-around">
            <NavButton icon={Home} label="Inicio" active={navTab === 'home'} onClick={() => navigate({ name: 'home' })} />
            <NavButton icon={Route} label="Ruta" active={navTab === 'route'} onClick={() => {
              if (screen.name === 'route') return;
              setNavTab('route');
              setScreen({ name: 'home' });
            }} />
            <NavButton icon={Map} label="Mapa" active={navTab === 'map'} onClick={() => navigate({ name: 'map' })} />
            <NavButton icon={Truck} label="Carga" active={navTab === 'truck'} onClick={() => navigate({ name: 'truck' })} />
            <NavButton icon={MoreHorizontal} label="Más" active={navTab === 'more'} onClick={() => navigate({ name: 'more' })} />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all active:scale-90 ${
        active ? 'bg-green-600 text-white shadow-md shadow-green-600/25' : 'text-stone-400'
      }`}
    >
      <Icon size={20} />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
