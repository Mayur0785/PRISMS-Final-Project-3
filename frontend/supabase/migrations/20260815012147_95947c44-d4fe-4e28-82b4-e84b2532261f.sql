
DELETE FROM public.queries;
DELETE FROM public.price_entries;
DELETE FROM public.markets;
DELETE FROM public.commodities;

INSERT INTO public.markets (name, district, state, latitude, longitude, distance_km, commission_fee_percent) VALUES
  ('Kalyan APMC','Thane','Maharashtra',19.2403,73.1305,15,8),
  ('Panvel Mandi','Panvel','Maharashtra',18.9894,73.1175,35,6.5),
  ('Vashi APMC, Navi Mumbai','Mumbai','Maharashtra',19.0760,73.0169,45,5),
  ('Nashik APMC','Nashik','Maharashtra',19.9975,73.7898,90,6),
  ('Pune Market Yard','Pune','Maharashtra',18.4783,73.8567,130,7);

INSERT INTO public.commodities (name, name_hi, spoilage_rate_percent, unit) VALUES
  ('Tomato','टमाटर',11.6,'kg'),
  ('Onion','प्याज',8,'kg'),
  ('Wheat','गेहूँ',5,'kg'),
  ('Guava','अमरूद',15,'kg'),
  ('Potato','आलू',6,'kg'),
  ('Cabbage','पत्ता गोभी',7,'kg'),
  ('Banana','केला',9,'kg'),
  ('Green Chilli','हरी मिर्च',12,'kg');

WITH base(mname, cname, price, drift) AS (VALUES
  ('Kalyan APMC','Tomato',22.0,0.03),('Panvel Mandi','Tomato',24.0,0.02),('Vashi APMC, Navi Mumbai','Tomato',28.0,0.16),('Nashik APMC','Tomato',18.0,-0.02),('Pune Market Yard','Tomato',21.0,0.01),
  ('Kalyan APMC','Onion',18.0,-0.14),('Panvel Mandi','Onion',19.0,-0.10),('Vashi APMC, Navi Mumbai','Onion',21.0,-0.06),('Nashik APMC','Onion',16.0,-0.12),('Pune Market Yard','Onion',18.0,-0.04),
  ('Kalyan APMC','Wheat',26.0,0.01),('Panvel Mandi','Wheat',26.5,0.01),('Vashi APMC, Navi Mumbai','Wheat',27.5,0.02),('Nashik APMC','Wheat',25.0,0.0),('Pune Market Yard','Wheat',26.0,0.01),
  ('Kalyan APMC','Guava',42.0,0.03),('Panvel Mandi','Guava',45.0,0.04),('Vashi APMC, Navi Mumbai','Guava',52.0,0.12),('Nashik APMC','Guava',38.0,0.01),('Pune Market Yard','Guava',44.0,0.02),
  ('Kalyan APMC','Potato',16.0,0.01),('Panvel Mandi','Potato',17.0,0.0),('Vashi APMC, Navi Mumbai','Potato',19.0,0.02),('Nashik APMC','Potato',15.0,-0.01),('Pune Market Yard','Potato',16.5,0.01),
  ('Kalyan APMC','Cabbage',12.0,-0.05),('Panvel Mandi','Cabbage',13.0,-0.03),('Vashi APMC, Navi Mumbai','Cabbage',15.0,-0.02),('Nashik APMC','Cabbage',10.0,-0.06),('Pune Market Yard','Cabbage',12.0,-0.09),
  ('Kalyan APMC','Banana',30.0,0.02),('Panvel Mandi','Banana',32.0,0.01),('Vashi APMC, Navi Mumbai','Banana',36.0,0.03),('Nashik APMC','Banana',27.0,0.0),('Pune Market Yard','Banana',31.0,0.02),
  ('Kalyan APMC','Green Chilli',48.0,0.05),('Panvel Mandi','Green Chilli',52.0,0.10),('Vashi APMC, Navi Mumbai','Green Chilli',58.0,0.04),('Nashik APMC','Green Chilli',44.0,0.02),('Pune Market Yard','Green Chilli',50.0,0.03)
)
INSERT INTO public.price_entries (market_id, commodity_id, date, price_per_unit)
SELECT m.id, c.id, (CURRENT_DATE - d),
  ROUND((b.price * (1 + b.drift * ((17 - d)::numeric / 17))
    * (1 + 0.02 * sin((d * 1.7 + length(b.mname) + length(b.cname))::numeric)))::numeric, 2)
FROM base b
JOIN public.markets m ON m.name = b.mname
JOIN public.commodities c ON c.name = b.cname
CROSS JOIN generate_series(0, 17) AS d;
