create extension if not exists pgcrypto;

create table if not exists public.campaign_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  contact text not null default '',
  website text not null default '',
  lga text not null,
  question text not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved','spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.questions add column if not exists website text not null default '';
create index if not exists questions_status_created on public.questions(status, created_at desc);
create index if not exists questions_lga on public.questions(lga);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  contact text not null default '',
  lga text not null,
  ward text not null,
  topic text not null check (topic in ('campaign','area','other')),
  original_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 62914560),
  consent boolean not null default true,
  status text not null default 'new' check (status in ('new','in_progress','resolved','spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists videos_status_created on public.videos(status, created_at desc);
create index if not exists videos_lga on public.videos(lga);

create table if not exists public.chat_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  question text not null,
  answer text not null,
  sources text not null default '',
  channel text not null default 'text' check (channel in ('text','voice')),
  created_at timestamptz not null default now()
);
create index if not exists chat_logs_created on public.chat_logs(created_at desc);
create index if not exists chat_logs_session_created on public.chat_logs(session_id, created_at desc);

create table if not exists public.rate_limit_windows (
  scope text not null,
  key_hash text not null,
  window_start timestamptz not null,
  hits integer not null check (hits > 0),
  primary key (scope, key_hash, window_start)
);

create table if not exists public.video_upload_tickets (
  id uuid primary key,
  storage_path text not null unique,
  ip_hash text not null,
  name text not null default '',
  contact text not null default '',
  lga text not null,
  ward text not null,
  topic text not null check (topic in ('campaign','area','other')),
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 62914560),
  created_at timestamptz not null default now()
);

alter table public.campaign_admins enable row level security;
alter table public.questions enable row level security;
alter table public.videos enable row level security;
alter table public.chat_logs enable row level security;
alter table public.rate_limit_windows enable row level security;
alter table public.video_upload_tickets enable row level security;

revoke all on public.campaign_admins, public.questions, public.videos, public.chat_logs,
  public.rate_limit_windows, public.video_upload_tickets from anon, authenticated;
grant all on public.campaign_admins, public.questions, public.videos, public.chat_logs,
  public.rate_limit_windows, public.video_upload_tickets to service_role;

create or replace function public.dumle_record_rate_hit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz;
  v_hits integer;
begin
  if p_scope not in ('token','question','chat','video','video-upload','admin-login','admin-refresh')
     or p_key_hash !~ '^[a-f0-9]{64}$'
     or p_limit < 1 or p_limit > 1000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit arguments';
  end if;
  v_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limit_windows(scope, key_hash, window_start, hits)
  values (p_scope, p_key_hash, v_start, 1)
  on conflict (scope, key_hash, window_start)
  do update set hits = public.rate_limit_windows.hits + 1
  returning hits into v_hits;
  if random() < 0.01 then
    delete from public.rate_limit_windows where window_start < now() - interval '2 days';
    delete from public.video_upload_tickets where created_at < now() - interval '1 day';
  end if;
  return v_hits;
end;
$$;

revoke all on function public.dumle_record_rate_hit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.dumle_record_rate_hit(text,text,integer,integer) to service_role;

create or replace function public.dumle_count_recent_sessions()
returns integer
language sql
security definer
set search_path = ''
as $$
  select count(distinct session_id)::integer
  from public.chat_logs
  where created_at >= now() - interval '7 days';
$$;

revoke all on function public.dumle_count_recent_sessions() from public, anon, authenticated;
grant execute on function public.dumle_count_recent_sessions() to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'dumle-community-videos',
  'dumle-community-videos',
  false,
  62914560,
  array['video/mp4','video/quicktime','video/webm','video/x-msvideo','video/mpeg','video/3gpp','video/ogg','video/x-m4v']
)
on conflict (id) do update
set public = false,
    file_size_limit = 62914560,
    allowed_mime_types = excluded.allowed_mime_types;

comment on table public.campaign_admins is 'Only functions using the server-side service role may read this allowlist.';
comment on table public.video_upload_tickets is 'Short-lived, IP-bound records for private signed video uploads.';
