-- 熊野同行计划：在 Supabase SQL Editor 一次性执行。
-- 前提：Authentication 中已开启 Anonymous Sign-Ins。

create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  summary text not null default '',
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  display_name text not null default '同行者',
  joined_at timestamptz not null default now(),
  unique (trip_id, user_id)
);
create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_no integer not null check (day_no between 1 and 99),
  content jsonb not null default '{}'::jsonb,
  revision integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  unique (trip_id, day_no)
);
create table if not exists public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  code text not null unique,
  role text not null check (role in ('editor','viewer')),
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table if not exists public.trip_activity (
  id bigint generated always as identity primary key,
  trip_id uuid not null references public.trips(id) on delete cascade,
  actor_id uuid references auth.users(id),
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists trip_members_trip_user_idx on public.trip_members (trip_id, user_id);
create index if not exists trip_days_trip_day_idx on public.trip_days (trip_id, day_no);
create index if not exists trip_activity_trip_time_idx on public.trip_activity (trip_id, created_at desc);
create index if not exists trip_invites_trip_code_idx on public.trip_invites (trip_id, code);

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_days enable row level security;
alter table public.trip_invites enable row level security;
alter table public.trip_activity enable row level security;

create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists(select 1 from public.trip_members where trip_id = p_trip_id and user_id = auth.uid());
$$;
create or replace function public.trip_role(p_trip_id uuid)
returns text language sql security definer set search_path = public stable as $$
  select role from public.trip_members where trip_id = p_trip_id and user_id = auth.uid() limit 1;
$$;
revoke all on function public.is_trip_member(uuid) from public;
revoke all on function public.trip_role(uuid) from public;

create policy "members read trips" on public.trips for select to authenticated using (public.is_trip_member(id));
create policy "members read members" on public.trip_members for select to authenticated using (public.is_trip_member(trip_id));
create policy "members read days" on public.trip_days for select to authenticated using (public.is_trip_member(trip_id));
create policy "members read activity" on public.trip_activity for select to authenticated using (public.is_trip_member(trip_id));

create or replace function public.add_activity(p_trip_id uuid, p_text text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.trip_activity(trip_id, actor_id, text) values (p_trip_id, auth.uid(), p_text);
end; $$;

create or replace function public.create_trip_with_days(
  p_name text, p_summary text, p_days jsonb, p_display_name text default '同行者'
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_trip uuid; v_day jsonb; v_day_no integer := 0;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  insert into public.trips(name, summary, owner_id) values (left(p_name, 100), left(p_summary, 500), auth.uid()) returning id into v_trip;
  insert into public.trip_members(trip_id, user_id, role, display_name) values (v_trip, auth.uid(), 'owner', left(coalesce(nullif(p_display_name,''),'同行者'), 30));
  for v_day in select value from jsonb_array_elements(p_days) loop
    v_day_no := v_day_no + 1;
    insert into public.trip_days(trip_id, day_no, content, updated_by) values (v_trip, v_day_no, v_day, auth.uid());
  end loop;
  perform public.add_activity(v_trip, '创建了熊野古道五日同行计划');
  return v_trip;
end; $$;

create or replace function public.create_trip_invite(p_trip_id uuid, p_role text default 'editor')
returns table(code text, expires_at timestamptz) language plpgsql security definer set search_path = public as $$
declare v_role text; v_code text; v_expiry timestamptz := now() + interval '7 days';
begin
  v_role := public.trip_role(p_trip_id);
  if v_role not in ('owner','editor') then raise exception '无邀请权限'; end if;
  if p_role not in ('editor','viewer') then raise exception '无效成员权限'; end if;
  v_code := encode(gen_random_bytes(8), 'hex');
  insert into public.trip_invites(trip_id, code, role, created_by, expires_at) values (p_trip_id, v_code, p_role, auth.uid(), v_expiry);
  perform public.add_activity(p_trip_id, '生成了一条可分享的邀请链接');
  return query select v_code, v_expiry;
end; $$;

create or replace function public.join_trip_with_invite(p_trip_id uuid, p_code text, p_display_name text default '同行者')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_invite public.trip_invites; v_exists boolean;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  select * into v_invite from public.trip_invites where trip_id = p_trip_id and code = p_code and expires_at > now() order by created_at desc limit 1;
  if not found then raise exception '邀请已失效或无效'; end if;
  select exists(select 1 from public.trip_members where trip_id = p_trip_id and user_id = auth.uid()) into v_exists;
  if not v_exists then
    insert into public.trip_members(trip_id,user_id,role,display_name) values (p_trip_id,auth.uid(),v_invite.role,left(coalesce(nullif(p_display_name,''),'同行者'),30));
    perform public.add_activity(p_trip_id, '一位同行者通过邀请链接加入了计划');
  end if;
  return p_trip_id;
end; $$;

create or replace function public.update_trip_day(p_trip_id uuid, p_day_id uuid, p_content jsonb, p_expected_revision integer)
returns public.trip_days language plpgsql security definer set search_path = public as $$
declare v_role text; v_day public.trip_days;
begin
  v_role := public.trip_role(p_trip_id);
  if v_role not in ('owner','editor') then raise exception '无编辑权限'; end if;
  select * into v_day from public.trip_days where id = p_day_id and trip_id = p_trip_id for update;
  if not found then raise exception '未找到该行程日'; end if;
  if v_day.revision <> p_expected_revision then raise exception 'CONFLICT'; end if;
  update public.trip_days set content = p_content, revision = revision + 1, updated_by = auth.uid(), updated_at = now() where id = p_day_id returning * into v_day;
  update public.trips set updated_at = now() where id = p_trip_id;
  perform public.add_activity(p_trip_id, format('更新了 DAY %s「%s」', v_day.day_no, coalesce(p_content->>'title','行程')));
  return v_day;
end; $$;

create or replace function public.set_trip_member_role(p_trip_id uuid, p_member_id uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare v_member public.trip_members;
begin
  if public.trip_role(p_trip_id) <> 'owner' then raise exception '只有组织者可以调整权限'; end if;
  if p_role not in ('editor','viewer') then raise exception '无效成员权限'; end if;
  select * into v_member from public.trip_members where id = p_member_id and trip_id = p_trip_id for update;
  if not found or v_member.role = 'owner' then raise exception '不能调整该成员'; end if;
  update public.trip_members set role = p_role where id = p_member_id;
  perform public.add_activity(p_trip_id, format('组织者将一位同行者设为%s', case when p_role='editor' then '可编辑' else '仅查看' end));
end; $$;

grant execute on function public.create_trip_with_days(text,text,jsonb,text) to authenticated;
grant execute on function public.create_trip_invite(uuid,text) to authenticated;
grant execute on function public.join_trip_with_invite(uuid,text,text) to authenticated;
grant execute on function public.update_trip_day(uuid,uuid,jsonb,integer) to authenticated;
grant execute on function public.set_trip_member_role(uuid,uuid,text) to authenticated;

alter publication supabase_realtime add table public.trip_days;
alter publication supabase_realtime add table public.trip_members;
alter publication supabase_realtime add table public.trip_activity;
