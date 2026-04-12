"""
Pipeline de extração de meta-análise em 5 estágios.

Estágios:
  1. Classificador  – identifica tipo de estudo e probabilidade de dados quantitativos
  2. Mapeador de Estrutura – localiza seções, tabelas e figuras no texto
  3. Extrator de Dados – extrai estudos individuais (regex + IA)
  4. Validador – verifica consistência dos dados extraídos
  5. Gerador de Dados para Gráfico – calcula efeitos combinados e heterogeneidade
"""

import re
import json
import math
import time
from typing import Any, Callable, Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ms_since(start: float) -> int:
    """Retorna milissegundos desde *start* (time.time())."""
    return int((time.time() - start) * 1000)


def _safe_float(v: Any) -> Optional[float]:
    """Converte para float de forma segura; retorna None se impossível."""
    if v is None:
        return None
    try:
        f = float(v)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


def _safe_int(v: Any) -> Optional[int]:
    if v is None:
        return None
    try:
        return int(v)
    except (ValueError, TypeError):
        return None


def _parse_gpt_json(raw: str) -> Any:
    """Remove marcadores de código e tenta parsear JSON."""
    raw = raw.strip()
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    return json.loads(raw)


# =====================================================================
# STAGE 1 – CLASSIFICADOR
# =====================================================================

_CLASSIFIER_PROMPT = """Você é um classificador de estudos científicos.
Analise o texto abaixo e retorne APENAS um objeto JSON (sem markdown, sem ```json) com:
{
  "type": "<meta-analysis|systematic-review|clinical-trial|observational|other>",
  "type_label": "<rótulo em português>",
  "probability_quantitative": <0-100>,
  "has_forest_plot_reference": <true|false>,
  "num_included_studies_declared": <inteiro ou null>,
  "reason": "<justificativa curta em português>"
}

probability_quantitative = probabilidade de o texto conter dados quantitativos extraíveis para forest plot.
num_included_studies_declared = número de estudos incluídos declarado no texto (ex: "23 estudos incluídos"), null se não encontrado.

TEXTO (primeiros 6000 caracteres):
"""


def stage_classifier(text: str, ask_ai_fn: Callable) -> Dict[str, Any]:
    """Classifica o tipo de estudo e estima probabilidade de dados quantitativos."""
    t0 = time.time()
    try:
        raw = ask_ai_fn(_CLASSIFIER_PROMPT + text[:6000])
        result = _parse_gpt_json(raw)
        prob = int(result.get("probability_quantitative", 0))
        passed = prob >= 60
        return {
            "type": result.get("type", "other"),
            "type_label": result.get("type_label", "Outro"),
            "probability": prob,
            "has_forest_plot_reference": bool(result.get("has_forest_plot_reference", False)),
            "num_included_studies_declared": _safe_int(result.get("num_included_studies_declared")),
            "passed": passed,
            "reason": result.get("reason", "") if passed else (
                result.get("reason", "Probabilidade baixa de dados quantitativos extraíveis.")
            ),
            "duration_ms": _ms_since(t0),
        }
    except Exception as exc:
        return {
            "type": "unknown",
            "type_label": "Desconhecido",
            "probability": 0,
            "has_forest_plot_reference": False,
            "num_included_studies_declared": None,
            "passed": False,
            "reason": f"Erro no classificador: {str(exc)[:200]}",
            "duration_ms": _ms_since(t0),
        }


# =====================================================================
# STAGE 2 – MAPEADOR DE ESTRUTURA
# =====================================================================

_SECTION_PATTERNS: List[Tuple[str, re.Pattern]] = [
    ("Abstract", re.compile(
        r'\b(Abstract|Resumo|ABSTRACT|RESUMO)\b', re.IGNORECASE)),
    ("Introduction", re.compile(
        r'\b(Introduc(?:tion|ão)|INTRODUC(?:TION|ÃO)|Background)\b', re.IGNORECASE)),
    ("Methods", re.compile(
        r'\b(Methods?|Método(?:s|logia)?|METHODS?|MÉTODO(?:S|LOGIA)?|Materials?\s+and\s+Methods?)\b',
        re.IGNORECASE)),
    ("Results", re.compile(
        r'\b(Results?|Resultado(?:s)?|RESULTS?|RESULTADO(?:S)?)\b', re.IGNORECASE)),
    ("Discussion", re.compile(
        r'\b(Discussion|Discussão|DISCUSSION|DISCUSSÃO)\b', re.IGNORECASE)),
    ("Tables", re.compile(
        r'\b(Tables?|Tabela(?:s)?)\b', re.IGNORECASE)),
    ("References", re.compile(
        r'\b(References?|Referência(?:s)?|Bibliography|REFERENCES?)\b', re.IGNORECASE)),
    ("Supplementary", re.compile(
        r'\b(Supplement(?:ary)?|Suplementar|Apêndice|Appendix)\b', re.IGNORECASE)),
]

