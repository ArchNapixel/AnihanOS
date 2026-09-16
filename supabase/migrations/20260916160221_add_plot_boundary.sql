-- Store each plot's drawn land boundary as GeoJSON (a Polygon), not PostGIS —
-- v1 only needs to render the shape, not run spatial queries against it.
alter table plots
  add column boundary jsonb;
