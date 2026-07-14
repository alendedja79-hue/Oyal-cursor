-- Oyal — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`) to provision the
-- database used by the app when EXPO_PUBLIC_SUPABASE_* env vars are configured.
--
-- Covers: profiles (Users), trips (Trips), photos (Photos),
--         forum_topics (ForumTopics), forum_posts (ForumPosts),
--         a public `media` storage bucket, RLS policies, and a trigger that
--         creates a profile row automatically on sign-up.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles  (maps to the "Users" entity; auth is handled by auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  username      text not null,
  profile_photo text,
  favorite_place text,
  travel_tip    text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
create table if not exists public.trips (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  trip_name  text not null,
  season     text not null check (season in ('Summer','Autumn','Winter','Spring')),
  spend      numeric not null default 0,
  party_size text not null check (party_size in ('Solo','Group','Couple','Family')),
  itinerary  text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists trips_user_id_idx on public.trips (user_id);
create index if not exists trips_created_at_idx on public.trips (created_at desc);

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------
create table if not exists public.photos (
  id            uuid primary key default uuid_generate_v4(),
  trip_id       uuid not null references public.trips (id) on delete cascade,
  image_url     text not null,
  location_name text not null,
  latitude      double precision,
  longitude     double precision,
  country       text,
  created_at    timestamptz not null default now()
);
create index if not exists photos_trip_id_idx on public.photos (trip_id);

-- ---------------------------------------------------------------------------
-- forum_topics
-- ---------------------------------------------------------------------------
create table if not exists public.forum_topics (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  created_at timestamptz not null default now()
);
create index if not exists forum_topics_created_at_idx on public.forum_topics (created_at desc);

-- ---------------------------------------------------------------------------
-- forum_posts
-- ---------------------------------------------------------------------------
create table if not exists public.forum_posts (
  id         uuid primary key default uuid_generate_v4(),
  topic_id   uuid not null references public.forum_topics (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  message    text not null,
  created_at timestamptz not null default now()
);
create index if not exists forum_posts_topic_id_idx on public.forum_posts (topic_id);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, profile_photo)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.trips        enable row level security;
alter table public.photos       enable row level security;
alter table public.forum_topics enable row level security;
alter table public.forum_posts  enable row level security;

-- profiles: readable by everyone, writable only by the owner
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- trips: public read, owner write
drop policy if exists "trips_read" on public.trips;
create policy "trips_read" on public.trips for select using (true);
drop policy if exists "trips_insert_own" on public.trips;
create policy "trips_insert_own" on public.trips for insert with check (auth.uid() = user_id);
drop policy if exists "trips_modify_own" on public.trips;
create policy "trips_modify_own" on public.trips for update using (auth.uid() = user_id);
drop policy if exists "trips_delete_own" on public.trips;
create policy "trips_delete_own" on public.trips for delete using (auth.uid() = user_id);

-- photos: public read, writable by the owner of the parent trip
drop policy if exists "photos_read" on public.photos;
create policy "photos_read" on public.photos for select using (true);
drop policy if exists "photos_insert_own" on public.photos;
create policy "photos_insert_own" on public.photos for insert with check (
  exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
);
drop policy if exists "photos_delete_own" on public.photos;
create policy "photos_delete_own" on public.photos for delete using (
  exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
);

-- forum_topics: public read, authenticated create, owner modify
drop policy if exists "topics_read" on public.forum_topics;
create policy "topics_read" on public.forum_topics for select using (true);
drop policy if exists "topics_insert_own" on public.forum_topics;
create policy "topics_insert_own" on public.forum_topics for insert with check (auth.uid() = user_id);
drop policy if exists "topics_delete_own" on public.forum_topics;
create policy "topics_delete_own" on public.forum_topics for delete using (auth.uid() = user_id);

-- forum_posts: public read, authenticated create, owner modify
drop policy if exists "posts_read" on public.forum_posts;
create policy "posts_read" on public.forum_posts for select using (true);
drop policy if exists "posts_insert_own" on public.forum_posts;
create policy "posts_insert_own" on public.forum_posts for insert with check (auth.uid() = user_id);
drop policy if exists "posts_delete_own" on public.forum_posts;
create policy "posts_delete_own" on public.forum_posts for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage bucket for media (profile photos + trip photos)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media_authenticated_upload" on storage.objects;
create policy "media_authenticated_upload" on storage.objects
  for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "media_owner_delete" on storage.objects;
create policy "media_owner_delete" on storage.objects
  for delete using (bucket_id = 'media' and owner = auth.uid());