_TABLE_PATTERN = re.compile(
    r'\b(Table|Tabela|Tabla)\s+(\d+)', re.IGNORECASE)
_FIGURE_PATTERN = re.compile(
    r'\b(Figure|Fig\.?|Figura)\s+(\d+)|[Ff]orest\s+[Pp]lot', re.IGNORECASE)


def stage_structure_mapper(text: str) -> Dict[str, Any]:
    """Mapeia seções, tabelas e figuras no texto com offsets de caractere."""
    t0 = time.time()

    sections: List[Dict[str, Any]] = []
    for name, pat in _SECTION_PATTERNS:
        for m in pat.finditer(text):
            sections.append({
                "name": name,
                "match": m.group(),
                "offset": m.start(),
            })
    sections.sort(key=lambda s: s["offset"])

    # Deduplica: manter apenas a primeira ocorrência de cada seção
    seen_sections: set = set()
    unique_sections: List[Dict[str, Any]] = []
    for s in sections:
        if s["name"] not in seen_sections:
            seen_sections.add(s["name"])
            unique_sections.append(s)

    tables: List[Dict[str, Any]] = []
    for m in _TABLE_PATTERN.finditer(text):
        tables.append({
            "label": m.group(),
            "number": int(m.group(2)),
            "offset": m.start(),
        })
    # Deduplica tabelas por número
    seen_tables: set = set()
    unique_tables: List[Dict[str, Any]] = []
    for t in tables:
        if t["number"] not in seen_tables:
            seen_tables.add(t["number"])
            unique_tables.append(t)

    figures: List[Dict[str, Any]] = []
    for m in _FIGURE_PATTERN.finditer(text):
        figures.append({
            "label": m.group(),
            "offset": m.start(),
        })

    # Determinar trechos prioritários para extração (Results + Tables)
    priority_ranges: List[Tuple[int, int]] = []
    for s in unique_sections:
        if s["name"] in ("Results", "Tables"):
            start = s["offset"]
            # Vai até a próxima seção ou +5000 chars
            next_sections = [
                x["offset"] for x in unique_sections if x["offset"] > start
            ]
            end = min(next_sections) if next_sections else min(start + 5000, len(text))
            priority_ranges.append((start, end))

    return {
        "sections": unique_sections,
        "tables": unique_tables,
        "figures": figures,
        "priority_ranges": priority_ranges,
        "duration_ms": _ms_since(t0),
    }


# =====================================================================
# STAGE 3 – EXTRATOR DE DADOS
# =====================================================================

# Regex para padrões comuns de medidas de efeito
_EFFECT_PATTERNS = [
    # OR = 1.45 (95% CI: 1.12-1.87)  /  OR = 1.45 (95% CI: 1.12 to 1.87)
    re.compile(
        r'(?P<measure>OR|RR|HR|MD|SMD|WMD|RD)\s*[=:]\s*'
        r'(?P<effect>-?\d+\.?\d*)\s*'
        r'[\(\[]\s*(?:95\s*%?\s*CI\s*[:\s]*)?'
        r'(?P<lower>-?\d+\.?\d*)\s*[-–to]+\s*(?P<upper>-?\d+\.?\d*)\s*[\)\]]',
        re.IGNORECASE,
    ),
    # RR 2.3 [1.5, 3.8]
    re.compile(
        r'(?P<measure>OR|RR|HR|MD|SMD|WMD|RD)\s+'
        r'(?P<effect>-?\d+\.?\d*)\s*'
        r'[\(\[]\s*(?P<lower>-?\d+\.?\d*)\s*[,;]\s*(?P<upper>-?\d+\.?\d*)\s*[\)\]]',
        re.IGNORECASE,
    ),
    # MD -2.5 (-4.1 to -0.9)  /  MD -2.5 (-4.1, -0.9)
    re.compile(
        r'(?P<measure>OR|RR|HR|MD|SMD|WMD|RD)\s+'
        r'(?P<effect>-?\d+\.?\d*)\s*'
        r'[\(\[]\s*(?P<lower>-?\d+\.?\d*)\s*[-–,to]+\s*(?P<upper>-?\d+\.?\d*)\s*[\)\]]',
        re.IGNORECASE,
    ),
    # 1.45 (1.12-1.87) – sem rótulo de medida
    re.compile(
        r'(?P<effect>-?\d+\.?\d*)\s*'
        r'[\(\[]\s*(?:95\s*%?\s*CI\s*[:\s]*)?'
        r'(?P<lower>-?\d+\.?\d*)\s*[-–to]+\s*(?P<upper>-?\d+\.?\d*)\s*[\)\]]',
    ),
]

