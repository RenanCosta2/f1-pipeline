# 🚀 Guia de Setup e Execução Local

Este guia detalha o passo a passo completo para configurar, inicializar e executar localmente o pipeline de dados de **Fórmula 1** e o **Web App Analítico (Pitwall)** do zero.

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de possuir instalado em sua máquina:

1. **Git**: Para clonar o repositório.
2. **Docker Desktop** (versão 24.x ou superior) com suporte a **Docker Compose v2**:
   - No **Windows**: Recomenda-se utilizar o backend **WSL 2** (Windows Subsystem for Linux).
   - No **Linux / macOS**: Instalação nativa do Docker Engine e Compose.
3. **Recursos de Hardware Recomendados**:
   - Memória RAM mínima: **8 GB** (alocados para o Docker ao rodar Airflow, Celery Workers, Redis, Postgres e Next.js).
   - Espaço em disco livre: **10 GB+** (para imagens Docker, volumes de cache do FastF1 e metadados do Airflow).
4. **Contas em Cloud**:
   - Um projeto no **[Google Cloud Platform (GCP)](https://console.cloud.google.com)** (para Google Cloud Storage e BigQuery).
   - Um projeto ativo no **[Supabase](https://supabase.com)** (para o banco PostgreSQL da *Serving Layer*).

---

## ☁️ 1. Configuração do Google Cloud Platform (Data Lake & Data Warehouse)

O Google Cloud hospeda o **Data Lake** (arquivos Parquet brutos no GCS) e o **Data Warehouse** (camadas `bronze`, `silver`, `gold` e `website` no BigQuery).

### 1.1 Criar o Bucket no Google Cloud Storage (GCS)
1. No console do GCP, acesse **Cloud Storage** ➔ **Buckets** e clique em **Create**.
2. Defina o nome do bucket (ex: `f1-lake-storage`).
3. Escolha a região (ex: `us-east1` — importante manter a mesma região dos datasets do BigQuery) e mantenha o acesso como **Privado**.

### 1.2 Gerar a Service Account (`gcp-credentials.json`)
1. No console do GCP, acesse **IAM & Admin** ➔ **Service Accounts** e clique em **Create Service Account**.
2. Conceda as seguintes permissões (*Roles*) para a conta de serviço:
   - **Storage Admin** (`roles/storage.admin`) — leitura e escrita de Parquets no GCS.
   - **BigQuery Admin** (`roles/bigquery.admin`) — criação de datasets, tabelas, views e execução de *Load Jobs* e queries do `dbt`.
3. Na aba **Keys** da Service Account criada, clique em **Add Key** ➔ **Create new key** ➔ **JSON**.
4. Salve o arquivo baixado na raiz do repositório com o nome **`gcp-credentials.json`**.

---

## 🗄️ 2. Configuração do Supabase (Serving Layer PostgreSQL)

O Supabase atua como a **Serving Layer** relacional de baixa latência que armazena as tabelas materializadas e indexadas (`website.v_*`) consumidas pelo front-end Next.js.

### 2.1 Obter a Connection String do PostgreSQL
1. Acesse o painel do seu projeto no Supabase e clique no botão **Connect** no menu superior.
2. Na seção **Connection String**, selecione a aba **URI**. O projeto usa **duas conexões com propostas distintas**, ambas pelo pooler (compatível com IPv4):

   | Uso | Modo | Porta | Variável | Por quê |
   | :--- | :--- | :---: | :--- | :--- |
   | **Pipeline** (`sync_serving_layer.py`) | Session Pooler | `5432` | `POSTGRES_CONNECTION_URL` | Sessão dedicada: necessária para `COPY`, DDL e a troca atômica de tabelas. |
   | **Site** (Next.js / Vercel) | Transaction Pooler | `6543` | `POSTGRES_WEB_URL` | Conexões multiplexadas: ideal para muitas leituras curtas em ambiente serverless. |

3. As URLs terão o formato:
   ```text
   postgresql://postgres.<PROJECT_REF>:<SUA_SENHA>@aws-0-<REGIAO>.pooler.supabase.com:5432/postgres   # pipeline
   postgresql://postgres.<PROJECT_REF>:<SUA_SENHA>@aws-0-<REGIAO>.pooler.supabase.com:6543/postgres   # site
   ```
> [!TIP]
> No deploy da Vercel, configure `POSTGRES_WEB_URL` (porta `6543`) nas variáveis de ambiente do projeto. Se ela for omitida, o site deriva a URL trocando `5432` por `6543` a partir de `POSTGRES_CONNECTION_URL`.

---

## 🔐 3. Configuração de Variáveis de Ambiente (`.env`)

Clone o repositório e crie o arquivo `.env` a partir do template `.env.example`:

```bash
# 1. Clone o repositório
git clone https://github.com/RenanCosta2/f1-pipeline.git
cd f1-pipeline

# 2. Crie seu arquivo .env
cp .env.example .env
```

Abra o arquivo `.env` e preencha com as credenciais obtidas:

```dotenv
# ==============================================================================
# 1. GOOGLE CLOUD STORAGE & BIGQUERY (DATA LAKE & DATA WAREHOUSE)
# ==============================================================================
GCP_PROJECT_ID=f1-analytics-platform
BUCKET_NAME=f1-lake-storage
GOOGLE_APPLICATION_CREDENTIALS=gcp-credentials.json

# ==============================================================================
# 2. SUPABASE POSTGRESQL (SERVING LAYER - WEBSITE MARTS)
# ==============================================================================
# Pipeline (escrita) -> Session Pooler, porta 5432
POSTGRES_CONNECTION_URL=postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
# Site (leitura) -> Transaction Pooler, porta 6543
POSTGRES_WEB_URL=postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres

# ==============================================================================
# 3. APACHE AIRFLOW CONFIGURATION
# ==============================================================================
AIRFLOW_UID=50000

# ==============================================================================
# 4. FORMULA 1 ACCOUNT (OPCIONAL - FASTF1 LIVETIMING)
# ==============================================================================
F1_USERNAME=
F1_PASSWORD=
```

> [!IMPORTANT]
> Certifique-se também de copiar o arquivo `gcp-credentials.json` para `orchestration/config/gcp-credentials.json` (ou mantê-lo na raiz do projeto) para que tanto os containers de ferramentas quanto o Airflow tenham acesso às credenciais do GCP.

---

## 🏗️ 4. Construção das Imagens Docker

O Airflow executa as tarefas de ingestão, transformação (`dbt`) e sincronização através do `DockerOperator`. Por isso, construa as imagens locais de ferramentas antes de iniciar o pipeline:

```bash
# Constrói as imagens de Ingestão (f1-pipeline-ingestion) e dbt (f1-pipeline-dbt)
docker compose --profile tools build
```

*(Opcional)* Se preferir construir cada imagem individualmente:
```bash
docker build -t f1-pipeline-ingestion:latest ./ingestion
docker build -t f1-pipeline-dbt:latest ./transform
```

---

## ⚡ 5. Inicialização dos Serviços

Com o `.env`, o `gcp-credentials.json` e as imagens prontas, suba os serviços em segundo plano:

```bash
# Inicializa Airflow (Scheduler, Worker, API Server, DAG Processor), Redis, Postgres e Website
docker compose up -d
```

Para verificar se todos os containers estão saudáveis (`healthy` / `running`):
```bash
docker compose ps
```

---

## 🏎️ 6. Execução do Pipeline de Dados

### Opção A: Execução Automática via Airflow (Recomendado)
1. Acesse a interface web do Airflow:
   - **URL**: [http://localhost:8080](http://localhost:8080)
   - **Usuário**: `airflow`
   - **Senha**: `airflow`
2. As DAGs disponíveis são:
   - **`f1_schedule_dag`**: Executa mensalmente (ou sob demanda passando `params.year`) para carregar o calendário oficial da temporada em `bronze.schedule` no BigQuery.
   - **`f1_pipeline_dag`**: Executa a cada hora nos finais de semana de corrida. Identifica sessões pendentes no BigQuery e dispara o fluxo completo:
     ```text
     get_missing_gps ➔ f1_ingestion (paralelo) ➔ f1_dbt (dbt build) ➔ f1_sync_serving
     ```
   - **`f1_manual_pipeline_dag`**: Permite reprocessar manualmente qualquer temporada, intervalo de GPs ou sessão específica, com suporte à flag `force` para sobrescrever arquivos e recarregar as tabelas.
3. Ative o toggle (`Unpause`) nas DAGs desejadas.

### Opção B: Execução Manual via CLI (Desenvolvimento & Manutenção)
Você pode executar qualquer etapa diretamente via terminal usando os containers do perfil `tools`:

```bash
# 1. Carregar sementes (seeds) e rodar todos os modelos e testes do dbt no BigQuery
docker compose --profile tools run --rm dbt seed
docker compose --profile tools run --rm dbt build

# 2. Compilar e testar apenas modelos específicos do dbt
docker compose --profile tools run --rm dbt build --select v_driver_season_summary+ v_constructor_season_summary+

# 3. Sincronizar incrementalmente todas as views do BigQuery para o Supabase (PostgreSQL)
docker compose --profile tools run --rm ingestion python ingestion/sync_serving_layer.py

# 4. Forçar recarga completa (--full-refresh) de tabelas específicas na Serving Layer
docker compose --profile tools run --rm ingestion python ingestion/sync_serving_layer.py --full-refresh --select v_driver_career_summary v_constructor_career_summary
```

---

## 📊 7. Acessando o Web App (Pitwall)

Com a *Serving Layer* sincronizada no Supabase, acesse a aplicação web interativa localmente (ou na versão em produção em **[f1-pitwall-hub.vercel.app](https://f1-pitwall-hub.vercel.app)**):

👉 **[http://localhost:3000](http://localhost:3000)**

Principais rotas da aplicação:
- **Visão Geral (`/`)**: Resumo da temporada, próxima corrida com contagem regressiva e últimos resultados.
- **Temporada (`/season`)**: Classificação de pilotos e construtores, evolução corrida a corrida e matriz completa da temporada.
- **Corrida & Telemetria (`/race` & `/telemetry`)**: Ritmo de corrida (*race pace*), volta a volta, estratégias de pneus, volta ideal e *Speed Trap*.
- **Pilotos (`/drivers` & `/drivers/[id]`)**: Catálogo histórico e perfil completo de carreira, títulos mundiais, métricas por temporada e desempenho por pista.
- **Equipes (`/teams` & `/teams/[id]`)**: Catálogo de construtores, títulos mundiais, dobradinhas, primeiras filas, evolução histórica e pilotos que correram pela equipe.
- **Circuitos (`/circuits` & `/circuits/[id]`)**: Enciclopédia de autódromos da F1, ficha técnica, traçados, recordes de volta, maiores vencedores e histórico de edições.

---

## 🛠️ Comandos Úteis do Dia a Dia

```bash
# Ver logs em tempo real do Web App Next.js
docker logs -f f1-website

# Ver logs do Scheduler ou Worker do Airflow
docker logs -f f1-scheduler
docker logs -f f1-worker

# Parar todos os serviços
docker compose down

# Parar serviços e remover volumes locais
docker compose down -v
```
