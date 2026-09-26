/*
# MUNDIFRUT - Datos iniciales (seed)

## Descripción
Inserta las rutas, pueblos y destinos iniciales para MUNDIFRUT.
No se inventan direcciones, teléfonos ni coordenadas - esos campos quedan vacíos
para que el usuario los rellene desde la aplicación.

## Datos
1. Ruta 1 - La Vera (con 4 pueblos: Robledillo, Losar, Jarandilla, Aldeanueva)
2. Ruta 2 - Tajo (con 7 pueblos: Casatejada entrada, Majadas, Casatejada, Saucedilla, Almaraz, Casas de Miravete, Jaraicejo)
3. Zonas temporales del camión: Zona A, B, C, D

## Notas importantes
- Las coordenadas GPS se dejan NULL para que el usuario las guarde desde la app
- Los teléfonos se dejan NULL
- Las direcciones se dejan NULL excepto cuando el spec indica un nombre que sirve como referencia
- El orden de pueblos y paradas respeta el orden del spec
*/

-- RUTA 1: LA VERA
INSERT INTO routes (id, name, description) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Ruta 1 - La Vera', 'Ruta de reparto por La Vera')
ON CONFLICT (id) DO NOTHING;

-- Pueblos La Vera
INSERT INTO towns (id, route_id, name, position, notes) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Robledillo', 1, 'Miércoles mercadillo'),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Losar de la Vera', 2, NULL),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Jarandilla de la Vera', 3, NULL),
  ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'Aldeanueva de la Vera', 4, NULL)
ON CONFLICT (id) DO NOTHING;

-- Robledillo: sin destinos específicos (solo mercadillo)
-- Losar de la Vera
INSERT INTO stops (id, town_id, name, client_name, notes, position) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', 'Ayuntamiento / Residencia de Losar', NULL, 'Pendiente de confirmar nombre exacto y ubicación', 1)
ON CONFLICT (id) DO NOTHING;

