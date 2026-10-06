-- Run once in a NEW Supabase project's SQL Editor. No customer data is seeded.
create table if not exists public.jc_sources (
 id uuid primary key,owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null,object_key text not null,type text not null,created_at timestamptz not null default now(),
 unique(id,owner_id),check(length(name)<=240),check(object_key=owner_id::text||'/'||id::text)
);
create table if not exists public.jc_vehicles (
 id uuid primary key,owner_id uuid not null references auth.users(id) on delete cascade,
 source_id uuid,body jsonb not null,created_at timestamptz not null default now(),
 foreign key(source_id,owner_id) references public.jc_sources(id,owner_id),
 check(jsonb_typeof(body)='object'),check(body->>'id'=id::text),
 check(body->>'status' in ('draft','confirmed')),
 check(coalesce(body->>'sourceId','')=coalesce(source_id::text,''))
);
create index if not exists jc_sources_owner_created on public.jc_sources(owner_id,created_at desc,id);
create index if not exists jc_vehicles_owner_created on public.jc_vehicles(owner_id,created_at desc,id);
alter table public.jc_sources enable row level security;
alter table public.jc_vehicles enable row level security;
revoke all on public.jc_sources, public.jc_vehicles from anon;
grant select,insert,update,delete on public.jc_sources,public.jc_vehicles to authenticated;
drop policy if exists jc_own_sources on public.jc_sources;
create policy jc_own_sources on public.jc_sources for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
drop policy if exists jc_own_vehicles on public.jc_vehicles;
create policy jc_own_vehicles on public.jc_vehicles for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
insert into storage.buckets(id,name,public,file_size_limit) values('jc-files','jc-files',false,15728640) on conflict(id) do nothing;
drop policy if exists jc_files_read on storage.objects;
create policy jc_files_read on storage.objects for select to authenticated using (bucket_id='jc-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists jc_files_insert on storage.objects;
create policy jc_files_insert on storage.objects for insert to authenticated with check (bucket_id='jc-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists jc_files_delete on storage.objects;
create policy jc_files_delete on storage.objects for delete to authenticated using (bucket_id='jc-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