# Padrão para nomes de estudo: "Author et al., 2019" ou "Author (2019)" etc.
_STUDY_NAME_PATTERN = re.compile(
    r'([A-Z][a-záéíóúàâêôãõçñ]+(?:\s+(?:et\s+al\.?|and\s+\w+|e\s+\w+))?)'
    r'[\s,]*[\(\[]?\s*((?:19|20)\d{2})\s*[\)\]]?',
    re.UNICODE,
)

_EXTRACTOR_PROMPT = """Você é um extrator especializado em dados de meta-análise.

Analise o texto abaixo e extraia TODOS os estudos individuais mencionados (estudos incluídos na meta-análise).
Para cada estudo, extraia as informações disponíveis.

Retorne APENAS um objeto JSON (sem markdown, sem ```json) com esta estrutura:
{
  "measure_type": "<OR|RR|HR|MD|SMD|WMD|outro>",
  "studies": [
    {
      "name": "Autor et al. (Ano)",
      "year": 2020,
      "n": 150,
      "effect": 1.45,
      "ci_lower": 1.12,
      "ci_upper": 1.87,
      "se": null,
      "weight": null,
      "subgroup": null
    }
  ]
}

Regras:
- Extraia TODOS os estudos que encontrar, mesmo que tenham dados parciais
- Se o SE não estiver disponível mas houver IC 95%, calcule: SE = (ci_upper - ci_lower) / 3.92
- Se o efeito é um ratio (OR, RR, HR), trabalhe em escala logarítmica para calcular SE: SE = (ln(ci_upper) - ln(ci_lower)) / 3.92
- Coloque null para campos não encontrados
- Se houver subgrupos, indique em qual subgrupo cada estudo pertence
- year deve ser inteiro, n deve ser inteiro, os demais devem ser números decimais

TEXTO PARA ANÁLISE:
"""


def _extract_regex(text: str) -> List[Dict[str, Any]]:
    """Tenta extrair dados de estudos usando regex."""
    results: List[Dict[str, Any]] = []

    # Encontrar todos os nomes de estudo candidatos no texto
    study_names = {}
    for m in _STUDY_NAME_PATTERN.finditer(text):
        name = f"{m.group(1).strip()} ({m.group(2)})"
        offset = m.start()
        study_names[offset] = name

    # Para cada padrão de efeito encontrado, tentar associar ao estudo mais próximo
    for pat in _EFFECT_PATTERNS:
        for m in pat.finditer(text):
            groups = m.groupdict()
            effect = _safe_float(groups.get("effect"))
            lower = _safe_float(groups.get("lower"))
            upper = _safe_float(groups.get("upper"))
            measure = groups.get("measure", None)

            if effect is None or lower is None or upper is None:
                continue

            # Calcular SE a partir do IC
            se = None
            if lower is not None and upper is not None:
                if measure and measure.upper() in ("OR", "RR", "HR") and lower > 0 and upper > 0:
                    se = (math.log(upper) - math.log(lower)) / 3.92
                else:
                    se = (upper - lower) / 3.92

            # Encontrar o nome de estudo mais próximo antes deste match
            effect_offset = m.start()
            best_name = None
            best_dist = float('inf')
            for name_offset, name in study_names.items():
                dist = effect_offset - name_offset
                if 0 <= dist < best_dist:
                    best_dist = dist
                    best_name = name
            if best_dist > 300:
                best_name = None

            results.append({
                "name": best_name,
                "year": None,
                "n": None,
                "effect": effect,
                "ci_lower": lower,
                "ci_upper": upper,
                "se": round(se, 6) if se is not None else None,
                "weight": None,
                "subgroup": None,
                "measure": measure.upper() if measure else None,
                "source": "regex",
            })

    return results


