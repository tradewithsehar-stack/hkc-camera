-- ============================================================================
-- HKC CAMERA STUDIO - SUPABASE CLOUD BACKEND SCHEMA & RLS POLICIES
-- PostgreSQL + Supabase Storage + Row Level Security (RLS)
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. Create the Media Metadata Table
create table if not exists public.media (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  media_type text not null check (media_type in ('photo', 'video')),
  file_name text not null,
  mime_type text not null,
  file_size bigint not null default 0,
  width integer,
  height integer,
  duration text,
  aspect_ratio text default '9:16',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast user gallery queries (newest captures first)
create index if not exists idx_media_user_created on public.media(user_id, created_at desc);

-- 2. Enable Row Level Security (RLS)
alter table public.media enable row level security;

-- 3. Row Level Security Policies for `media` Table
-- Policy: Users can select only their own captures
drop policy if exists "Users can view own media" on public.media;
create policy "Users can view own media"
  on public.media for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own captures
drop policy if exists "Users can insert own media" on public.media;
create policy "Users can insert own media"
  on public.media for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own captures
drop policy if exists "Users can update own media" on public.media;
create policy "Users can update own media"
  on public.media for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own captures
drop policy if exists "Users can delete own media" on public.media;
create policy "Users can delete own media"
  on public.media for delete
  using (auth.uid() = user_id);

-- 4. Create the Supabase Storage Bucket for Media Files
insert into storage.buckets (id, name, public)
values ('hkc-media', 'hkc-media', true)
on conflict (id) do nothing;

-- 5. Storage Row Level Security Policies for `hkc-media` Bucket
-- Allow users to upload media into their own user folder: `hkc-media/{user_id}/*`
drop policy if exists "Users can upload media to own folder" on storage.objects;
create policy "Users can upload media to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'hkc-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to read media from the bucket (public or authenticated)
drop policy if exists "Users can read media" on storage.objects;
create policy "Users can read media"
  on storage.objects for select
  using (bucket_id = 'hkc-media');

-- Allow users to delete their own media objects
drop policy if exists "Users can delete own storage media" on storage.objects;
create policy "Users can delete own storage media"
  on storage.objects for delete
  using (
    bucket_id = 'hkc-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
