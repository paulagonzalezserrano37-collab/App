/*
# Add location confirmation and route optimization fields

1. Modified Tables
- `stops`: Add `google_place_id` (text, nullable) to store Google Places identifier when available.
  Add `location_confirmed` (boolean, default false) to distinguish between confirmed locations and auto-assigned/generic ones.
  Add `location_source` (text, default 'manual') to track how the location was set: 'manual', 'gps', 'search', 'map'.
  Add `optimized_position` (integer, nullable) to store the optimized route order without overwriting the habitual `position`.
  Add `optimized_town_position` (integer, nullable) to store optimized town-level ordering.
- `routes`: Add `is_optimized` (boolean, default false) to mark whether the route is currently using an optimized order.
  Add `optimized_at` (timestamptz, nullable) to record when optimization was last applied.

2. Security
- No changes to RLS policies. Existing anon/authenticated policies cover the new columns automatically.

3. Important Notes
- `location_confirmed = false` means the location has NOT been verified by the user. The app must show a warning and NOT pretend the position is exact.
- `location_saved` remains as-is for backwards compatibility. `location_confirmed` is the new source of truth for "do we trust this location?"
- `optimized_position` is nullable. When null, the app uses the habitual `position`. When set, the app can display the proposed optimized order.
- The user must explicitly choose to use the optimized route. The app never changes the habitual order automatically.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stops' AND column_name = 'google_place_id') THEN
    ALTER TABLE stops ADD COLUMN google_place_id text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stops' AND column_name = 'location_confirmed') THEN
    ALTER TABLE stops ADD COLUMN location_confirmed boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stops' AND column_name = 'location_source') THEN
    ALTER TABLE stops ADD COLUMN location_source text NOT NULL DEFAULT 'manual';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stops' AND column_name = 'optimized_position') THEN
    ALTER TABLE stops ADD COLUMN optimized_position integer;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stops' AND column_name = 'optimized_town_position') THEN
    ALTER TABLE stops ADD COLUMN optimized_town_position integer;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'is_optimized') THEN
    ALTER TABLE routes ADD COLUMN is_optimized boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'optimized_at') THEN
    ALTER TABLE routes ADD COLUMN optimized_at timestamptz;
  END IF;
END $$;

-- Mark existing stops that have coordinates as location_confirmed = true
-- (they were set deliberately, either by seed data or by user action)
UPDATE stops SET location_confirmed = true WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