def _extract_ai(text: str, ask_ai_fn: Callable) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """Extrai dados de estudos usando IA."""
    raw = ask_ai_fn(_EXTRACTOR_PROMPT + text[:12000])
    data = _parse_gpt_json(raw)

    measure_type = data.get("measure_type", None)
    studies_raw = data.get("studies", [])
    studies: List[Dict[str, Any]] = []

    for s in studies_raw:
        effect = _safe_float(s.get("effect"))
        lower = _safe_float(s.get("ci_lower"))
        upper = _safe_float(s.get("ci_upper"))
        se = _safe_float(s.get("se"))

        # Calcular SE se não fornecido
        if se is None and lower is not None and upper is not None:
            if measure_type and measure_type.upper() in ("OR", "RR", "HR") and lower > 0 and upper > 0:
                se = (math.log(upper) - math.log(lower)) / 3.92
            elif lower is not None and upper is not None:
                se = (upper - lower) / 3.92

        studies.append({
            "name": s.get("name"),
            "year": _safe_int(s.get("year")),
            "n": _safe_int(s.get("n")),
            "effect": effect,
            "ci_lower": lower,
            "ci_upper": upper,
            "se": round(se, 6) if se is not None else None,
            "weight": _safe_float(s.get("weight")),
            "subgroup": s.get("subgroup"),
            "measure": measure_type,
            "source": "ai",
        })

    return studies, measure_type


