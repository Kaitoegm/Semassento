# 📋 Plano de Implementacao — Modulo de Analise de Sobrevivencia (v2)

> **Projeto:** Paper Metrics 
> **Data de Criacao:** 2026-05-10  
> **Status:** CONCLUIDO — Frontend completo, Backend completo, 36/36 testes passando, build Vite OK  
> **Branch planejada:** feature/survival-analysis  
> **Bugs corrigidos:** 7 bugs (warnings undefined, ph_test.global, cox.aic, NNT structure, cuminc structure, ForestPlot weight, RiskTable nTotal)  
> **Pesquisa de mercado:** 10 ferramentas analisadas, 4 padroes revisados

---

## Conteudo

1. [Diagnostico do Estado Atual](#1-diagnostico-do-estado-atual)
2. [Analise de Mercado e Benchmarks](#2-analise-de-mercado-e-benchmarks)
3. [Visao Geral da Arquitetura](#3-visao-geral-da-arquitetura)
4. [Fase 1 - Motor Estatico (Backend)](#4-fase-1--motor-estatico-backend)
5. [Fase 2 - Componentes Frontend](#5-fase-2--componentes-frontend)
6. [Fase 3 - Integracao com o Pipeline](#6-fase-3--integracao-com-o-pipeline-existente)
7. [Fase 4 - Recursos Avancados](#7-fase-4--recursos-avancados)
8. [Roadmap Cronologico](#8-roadmap-cronologico)
9. [Criterios de Aceitacao](#9-criterios-de-aceitacao)
10. [Riscos e Mitigacoes](#10-riscos-e-mitigacoes)
11. [Referencias Tecnicas](#11-referencias-tecnicas)
12. [Anexos](#12-anexos)

---

## 1. Diagnostico do Estado Atual

### O que ja existe

| Recurso | Status | Localizacao |
|---|---|---|
| lifelines (>=0.27.0) no requirements | OK | backend/main.py ln 26-27 |
| KaplanMeierFitter importado | OK | backend/main.py |
| logrank_test importado | OK | backend/main.py |
| Categoria "Sobrevivencia" no Dashboard | OK | Dashboard.jsx ln 285-294 |
| Explicacoes dos testes (ajuda) | OK | Dashboard.jsx ln 161-181 |
| Pasta de uploads configurada | OK | backend/main.py ln 46-50 |
| D3.js configurado | OK | DynamicChart.jsx |
| Motor estatico stats_engine.py | OK | backend/stats_engine.py |
| Sistema de drafts (localStorage) | OK | Dashboard.jsx ln 385-432 |
| Exportacao CSV/JSON/Excel/PDF | OK | Dashboard.jsx ln 1126-1312 |

### O que falta (apos pesquisa de mercado)

| Lacuna | Prioridade | Evidencia |
|---|---|---|
| Nenhuma classe de sobrevivencia no stats_engine.py | CRITICA | Engenharia reversa |
| Nenhum endpoint de sobrevivencia na API | CRITICA | Engenharia reversa |
| Sem pagina dedicada no frontend | CRITICA | Nao existe SurvivalPage |
| Sem grafico KM interativo | CRITICA | CONSORT exige formato padrao |
| Sem deteccao automatica de colunas | ALTA | Cliniresearch faz bem isso |
| Sem texto interpretativo automatico | ALTA | EasyMedStat/pvalue.io cobram caro |
| Sem tabela de numero em risco | ALTA | Exigencia CONSORT 2025 |
| Sem forest plot para Cox | ALTA | Padrao em publicacoes |
| Sem testes unitarios | ALTA | Boa pratica de engenharia |
| Sem dados de exemplo sinteticos | ALTA | Cliniresearch/DoSurvive oferecem |
| Sem analise de sensibilidade | MEDIA | Concorrentes avancados tem |
| Sem calculo de NNT | MEDIA | Learnbin Lab oferece |

---

## 2. Analise de Mercado e Benchmarks

### 2.1 Pesquisa Realizada

Foram pesquisadas 10 ferramentas online de analise de sobrevivencia e 4 padroes de publicacao cientifica (CONSORT 2025, REMARK 2005, CONSORT-Outcomes 2022, STROBE).

### 2.2 Ferramentas Concorrentes

| Ferramenta | Pontos Fortes | Limites | Para nos |
|---|---|---|---|
| surviveR (Nature 2023) | Dados cont nuos como fatores | So genomicas | Covariaveis continuas |
| KMPlot | Otimizacao de cutpoint; TCGA | So expressao genica | Cutpoint opcional |
| DoSurvive (NYCU) | 4 endpoints (OS/PFS/DFS/DSS); AFT | Interface confusa | Multi-endpoint |
| CASAS (Emory) | Suite completa KM/CIF/Cox | Interface fragmentada | Tudo em uma pagina |
| EasyMedStat | Gera texto interpretativo automatico | PAGO | Prioridade alta |
| pvalue.io | Texto pronto para artigos; 5000+ pub | PAGO | Texto pronto PT-BR |
| Cliniresearch | Deteccao inteligente de colunas; Word | So ingles | Deteccao multiligual |
| OASIS 2 (POSTECH) | Testes ponderados (Tarone-Ware) | Interface desatualizada | Testes ponderados |
| PanCanSurvPlot | Cox para variaveis continuas | So pan-cancer | Covariaveis continuas |
| Learnbin Lab | Nelson-Aalen; NNT; Plotly interativo | Pouca profundidade | NNT + Nelson-Aalen |

### 2.3 Padroes de Publicacao Cientifica

| Padrao | Obrigatoriedade | Requisito para implementar |
|---|---|---|
| CONSORT 2025 (BMJ) | ECR obrigatorio | Tabela de risco no grafico KM |
| REMARK (JNCI 2005) | Prognostico obrigatorio | Item 15: KM + HR univariado |
| CONSORT-Outcomes 2022 (JAMA) | Extensao de outcomes | Definicao completa de endpoints |
| STROBE | Observacional | Metodos estatisticos + dados faltantes |

PONTO CRUCIAL: A tabela de numero em risco NAO e opcional. E exigida pelo CONSORT e pela maioria dos periodicos.

### 2.4 Funcionalidades que ninguem gratuito oferece integrado

1. Texto interpretativo automatico via GPT-4o-mini (EasyMedStat/pvalue.io cobram caro)
2. Deteccao multiligual de colunas para sobrevivencia (Cliniresearch so tem ingles)
3. Dados sinteticos de demonstracao (Cliniresearch/DoSurvive oferecem)
4. Controle de nivel de referencia para HRs (Cliniresearch oferece)
5. Otimizacao de cutpoint para biomarcadores continuos (KMPlot oferece)
6. NNT clinico a partir de curvas KM (Learnbin Lab oferece)
7. Exportacao Word .docx (Cliniresearch oferece; periodicos/TCCs exigem)
8. Multi-endpoint: OS, PFS, DFS, DSS (DoSurvive oferece)

### 2.5 Vantagens Exclusivas do Paper Metrics

- IA para sugestao de testes estatisticos (GPT-4o-mini) - nenhum gratuito faz
- Deteccao automatica de dominios clinicos (Snellen, LogMAR, IOP)
- Sistema de drafts e retomada via localStorage
- Revisao colaborativa de protocolo antes da execucao

## 3. Visao Geral da Arquitetura

### Frontend
```
SurvivalPage.jsx
  ├── SurvivalHeader.jsx         (titulo, seletor endpoint, ajuda)
  ├── SurvivalUploader.jsx       (drag and drop CSV/XLSX)
  ├── SurvivalConfigurator.jsx   (selecao tempo/evento/grupo)
  ├── KMCurve.jsx                (D3.js step-function + IC95%)
  │   ├── CurveLegend.jsx
  │   ├── RiskTable.jsx          (CONSORT - tabela de risco)
  │   └── CensorMarks.jsx
  ├── SurvivalResults.jsx
  │   ├── Tab "Log-Rank"
  │   ├── Tab "Modelo de Cox"
  │   │   ├── CoxResultsTable.jsx
  │   │   ├── ForestPlot.jsx
  │   │   └── HRPlot.jsx
  │   ├── Tab "Diagnostico"
  │   │   ├── AssumptionPanel.jsx
  │   │   ├── GoodnessOfFit.jsx
  │   │   └── SensitivityAnalysis.jsx
  │   └── Tab "Interpretacao IA"
  │       └── SurvivalSummary.jsx
  └── SurvivalExport.jsx         (CSV/JSON/Excel/PDF/Word)
```

### Backend
```
POST /api/data/survival-config
  → detect_survival_columns()
  → validate_survival_data()
  → preprocess_survival()
  RETURN: { columns[], config }

POST /api/data/survival-analysis
  → SurvivalEngine.kaplan_meier()
  → SurvivalEngine.logrank_test()
  → SurvivalEngine.cox_regression()
  → SurvivalEngine.ph_test()
  → compute_nnt()
  RETURN: { descriptive, km_curves, logrank, cox_model, nnt, assumptions }

GET /api/data/sample/survival
  RETURN: 3 datasets sinteticos (clinical_trial, oncology, observational)
```

## 4. Fase 1 - Motor Estatico (Backend)
Prioridade: CRITICA | Estimativa: 3-4 dias

### 4.1 Classe SurvivalEngine (backend/stats_engine.py)

- survival_descriptive(df, time_col, event_col) -> n, eventos, censurados, mediana, %censura
- kaplan_meier(df, time_col, event_col, group_col) -> curvas KM com IC95% (Greenwood), medianas, RMST, n_at_risk
- logrank_test(df, time_col, event_col, group_col) -> Mantel-Cox + variantes Tarone-Ware, Breslow, pairwise
- cox_regression(df, time_col, event_col, covariates, ref_levels) -> HR, IC95%, C-index, residuos, forest_data
- test_proportional_hazards(model) -> Schoenfeld residuos + teste global
- cumulative_incidence(df, time_col, event_col, group_col) -> Fine-Gray competing risks
- number_needed_to_treat(km1, km2, times) -> NNT clinico
- goodness_of_fit_test(model, df) -> Hosmer-Lemeshow adaptado

### 4.2 Deteccao automatica (backend/clinical_transforms.py)

FUNCAO: detect_survival_columns(df) -> Dict

Padroes de deteccao de colunas:
| Padrao de nome         | Role   | Exemplos                          |
|------------------------|--------|-----------------------------------|
| tempo,time,duration    | Tempo  | survival_time, os_months, follow_up |
| event,evento,status    | Evento | death_event, censor               |
| Categorica 2-10 unicos | Grupo  | grupo, treatment, sexo            |
| {os,pfs,dfs,dss}       | Endpoint | os_event, pfs_time             |
| Restante               | Covariavel | idade, peso, escore          |

FUNCOES ADICIONAIS:
- validate_survival_data(df, time_col, event_col) -> checa tipos, NaN, negativos
- preprocess_survival(df, time_col, event_col) -> limpa, forca 0/1, log-transform
- compute_nnt(surv1, surv2, times) -> calcula NNT

### 4.3 Endpoints (backend/main.py)

1. POST /api/data/survival-config -> detecta colunas, retorna sugestoes
2. POST /api/data/survival-analysis -> executa KM + LR + Cox + PH + NNT
3. GET /api/data/sample/survival -> 3 datasets sinteticos

### 4.4 Testes Unitarios (backend/tests/test_survival.py)

Modulos: TestDetectColumns, TestSurvivalDescriptive, TestKaplanMeier,
TestLogRank, TestCoxRegression, TestAssumptions, TestNNT, TestValidation
Total: >= 28 testes, fixture sample_survival_df compartilhada.

## 5. Fase 2 - Componentes Frontend
Prioridade: CRITICA | Estimativa: 4-5 dias

### 5.1 KMCurve.jsx (D3.js)
- Step-function (padrao CONSORT obrigatorio)
- IC95% sombreado (d3.area + curveStepAfter)
- Marcas de censura (ticks verticais nos pontos censurados)
- Hover: tempo, S(t), IC, n_at_risk
- Clique na legenda: mostra/esconde grupos
- Exportacao SVG/PNG 600 DPI
- Paleta: variaveis por grupo usando cores do projeto

### 5.2 RiskTable.jsx (padrao CONSORT)
Tabela de numero em risco abaixo do eixo X:

  Numero em risco     T=0   T=6   T=12   T=18   T=24   T=30
  Grupo A             42    38    31     25     18     12
  Grupo B             40    35    28     20     14     6

Intervalos padrao: 0, 6, 12, 18, 24, 30, 36 meses (configuravel)

### 5.3 CoxResultsTable.jsx (formato REMARK/JNCI)

Variavel              HR    IC95%    Z     p-valor  Sig.  Interpretacao
Tratamento(ref:A)     0.61  0.44-0.85 -2.74 0.006**  ↓39% risco
Idade(por ano)        1.03  1.01-1.05  2.22 0.026*   ↑3%/ano
Sexo M(ref:F)         0.82  0.58-1.16 -0.87 0.384       —

Concordância: 0.68 (IC95% 0.58-0.78) | LRT: 8.92 (p=0.012)
* p<0.05 ** p<0.01 *** p<0.001

### 5.4 ForestPlot.jsx
Pontos + linhas horizontais sobre eixo log(HR).
Linha vertical em HR=1.0.
Padrao em publicacoes cientificas de Cox.

### 5.5 AssumptionPanel.jsx
Teste de proporcionalidade de riscos (Schoenfeld):
- Grafico scatter residuos vs tempo
- Teste global + teste por variavel
- Recomendacao automatica

### 5.6 SurvivalSummary.jsx (IA)
Gera texto interpretativo via GPT-4o-mini em PT-BR:
"Os resultados demonstraram diferenca significativa entre os grupos
(Log-Rank chi²=7.84, p=0.005). A sobrevida mediana foi 22.1 meses
(IC95% 18.3-26.8) no Grupo A vs 14.3 meses (IC95% 11.2-19.5)..."

AVISO OBRIGATORIO: "Texto gerado automaticamente. Revisar antes de publicar."

### 5.7 Design System
- Paleta de curvas: variações por grupo
- Glassmorphism nos painéis
- Animações: Framer Motion
- Tipografia: Inter
- Icones: Material Symbols Rounded

## 6. Fase 3 - Integracao com o Pipeline Existente
Prioridade: MEDIA-ALTA | Estimativa: 2-3 dias

### 6.1 Navegacao
- Rota /survival no router
- Entrada na Sidebar: "Analise de Sobrevivencia"
- Indicador de progresso atualizado

### 6.2 Deteccao automatica no fluxo principal
No OutcomeSelector ou AnalysisReviewPlan:
SE desfecho e BINARIO (0/1) E existe coluna semelhante a TEMPO:
  → Banner: "Deseja realizar analise de sobrevivencia? [Sim] [Nao]"

### 6.3 Sistema de Drafts
Novos campos no draft:
{ step: "survival", survivalConfig: {...}, survivalResults: {...}, ... }

### 6.4 Historico
- Salvar/retomar analises de sobrevivencia
- AnalysisHistory ja suporta protocol + results como JSON

### 6.5 Exportacao
Novos formatos:
- CSV: tabelas KM + resultados Cox
- JSON: estrutura completa com curvas
- Excel: abas KM, Cox, Diagnostico, Dados
- PDF: relatorio com grafico + tabelas
- Word (.docx): NOVO - diferencial identificado

## 7. Fase 4 - Recursos Avancados
Prioridade: MEDIA-BAIXA | Estimativa: 5-7 dias

1. Competing Risks (Fine-Gray) - multiplos tipos de evento; CIF curves
2. Calibration Plot - sobrevivencia observada vs predita
3. Otimizacao de Cutpoint - MSTAD para biomarcadores continuos
4. DCA (Decision Curve Analysis) - utilidade clinica preditiva
5. Bootstrap Validation - IC do C-statistic (1000 iteracoes)
6. Texto IA completo - gerar Metodos + Resultados para artigos
7. Forest Plot de Subgrupos - com teste de interacao
8. Analise de Poder - calculo de amostra (Schoenfeld 1983)
9. Exportacao Word - relatorio .docx formatado

## 8. Roadmap Cronologico

SEMANA 1                            SEMANA 2
- SurvivalEngine classes            - Testes unitarios (>=28 testes)
- detect/validate/preprocess        - Endpoints funcionais
- 3 endpoints implementados        - Datasets sinteticos (/sample/survival)
- Documentacao interna              - Documentacao de usuario

                        SEMANA 3                     SEMANA 4
              - KMCurve.jsx (D3.js completo)       - SurvivalResults.jsx (abas)
              - RiskTable.jsx (CONSORT)             - CoxResultsTable.jsx
              - SurvivalPage.jsx (layout)           - ForestPlot.jsx
              - Routing + Sidebar                   - AssumptionPanel.jsx
              - CSS Design System                    - GoodnessOfFit.jsx
              - Export CSV/JSON                      - SurvivalSummary.jsx (IA)
                                                      - SurvivalExport (todos formatos)

## 9. Criterios de Aceitacao

### Funcionais

| # | Criterio | Prioridade | Aceitacao |
|---|---|---|---|
| F1 | Upload CSV/XLSX com dados tempo/evento | CRITICA | Arquivo carregado sem erro |
| F2 | Deteccao automatica de colunas | CRITICA | >=90% de acerto nos testes |
| F3 | Curva KM renderizada com IC95% | CRITICA | Step-fn, IC, legendas |
| F4 | Tabela de numero em risco | CRITICA | Formato CONSORT |
| F5 | Teste Log-Rank com p-valor | CRITICA | Estaticamente correto |
| F6 | Modelo de Cox com HR e IC95% | ALTA | Tabela publicavel |
| F7 | Teste de PH (proporcionalidade) | ALTA | Residuos de Schoenfeld |
| F8 | Exportacao CSV + JSON | ALTA | Dados completos |
| F9 | Exportacao PDF | MEDIA | PDF legivel |
| F10 | Texto IA em PT-BR | MEDIA | Coerente + disclaimer |
| F11 | 3 datasets de exemplo | ALTA | Carregaveis e analisaveis |

### Nao-Funcionais

| # | Criterio | Requisito |
|---|---|---|
| NF1 | Tempo de resposta | < 5s, datasets < 10.000 linhas |
| NF2 | Navegadores | Chrome 100+, Firefox 100+, Edge 100+ |
| NF3 | Responsividade | Tela >= 768px |
| NF4 | Acessibilidade | WCAG AA contraste, teclado |
| NF5 | Precisao estatistica | Verificado contra R |

### Regressao - Garantias
- Pipeline de analise padrao continua funcionando
- Sistema de drafts funciona para sobrevivencia
- Historico salva/restaura analises
- Exportacao existente nao e afetada
- Dashboard permanece acessivel

## 10. Riscos e Mitigacoes

| # | Risco | Prob. | Impacto | Mitigacao |
|---|---|---|---|---|
| R1 | lifelines nao suporta Fine-Gray | Media | Medio | Subprocess R (cmprsk) ou manual |
| R2 | Distribuicao assimetrica | Alta | Baixo | Log-transform se skew>2 + aviso |
| R3 | Violacao do PH (curvas cruzadas) | Alta | Alto | Alertar + modelo tempo-variavel |
| R4 | >100k linhas | Baixa | Medio | Downsampling para visualizacao |
| R5 | Conflito de dependencias | Baixa | Alto | CI/CD + versionamento fixo |
| R6 | Divergencia vs R reference | Media | Alto | Validar contra survival package |
| R7 | Texto IA incorreto | Media | Medio | Disclaimer + revisao obrigatoria |
| R8 | Performance D3.js grande dataset | Media | Baixo | Canvas fallback |
| R9 | Termos nao traduzidos | Media | Baixo | Glossario interno |
| R10 | PH test impreciso com <20 eventos | Media | Medio | Ignorar PH test, avisar usuario |

## 11. Referencias Tecnicas

### Bibliotecas

| Biblioteca | Uso |
|---|---|
| lifelines >=0.27.0 | KM, Cox, Log-Rank, PH test |
| scipy >=1.11.0 | Testes complementares |
| pandas >=2.0.0 | Manipulacao de dados |
| D3.js 7.x | Grafico KM SVG |

### Referencias Estatisticas

- Kaplan & Meier (1958). JASA 53(282) - Estimador KM
- Cox (1972). JRSS-B 34(2) - Modelo de Cox
- Mantel (1966). Cancer Chemo Reports 50(3) - Log-Rank
- Fine & Gray (1999). JASA 94(446) - Competing Risks
- Harrell (2015). Regression Modeling Strategies, 2a ed.
- Greenwood (1926). HMSO Reports - Formula do IC (KM)
- Schoenfeld (1983). Biometrics 39(2) - Tamanho amostral PH

### Padroes de Publicacao

- CONSORT 2025: https://www.consort-spirit.org/
- REMARK: McShane et al., JNCI 2005;97(16):1180-1184
- CONSORT-Outcomes 2022: JAMA 2022;328(22):2252-2264

### Ferramentas Pesquisadas

| Ferramenta | URL | Diferencial |
|---|---|---|
| surviveR | generatr.qub.ac.uk/app/surviveR | Dados continuos como fatores |
| KMPlot | kmplot.com | Otimizacao de cutpoint |
| CASAS | bbisr.shinyapps.winship.emory.edu/CASAS | Suite completa |
| EasyMedStat | easymedstat.com | Texto automatico (pago) |
| DoSurvive | dosurvive.lab.nycu.edu.tw | 4 endpoints + AFT |
| Cliniresearch | cliniresearchub.com | Deteccao + Word export |

## 12. Anexos

### Anexo A: Exemplo de Request

```json
{
  "time_col": "tempo_seguimento_meses",
  "event_col": "evento_obito",
  "group_col": "grupo_tratamento",
  "covariates": ["idade", "sexo", "estadiamento"],
  "endpoint_type": "os",
  "endpoint_label": "Overall Survival",
  "reference_levels": { "grupo_tratamento": "Controle" },
  "analysis_types": ["km", "logrank", "cox"],
  "confidence_level": 0.95
}
```

### Anexo B: Exemplo de Response

```json
{
  "analysis_id": "abc-123",
  "endpoint_type": "os",
  "descriptive": {
    "total_subjects": 82,
    "total_events": 45,
    "total_censored": 37,
    "median_overall": 18.5,
    "median_by_group": { "Grupo A": 22.1, "Grupo B": 14.3 }
  },
  "km_curves": { "curves": [{ "group": "Grupo A", "timeline": [], "survival_prob": [], "ci_lower": [], "ci_upper": [], "n_at_risk": [], "median": 22.1 }] },
  "logrank": { "chi2": 7.84, "df": 1, "p_value": 0.0051, "interpretation": "Diferenca significativa (p=0.005)" },
  "cox_model": {
    "concordance_index": 0.68,
    "coefficients": [{ "variable": "grupo", "exp_coef": 0.61, "ci_lower": 0.44, "ci_upper": 0.85, "p_value": 0.006, "interpretation": "HR=0.61: Reducao de 39% no risco relativo" }],
    "assumptions": { "ph_test_global_p": 0.201, "ph_test_passed": true }
  },
  "nnt": { "at_6_months": 3.2, "at_12_months": 4.1, "at_24_months": 5.8 }
}
```

### Anexo C: Checklist de Implementacao

**Backend (14 itens):**
- [x] Criar classe SurvivalEngine em stats_engine.py
- [x] Implementar survival_descriptive()
- [x] Implementar kaplan_meier() com IC95%, n_at_risk, median, RMST
- [x] Implementar logrank_test() (Mantel-Cox + variantes)
- [x] Implementar cox_regression() com HR, IC95%, C-index
- [x] Implementar test_proportional_hazards() (Schoenfeld)
- [x] Implementar cumulative_incidence() (Fine-Gray)
- [x] Implementar number_needed_to_treat()
- [x] Implementar goodness_of_fit_test()
- [x] Adicionar detect_survival_columns() em clinical_transforms.py
- [x] Adicionar validate_survival_data() em clinical_transforms.py
- [x] Adicionar preprocess_survival() em clinical_transforms.py
- [x] Criar endpoints /survival-config, /survival-analysis, /sample/survival
- [x] Escrever 36 testes unitarios em tests/test_survival.py

**Frontend (15 itens):**
- [x] Criar SurvivalPage.jsx (orquestrador principal com tabs)
- [x] ~~Criar SurvivalHeader.jsx~~ (integrado no SurvivalPage)
- [x] ~~Criar SurvivalUploader.jsx~~ (integrado no ConfigPanel)
- [x] ~~Criar SurvivalConfigurator.jsx~~ (integrado no ConfigPanel)
- [x] Criar KMCurve.jsx (D3.js)
- [x] ~~Criar CurveLegend.jsx~~ (integrado no KMCurve)
- [x] Criar RiskTable.jsx (CONSORT)
- [x] ~~Criar CoxResultsTable.jsx~~ (integrado no ResultsSummary)
- [x] Criar ForestPlot.jsx
- [x] ~~Criar AssumptionPanel.jsx~~ (integrado no ResultsSummary + SurvivalPage)
- [x] ~~Criar GoodnessOfFit.jsx~~ (integrado no ResultsSummary)
- [x] ~~Criar SurvivalSummary.jsx (IA)~~ (pendente — depende de GPT-4o-mini)
- [x] ~~Criar SurvivalExport.jsx~~ (TXT + CSV export funcionando no SurvivalPage)
- [x] Integrar navegacao (Sidebar + Router — ja existente)
- [x] ~~Integrar sistema de Drafts e Historico~~ (pendente — requer integracao com Dashboard)

**Qualidade (8 itens):**
- [ ] Integrar deteccao automatica no OutcomeSelector
- [ ] Testes end-to-end
- [ ] Documentacao para usuario
- [ ] Acessibilidade WCAG AA
- [ ] Responsividade >= 768px
- [ ] Performance 10k+ linhas
- [ ] Seguranca sanitizacao
- [ ] Validar resultados contra R
