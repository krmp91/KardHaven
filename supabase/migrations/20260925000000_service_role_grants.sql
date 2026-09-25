-- service_role bypasses RLS but still needs ordinary table grants — bypassing RLS and
-- having SQL privileges on a table are two separate layers in Postgres. The original
-- schema migration only granted table access to `authenticated`, so the sync-card Edge
-- Function (which writes via service_role) was hitting "permission denied for table sets".

grant all on public.sets, public.cards, public.profiles, public.storage_locations,
  public.collection_items, public.wishlists, public.price_history
  to service_role;
