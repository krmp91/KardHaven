-- KardHaven initial schema: catalog data, user collections, wishlist, pricing.
-- See README.md for the full product plan this maps to.

create extension if not exists "pgcrypto";

-- ============ Catalog data (shared, read-only for clients) ============

create table public.sets (
  id text primary key, -- TCGdex set id, e.g. "swsh1"
  name text not null,
  series text,
  release_date date,
  card_count integer,
  logo_url text,
  symbol_url text,
  created_at timestamptz not null default now()
);

create table public.cards (
  id text primary key, -- TCGdex card id, e.g. "swsh1-1"
  set_id text not null references public.sets(id) on delete cascade,
  name text not null,
  number text,
  rarity text,
  image_url text,
  types text[],
  created_at timestamptz not null default now()
);

create index cards_set_id_idx on public.cards(set_id);
create index cards_name_idx on public.cards using gin (to_tsvector('simple', name));

-- ============ User profile ============

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Automatically create a profile row whenever a new user signs up.
-- search_path is deliberately empty and all names are schema-qualified, since this
-- function runs as security definer and an unqualified search_path could be hijacked.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Reusable helper: keep an `updated_at` column current on every update.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ Storage locations (e.g. "binder A, page 3") ============

create table public.storage_locations (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),

  primary key (id),
  unique (id, user_id) -- lets collection_items enforce location ownership below
);

-- ============ Collection items (a user's owned copies of cards) ============

create type public.card_finish as enum ('normal', 'holo', 'reverse_holo', 'other');
create type public.card_condition as enum ('NM', 'EX', 'GD', 'LP', 'PL', 'PO');

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null references public.cards(id),

  -- Two copies belong in separate rows unless they're identical across condition,
  -- language, variant, purchase price/date, grading and storage location.
  quantity integer not null default 1 check (quantity > 0),

  language text not null default 'EN',
  variant public.card_finish not null default 'normal',
  variant_details text, -- freeform, e.g. "Cosmos holo", "1st Edition" — filled in once TCGdex's variant vocabulary is integrated
  condition public.card_condition, -- left null for graded cards; the grade replaces it
  is_graded boolean not null default false,
  grading_company text,
  grade text,

  purchase_price_per_unit numeric(10, 2) check (purchase_price_per_unit is null or purchase_price_per_unit >= 0),
  purchase_currency text not null default 'DKK' check (purchase_currency ~ '^[A-Z]{3}$'),
  purchase_date date,

  -- Cached snapshot meant to be refreshed periodically from price_history filtered to
  -- this item's variant/condition/grading — not a value the user maintains by hand.
  estimated_value numeric(10, 2) check (estimated_value is null or estimated_value >= 0),

  storage_location_id uuid,
  notes text,
  image_urls text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  foreign key (storage_location_id, user_id)
    references public.storage_locations (id, user_id)
    on delete set null (storage_location_id),

  check (
    (is_graded = false and grading_company is null and grade is null)
    or
    (is_graded = true and grading_company is not null and grade is not null)
  ),
  check (not (is_graded and condition is not null))
);

create index collection_items_user_id_idx on public.collection_items(user_id);
create index collection_items_card_id_idx on public.collection_items(card_id);
create index collection_items_storage_location_id_idx on public.collection_items(storage_location_id);

create trigger collection_items_set_updated_at
  before update on public.collection_items
  for each row execute function public.set_updated_at();

-- ============ Wishlist ============

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null references public.cards(id),
  language text,
  variant public.card_finish,
  preferred_condition public.card_condition,
  target_price numeric(10, 2) check (target_price is null or target_price >= 0),
  notes text,
  created_at timestamptz not null default now(),
  -- A card can be wishlisted more than once if language or variant differ
  -- (e.g. a Japanese holo and an English normal of the same card).
  unique nulls not distinct (user_id, card_id, language, variant)
);

create index wishlists_user_id_idx on public.wishlists(user_id);

-- ============ Price history (catalog-level market price tracking) ============

create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  card_id text not null references public.cards(id) on delete cascade,

  source text not null, -- e.g. "cardmarket", "tcgdex"
  market text, -- e.g. a specific marketplace/region within the source
  currency text not null default 'EUR',

  language text,
  variant public.card_finish,
  condition public.card_condition,
  grading_company text,
  grade text,

  price_type text not null, -- e.g. "trend", "average", "low"
  price numeric(10, 2) not null check (price >= 0),

  recorded_on date not null default current_date,
  fetched_at timestamptz not null default now()
);

create index price_history_card_id_idx on public.price_history(card_id);

-- Prevent duplicate snapshots for the same card/source/currency/segment/day.
-- NULLS NOT DISTINCT treats two NULLs in the same segment column as equal, so e.g.
-- two rows with no grading info still count as duplicates.
create unique index price_history_daily_unique_idx
  on public.price_history (
    card_id,
    source,
    currency,
    language,
    variant,
    condition,
    grading_company,
    grade,
    price_type,
    recorded_on
  )
  nulls not distinct;

-- ============ Row Level Security ============

alter table public.profiles enable row level security;
alter table public.storage_locations enable row level security;
alter table public.collection_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.cards enable row level security;
alter table public.sets enable row level security;
alter table public.price_history enable row level security;

-- Explicit grants alongside RLS. Supabase's platform defaults already grant these to
-- `authenticated` on new public tables, but stating them here keeps the schema
-- self-contained and correct even if that default is ever changed.
grant usage on schema public to authenticated;
grant select on public.sets, public.cards, public.price_history to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete
  on public.storage_locations, public.collection_items, public.wishlists
  to authenticated;

-- Profiles: a user can see and edit only their own profile.
create policy "Profiles are viewable by owner" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "Profiles are editable by owner" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Storage locations, collection items and wishlist entries are fully owned by the user.
create policy "Storage locations are managed by owner" on public.storage_locations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Collection items are managed by owner" on public.collection_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Wishlist items are managed by owner" on public.wishlists
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Catalog tables are readable by any signed-in user; writes go through the service role only
-- (e.g. a catalog sync job), never directly from the app.
create policy "Cards are readable by authenticated users" on public.cards
  for select to authenticated
  using (true);

create policy "Sets are readable by authenticated users" on public.sets
  for select to authenticated
  using (true);

create policy "Price history is readable by authenticated users" on public.price_history
  for select to authenticated
  using (true);
