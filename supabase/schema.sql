-- Mon Poulailler : schéma Supabase (PostgreSQL)
-- À exécuter dans l'éditeur SQL de Supabase, sur un projet neuf.
-- Chaque table porte un ferme_id ; la Row Level Security limite chaque
-- utilisateur aux données de sa propre ferme.
-- Le fichier peut être exécuté une seule fois sur un projet vide.


-- ---------------------------------------------------------------- fermes
create table public.fermes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  proprietaire_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prenom text,
  localite text,
  telephone text,
  seuil_mortalite numeric not null default 5 check (seuil_mortalite > 0),
  poussins_par_carton_defaut integer not null default 100 check (poussins_par_carton_defaut > 0),
  cree_le timestamptz not null default now()
);

-- ---------------------------------------------------------------- bandes
create table public.bandes (
  id uuid primary key default gen_random_uuid(),
  ferme_id uuid not null references public.fermes (id) on delete cascade,
  nom text not null,
  type text not null default 'chair' check (type in ('chair', 'ponte')),
  date_arrivee date not null,
  nb_cartons numeric check (nb_cartons >= 0),
  poussins_par_carton numeric check (poussins_par_carton >= 0),
  prix_carton numeric check (prix_carton >= 0),
  nb_poussins numeric check (nb_poussins >= 0),        -- saisi à la main, sinon calculé
  prix_poussin numeric check (prix_poussin >= 0),      -- si achat hors carton
  morts_arrivee integer check (morts_arrivee >= 0),
  statut text not null default 'en_cours' check (statut in ('en_cours', 'terminee')),
  souche text,
  fournisseur text,
  notes text,
  cree_le timestamptz not null default now(),
  unique (id, ferme_id)
);

-- ---------------------------------------------------------------- mortalites
create table public.mortalites (
  id uuid primary key default gen_random_uuid(),
  ferme_id uuid not null references public.fermes (id) on delete cascade,
  bande_id uuid not null,
  date date not null default current_date,
  nombre integer not null check (nombre > 0),
  cause text,
  notes text,
  cree_le timestamptz not null default now(),
  foreign key (bande_id, ferme_id) references public.bandes (id, ferme_id) on delete cascade
);

-- ---------------------------------------------------------------- charges
create table public.charges (
  id uuid primary key default gen_random_uuid(),
  ferme_id uuid not null references public.fermes (id) on delete cascade,
  bande_id uuid,                                       -- vide = charge de toute la ferme
  date date not null default current_date,
  categorie text not null check (categorie in (
    'Aliment', 'Médicaments et vaccins', 'Matériel', 'Déplumage', 'Transport',
    'Litière', 'Énergie et eau', 'Main-d''œuvre', 'Autre')),
  type text,
  produit text,
  quantite numeric check (quantite >= 0),
  prix_unitaire numeric check (prix_unitaire >= 0),
  poids_unitaire numeric check (poids_unitaire >= 0),
  montant numeric not null check (montant >= 0),       -- calculé par l'application, modifiable
  fournisseur text,
  notes text,
  cree_le timestamptz not null default now(),
  foreign key (bande_id, ferme_id) references public.bandes (id, ferme_id) on delete cascade
);

-- ---------------------------------------------------------------- ventes
-- Pour l'instant seuls les poulets sont vendus. Pour ajouter un produit,
-- élargir la contrainte produit_valide, sans toucher aux ventes existantes.
create table public.ventes (
  id uuid primary key default gen_random_uuid(),
  ferme_id uuid not null references public.fermes (id) on delete cascade,
  bande_id uuid,                                       -- facultatif pour de futurs produits
  date date not null default current_date,
  produit text not null default 'poulets',
  quantite numeric not null check (quantite > 0),
  prix_unitaire numeric not null check (prix_unitaire >= 0),
  montant numeric generated always as (quantite * prix_unitaire) stored,
  statut text not null default 'paye' check (statut in ('paye', 'credit')),
  client text,
  telephone_client text,
  poids_moyen numeric check (poids_moyen >= 0),
  notes text,
  cree_le timestamptz not null default now(),
  constraint produit_valide check (produit in ('poulets')),
  constraint poulets_avec_bande check (produit <> 'poulets' or bande_id is not null),
  foreign key (bande_id, ferme_id) references public.bandes (id, ferme_id) on delete cascade
);

create index on public.bandes (ferme_id);
create index on public.mortalites (bande_id);
create index on public.charges (ferme_id, bande_id);
create index on public.ventes (ferme_id, bande_id);

-- ---------------------------------------------------------------- sécurité
create or replace function public.est_ma_ferme(f uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.fermes where id = f and proprietaire_id = auth.uid());
$$;

alter table public.fermes enable row level security;
alter table public.bandes enable row level security;
alter table public.mortalites enable row level security;
alter table public.charges enable row level security;
alter table public.ventes enable row level security;

create policy "ma ferme" on public.fermes for all
  using (proprietaire_id = auth.uid()) with check (proprietaire_id = auth.uid());
