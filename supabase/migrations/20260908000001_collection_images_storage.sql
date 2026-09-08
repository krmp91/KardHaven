-- Storage bucket for user-uploaded card photos.
-- Expected path convention: {user_id}/{collection_item_id}/{filename}
-- The `image_urls` column on collection_items stores paths into this bucket.

insert into storage.buckets (id, name, public)
values ('collection-images', 'collection-images', false)
on conflict (id) do nothing;

create policy "Users can view their own collection images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'collection-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can upload their own collection images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'collection-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own collection images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'collection-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'collection-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own collection images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'collection-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
