
CREATE TABLE public.markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  district text NOT NULL,
  state text NOT NULL,
  latitude double precision,
  longitude double precision,
  distance_km numeric(6,1) NOT NULL DEFAULT 0,
  commission_fee_percent numeric(5,2) NOT NULL DEFAULT 6,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.markets TO anon, authenticated;
GRANT ALL ON public.markets TO service_role;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Markets are publicly readable" ON public.markets FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.commodities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_hi text,
  spoilage_rate_percent numeric(5,2) NOT NULL DEFAULT 5,
  unit text NOT NULL DEFAULT 'kg',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commodities TO anon, authenticated;
GRANT ALL ON public.commodities TO service_role;
ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Commodities are publicly readable" ON public.commodities FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.price_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  commodity_id uuid NOT NULL REFERENCES public.commodities(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  price_per_unit numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (market_id, commodity_id, date)
);
CREATE INDEX price_entries_lookup_idx ON public.price_entries (commodity_id, market_id, date DESC);
GRANT SELECT ON public.price_entries TO anon, authenticated;
GRANT ALL ON public.price_entries TO service_role;
ALTER TABLE public.price_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prices are publicly readable" ON public.price_entries FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  commodity_id uuid REFERENCES public.commodities(id) ON DELETE SET NULL,
  quantity_kg numeric(10,2),
  farmer_location text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.queries TO anon, authenticated;
GRANT SELECT ON public.queries TO authenticated;
GRANT ALL ON public.queries TO service_role;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log a search" ON public.queries FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users can read their own searches" ON public.queries FOR SELECT TO authenticated
  USING (user_id = auth.uid());

INSERT INTO public.commodities (name, name_hi, spoilage_rate_percent, unit) VALUES
  ('Tomato', 'टमाटर', 11.6, 'kg'),
  ('Onion', 'प्याज', 8.2, 'kg'),
  ('Potato', 'आलू', 7.1, 'kg'),
  ('Wheat', 'गेहूँ', 5.0, 'kg'),
  ('Banana', 'केला', 10.4, 'kg'),
  ('Green Chilli', 'हरी मिर्च', 9.8, 'kg');

INSERT INTO public.markets (name, district, state, latitude, longitude, distance_km, commission_fee_percent) VALUES
  ('Nashik APMC', 'Nashik', 'Maharashtra', 19.9975, 73.7898, 12, 6.0),
  ('Lasalgaon Mandi', 'Nashik', 'Maharashtra', 20.1436, 74.2394, 48, 4.0),
  ('Pimpalgaon Mandi', 'Nashik', 'Maharashtra', 20.1670, 73.9880, 27, 5.0),
  ('Vashi Market, Mumbai', 'Nashik', 'Maharashtra', 19.0771, 73.0000, 165, 8.0),
  ('Choithram Mandi', 'Indore', 'Madhya Pradesh', 22.6913, 75.8577, 9, 6.5),
  ('Dewas Mandi', 'Indore', 'Madhya Pradesh', 22.9676, 76.0534, 38, 4.5),
  ('Ujjain Krishi Upaj', 'Indore', 'Madhya Pradesh', 23.1793, 75.7849, 56, 5.0),
  ('Bhopal Karond Mandi', 'Indore', 'Madhya Pradesh', 23.2969, 77.3900, 190, 7.0),
  ('Ludhiana Grain Market', 'Ludhiana', 'Punjab', 30.9010, 75.8573, 8, 6.0),
  ('Khanna Mandi', 'Ludhiana', 'Punjab', 30.7050, 76.2220, 42, 4.0),
  ('Jagraon Mandi', 'Ludhiana', 'Punjab', 30.7880, 75.4730, 35, 5.0),
  ('Azadpur Mandi, Delhi', 'Ludhiana', 'Punjab', 28.7075, 77.1770, 310, 8.0),
  ('Guntur Mirchi Yard', 'Guntur', 'Andhra Pradesh', 16.3067, 80.4365, 7, 6.0),
  ('Tenali Mandi', 'Guntur', 'Andhra Pradesh', 16.2430, 80.6400, 30, 4.5),
  ('Vijayawada Market', 'Guntur', 'Andhra Pradesh', 16.5062, 80.6480, 40, 6.5),
  ('Hyderabad Bowenpally', 'Guntur', 'Andhra Pradesh', 17.4870, 78.4780, 265, 7.5),
  ('Pahariya Mandi', 'Varanasi', 'Uttar Pradesh', 25.3600, 83.0100, 10, 6.0),
  ('Chandauli Mandi', 'Varanasi', 'Uttar Pradesh', 25.2570, 83.2680, 32, 4.0),
  ('Jaunpur Mandi', 'Varanasi', 'Uttar Pradesh', 25.7460, 82.6840, 62, 5.0),
  ('Prayagraj Mundera', 'Varanasi', 'Uttar Pradesh', 25.4358, 81.8463, 125, 7.0);

-- Seed ~14 days of price history per market per commodity.
WITH base AS (
  SELECT id AS commodity_id, name,
    CASE name
      WHEN 'Tomato' THEN 22 WHEN 'Onion' THEN 18 WHEN 'Potato' THEN 15
      WHEN 'Wheat' THEN 24 WHEN 'Banana' THEN 28 ELSE 40 END::numeric AS base_price
  FROM public.commodities
), mkt AS (
  SELECT id AS market_id, name,
    CASE
      WHEN distance_km > 150 THEN 1.32
      WHEN distance_km > 40 THEN 1.10
      WHEN distance_km > 20 THEN 1.07
      ELSE 1.00 END::numeric AS price_factor,
    ((('x' || substr(md5(name), 1, 6))::bit(24)::int % 300) - 130)::numeric / 100 AS slope
  FROM public.markets
)
INSERT INTO public.price_entries (market_id, commodity_id, date, price_per_unit)
SELECT
  mkt.market_id,
  base.commodity_id,
  CURRENT_DATE - d,
  GREATEST(
    1,
    ROUND(
      base.base_price * mkt.price_factor
      - (mkt.slope / 100) * d * base.base_price * mkt.price_factor
      + ((('x' || substr(md5(mkt.name || base.name || d::text), 1, 6))::bit(24)::int % 100) - 50)::numeric / 100
        * base.base_price * 0.03,
      2)
  )
FROM mkt CROSS JOIN base CROSS JOIN generate_series(0, 13) AS d;
