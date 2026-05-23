-- =============================================================================
-- ALADJ — Base de données Supabase
-- À coller dans : Supabase → SQL Editor → New query → Run
-- Vous pouvez relancer ce script sans risque : tout est en "if not exists".
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) PROFILS MEMBRES
--    Chaque compte créé via l'authentification Supabase a une ligne ici.
--    role : 'decideur' (cotisation 30€, voix en AG) ou 'membre' (gratuit)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  role        text not null default 'membre',   -- 'decideur' | 'membre'
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2) JEUX (ludothèque générale)
--    Chaque jeu appartient à un membre (owner_id) mais est visible par tous.
-- ---------------------------------------------------------------------------
create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  year        int,
  min_players int,
  max_players int,
  play_time   int,
  mechanics   text[] default '{}',
  description  text default '',
  image_url   text default '',
  source      text default 'manuel',           -- 'manuel' | 'BoardGameGeek'
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists games_owner_idx on public.games(owner_id);

-- ---------------------------------------------------------------------------
-- 3) NOTES (un membre note un jeu de 1 à 5)
--    Contrainte : une seule note par (membre, jeu).
-- ---------------------------------------------------------------------------
create table if not exists public.ratings (
  game_id     uuid not null references public.games(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  value       int not null check (value between 1 and 5),
  created_at  timestamptz not null default now(),
  primary key (game_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 4) SOIRÉES
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  event_date  date not null,
  event_time  text not null,
  place       text not null,
  min_players int not null default 2,
  max_players int not null default 8,
  notes       text default '',
  host_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5) PARTICIPATIONS aux soirées
-- ---------------------------------------------------------------------------
create table if not exists public.event_players (
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- =============================================================================
-- SÉCURITÉ (Row Level Security)
-- Tout le monde (connecté) peut LIRE la ludothèque, les soirées, les notes.
-- Chacun ne peut MODIFIER que ses propres données.
-- =============================================================================
alter table public.profiles      enable row level security;
alter table public.games         enable row level security;
alter table public.ratings       enable row level security;
alter table public.events        enable row level security;
alter table public.event_players enable row level security;

-- PROFILS : lecture publique, chacun gère le sien
drop policy if exists "profiles_read"   on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_read"   on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- JEUX : lecture publique, chacun gère les siens
drop policy if exists "games_read"   on public.games;
drop policy if exists "games_insert" on public.games;
drop policy if exists "games_update" on public.games;
drop policy if exists "games_delete" on public.games;
create policy "games_read"   on public.games for select using (true);
create policy "games_insert" on public.games for insert with check (auth.uid() = owner_id);
create policy "games_update" on public.games for update using (auth.uid() = owner_id);
create policy "games_delete" on public.games for delete using (auth.uid() = owner_id);

-- NOTES : lecture publique, chacun gère les siennes
drop policy if exists "ratings_read"   on public.ratings;
drop policy if exists "ratings_write"  on public.ratings;
drop policy if exists "ratings_update" on public.ratings;
drop policy if exists "ratings_delete" on public.ratings;
create policy "ratings_read"   on public.ratings for select using (true);
create policy "ratings_write"  on public.ratings for insert with check (auth.uid() = user_id);
create policy "ratings_update" on public.ratings for update using (auth.uid() = user_id);
create policy "ratings_delete" on public.ratings for delete using (auth.uid() = user_id);

-- SOIRÉES : lecture publique, l'hôte gère la sienne
drop policy if exists "events_read"   on public.events;
drop policy if exists "events_insert" on public.events;
drop policy if exists "events_update" on public.events;
drop policy if exists "events_delete" on public.events;
create policy "events_read"   on public.events for select using (true);
create policy "events_insert" on public.events for insert with check (auth.uid() = host_id);
create policy "events_update" on public.events for update using (auth.uid() = host_id);
create policy "events_delete" on public.events for delete using (auth.uid() = host_id);

-- PARTICIPATIONS : lecture publique, chacun gère la sienne
drop policy if exists "ep_read"   on public.event_players;
drop policy if exists "ep_write"  on public.event_players;
drop policy if exists "ep_delete" on public.event_players;
create policy "ep_read"   on public.event_players for select using (true);
create policy "ep_write"  on public.event_players for insert with check (auth.uid() = user_id);
create policy "ep_delete" on public.event_players for delete using (auth.uid() = user_id);

-- =============================================================================
-- CRÉATION AUTOMATIQUE DU PROFIL à l'inscription
-- Lit le nom et le rôle saisis au moment de l'inscription (raw_user_meta_data).
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'membre')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Terminé. Vos tables sont prêtes et sécurisées.
-- =============================================================================
