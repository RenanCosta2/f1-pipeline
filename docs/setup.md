# 🚀 Guia de Setup e Execução Local

Este guia detalha o passo a passo completo para configurar, inicializar e executar localmente o pipeline de dados de **Fórmula 1** e o **Dashboard Analítico** do zero.

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de possuir instalado em sua máquina:

1. **Git**: Para clonar o repositório.
2. **Docker Desktop** (versão 24.x ou superior) com suporte a **Docker Compose v2**:
   - No **Windows**: Recomenda-se utilizar o backend **WSL 2** (Windows Subsystem for Linux).
   - No **Linux / macOS**: Instalação nativa do Docker Engine e Compose.
3. **Recursos de Hardware Recomendados**:
   - Memória RAM mínima: **8 GB** (alocados para o Docker ao rodar Airflow, Celery Workers, Redis, Postgres e Next.js).
   - Espaço em disco livre: **10 GB+** (para imagens Docker, volumes de cache do FastF1 e dados do Airflow).
4. **Conta no Supabase**:
   - Um projeto ativo no [Supabase](https://supabase.com).

---

## ☁️ 1. Configuração do Supabase (Storage & Banco)

O pipeline utiliza a infraestrutura gerenciada do Supabase como Data Lake (arquivos Parquet brutos) e Data Warehouse (tabelas e views relacionais).

### 1.1 Criar o Bucket S3 (Camada Bronze)
1. Acesse o painel do seu projeto no Supabase.
2. No menu lateral, acesse **Storage** e clique em **New Bucket**.
3. Defina o nome do bucket como `f1-lake` (ou o nome que preferir).
4. Configure como bucket **privado** (não público).

### 1.2 Gerar Credenciais S3 (S3 Access Keys)
1. No menu lateral, vá em **Storage** ➔ **CONFIGURATION** ➔ **S3**.
2. Na seção **Access keys**, clique em **New access key**.
3. Copie o **Access Key ID** e o **Secret Access Key**.
4. Anote também o endpoint S3 fornecido na tela, com o formato:
   ```text
   https://<PROJECT_REF>.storage.supabase.co/storage/v1/s3
   ```

### 1.3 Obter a Connection String do PostgreSQL
1. No menu superior, vá em **Connect**.
2. Na seção **Direct (Connection String)**, selecione a aba **URI** e escolha o modo **Session pooler** (porta `5432` através do Pooler).
3. A URL terá o formato:
   ```text
   postgresql://postgres.<PROJECT_REF>:<SUA_SENHA>@aws-0-<REGIAO>.pooler.supabase.com:5432/postgres
   ```
> [!TIP]
> Caso sua operadora de internet tenha problemas de resolução IPv6, a string do pooler (`pooler.supabase.com`) na porta 5432 garante compatibilidade direta com IPv4.

---

## 🔐 2. Configuração de Variáveis de Ambiente (`.env`)

Clone o repositório e crie o arquivo de configuração `.env` a partir do template:

```bash
# 1. Clone o repositório
git clone https://github.com/RenanCosta2/f1-pipeline.git
cd f1-pipeline

# 2. Crie seu arquivo .env
cp .env.example .env
```

Abra o arquivo `.env` e preencha com as credenciais obtidas no passo anterior:

```dotenv
# ==============================================================================
# CONFIGURAÇÕES DO SUPABASE STORAGE (S3 COMPATÍVEL)
# ==============================================================================
BUCKET_NAME=f1-lake
AWS_REGION=us-west-2
S3_ENDPOINT_URL=https://<PROJECT_REF>.storage.supabase.co/storage/v1/s3
AWS_ACCESS_KEY_ID=seu_access_key_aqui
AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui

# ==============================================================================
# CONFIGURAÇÕES DO BANCO POSTGRESQL (SUPABASE)
# ==============================================================================
POSTGRES_CONNECTION_URL=postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres

# ==============================================================================
# CONFIGURAÇÕES DO AIRFLOW
# ==============================================================================
# Linux/macOS: execute `id -u` no terminal. Windows/WSL2: mantenha 50000 ou 501.
AIRFLOW_UID=50000
```

---

## 🏗️ 3. Construção das Imagens Docker

O pipeline do Airflow orquestra as tarefas através do `DockerOperator`. Isso significa que as imagens do **extrator (Python)** e do **transformador (dbt)** precisam existir no host Docker:

```bash
# Constrói as imagens de Ingestão e dbt
docker-compose --profile tools build
```

*(Opcional)* Se preferir construir individualmente via CLI Docker:
```bash
docker build -t f1-pipeline-ingestion:latest ./ingestion
docker build -t f1-pipeline-dbt:latest ./transform
```

---

## ⚡ 4. Inicialização dos Serviços

Com o arquivo `.env` configurado e as imagens construídas, inicialize todo o ambiente do pipeline:

```bash
# Inicializa e executa todos os microsserviços em segundo plano
docker-compose up -d
```

Para verificar o status dos containers:
```bash
docker ps
```

---

## 🔗 5. Configurar Conexão do Airflow com o Supabase

A DAG principal (`f1_pipeline_dag`) precisa consultar o banco no Supabase para verificar quais GPs e sessões ainda não foram ingeridos. Para isso, criamos a conexão `supabase_postgres` no Airflow:

Execute o comando abaixo substituindo pela sua connection string do `.env`:

```bash
docker exec f1-pipeline-airflow-scheduler-1 airflow connections add supabase_postgres \
  --conn-uri "postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres"
```

> [!NOTE]
> Você também pode cadastrar essa conexão manualmente na interface web do Airflow em **Admin** ➔ **Connections** com o Connection ID: `supabase_postgres`.

---

## 🏎️ 6. Execução do Pipeline de Dados

### Opção A: Execução Automática via Airflow (Recomendado)
1. Acesse o painel do Airflow em seu navegador:
   - **URL**: [http://localhost:8080](http://localhost:8080)
   - **Usuário**: `airflow`
   - **Senha**: `airflow`
2. Localize a DAG **`f1_pipeline_dag`**.
3. Ative o toggle para `Unpause` (ou dispare manualmente clicando em **Trigger DAG**).
4. O Airflow executará o ciclo completo:
   ```text
   get_missing_gps ➔ f1_ingest_schedule ➔ f1_ingestion (em paralelo) ➔ f1_dbt (build)
   ```

### Opção B: Execução Manual dos Modelos dbt (CLI)
Caso queira testar ou reconstruir os modelos do dbt diretamente via terminal sem esperar pelo Airflow:

```bash
# Executa todos os testes e compilação de views e tabelas
docker-compose --profile tools run --rm dbt build

# Ou rodar apenas os modelos da camada analítica de website
docker-compose --profile tools run --rm dbt build --select website.*
```

---

## 📊 7. Acessando o Dashboard

Com as views do dbt compiladas no Supabase, acesse o dashboard web interativo:

👉 **[http://localhost:3000](http://localhost:3000)**

- **Visão Geral (`/`)**: Raio-X do circuito atual, tempos ao vivo e contagem regressiva da próxima corrida.
- **Temporada (`/season`)**: Classificação mundial com slider dinâmico de rodadas, gráficos de evolução de pontos e métricas de vitórias e pódios.

---

## 🛠️ Comandos Úteis do Dia a Dia

### Gerenciamento de Containers
```bash
# Ver logs em tempo real do Dashboard
docker logs -f f1-dashboard

# Ver logs do Scheduler do Airflow
docker logs -f f1-pipeline-airflow-scheduler-1

# Reiniciar o container do dashboard
docker restart f1-dashboard

# Parar todos os serviços
docker-compose down

# Parar e remover todos os volumes locais
docker-compose down -v
```

### Operações com dbt
```bash
# Gerar documentação do dbt
docker-compose --profile tools run --rm dbt docs generate

# Executar apenas testes de qualidade e integridade
docker-compose --profile tools run --rm dbt test
```

---