-- Jarandilla de la Vera
INSERT INTO stops (id, town_id, name, position) VALUES
  ('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000003', 'Coviran', 1),
  ('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'Carrefour', 2),
  ('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000003', 'Colegio cerca del Parador', 3),
  ('c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000003', 'El Parador', 4)
ON CONFLICT (id) DO NOTHING;

-- Aldeanueva de la Vera
INSERT INTO stops (id, town_id, name, client_name, notes, position) VALUES
  ('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000004', 'Colegio Aldeanueva', NULL, 'Entrada por arriba', 1),
  ('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000004', 'Sediaco', 'Elena Bermejo', NULL, 2),
  ('c0000001-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000004', 'Carnicería Charcutería La Vera', 'Sole', NULL, 3),
  ('c0000001-0000-0000-0000-000000000009', 'b0000001-0000-0000-0000-000000000004', 'Residencia Aldeanueva', NULL, 'Entrada por detrás', 4)
ON CONFLICT (id) DO NOTHING;

-- RUTA 2: TAJO
INSERT INTO routes (id, name, description) VALUES
  ('a0000001-0000-0000-0000-000000000002', 'Ruta 2 - Tajo', 'Ruta de reparto por Tajo')
ON CONFLICT (id) DO NOTHING;

-- Pueblos Tajo
INSERT INTO towns (id, route_id, name, position) VALUES
  ('b0000002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'Entrada Autovía → Casatejada', 1),
  ('b0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'Majadas', 2),
  ('b0000002-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'Casatejada', 3),
  ('b0000002-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'Saucedilla', 4),
  ('b0000002-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'Almaraz', 5),
  ('b0000002-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002', 'Casas de Miravete', 6),
  ('b0000002-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000002', 'Jaraicejo', 7)
ON CONFLICT (id) DO NOTHING;

-- Entrada Autovía → Casatejada
INSERT INTO stops (id, town_id, name, position) VALUES
  ('c0000002-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000001', 'Restaurante Hostal El Nogal', 1)
ON CONFLICT (id) DO NOTHING;

-- Majadas
INSERT INTO stops (id, town_id, name, client_name, alias, position) VALUES
  ('c0000002-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000002', 'Mercado Maricarmen', 'Maricarmen', 'Mari Majadas', 1),
  ('c0000002-0000-0000-0000-000000000003', 'b0000002-0000-0000-0000-000000000002', 'Residencia de Majadas', NULL, NULL, 2)
ON CONFLICT (id) DO NOTHING;

-- Casatejada
INSERT INTO stops (id, town_id, name, client_name, position) VALUES
  ('c0000002-0000-0000-0000-000000000004', 'b0000002-0000-0000-0000-000000000003', 'La Salmorosa', 'Sara / Gregorio', 1),
  ('c0000002-0000-0000-0000-000000000005', 'b0000002-0000-0000-0000-000000000003', 'Hermanos Gracia', NULL, 2),
  ('c0000002-0000-0000-0000-000000000006', 'b0000002-0000-0000-0000-000000000003', 'Residencia', NULL, 3),
  ('c0000002-0000-0000-0000-000000000007', 'b0000002-0000-0000-0000-000000000003', 'Mateos', 'Feliciano', 4),
  ('c0000002-0000-0000-0000-000000000008', 'b0000002-0000-0000-0000-000000000003', 'Café Bar Machaca', NULL, 5)
ON CONFLICT (id) DO NOTHING;

-- Nota para Mateos
UPDATE stops SET notes = 'Tienda de alimentación, pescados y carnes' WHERE id = 'c0000002-0000-0000-0000-000000000007';

-- Saucedilla
INSERT INTO stops (id, town_id, name, position) VALUES
  ('c0000002-0000-0000-0000-000000000009', 'b0000002-0000-0000-0000-000000000004', 'Colegio Saucedilla', 1),
  ('c0000002-0000-0000-0000-000000000010', 'b0000002-0000-0000-0000-000000000004', 'CRA Río Tajo', 2)
ON CONFLICT (id) DO NOTHING;

-- Almaraz
INSERT INTO stops (id, town_id, name, position) VALUES
  ('c0000002-0000-0000-0000-000000000011', 'b0000002-0000-0000-0000-000000000005', 'Restaurante Nuevo Hogar', 1),
  ('c0000002-0000-0000-0000-000000000012', 'b0000002-0000-0000-0000-000000000005', 'Supermercado Zaira y Más', 2),
  ('c0000002-0000-0000-0000-000000000013', 'b0000002-0000-0000-0000-000000000005', 'Lotería Almaraz', 3),
  ('c0000002-0000-0000-0000-000000000014', 'b0000002-0000-0000-0000-000000000005', 'Residencia Almaraz', 4),
  ('c0000002-0000-0000-0000-000000000015', 'b0000002-0000-0000-0000-000000000005', 'Colegio Almaraz', 5),
  ('c0000002-0000-0000-0000-000000000016', 'b0000002-0000-0000-0000-000000000005', 'Km 200 autovía 5', 6)
ON CONFLICT (id) DO NOTHING;

-- Notas para Almaraz
UPDATE stops SET client_name = 'Zaida' WHERE id = 'c0000002-0000-0000-0000-000000000012';
UPDATE stops SET notes = 'Nombre en factura: Arcaz Suerte. Nombre utilizado en la nota: Lotería Almaraz' WHERE id = 'c0000002-0000-0000-0000-000000000013';
UPDATE stops SET name = 'El Portugal', notes = 'NO BUSCAR RUTA POR AUTOVÍA. UTILIZAR CARRETERA GENERAL DESDE ALMARAZ.' WHERE id = 'c0000002-0000-0000-0000-000000000016';

-- Casas de Miravete
INSERT INTO stops (id, town_id, name, client_name, position) VALUES
  ('c0000002-0000-0000-0000-000000000017', 'b0000002-0000-0000-0000-000000000006', 'Autoservicio de Alimentación Las Casas del Puesto', 'Mari Miravete', 1)
ON CONFLICT (id) DO NOTHING;

-- Jaraicejo
INSERT INTO stops (id, town_id, name, position) VALUES
  ('c0000002-0000-0000-0000-000000000018', 'b0000002-0000-0000-0000-000000000007', 'Residencia', 1)
ON CONFLICT (id) DO NOTHING;

-- ZONAS TEMPORALES DEL CAMIÓN
INSERT INTO truck_zones (id, name, description, is_temporary) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Zona A', 'Zona temporal - pendiente de definir', true),
  ('d0000001-0000-0000-0000-000000000002', 'Zona B', 'Zona temporal - pendiente de definir', true),
  ('d0000001-0000-0000-0000-000000000003', 'Zona C', 'Zona temporal - pendiente de definir', true),
  ('d0000001-0000-0000-0000-000000000004', 'Zona D', 'Zona temporal - pendiente de definir', true)
ON CONFLICT (id) DO NOTHING;
