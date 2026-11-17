-- Выполнить в SQL Editor проекта Supabase. Скрипт можно запускать повторно.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.create_user_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name, role)
  values (new.id, '', 'client') on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_user_profile() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_user_profile();

-- Поддержка аккаунтов, созданных до выполнения этого скрипта.
insert into public.profiles(id)
select id from auth.users on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.products (
  id text primary key,
  category text not null check (category in ('cpu','motherboard','ram','gpu','storage','psu','case','cooler')),
  name text not null check (length(trim(name)) between 1 and 160),
  brand text not null check (length(trim(brand)) between 1 and 80),
  description text not null default '' check (length(description) <= 2000),
  price numeric(12,2) not null check (price >= 0 and price <= 10000000),
  specs jsonb not null check (jsonb_typeof(specs) = 'object'),
  appearance jsonb not null default '{"color":"#25282c","rgb":false}',
  source_url text check (source_url is null or source_url ~ '^https://'),
  price_source text not null default 'demo' check (price_source in ('demo','manual','DNS')),
  price_updated_at timestamptz,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(appearance) = 'object'
    and appearance ? 'color' and appearance->>'color' ~ '^#[0-9a-fA-F]{6}$'
    and appearance ? 'rgb' and jsonb_typeof(appearance->'rgb') = 'boolean')
);

create or replace function public.valid_build_components(components jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select jsonb_typeof(components) = 'object'
    and (select count(*) from jsonb_object_keys(components)) <= 8
    and not exists (
      select 1 from jsonb_each(components) as entry
      where entry.key not in ('cpu','motherboard','ram','gpu','storage','psu','case','cooler')
      or jsonb_typeof(entry.value) not in ('string','null')
      or length(entry.value::text) > 200
    );
$$;

create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  components jsonb not null check (public.valid_build_components(components)),
  rgb_color text not null default '#69f2b2' check (rgb_color ~ '^#[0-9a-fA-F]{6}$'),
  rgb_mode text not null default 'static' check (rgb_mode in ('static','rainbow','breathe','rgb')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists builds_owner_updated_idx on public.builds(user_id, updated_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists products_updated on public.products;
create trigger products_updated before update on public.products for each row execute function public.touch_updated_at();
drop trigger if exists builds_updated on public.builds;
create trigger builds_updated before update on public.builds for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.builds enable row level security;

revoke all on public.profiles, public.products, public.builds from anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.builds to authenticated;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
using (id = (select auth.uid()));
-- Обновление роли доступно только владельцу проекта через SQL Editor.

drop policy if exists products_read on public.products;
create policy products_read on public.products for select to anon, authenticated
using (active or (select public.is_admin()));
drop policy if exists products_insert on public.products;
create policy products_insert on public.products for insert to authenticated
with check ((select public.is_admin()));
drop policy if exists products_update on public.products;
create policy products_update on public.products for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists products_delete on public.products;
create policy products_delete on public.products for delete to authenticated
using ((select public.is_admin()));

drop policy if exists builds_read on public.builds;
create policy builds_read on public.builds for select to authenticated
using (user_id = (select auth.uid()));
drop policy if exists builds_insert on public.builds;
create policy builds_insert on public.builds for insert to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists builds_update on public.builds;
create policy builds_update on public.builds for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists builds_delete on public.builds;
create policy builds_delete on public.builds for delete to authenticated
using (user_id = (select auth.uid()));

commit;
