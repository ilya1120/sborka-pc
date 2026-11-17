-- Проверка правил на временных тестовых записях. ROLLBACK отменяет все изменения.
begin;
select set_config('sborka.test_user', gen_random_uuid()::text, true);
select set_config('sborka.other_user', gen_random_uuid()::text, true);

insert into auth.users(id, email)
values
  (current_setting('sborka.test_user')::uuid, 'sborka-test-' || current_setting('sborka.test_user') || '@example.invalid'),
  (current_setting('sborka.other_user')::uuid, 'sborka-test-' || current_setting('sborka.other_user') || '@example.invalid');
insert into public.builds(user_id, name, components)
values (current_setting('sborka.other_user')::uuid, 'RLS temporary test', '{}');

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('sborka.test_user'), true);

do $$
declare affected integer;
begin
  if public.is_admin() then raise exception 'Новый клиент получил роль администратора'; end if;
  if exists(select 1 from public.builds where user_id = current_setting('sborka.other_user')::uuid) then
    raise exception 'Клиент видит чужую сборку';
  end if;
  insert into public.builds(user_id, name, components)
  values (current_setting('sborka.test_user')::uuid, 'RLS own test', '{}');
  if (select count(*) from public.builds where user_id = current_setting('sborka.test_user')::uuid) <> 1 then
    raise exception 'Своя сборка недоступна';
  end if;
  update public.builds set name = 'RLS rename test' where user_id = current_setting('sborka.test_user')::uuid;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Переименование своей сборки не работает'; end if;
  update public.products set name = name where id = 'cpu-r5-7600';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Клиент изменил каталог'; end if;
  begin
    update public.profiles set role = 'admin' where id = current_setting('sborka.test_user')::uuid;
    raise exception 'Клиент самостоятельно назначил себе роль';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.builds(user_id, name, components)
    values (current_setting('sborka.other_user')::uuid, 'RLS illegal test', '{}');
    raise exception 'Клиент записал сборку другому пользователю';
  exception when insufficient_privilege then null;
  end;
  delete from public.builds where user_id = current_setting('sborka.other_user')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Клиент удалил чужую сборку'; end if;
  delete from public.builds where user_id = current_setting('sborka.test_user')::uuid;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Удаление своей сборки не работает'; end if;
end;
$$;
rollback;
