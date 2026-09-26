/*
# MUNDIFRUT - Esquema de base de datos para gestión de reparto

## Descripción
Crea todas las tablas necesarias para la aplicación MUNDIFRUT, que ayuda a gestionar
rutas de reparto de fruta con un camión. Es una aplicación single-tenant (sin autenticación),
por lo que todas las políticas permiten acceso a anon y authenticated.

## Tablas nuevas

1. **routes** - Rutas de reparto (La Vera, Tajo, etc.)
   - id (uuid, PK)
   - name (text) - Nombre de la ruta
   - description (text) - Descripción opcional
   - created_at (timestamptz)

2. **towns** - Pueblos/localidades dentro de una ruta
   - id (uuid, PK)
   - route_id (uuid, FK → routes)
   - name (text) - Nombre del pueblo
   - position (int) - Orden dentro de la ruta
   - notes (text) - Notas del pueblo (ej. "Miércoles mercadillo")

3. **stops** - Destinos/paradas (establecimientos a entregar)
   - id (uuid, PK)
   - town_id (uuid, FK → towns)
   - name (text) - Nombre del establecimiento
   - client_name (text) - Nombre del cliente/contacto
   - alias (text) - Alias del cliente
   - phone (text) - Teléfono
   - address (text) - Dirección
   - notes (text) - Notas permanentes del cliente
   - access_notes (text) - Notas de acceso para el camión
   - priority (text) - 'normal' | 'urgent'
   - delivery_status (text) - 'pending' | 'loaded' | 'delivered'
   - payment_status (text) - 'pending' | 'paid' | 'no_pay_on_delivery'
   - payment_method (text) - 'cash' | 'card' | 'transfer' | 'invoice' | 'other'
   - amount (numeric) - Importe
   - latitude (float8) - Latitud GPS
   - longitude (float8) - Longitud GPS
   - location_saved (bool) - Si el usuario guardó manualmente la ubicación
   - position (int) - Orden dentro del pueblo
   - created_at (timestamptz)

4. **products** - Catálogo de productos
   - id (uuid, PK)
   - name (text) - Nombre del producto
   - unit (text) - Unidad (kg, caja, unidad, etc.)
   - created_at (timestamptz)

5. **truck_zones** - Zonas del camión (temporales)
   - id (uuid, PK)
   - name (text) - Nombre (Zona A, Zona B, etc.)
   - description (text) - Descripción
   - is_temporary (bool) - Indica que es temporal

6. **stop_products** - Productos asignados a cada parada
   - id (uuid, PK)
   - stop_id (uuid, FK → stops)
   - product_id (uuid, FK → products, nullable)
   - product_name (text) - Nombre del producto (por si no está en catálogo)
   - quantity (numeric) - Cantidad
   - unit (text) - Unidad
   - weight (numeric) - Peso
   - truck_zone_id (uuid, FK → truck_zones, nullable) - Zona del camión
   - status (text) - 'pending' | 'loaded' | 'delivered'
   - created_at (timestamptz)

## Seguridad
- RLS habilitado en todas las tablas.
- Políticas de CRUD para anon + authenticated (single-tenant, sin autenticación).
*/

-- Routes
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_routes" ON routes;
CREATE POLICY "anon_select_routes" ON routes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_routes" ON routes;
CREATE POLICY "anon_insert_routes" ON routes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_routes" ON routes;
CREATE POLICY "anon_update_routes" ON routes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_routes" ON routes;
CREATE POLICY "anon_delete_routes" ON routes FOR DELETE TO anon, authenticated USING (true);

-- Towns
CREATE TABLE IF NOT EXISTS towns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE towns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_towns" ON towns;
CREATE POLICY "anon_select_towns" ON towns FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_towns" ON towns;
CREATE POLICY "anon_insert_towns" ON towns FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_towns" ON towns;
CREATE POLICY "anon_update_towns" ON towns FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_towns" ON towns;
CREATE POLICY "anon_delete_towns" ON towns FOR DELETE TO anon, authenticated USING (true);

-- Stops
CREATE TABLE IF NOT EXISTS stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  town_id uuid NOT NULL REFERENCES towns(id) ON DELETE CASCADE,
  name text NOT NULL,
  client_name text,
  alias text,
  phone text,
  address text,
  notes text,
  access_notes text,
  priority text NOT NULL DEFAULT 'normal',
  delivery_status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text,
  amount numeric DEFAULT 0,
  latitude float8,
  longitude float8,
  location_saved boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_stops" ON stops;
CREATE POLICY "anon_select_stops" ON stops FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_stops" ON stops;
CREATE POLICY "anon_insert_stops" ON stops FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_stops" ON stops;
CREATE POLICY "anon_update_stops" ON stops FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_stops" ON stops;
CREATE POLICY "anon_delete_stops" ON stops FOR DELETE TO anon, authenticated USING (true);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE TO anon, authenticated USING (true);

-- Truck zones
CREATE TABLE IF NOT EXISTS truck_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_temporary boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE truck_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_truck_zones" ON truck_zones;
CREATE POLICY "anon_select_truck_zones" ON truck_zones FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_truck_zones" ON truck_zones;
CREATE POLICY "anon_insert_truck_zones" ON truck_zones FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_truck_zones" ON truck_zones;
CREATE POLICY "anon_update_truck_zones" ON truck_zones FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_truck_zones" ON truck_zones;
CREATE POLICY "anon_delete_truck_zones" ON truck_zones FOR DELETE TO anon, authenticated USING (true);

-- Stop products
CREATE TABLE IF NOT EXISTS stop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id uuid NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric DEFAULT 0,
  unit text,
  weight numeric,
  truck_zone_id uuid REFERENCES truck_zones(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE stop_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_stop_products" ON stop_products;
CREATE POLICY "anon_select_stop_products" ON stop_products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_stop_products" ON stop_products;
CREATE POLICY "anon_insert_stop_products" ON stop_products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_stop_products" ON stop_products;
CREATE POLICY "anon_update_stop_products" ON stop_products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_stop_products" ON stop_products;
CREATE POLICY "anon_delete_stop_products" ON stop_products FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_towns_route_id ON towns(route_id);
CREATE INDEX IF NOT EXISTS idx_stops_town_id ON stops(town_id);
CREATE INDEX IF NOT EXISTS idx_stop_products_stop_id ON stop_products(stop_id);
CREATE INDEX IF NOT EXISTS idx_stop_products_product_id ON stop_products(product_id);
