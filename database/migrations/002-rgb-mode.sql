begin;
alter table public.builds drop constraint if exists builds_rgb_mode_check;
alter table public.builds add constraint builds_rgb_mode_check
  check (rgb_mode in ('static', 'breathe', 'rgb', 'rainbow'));
commit;
