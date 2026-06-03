# Formula 1 Data Pipeline

Este projeto implementa um pipeline de dados ponta a ponta (*end-to-end*) focado na ingestão, estruturação e processamento de dados históricos e recentes da **Fórmula 1**.

O pipeline foi desenhado para ser incremental. À medida que o campeonato avança e novos Grandes Prêmios acontecem, o fluxo processa novas informações, permitindo que a aplicação evolua dinamicamente.

O objetivo é disponibilizar dados estruturados para possibilitar a análise e visualização de:
- 🏎️ **Métricas de Corrida**: Posições finais, pontos acumulados e classificação.
- ⏱️ **Desempenho em Pista**: Tempos de volta (*lap times*) e telemetria.
- 📅 **Calendário Dinâmico**: Cronograma de sessões (Treinos Livres, Sprint e Corrida).


## 🛠️ Tecnologias Utilizadas

O projeto é construído utilizando as seguintes ferramentas de Engenharia de Dados:

* ![Apache Airflow](https://img.shields.io/badge/Apache%20Airflow-017CE2?style=flat-square&logo=Apache%20Airflow&logoColor=white) **Orquestração** — Responsável por agendar, monitorar e garantir o fluxo incremental de ponta a ponta.
* ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) **Ingestão & Extração** — Scripts de ingestão consumindo a biblioteca [FastF1](https://github.com/theOehrly/Fast-F1) com processamento otimizado usando `pandas` e serialização com `pyarrow` (Parquet).
* ![dbt](https://img.shields.io/badge/dbt-FF694B?style=flat-square&logo=dbt&logoColor=white) **Transformação** — Utilizado para modelagem de dados e implementação da arquitetura Medalhão.
* ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white) **Banco de Dados & Storage** — Banco relacional PostgreSQL para as tabelas finais e estruturadas, integrado a um bucket S3 para persistência de dados brutos (Raw/Parquet).
* ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) / ![Docker Compose](https://img.shields.io/badge/Docker%20Compose-2496ED?style=flat-square&logo=docker&logoColor=white) **Ambiente & Infraestrutura** — Garante que todo o pipeline e seus microsserviços rodem de forma idêntica localmente ou em produção.


## Arquitetura do Projeto

O pipeline segue o modelo **ELT (Extract, Load, Transform)** e é totalmente orquestrado e automatizado para refletir novos resultados à medida que a temporada avança.

![Arquitetura do Pipeline de Dados F1](docs/f1_pipeline_architecture.png)

### Componentes e Fluxo dos Dados

1. **Orquestração (Apache Airflow)**:
   - Monitora e gerencia o fluxo de ponta a ponta. 
   - Conforme o calendário da temporada avança, o Airflow dispara de forma incremental o script de extração e, na sequência, as transformações do dbt.

2. **Extração & Ingestão (FastF1 & Docker)**:
   - Um script em Python rodando em um ambiente isolado (Docker) se conecta à API do **FastF1** para extrair os resultados e telemetrias mais recentes da rodada.

3. **Armazenamento Raw (Supabase S3)**:
   - Os dados extraídos são gravados e versionados como arquivos brutos (no formato Parquet) em um Bucket S3 dentro da estrutura do **Supabase**.

4. **Carga e Transformação Medalhão (Postgres & dbt)**:
   - Os arquivos brutos são carregados no banco de dados PostgreSQL do **Supabase**, iniciando a modelagem **Medalhão**, feito pelo **dbt (data build tool)** rodando sob demanda via Docker:
     - 🥉 **Bronze (Raw Data)**: Dados em seu formato original bruto de extração.
     - 🥈 **Silver (Clean Data)**: Processamento e limpeza dos dados. Nesta camada, os dados são limpos, tipados e estruturados.
     - 🥇 **Gold (Metrics)**: Tabelas finais agregadas e enriquecidas com métricas de performance prontas para consumo e visualização.