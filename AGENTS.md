# Paper Metrics — Agent Instructions

## MANDATORY: Read SKILLS.md at the start of every session
Before writing any code, read `SKILLS.md` and activate the relevant skills for the task.

---

## Project Context
**Paper Metrics** is a statistical analysis web application for clinical research.
It takes uploaded CSV/XLSX files and automatically generates a complete statistical protocol.

### Stack
- **Frontend:** React + Vite, vanilla CSS (glassmorphism design), D3.js charts
- **Backend:** Python + FastAPI, Pingouin + SciPy + Pandas (statistical engine)
- **Architecture:** 5-step pipeline — Upload → Domain Review → Outcome Selection → Protocol Review → Results

### Key Files
- `frontend/src/pages/Dashboard.jsx` — main orchestrator (state machine, API calls, draft system)
- `frontend/src/components/OutcomeSelector.jsx` — outcome variable selection with derived variables
- `frontend/src/components/AnalysisReviewPlan.jsx` — protocol review with data quality semaphore
- `backend/main.py` — FastAPI routes for the full analysis pipeline
- `backend/domain_resolver.py` — clinical domain detection (Snellen→LogMAR, IOP, etc.)

---

## Skill Routing Map

| Task type | Skills to use |
|---|---|
| Python / FastAPI / API endpoints | `python-pro`, `fastapi-pro`, `async-python-patterns`, `pydantic-models-py` |
| Statistical analysis (Pingouin/SciPy) | `data-scientist`, `scikit-learn`, `polars`, `scientific-writing` |
| Data validation / quality | `data-quality-frameworks`, `error-handling-patterns` |
| Charts / visualizations | `matplotlib`, `claude-d3js-skill`, `data-storytelling` |
| React components / state | `react-patterns`, `react-ui-patterns`, `tanstack-query-expert` |
| Visual design / animations | `frontend-design`, `design-spells`, `animejs-animation` |
| Dashboard / KPI results display | `kpi-dashboard-design`, `uxui-principles` |
| Debugging | `systematic-debugging`, `error-handling-patterns` |
| Architecture / refactoring | `software-architecture`, `uncle-bob-craft`, `production-code-audit` |
| Testing | `webapp-testing`, `e2e-testing-patterns`, `testing-patterns` |
| Code review | `vibe-code-auditor`, `uncle-bob-craft` |

---

## Critical Rules
1. **Never break the step pipeline** — each step depends on the previous step's state.
2. **Derived variables** (e.g., LogMAR) must be injected via `addDerivedCandidatesToColumns`, never hardcoded.
3. **APA-7 outputs** must be preserved in any result format change.
4. **localStorage draft** — any state change must update the draft via `saveDraft()`.
5. **No Tailwind CSS** — this project uses pure CSS with custom CSS variables.
6. **Language:** comments and UI text in **Brazilian Portuguese**; code identifiers in **English**.

---

## API Endpoints Reference
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/data/get-columns` | POST | Read columns from uploaded file |
| `/api/data/resolve-columns` | POST | Detect clinical domains (Snellen, IOP) |
| `/api/domains/teach` | POST | Teach backend a confirmed domain mapping |
| `/api/data/analyze-protocol` | POST | Generate statistical protocol suggestion |
| `/api/data/upload` | POST | Upload file and get data summary |
| `/api/data/summary-grouped` | POST | Pre-validate data quality by group |
| `/api/data/execute-protocol` | POST | Run full statistical analysis |
| `/api/stats/premium-analysis` | POST | Additional premium analyses |
