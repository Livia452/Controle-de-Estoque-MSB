-- ═══════════════════════════════════════════════════════════════════════
-- Painel de Estoque MSB — schema do Supabase
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase (Run).
-- Pode rodar de novo sem problema: usa "if not exists" / "or replace".
-- ═══════════════════════════════════════════════════════════════════════

-- ── PRODUTO ACABADO (PA) ──────────────────────────────────────────────
create table if not exists pa_products (
  code          text primary key,
  description   text not null default '',
  family        text not null default '',
  stock         integer not null default 0,
  stock_sa      integer not null default 0,
  sales_history jsonb not null default '{}'::jsonb, -- { "2026-01": 120, ... }
  updated_at    timestamptz not null default now()
);

-- ── MATERIAIS (ME / MP / MS) ──────────────────────────────────────────
create table if not exists materials (
  code             text primary key,
  description      text not null default '',
  type             text not null default '',   -- MP | ME | MS
  family           text not null default '',
  supplier         text not null default '',
  origin           text not null default '',
  lead_time        numeric,
  stock            numeric not null default 0,
  avg_forecast     numeric not null default 0,
  avg_consumption  numeric not null default 0,
  in_transit       numeric not null default 0,
  consumo_history  jsonb not null default '{}'::jsonb,  -- { "2026-01": 120, ... }
  forecast_history jsonb not null default '{}'::jsonb,  -- { "2026-01": 100, ... }
  transit_entries  jsonb not null default '[]'::jsonb,  -- [ { qty, date }, ... ]
  updated_at       timestamptz not null default now()
);

-- ── METADADOS DE IMPORTAÇÃO DE MATERIAIS ──────────────────────────────
-- 1 linha só (id fixo), guarda as datas da última importação de cada tipo
create table if not exists materials_meta (
  id                  boolean primary key default true, -- trava a tabela em 1 linha só
  stock_updated_at    timestamptz,
  consumo_updated_at  timestamptz,
  forecast_updated_at timestamptz,
  transito_updated_at timestamptz,
  bom_updated_at      timestamptz,
  constraint materials_meta_single_row check (id)
);
insert into materials_meta (id) values (true) on conflict (id) do nothing;

-- ── ESTRUTURA / BOM (quem consome quem) ───────────────────────────────
create table if not exists materials_bom (
  id         bigint generated always as identity primary key,
  code       text not null,
  parent     text not null,
  final      text not null default '',
  qty        numeric not null default 1,
  unit       text not null default ''
);
create index if not exists materials_bom_code_idx   on materials_bom (code);
create index if not exists materials_bom_parent_idx on materials_bom (parent);

-- ── ESTOQUE DOS NÓS DA ESTRUTURA SEM CADASTRO PRÓPRIO (ex.: PIs) ──────
create table if not exists materials_bom_stock (
  code       text primary key,
  stock      numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- ── LOTES DE PA COM VALIDADE (aba Alertas de Estoque) ─────────────────
-- Snapshot: cada importação substitui a tabela inteira (igual ao trânsito).
create table if not exists pa_lots (
  id         bigint generated always as identity primary key,
  code       text not null,            -- código do PA
  lot        text not null default '', -- nº do lote
  qty        numeric not null default 0,
  expiry     date,                     -- data de validade do lote
  updated_at timestamptz not null default now()
);
create index if not exists pa_lots_code_idx   on pa_lots (code);
create index if not exists pa_lots_expiry_idx on pa_lots (expiry);

-- ── SALDO POR LOTE (vem da importação de estoque, cruzado com pa_lots) ──
-- A planilha de validade dá código+lote+validade; a de estoque dá o saldo
-- atual de cada lote. A aba Alertas cruza os dois por (código + lote).
-- Snapshot: cada importação de estoque substitui a tabela inteira.
create table if not exists pa_lot_stock (
  code       text not null,
  lot        text not null,
  qty        numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (code, lot)
);

-- ── USUÁRIOS / PAPÉIS ──────────────────────────────────────────────────
-- ligada ao login do Supabase (auth.users); role controla quem vê "Gerenciar usuários"
create table if not exists profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════
-- RLS — leitura pública nos dados de negócio, escrita só autenticado.
-- profiles: cada um lê o próprio registro, admin lê todos; escrita bloqueada
-- pra qualquer cliente (só a função serverless, com service_role, escreve).
-- ═══════════════════════════════════════════════════════════════════════
alter table pa_lots             enable row level security;
alter table pa_lot_stock        enable row level security;
alter table pa_products         enable row level security;
alter table materials           enable row level security;
alter table materials_meta      enable row level security;
alter table materials_bom       enable row level security;
alter table materials_bom_stock enable row level security;
alter table profiles            enable row level security;

drop policy if exists pa_lots_read  on pa_lots;
drop policy if exists pa_lots_write on pa_lots;
create policy pa_lots_read  on pa_lots for select using (true);
create policy pa_lots_write on pa_lots for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists pa_lot_stock_read  on pa_lot_stock;
drop policy if exists pa_lot_stock_write on pa_lot_stock;
create policy pa_lot_stock_read  on pa_lot_stock for select using (true);
create policy pa_lot_stock_write on pa_lot_stock for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists pa_products_read  on pa_products;
drop policy if exists pa_products_write on pa_products;
create policy pa_products_read  on pa_products for select using (true);
create policy pa_products_write on pa_products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists materials_read  on materials;
drop policy if exists materials_write on materials;
create policy materials_read  on materials for select using (true);
create policy materials_write on materials for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists materials_meta_read  on materials_meta;
drop policy if exists materials_meta_write on materials_meta;
create policy materials_meta_read  on materials_meta for select using (true);
create policy materials_meta_write on materials_meta for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists materials_bom_read  on materials_bom;
drop policy if exists materials_bom_write on materials_bom;
create policy materials_bom_read  on materials_bom for select using (true);
create policy materials_bom_write on materials_bom for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists materials_bom_stock_read  on materials_bom_stock;
drop policy if exists materials_bom_stock_write on materials_bom_stock;
create policy materials_bom_stock_read  on materials_bom_stock for select using (true);
create policy materials_bom_stock_write on materials_bom_stock for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists profiles_read  on profiles;
drop policy if exists profiles_write on profiles;
create policy profiles_read on profiles for select
  using (
    auth.uid() = id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
-- nenhuma policy de insert/update/delete criada de propósito: só o service_role
-- (usado pela função serverless api/create-user.js) grava nessa tabela.

-- ═══════════════════════════════════════════════════════════════════════
-- BOOTSTRAP DO PRIMEIRO ADMIN
-- 1. Crie o primeiro usuário em Authentication → Users → Add user (Supabase).
-- 2. Pegue o UUID dele (aparece na lista de usuários) e rode, trocando os
--    valores abaixo:
-- ═══════════════════════════════════════════════════════════════════════
-- insert into profiles (id, email, role)
-- values ('COLE-O-UUID-DO-USUARIO-AQUI', 'seu-email@msbbrasil.com', 'admin')
-- on conflict (id) do update set role = 'admin';
