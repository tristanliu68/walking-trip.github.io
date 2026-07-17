-- 熊野同行计划：邀请链接热修复
-- 在 Supabase Dashboard → SQL Editor 中执行一次即可。
-- 根因：原函数在 search_path=public 下调用 pgcrypto 的 gen_random_bytes，
-- 而 Supabase 的扩展函数不在该 search_path 中，导致“function ... does not exist”。

create or replace function public.create_trip_invite(p_trip_id uuid, p_role text default 'editor')
returns table(code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_code text;
  v_expiry timestamptz := now() + interval '7 days';
begin
  v_role := public.trip_role(p_trip_id);
  if v_role not in ('owner', 'editor') then
    raise exception '无邀请权限';
  end if;
  if p_role not in ('editor', 'viewer') then
    raise exception '无效成员权限';
  end if;

  v_code := replace(pg_catalog.gen_random_uuid()::text, '-', '')
    || replace(pg_catalog.gen_random_uuid()::text, '-', '');

  insert into public.trip_invites(trip_id, code, role, created_by, expires_at)
  values (p_trip_id, v_code, p_role, auth.uid(), v_expiry);

  perform public.add_activity(p_trip_id, '生成了一条可分享的邀请链接');
  return query select v_code, v_expiry;
end;
$$;

grant execute on function public.create_trip_invite(uuid, text) to authenticated;
