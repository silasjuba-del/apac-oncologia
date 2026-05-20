-- ═══════════════════════════════════════════════════════════════
-- ONCOLOGIA HB — Setup Supabase
-- Cole este SQL em: Supabase → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════

-- 1. Tabela de pacientes
create table if not exists pacientes (
  id           uuid default gen_random_uuid() primary key,
  pac_id       text unique not null,
  dados        jsonb not null default '{}',
  criado_em    timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- 2. Tabela de configurações (agenda, fila, triagens, historico_qt)
create table if not exists configuracoes (
  chave        text primary key,
  valor        jsonb,
  atualizado_em timestamptz default now()
);

-- 3. Índice para busca rápida por nome/cpf/cns dentro do JSON
create index if not exists idx_pacientes_dados on pacientes using gin(dados);
create index if not exists idx_pacientes_atualizado on pacientes (atualizado_em desc);

-- 4. Row Level Security (acesso público por enquanto — adicionar auth depois)
alter table pacientes    enable row level security;
alter table configuracoes enable row level security;

create policy "acesso_total_pacientes"
  on pacientes for all using (true) with check (true);

create policy "acesso_total_config"
  on configuracoes for all using (true) with check (true);

-- 5. Trigger: atualiza atualizado_em automaticamente
create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_pacientes_atualizado
  before update on pacientes
  for each row execute function set_atualizado_em();

create trigger trg_config_atualizado
  before update on configuracoes
  for each row execute function set_atualizado_em();

-- ✅ Pronto! Tabelas criadas com sucesso.
select 'Setup concluído!' as resultado;
