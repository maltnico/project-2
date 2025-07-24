-- Migration pour créer la table vault
-- Cette table stocke de manière sécurisée les configurations sensibles

create table if not exists public.vault (
  id uuid default gen_random_uuid() primary key,
  key text not null unique,
  value text not null,
  encrypted boolean default false,
  description text,
  category text not null check (category in ('mail', 'database', 'api', 'system', 'security')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index pour améliorer les performances
create index if not exists vault_key_idx on public.vault (key);
create index if not exists vault_category_idx on public.vault (category);
create index if not exists vault_created_at_idx on public.vault (created_at);

-- RLS (Row Level Security)
alter table public.vault enable row level security;

-- Politique pour permettre aux administrateurs de gérer le vault
create policy "Admin can manage vault" on public.vault
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Fonction pour mettre à jour automatiquement updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Trigger pour updated_at
create trigger if not exists vault_updated_at
  before update on public.vault
  for each row execute procedure public.handle_updated_at();

-- Commentaires pour la documentation
comment on table public.vault is 'Stockage sécurisé des configurations sensibles';
comment on column public.vault.key is 'Clé unique pour identifier la configuration';
comment on column public.vault.value is 'Valeur de la configuration (peut être chiffrée)';
comment on column public.vault.encrypted is 'Indique si la valeur est chiffrée';
comment on column public.vault.description is 'Description de la configuration';
comment on column public.vault.category is 'Catégorie de la configuration';
