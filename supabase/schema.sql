create extension if not exists "uuid-ossp";

create type player_color as enum ('white', 'black');
create type game_mode as enum ('local', 'ai', 'online', 'puzzle');
create type game_status as enum ('playing', 'finished', 'draw');
create type room_status as enum ('waiting', 'playing', 'finished');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar text,
  city text,
  country text,
  rating integer not null default 600,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists games (
  id uuid primary key,
  mode game_mode not null,
  status game_status not null,
  winner player_color,
  white_player_id uuid references profiles(id),
  black_player_id uuid references profiles(id),
  created_by uuid references profiles(id),
  duration_ms integer not null default 0,
  ai_difficulty text,
  initial_board jsonb,
  created_at timestamptz not null default now()
);

create table if not exists moves (
  id bigint generated always as identity primary key,
  game_id uuid not null references games(id) on delete cascade,
  move_number integer not null,
  player player_color not null,
  notation text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (game_id, move_number)
);

create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  host_id uuid references profiles(id),
  guest_id uuid references profiles(id),
  status room_status not null default 'waiting',
  board jsonb not null,
  current_turn player_color not null default 'white',
  rematch_requested_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  created_at timestamptz not null default now()
);

create table if not exists user_achievements (
  user_id uuid not null references profiles(id) on delete cascade,
  achievement_id text not null references achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table profiles enable row level security;
alter table games enable row level security;
alter table moves enable row level security;
alter table rooms enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;

create policy "profiles are public readable" on profiles for select using (true);
create policy "users update own profile" on profiles for update using (auth.uid() = id);
create policy "users insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "users read related games" on games for select
  using (created_by = auth.uid() or white_player_id = auth.uid() or black_player_id = auth.uid());
create policy "users insert own games" on games for insert with check (created_by = auth.uid());

create policy "users read moves for own games" on moves for select
  using (exists (
    select 1 from games
    where games.id = moves.game_id
      and (games.created_by = auth.uid() or games.white_player_id = auth.uid() or games.black_player_id = auth.uid())
  ));
create policy "users insert moves for own games" on moves for insert
  with check (exists (
    select 1 from games
    where games.id = moves.game_id
      and (games.created_by = auth.uid() or games.white_player_id = auth.uid() or games.black_player_id = auth.uid())
  ));

create policy "room players can read room" on rooms for select
  using (host_id = auth.uid() or guest_id = auth.uid() or status = 'waiting');
create policy "authenticated users create rooms" on rooms for insert
  with check (auth.role() = 'authenticated' and host_id = auth.uid());
create policy "room players update room" on rooms for update
  using (host_id = auth.uid() or guest_id = auth.uid());

create policy "achievements are public readable" on achievements for select using (true);
create policy "authenticated users seed achievements" on achievements for insert with check (auth.role() = 'authenticated');
create policy "authenticated users keep achievements seeded" on achievements for update using (auth.role() = 'authenticated');
create policy "users read own achievements" on user_achievements for select using (user_id = auth.uid());
create policy "users insert own achievements" on user_achievements for insert with check (user_id = auth.uid());
create policy "users update own achievements" on user_achievements for update using (user_id = auth.uid());

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table moves;