create policy "ma ferme" on public.bandes for all
  using (public.est_ma_ferme(ferme_id)) with check (public.est_ma_ferme(ferme_id));
create policy "ma ferme" on public.mortalites for all
  using (public.est_ma_ferme(ferme_id)) with check (public.est_ma_ferme(ferme_id));
create policy "ma ferme" on public.charges for all
  using (public.est_ma_ferme(ferme_id)) with check (public.est_ma_ferme(ferme_id));
create policy "ma ferme" on public.ventes for all
  using (public.est_ma_ferme(ferme_id)) with check (public.est_ma_ferme(ferme_id));

-- ---------------------------------------------------------------- vue bilan_bandes
-- Mêmes règles que l'application : une valeur vide vaut 0,
-- une division par 0 donne null (affichée « – »).
-- security_invoker : la vue respecte la RLS de l'utilisateur connecté.
create or replace view public.bilan_bandes
with (security_invoker = true) as
with base as (
  select
    b.*,
    case
      when coalesce(b.nb_poussins, 0) > 0 then b.nb_poussins
      else coalesce(b.nb_cartons, 0) * coalesce(nullif(b.poussins_par_carton, 0), f.poussins_par_carton_defaut)
    end as recus
  from public.bandes b
  join public.fermes f on f.id = b.ferme_id
),
couts as (
  select
    base.*,
    case
      when coalesce(prix_carton, 0) > 0 then coalesce(nb_cartons, 0) * prix_carton
      else recus * coalesce(prix_poussin, 0)
    end as cout_poussins
  from base
),
m as (
  select bande_id, sum(nombre) as morts from public.mortalites group by bande_id
),
v as (
  select
    bande_id,
    coalesce(sum(quantite) filter (where produit = 'poulets'), 0) as vendus,
    coalesce(sum(montant), 0) as ca,
    coalesce(sum(montant) filter (where produit = 'poulets'), 0) as ca_poulets,
    coalesce(sum(montant) filter (where statut = 'credit'), 0) as credits
  from public.ventes
  where bande_id is not null
  group by bande_id
),
c as (
  select
    bande_id,
    coalesce(sum(montant) filter (where categorie = 'Aliment'), 0) as aliment,
    coalesce(sum(montant) filter (where categorie = 'Médicaments et vaccins'), 0) as medicaments,
    coalesce(sum(montant) filter (where categorie = 'Matériel'), 0) as materiel,
    coalesce(sum(montant) filter (where categorie = 'Déplumage'), 0) as deplumage,
    coalesce(sum(montant) filter (where categorie not in ('Aliment', 'Médicaments et vaccins', 'Matériel', 'Déplumage')), 0) as autres,
    coalesce(sum(montant), 0) as total
  from public.charges
  where bande_id is not null
  group by bande_id
),
calc as (
  select
    k.id as bande_id,
    k.ferme_id,
    k.nom,
    k.statut,
    k.date_arrivee,
    (current_date - k.date_arrivee) as age_jours,
    k.recus,
    coalesce(k.morts_arrivee, 0) + coalesce(m.morts, 0) as morts,
    coalesce(v.vendus, 0) as vendus,
    greatest(0, k.recus - coalesce(k.morts_arrivee, 0) - coalesce(m.morts, 0) - coalesce(v.vendus, 0)) as effectif_vivant,
    k.cout_poussins,
    coalesce(c.aliment, 0) as charges_aliment,
    coalesce(c.medicaments, 0) as charges_medicaments,
    coalesce(c.materiel, 0) as charges_materiel,
    coalesce(c.deplumage, 0) as charges_deplumage,
    coalesce(c.autres, 0) as charges_autres,
    k.cout_poussins + coalesce(c.total, 0) as total_charges,
    coalesce(v.ca, 0) as chiffre_affaires,
    coalesce(v.ca_poulets, 0) as ca_poulets,
    coalesce(v.credits, 0) as credits_clients
  from couts k
  left join m on m.bande_id = k.id
  left join v on v.bande_id = k.id
  left join c on c.bande_id = k.id
)
select
  calc.*,
  case when recus > 0 then round(100.0 * morts / recus, 2) end as taux_mortalite,
  chiffre_affaires - total_charges as benefice,
  case when effectif_vivant + vendus > 0 then round(total_charges / (effectif_vivant + vendus), 0) end as cout_revient,
  case when vendus > 0 then round(ca_poulets / vendus, 0) end as prix_vente_moyen
from calc;

-- ---------------------------------------------------------------- droits
-- Seuls les utilisateurs connectés accèdent aux tables ; la RLS filtre ensuite par ferme.
revoke all on public.fermes, public.bandes, public.mortalites, public.charges, public.ventes, public.bilan_bandes from anon;
grant select, insert, update, delete on public.fermes, public.bandes, public.mortalites, public.charges, public.ventes to authenticated;
grant select on public.bilan_bandes to authenticated;
