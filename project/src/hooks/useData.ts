import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Route, Town, Stop, Product, TruckZone, StopProduct, StopProductWithZone } from '@/types/database';

export function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('routes').select('*').order('name');
    if (error) { console.error('Error fetching routes:', error); }
    setRoutes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { routes, loading, refetch: fetch };
}

export function useTowns(routeId: string | null) {
  const [towns, setTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!routeId) { setTowns([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('towns')
      .select('*')
      .eq('route_id', routeId)
      .order('position');
    if (error) { console.error('Error fetching towns:', error); }
    setTowns(data || []);
    setLoading(false);
  }, [routeId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { towns, loading, refetch: fetch };
}

export function useStops(townId: string | null) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!townId) { setStops([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .eq('town_id', townId)
      .order('position');
    if (error) { console.error('Error fetching stops:', error); }
    setStops(data || []);
    setLoading(false);
  }, [townId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { stops, loading, refetch: fetch };
}

export function useAllStopsInRoute(routeId: string | null) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!routeId) { setStops([]); setLoading(false); return; }
    setLoading(true);
    const { data: townData } = await supabase.from('towns').select('id').eq('route_id', routeId);
    const townIds = (townData || []).map(t => t.id);
    if (townIds.length === 0) { setStops([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('stops')
      .select('*, town:towns(*)')
      .in('town_id', townIds)
      .order('position');
    if (error) { console.error('Error fetching route stops:', error); }
    setStops(data || []);
    setLoading(false);
  }, [routeId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { stops, loading, refetch: fetch };
}

export function useStop(stopId: string | null) {
  const [stop, setStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!stopId) { setStop(null); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .eq('id', stopId)
      .maybeSingle();
    if (error) { console.error('Error fetching stop:', error); }
    setStop(data || null);
    setLoading(false);
  }, [stopId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { stop, loading, refetch: fetch };
}

export function useStopProducts(stopId: string | null) {
  const [products, setProducts] = useState<StopProductWithZone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!stopId) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('stop_products')
      .select('*, truck_zone:truck_zones(*)')
      .eq('stop_id', stopId)
      .order('created_at');
    if (error) { console.error('Error fetching stop products:', error); }
    setProducts(data || []);
    setLoading(false);
  }, [stopId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { products, loading, refetch: fetch };
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) { console.error('Error fetching products:', error); }
    setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { products, loading, refetch: fetch };
}

export function useTruckZones() {
  const [zones, setZones] = useState<TruckZone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('truck_zones').select('*').order('name');
    if (error) { console.error('Error fetching truck zones:', error); }
    setZones(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { zones, loading, refetch: fetch };
}

export function useAllStops() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('stops').select('*').order('name');
    if (error) { console.error('Error fetching all stops:', error); }
    setStops(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { stops, loading, refetch: fetch };
}

export function usePendingPayments() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .eq('payment_status', 'pending')
      .gt('amount', 0)
      .order('name');
    if (error) { console.error('Error fetching pending payments:', error); }
    setStops(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { stops, loading, refetch: fetch };
}
