-- Fruit Farmer family leaderboards. Paste this whole file into the Supabase SQL Editor and run it.
-- Safe for kids by design: no sign-in, no personal details, no chat. Farm names can only be built
-- from the word lists below, so nobody can type their own. The game reaches the tables only through
-- these functions; a family's code is what lets you see that family's board.
-- The word lists here must match boardWords in js/data.js.

create table if not exists families (
  code text primary key check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key,
  secret_hash text not null,
  family_code text not null references families (code) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists players_family on players (family_code);

create table if not exists scores (
  player_id uuid not null references players (id) on delete cascade,
  day date not null,
  coins integer not null check (coins between 0 and 1000000),
  primary key (player_id, day)
);

alter table families enable row level security;
alter table players enable row level security;
alter table scores enable row level security;
revoke all on families, players, scores from anon, authenticated;

create or replace function hash_secret(p_secret text) returns text
language sql immutable as $$ select encode(sha256(convert_to(p_secret, 'UTF8')), 'hex') $$;

create or replace function valid_farm_name(p_name text) returns boolean
language sql immutable as $$
  select split_part(p_name, ' ', 1) = any (array['Sunny','Happy','Silly','Jolly','Lucky','Golden','Bouncy','Sleepy','Rainbow','Sparkly','Cozy','Giggly','Mighty','Tiny','Windy','Starry'])
     and split_part(p_name, ' ', 2) = any (array['Pig','Bunny','Bear','Frog','Cat','Duck','Apple','Berry','Banana','Grape','Orange','Barrel','Basket','Sprout','Acorn','Clover'])
     and split_part(p_name, ' ', 3) = 'Farm'
     and split_part(p_name, ' ', 4) = ''
$$;

create or replace function join_family(p_code text, p_player uuid, p_secret text, p_name text) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  existing players%rowtype;
begin
  if not valid_farm_name(p_name) or length(p_secret) < 32 then return false; end if;
  if not exists (select 1 from families where code = p_code) then return false; end if;
  select * into existing from players where id = p_player;
  if found and existing.secret_hash <> hash_secret(p_secret) then return false; end if;
  if (select count(*) from players where family_code = p_code and id <> p_player) >= 30 then return false; end if;
  insert into players (id, secret_hash, family_code, name)
    values (p_player, hash_secret(p_secret), p_code, p_name)
    on conflict (id) do update set family_code = excluded.family_code, name = excluded.name;
  return true;
end $$;

create or replace function create_family(p_player uuid, p_secret text, p_name text) returns text
language plpgsql security definer set search_path = public as $$
declare
  letters constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
begin
  if not valid_farm_name(p_name) or length(p_secret) < 32 then return null; end if;
  loop
    select string_agg(substr(letters, 1 + floor(random() * 32)::int, 1), '') into new_code from generate_series(1, 6);
    exit when not exists (select 1 from families where code = new_code);
  end loop;
  insert into families (code) values (new_code);
  if join_family(new_code, p_player, p_secret, p_name) then return new_code; end if;
  delete from families where code = new_code;
  return null;
end $$;

-- p_scores is { "2026-11-02": 88, ... }. Totals can only go up.
create or replace function submit_scores(p_player uuid, p_secret text, p_scores jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from players where id = p_player and secret_hash = hash_secret(p_secret)) then return false; end if;
  insert into scores (player_id, day, coins)
    select p_player, key::date, least(value::int, 1000000)
    from (select * from jsonb_each_text(p_scores) limit 400) s
    where key::date <= current_date + 1
  on conflict (player_id, day) do update set coins = greatest(scores.coins, excluded.coins);
  return true;
end $$;

create or replace function family_board(p_code text, p_since date, p_player uuid)
returns table (name text, coins bigint, me boolean)
language sql stable security definer set search_path = public as $$
  select p.name, coalesce(sum(s.coins) filter (where s.day >= p_since), 0)::bigint, p.id = p_player
  from players p left join scores s on s.player_id = p.id
  where p.family_code = p_code
  group by p.id, p.name
  order by 2 desc, p.name
$$;

create or replace function leave_family(p_player uuid, p_secret text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from players where id = p_player and secret_hash = hash_secret(p_secret);
  return found;
end $$;

revoke execute on function hash_secret(text), valid_farm_name(text) from public, anon, authenticated;
revoke execute on function join_family(text, uuid, text, text), create_family(uuid, text, text),
  submit_scores(uuid, text, jsonb), family_board(text, date, uuid), leave_family(uuid, text) from public;
grant execute on function join_family(text, uuid, text, text), create_family(uuid, text, text),
  submit_scores(uuid, text, jsonb), family_board(text, date, uuid), leave_family(uuid, text) to anon;
