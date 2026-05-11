# Paper Metrics — Instruções para Claude

## 📋 Leitura Obrigatória ao Iniciar
Antes de qualquer tarefa de código neste projeto, leia o arquivo `SKILLS.md` para identificar qual skill aplicar.

## 🗺️ Mapa Rápido de Skills por Contexto

| Contexto da tarefa | Skills a usar |
|---|---|
| Backend Python / FastAPI / endpoints | `python-pro`, `fastapi-pro`, `async-python-patterns`, `pydantic-models-py` |
| Análise estatística / Pingouin / SciPy | `data-scientist`, `scikit-learn`, `polars`, `scientific-writing` |
| Qualidade de dados / validação | `data-quality-frameworks`, `error-handling-patterns` |
| Visualizações / gráficos | `matplotlib`, `claude-d3js-skill`, `data-storytelling` |
| Componentes React / UI | `react-patterns`, `react-ui-patterns`, `tanstack-query-expert` |
| Design visual / animações | `frontend-design`, `design-spells`, `animejs-animation` |
| Dashboard / KPIs / resultados | `kpi-dashboard-design`, `uxui-principles` |
| Bug / debug | `systematic-debugging`, `error-handling-patterns` |
| Arquitetura / refatoração | `software-architecture`, `uncle-bob-craft`, `production-code-audit` |
| Testes | `webapp-testing`, `e2e-testing-patterns`, `testing-patterns` |
| Code review | `vibe-code-auditor`, `uncle-bob-craft` |

## 🏗️ Stack do Projeto
- **Frontend:** React + Vite, CSS puro (glassmorphism), D3.js
- **Backend:** Python + FastAPI, Pingouin, SciPy, Pandas
- **Análise:** Protocolo automático de testes estatísticos (paramétrico/não-paramétrico)
- **Persistência:** localStorage (draft 24h), sem banco de dados permanente no frontend

## 🔄 Fluxo Principal (Dashboard)
```
Upload → resolve-columns → ColumnDomainReview → OutcomeSelector
→ analyze-protocol → AnalysisReviewPlan → execute-protocol → Resultados
```

## ⚠️ Regras Críticas
1. **Nunca quebre o fluxo de passos** — cada passo depende do estado do anterior.
2. **Variáveis derivadas** (ex: LogMAR) devem ser injetadas via `addDerivedCandidatesToColumns`, nunca hardcoded.
3. **Outputs APA-7** devem ser preservados em qualquer alteração de formato de resultado.
4. **Draft no localStorage** — qualquer mudança de estado deve atualizar o draft via `saveDraft()`.
5. **Não use TailwindCSS** — o projeto usa CSS puro com variáveis CSS customizadas.
