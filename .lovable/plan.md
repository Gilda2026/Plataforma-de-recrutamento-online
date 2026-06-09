# Expansão da Plataforma de Recrutamento

Vou transformar a app atual (focada em CVs/entrevistas/testes) numa plataforma de concursos públicos com perfil de candidato, área administrativa com permissões e impressão de listas/concursos.

## 1. Base de dados (nova migração)

### Roles & permissões
- `enum app_role`: `admin`, `gestor`, `candidato`
- `user_roles` (user_id, role) + função `has_role()` SECURITY DEFINER
- Trigger no signup: novos utilizadores recebem role `candidato` por defeito

### Catálogos administrativos
- `careers` — carreiras (designação, descrição)
- `occupations` — ocupações profissionais (nome, career_id)
- `institutions` — sectores/instituições (nome, tipo)
- `provinces` — províncias (pré-populadas com as 11 de Moçambique)
- `districts` — distritos (province_id, nome)

### Perfil do candidato
- `candidate_profiles` (user_id único)
  - Dados pessoais: nome_completo, género, estado_civil, data_nascimento, nome_pai, nome_mae, province_id, district_id, telefone
  - Documento: tipo_documento (BI/Passaporte/DIRE), numero_documento, validade_documento
  - Habilitação literária (nível)
- `candidate_education` — formação complementar (tipo, instituição, curso, ano)
- `candidate_experience` — experiência profissional (empresa, cargo, início, fim, descrição)
- `candidate_internships` — estágios pré-profissionais
- `candidate_courses` — cursos de formação específica
- (opcional) `candidate_extras` — JSONB para elementos adicionais propostos

### Concursos & candidaturas
- `contests` — concurso (designação, ano, institution_id, status: rascunho/publicado/encerrado, criado_por)
- `contest_provinces` — N:N concurso × províncias
- `contest_positions` — concurso × ocupação × num_vagas
- `applications` — candidatura (candidate_user_id, contest_id, contest_position_id, status: submetida/em_análise/entrevista/aprovado/rejeitado, score_final)
- Reusar tabelas existentes `interview_sessions` e `test_assignments` ligando a `application_id`

### RLS
- Admin/gestor: acesso total via `has_role()`
- Candidato: lê/edita apenas o próprio perfil e as próprias candidaturas
- Catálogos: leitura pública (autenticados), escrita só admin/gestor

## 2. Server functions (`src/lib/*.functions.ts`)

- `profile.functions.ts` — get/upsert do perfil, gerir educação/experiência/estágios/cursos
- `catalog.functions.ts` — CRUD de carreiras, ocupações, instituições, províncias, distritos
- `contests.functions.ts` — criar/publicar/encerrar concurso, listar concursos publicados, candidatar-se, listar candidaturas, marcar aprovados
- Manter `recruitment.functions.ts` (análise CV, entrevistas, testes) e ligá-las a `application_id`

## 3. Rotas (frontend)

### Públicas / candidato (`_authenticated/`)
- `/concursos` — listagem de concursos publicados (filtro província/ocupação)
- `/concursos/$id` — detalhe + botão "Candidatar-me" (escolhe carreira → ocupação)
- `/perfil` — formulário multi-secção do perfil
- `/minhas-candidaturas` — estado das candidaturas

### Admin (`_authenticated/admin/`) — protegido por `has_role('admin'|'gestor')`
- `/admin` — dashboard
- `/admin/utilizadores` — registar utilizadores e atribuir roles
- `/admin/carreiras` — CRUD + imprimir
- `/admin/ocupacoes` — CRUD (associar a carreira)
- `/admin/instituicoes` — CRUD + imprimir
- `/admin/localidades` — províncias e distritos
- `/admin/concursos` — listar/criar/publicar
- `/admin/concursos/novo` — wizard (designação, ano, instituição, províncias, ocupações+vagas)
- `/admin/concursos/$id` — detalhe + candidatos + **imprimir concurso** + **imprimir aprovados**

### Impressão
- Componente `PrintLayout` + `window.print()` com CSS `@media print`
- Páginas dedicadas `/admin/print/concurso/$id` e `/admin/print/aprovados/$id`

## 4. Navegação
- Sidebar adapta-se ao role:
  - Candidato: Concursos, Meu Perfil, Minhas Candidaturas
  - Admin/Gestor: secção "Administração" com tudo acima
- Redirect pós-login conforme role

## Notas técnicas
- Seed inicial das 11 províncias de Moçambique + alguns distritos
- Usar `react-hook-form` + `zod` nos formulários longos (perfil, concurso)
- Validações server-side em todos os server functions
- Manter design tokens Navy Trust existentes

Volume: ~1 migração + ~15-20 ficheiros novos. Implementação em sequência: BD → catálogos admin → perfil candidato → concursos → candidaturas → impressões.