def _merge_studies(
    regex_studies: List[Dict[str, Any]],
    ai_studies: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Mescla resultados de regex e IA, preferindo IA quando há sobreposição."""
    if not regex_studies:
        return ai_studies
    if not ai_studies:
        return regex_studies

    merged = list(ai_studies)
    ai_effects = {
        (round(s["effect"], 3), round(s.get("ci_lower") or 0, 3))
        for s in ai_studies
        if s["effect"] is not None
    }

    for rs in regex_studies:
        if rs["effect"] is None:
            continue
        key = (round(rs["effect"], 3), round(rs.get("ci_lower") or 0, 3))
        if key not in ai_effects:
            rs["source"] = "regex"
            merged.append(rs)

    return merged


def stage_extractor(
    text: str,
    structure: Dict[str, Any],
    ask_ai_fn: Callable,
) -> Dict[str, Any]:
    """Extrai dados de estudos do texto usando regex + IA."""
    t0 = time.time()

    # Montar texto prioritário a partir das ranges identificadas
    priority_ranges = structure.get("priority_ranges", [])
    if priority_ranges:
        priority_text = "\n\n".join(
            text[start:end] for start, end in priority_ranges
        )
    else:
        priority_text = text

    # Primeiro: regex
    regex_studies: List[Dict[str, Any]] = []
    try:
        regex_studies = _extract_regex(priority_text)
        # Se o texto prioritário não deu resultado, tentar no texto completo
        if not regex_studies:
            regex_studies = _extract_regex(text)
    except Exception:
        regex_studies = []

    # Segundo: IA
    ai_studies: List[Dict[str, Any]] = []
    measure_type: Optional[str] = None
    try:
        ai_text = priority_text if priority_text.strip() else text
        ai_studies, measure_type = _extract_ai(ai_text, ask_ai_fn)
    except Exception:
        ai_studies = []

    # Mesclar resultados
    studies = _merge_studies(regex_studies, ai_studies)

    # Determinar método
    has_regex = any(s.get("source") == "regex" for s in studies)
    has_ai = any(s.get("source") == "ai" for s in studies)
    if has_regex and has_ai:
        method = "ai+regex"
    elif has_ai:
        method = "ai"
    elif has_regex:
        method = "regex"
    else:
        method = "none"

    return {
        "studies": studies,
        "method": method,
        "measure_type": measure_type,
        "tables_found": [t["label"] for t in structure.get("tables", [])],
        "regex_count": len(regex_studies),
        "ai_count": len(ai_studies),
        "total_count": len(studies),
        "duration_ms": _ms_since(t0),
    }


# =====================================================================
# STAGE 4 – VALIDADOR
# =====================================================================

_RATIO_MEASURES = {"OR", "RR", "HR"}
_DIFF_MEASURES = {"MD", "SMD", "WMD", "RD"}

# Limites razoáveis por tipo de medida
_BOUNDS = {
    "OR":  (0.01, 200),
    "RR":  (0.01, 100),
    "HR":  (0.01, 100),
    "MD":  (-1000, 1000),
    "SMD": (-10, 10),
    "WMD": (-1000, 1000),
    "RD":  (-1, 1),
}


def stage_validator(
    studies: List[Dict[str, Any]],
    num_declared: Optional[int] = None,
) -> Dict[str, Any]:
    """Valida dados extraídos e atribui score de qualidade."""
    t0 = time.time()

    validated: List[Dict[str, Any]] = []
    all_warnings: List[Dict[str, Any]] = []
    total_score_sum = 0.0

    for idx, s in enumerate(studies):
        warnings: List[str] = []
        score = 100.0
        effect = s.get("effect")
        lower = s.get("ci_lower")
        upper = s.get("ci_upper")
        se = s.get("se")
        n = s.get("n")
        measure = (s.get("measure") or "").upper()
        name = s.get("name", f"Estudo {idx + 1}")

        # -- Verificação: efeito presente --
        if effect is None:
            warnings.append("Tamanho do efeito ausente")
            score -= 40
        else:
            # -- CI: lower < effect < upper --
            if lower is not None and upper is not None:
                if not (lower <= effect <= upper):
                    warnings.append(
                        f"IC inconsistente: {lower} <= {effect} <= {upper} não é verdadeiro"
                    )
                    score -= 20
            elif lower is None or upper is None:
                warnings.append("Intervalo de confiança incompleto")
                score -= 10

            # -- Limites razoáveis para tipo de medida --
            if measure in _BOUNDS:
                lo, hi = _BOUNDS[measure]
                if not (lo <= effect <= hi):
                    warnings.append(
                        f"Efeito {effect} fora dos limites razoáveis para {measure} ({lo}-{hi})"
                    )
                    score -= 15

        # -- SE > 0 --
        if se is not None and se <= 0:
            warnings.append(f"SE inválido: {se} (deve ser > 0)")
            score -= 15

        # -- N > 0 --
        if n is not None and n <= 0:
            warnings.append(f"N inválido: {n} (deve ser > 0)")
            score -= 10

        score = max(score, 0.0)
        total_score_sum += score

        study_validated = dict(s)
        study_validated["valid"] = len(warnings) == 0
        study_validated["score"] = round(score, 1)
        validated.append(study_validated)

        if warnings:
            all_warnings.append({"study": name, "warnings": warnings})

    # -- Verificações agregadas --
    aggregate_warnings: List[str] = []

    # Soma dos pesos ~100%
    weights = [s.get("weight") for s in studies if s.get("weight") is not None]
    if weights:
        total_w = sum(weights)
        if total_w < 95 or total_w > 105:
            aggregate_warnings.append(
                f"Soma dos pesos = {round(total_w, 1)}% (esperado ~100%)"
            )

    # Número extraído vs declarado
    if num_declared is not None and num_declared > 0:
        if len(studies) < num_declared:
            aggregate_warnings.append(
                f"Extraídos {len(studies)} estudos, mas o texto declara {num_declared}"
            )
        elif len(studies) > num_declared:
            aggregate_warnings.append(
                f"Extraídos {len(studies)} estudos, mais que os {num_declared} declarados — possíveis duplicatas"
            )

    overall_score = round(total_score_sum / len(studies), 1) if studies else 0.0

    return {
        "passed": overall_score >= 60 and len(validated) > 0,
        "studies": validated,
        "warnings": all_warnings,
        "aggregate_warnings": aggregate_warnings,
        "validity_score": overall_score,
        "total_studies": len(validated),
        "duration_ms": _ms_since(t0),
    }


# =====================================================================
# STAGE 5 – GERADOR DE DADOS PARA GRÁFICO (FOREST PLOT)
# =====================================================================

def _inverse_variance_weight(se: float) -> float:
    """Peso por variância inversa: w_i = 1 / se_i^2."""
    if se is None or se <= 0:
        return 0.0
    return 1.0 / (se ** 2)


def _pooled_fixed_effect(
    effects: List[float], ses: List[float],
) -> Dict[str, Any]:
    """Calcula efeito combinado pelo modelo de efeitos fixos (Mantel-Haenszel/IV)."""
    weights = [_inverse_variance_weight(s) for s in ses]
    total_w = sum(weights)
    if total_w == 0:
        return {"effect": None, "se": None, "ci_lower": None, "ci_upper": None, "z": None, "p": None}

    pooled = sum(e * w for e, w in zip(effects, weights)) / total_w
    pooled_se = math.sqrt(1.0 / total_w)
    ci_lower = pooled - 1.96 * pooled_se
    ci_upper = pooled + 1.96 * pooled_se
    z = pooled / pooled_se if pooled_se > 0 else 0
    # p-valor bilateral
    p = 2 * (1 - _norm_cdf(abs(z)))

    return {
        "effect": round(pooled, 6),
        "se": round(pooled_se, 6),
        "ci_lower": round(ci_lower, 6),
        "ci_upper": round(ci_upper, 6),
        "z": round(z, 4),
        "p": round(p, 6),
    }


def _heterogeneity(
    effects: List[float], ses: List[float],
) -> Dict[str, Any]:
    """Calcula estatísticas de heterogeneidade: Q, I², tau², p-valor."""
    k = len(effects)
    if k < 2:
        return {"Q": None, "df": 0, "p": None, "I2": None, "tau2": None}

    weights = [_inverse_variance_weight(s) for s in ses]
    total_w = sum(weights)
    if total_w == 0:
        return {"Q": None, "df": k - 1, "p": None, "I2": None, "tau2": None}

    pooled = sum(e * w for e, w in zip(effects, weights)) / total_w

    Q = sum(w * (e - pooled) ** 2 for e, w in zip(effects, weights))
    df = k - 1
    # p-valor do teste Q (distribuição chi-quadrado)
    p_Q = 1 - _chi2_cdf(Q, df) if Q >= 0 else 1.0

    # I²
    I2 = max(0, (Q - df) / Q * 100) if Q > 0 else 0.0

    # tau² (método DerSimonian-Laird)
    sum_w = sum(weights)
    sum_w2 = sum(w ** 2 for w in weights)
    C = sum_w - sum_w2 / sum_w if sum_w > 0 else 1
    tau2 = max(0, (Q - df) / C) if C > 0 else 0.0

    return {
        "Q": round(Q, 4),
        "df": df,
        "p": round(p_Q, 6),
        "I2": round(I2, 2),
        "tau2": round(tau2, 6),
    }


def _pooled_random_effect(
    effects: List[float], ses: List[float], tau2: float,
) -> Dict[str, Any]:
    """Calcula efeito combinado pelo modelo de efeitos aleatórios (DerSimonian-Laird)."""
    weights = []
    for s in ses:
        var = s ** 2 if s and s > 0 else 0
        denom = var + tau2
        weights.append(1.0 / denom if denom > 0 else 0)

    total_w = sum(weights)
    if total_w == 0:
        return {"effect": None, "se": None, "ci_lower": None, "ci_upper": None, "z": None, "p": None}

    pooled = sum(e * w for e, w in zip(effects, weights)) / total_w
    pooled_se = math.sqrt(1.0 / total_w)
    ci_lower = pooled - 1.96 * pooled_se
    ci_upper = pooled + 1.96 * pooled_se
    z = pooled / pooled_se if pooled_se > 0 else 0
    p = 2 * (1 - _norm_cdf(abs(z)))

    return {
        "effect": round(pooled, 6),
        "se": round(pooled_se, 6),
        "ci_lower": round(ci_lower, 6),
        "ci_upper": round(ci_upper, 6),
        "z": round(z, 4),
        "p": round(p, 6),
    }


# Aproximações de CDF sem scipy (para manter este módulo leve)

def _norm_cdf(x: float) -> float:
    """Aproximação da CDF da normal padrão (Abramowitz & Stegun)."""
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def _chi2_cdf(x: float, k: int) -> float:
    """Aproximação da CDF chi-quadrado via regularized incomplete gamma."""
    if x <= 0 or k <= 0:
        return 0.0
    return _regularized_gamma(k / 2.0, x / 2.0)


def _regularized_gamma(a: float, x: float) -> float:
    """Regularized lower incomplete gamma P(a, x) via série."""
    if x < 0:
        return 0.0
    if x == 0:
        return 0.0

    # Série: P(a,x) = (e^-x * x^a / Gamma(a)) * sum_{n=0}^{inf} x^n / (a*(a+1)*...*(a+n))
    try:
        log_gamma_a = math.lgamma(a)
        term = 1.0 / a
        total = term
        for n in range(1, 300):
            term *= x / (a + n)
            total += term
            if abs(term) < 1e-12:
                break
        log_prefix = a * math.log(x) - x - log_gamma_a
        return min(1.0, max(0.0, math.exp(log_prefix) * total))
    except (ValueError, OverflowError):
        return 0.5


def stage_plot_data(
    studies: List[Dict[str, Any]],
    measure_type: Optional[str] = None,
) -> Dict[str, Any]:
    """Gera dados estruturados para renderizar forest plot (SVG)."""
    t0 = time.time()

    # Filtrar estudos com dados suficientes
    usable = [
        s for s in studies
        if s.get("effect") is not None and s.get("se") is not None and s["se"] > 0
    ]

    if not usable:
        return {
            "studies": [],
            "pooled_fixed": {},
            "pooled_random": {},
            "heterogeneity": {},
            "scale": {},
            "measure_type": measure_type,
            "duration_ms": _ms_since(t0),
        }

    effects = [s["effect"] for s in usable]
    ses = [s["se"] for s in usable]

    # Pesos por variância inversa
    total_iv = sum(_inverse_variance_weight(s) for s in ses)
    for s in usable:
        w = _inverse_variance_weight(s["se"])
        s["weight_iv"] = round(w / total_iv * 100, 2) if total_iv > 0 else 0

    # Efeito combinado — fixo
    fixed = _pooled_fixed_effect(effects, ses)

    # Heterogeneidade
    het = _heterogeneity(effects, ses)
    tau2 = het.get("tau2", 0) or 0

    # Efeito combinado — aleatório
    random_ = _pooled_random_effect(effects, ses, tau2)

    # Escala para o gráfico
    all_lowers = [s.get("ci_lower", s["effect"]) for s in usable if s.get("ci_lower") is not None]
    all_uppers = [s.get("ci_upper", s["effect"]) for s in usable if s.get("ci_upper") is not None]

    # Incluir pooled CIs na escala
    for p in (fixed, random_):
        if p.get("ci_lower") is not None:
            all_lowers.append(p["ci_lower"])
        if p.get("ci_upper") is not None:
            all_uppers.append(p["ci_upper"])

    is_ratio = measure_type and measure_type.upper() in _RATIO_MEASURES

    if all_lowers and all_uppers:
        scale_min = min(all_lowers)
        scale_max = max(all_uppers)
        margin = (scale_max - scale_min) * 0.1
        scale_min -= margin
        scale_max += margin
    else:
        scale_min, scale_max = -1, 2

    null_value = 1.0 if is_ratio else 0.0

    # Preparar estudos para renderização
    plot_studies = []
    for s in usable:
        plot_studies.append({
            "name": s.get("name", "?"),
            "year": s.get("year"),
            "n": s.get("n"),
            "effect": s["effect"],
            "ci_lower": s.get("ci_lower"),
            "ci_upper": s.get("ci_upper"),
            "se": s["se"],
            "weight": round(s.get("weight_iv", 0), 2),
            "subgroup": s.get("subgroup"),
            "valid": s.get("valid", True),
        })

    return {
        "studies": plot_studies,
        "pooled_fixed": fixed,
        "pooled_random": random_,
        "heterogeneity": het,
        "scale": {
            "min": round(scale_min, 4),
            "max": round(scale_max, 4),
            "null_value": null_value,
            "is_ratio": bool(is_ratio),
            "measure": measure_type,
        },
        "k": len(usable),
        "measure_type": measure_type,
        "duration_ms": _ms_since(t0),
    }


# =====================================================================
# ORQUESTRADOR
# =====================================================================

def run_pipeline(text: str, ask_ai_fn: Callable) -> Dict[str, Any]:
    """
    Executa o pipeline completo de extração de meta-análise em 5 estágios.

    Parâmetros:
        text: texto completo do artigo (PDF/URL)
        ask_ai_fn: função para chamar a IA (ex: ask_gpt)

    Retorna:
        Dicionário com resultado completo do pipeline.
    """
    pipeline: Dict[str, Any] = {}
    status = "success"
    final_studies: List[Dict[str, Any]] = []
    needs_user_input: Optional[Dict[str, Any]] = None

    # ---- Stage 1: Classificador ----
    try:
        classifier = stage_classifier(text, ask_ai_fn)
        pipeline["classifier"] = classifier
    except Exception as exc:
        classifier = {
            "type": "unknown", "probability": 0, "passed": False,
            "reason": f"Erro: {str(exc)[:200]}", "duration_ms": 0,
        }
        pipeline["classifier"] = classifier
        status = "partial"

    # Se o classificador não passou mas não falhou catastroficamente,
    # continuamos mesmo assim — o usuário pode querer forçar extração
    if not classifier.get("passed", False):
        status = "partial" if status == "success" else status

    # ---- Stage 2: Mapeador de Estrutura ----
    try:
        structure = stage_structure_mapper(text)
        pipeline["structure"] = structure
    except Exception as exc:
        structure = {
            "sections": [], "tables": [], "figures": [],
            "priority_ranges": [], "duration_ms": 0,
        }
        pipeline["structure"] = structure
        status = "partial"

    # ---- Stage 3: Extrator de Dados ----
    try:
        extractor = stage_extractor(text, structure, ask_ai_fn)
        pipeline["extractor"] = extractor
    except Exception as exc:
        extractor = {
            "studies": [], "method": "none", "tables_found": [],
            "total_count": 0, "duration_ms": 0,
        }
        pipeline["extractor"] = extractor
        status = "partial"

    raw_studies = extractor.get("studies", [])
    measure_type = extractor.get("measure_type")

    if not raw_studies:
        status = "failed" if status != "partial" else status
        needs_user_input = {
            "type": "no_data",
            "details": {
                "message": "Nenhum estudo foi extraído automaticamente.",
                "sections_found": [s["name"] for s in structure.get("sections", [])],
                "tables_found": extractor.get("tables_found", []),
                "suggestion": "Tente fornecer um texto com a seção de resultados ou tabelas de forest plot.",
            },
        }

    # ---- Stage 4: Validador ----
    try:
        num_declared = classifier.get("num_included_studies_declared")
        validator = stage_validator(raw_studies, num_declared)
        pipeline["validator"] = validator
    except Exception as exc:
        validator = {
            "passed": False, "studies": raw_studies, "warnings": [],
            "validity_score": 0, "duration_ms": 0,
        }
        pipeline["validator"] = validator
        status = "partial"

    validated_studies = validator.get("studies", [])

    # Verificar se precisamos de input do usuário
    if raw_studies and not needs_user_input:
        tables = structure.get("tables", [])
        if len(tables) > 1 and len(raw_studies) < 3:
            needs_user_input = {
                "type": "multiple_tables",
                "details": {
                    "message": "Múltiplas tabelas detectadas mas poucos estudos extraídos.",
                    "tables": [t["label"] for t in tables],
                    "suggestion": "Indique qual tabela contém os dados do forest plot.",
                },
            }
        elif validator.get("validity_score", 0) < 50 and len(raw_studies) > 0:
            needs_user_input = {
                "type": "partial_data",
                "details": {
                    "message": "Dados extraídos com baixa qualidade.",
                    "validity_score": validator.get("validity_score", 0),
                    "warnings_count": len(validator.get("warnings", [])),
                    "suggestion": "Revise os dados extraídos e corrija manualmente se necessário.",
                },
            }

    # ---- Stage 5: Gerador de Dados para Gráfico ----
    try:
        plot_data = stage_plot_data(validated_studies, measure_type)
        pipeline["plot_data"] = plot_data
    except Exception as exc:
        plot_data = {
            "studies": [], "pooled_fixed": {}, "pooled_random": {},
            "heterogeneity": {}, "scale": {}, "duration_ms": 0,
        }
        pipeline["plot_data"] = plot_data
        status = "partial" if validated_studies else "failed"

    # ---- Montar resultado final ----
    final_studies = plot_data.get("studies", [])

    if not final_studies and validated_studies:
        # Se o plot_data não gerou nada mas temos estudos validados, usá-los
        final_studies = validated_studies

    if status == "success" and not final_studies:
        status = "failed"

    return {
        "status": status,
        "pipeline": pipeline,
        "studies": final_studies,
        "needs_user_input": needs_user_input,
    }
