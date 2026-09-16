-- ============================================================
-- AnihanOS schema — Land & Plot module (farms, plots)
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- farms
-- ------------------------------------------------------------
create table farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_farms_owner_id on farms(owner_id);

create trigger trg_farms_updated_at
  before update on farms
  for each row execute function set_updated_at();

alter table farms enable row level security;

create policy "Farms are viewable by their owner"
  on farms for select
  using (owner_id = auth.uid());

create policy "Farms are insertable by their owner"
  on farms for insert
  with check (owner_id = auth.uid());

create policy "Farms are updatable by their owner"
  on farms for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Farms are deletable by their owner"
  on farms for delete
  using (owner_id = auth.uid());

-- ------------------------------------------------------------
-- plots
-- ------------------------------------------------------------
create table plots (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  size numeric(10, 2) not null check (size > 0),
  size_unit text not null default 'hectares' check (size_unit in ('hectares', 'acres', 'sqm')),
  soil_type text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null))
);

create index idx_plots_farm_id on plots(farm_id);

create trigger trg_plots_updated_at
  before update on plots
  for each row execute function set_updated_at();

alter table plots enable row level security;

create policy "Plots are viewable by their farm's owner"
  on plots for select
  using (exists (select 1 from farms where farms.id = plots.farm_id and farms.owner_id = auth.uid()));

create policy "Plots are insertable by their farm's owner"
  on plots for insert
  with check (exists (select 1 from farms where farms.id = plots.farm_id and farms.owner_id = auth.uid()));

create policy "Plots are updatable by their farm's owner"
  on plots for update
  using (exists (select 1 from farms where farms.id = plots.farm_id and farms.owner_id = auth.uid()))
  with check (exists (select 1 from farms where farms.id = plots.farm_id and farms.owner_id = auth.uid()));

create policy "Plots are deletable by their farm's owner"
  on plots for delete
  using (exists (select 1 from farms where farms.id = plots.farm_id and farms.owner_id = auth.uid()));
