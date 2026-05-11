"""
clinical_transforms.py — Motor de variáveis derivadas clínicas.

Contém parsers, conversores e calculadores para variáveis clínicas derivadas.
Agnóstico de especialidade: suporta oftalmologia, cardiologia, nefrologia, etc.

Uso:
    from clinical_transforms import detect_derived_candidates, apply_all_transforms
"""

import math
import re
import logging
import pandas as pd
import numpy as np
from typing import Optional, List

logger = logging.getLogger("clinical_transforms")

# ============================================================
# FAMÍLIA 1 — Parsers de formato Snellen / acuidade visual
# ============================================================

# Valores especiais de acuidade visual (convenção clínica internacional)
SNELLEN_SPECIAL = {
    "cd": 0.014,          # Conta-dedos (Counting Fingers ~1m)
    "cf": 0.014,
    "conta dedos": 0.014,
    "conta-dedos": 0.014,
    "mm": 0.005,          # Movimento de mão (Hand Motion)
    "hm": 0.005,
    "movimento de mao": 0.005,
    "pl": 0.002,          # Percepção de luz (Light Perception)
    "lp": 0.002,
    "percepcao de luz": 0.002,
    "percepção de luz": 0.002,
    "spl": None,          # Sem percepção de luz
    "npl": None,
    "sem percepcao": None,
    "sem percepção": None,
    "pm": None,           # Sem percepção de movimento
}

# Regex para fração Snellen: "20/200", "6/60", "20/ 200", etc.
_SNELLEN_FRACTION_RE = re.compile(r"^\s*(\d+(?:[.,]\d+)?)\s*/\s*(\d+(?:[.,]\d+)?)\s*$")

# Regex para decimal puro: "0.1", "1,0", ".5"
_DECIMAL_RE = re.compile(r"^\s*(\d*[.,]\d+)\s*$")


def parse_snellen(value) -> Optional[float]:
    """
    Converte qualquer representação de acuidade visual para decimal (0.0–1.0+).

    Aceita:
      - Fração Snellen: "20/200", "6/6", "20/20"
      - Decimal: 0.1, "0.5", "1,0"
      - Especiais: "CD", "MM", "PL", "SPL" (sem percepção)
      - None / NaN → None

    Rejeita (retorna None):
      - Inteiros sem contexto: 200, 60 (ambíguo)
      - Strings vazias
    """
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None

    s = str(value).strip().lower().replace(",", ".")

    if not s or s in ("nan", "none", "—", "-", "nd", "nr", "ns"):
        return None

    # 1. Verificar especiais primeiro
    if s in SNELLEN_SPECIAL:
        return SNELLEN_SPECIAL[s]

    # 2. Fração Snellen
    m = _SNELLEN_FRACTION_RE.match(s)
    if m:
        num = float(m.group(1).replace(",", "."))
        den = float(m.group(2).replace(",", "."))
        if den == 0:
            return None
        return round(num / den, 5)

    # 3. Decimal puro (ex: "0.1", "1.0", ".5")
    m2 = _DECIMAL_RE.match(s)
    if m2:
        v = float(m2.group(1).replace(",", "."))
        if 0 < v <= 2.0:   # faixa razoável para acuidade decimal
            return round(v, 5)
        return None

    # 4. Tentar float direto (ex: já é 0.1 como número)
    try:
        v = float(s)
        if 0 < v <= 2.0:
            return round(v, 5)
    except (ValueError, TypeError):
        pass

    return None


def snellen_to_logmar(value) -> Optional[float]:
    """
    Converte qualquer representação de acuidade visual para LogMAR.

    LogMAR = -log10(decimal)
    LogMAR mais ALTO = PIOR visão (0.0 = 20/20 = visão normal)
    """
    decimal = parse_snellen(value)
    if decimal is None or decimal <= 0:
        return None
    return round(-math.log10(decimal), 3)


def snellen_to_decimal(value) -> Optional[float]:
    """Converte para fração decimal pura (20/20 = 1.0, 20/200 = 0.1)."""
    return parse_snellen(value)


def is_snellen_column(series: pd.Series, threshold: float = 0.6) -> bool:
    """
    Heurística: verifica se uma coluna contém dados de acuidade visual Snellen.
    Retorna True se ≥ threshold das amostras parseiam como Snellen.
    """
    sample = series.dropna().head(20).astype(str)
    if len(sample) == 0:
        return False
    parsed = sum(1 for v in sample if parse_snellen(v) is not None)
    # Exigir pelo menos 1 fração real (com "/") para não confundir com decimais genéricos
    has_fraction = any("/" in str(v) for v in sample)
    return has_fraction and (parsed / len(sample)) >= threshold


# ============================================================
# FAMÍLIA 2 — Combinações bilaterais (melhor olho, pior olho)
# ============================================================

def best_eye_logmar(od_series: pd.Series, oe_series: pd.Series) -> pd.Series:
    """
    Melhor olho = mínimo LogMAR entre OD e OE por linha.
    (Menor LogMAR = melhor visão)
    """
    od = pd.to_numeric(od_series, errors="coerce")
    oe = pd.to_numeric(oe_series, errors="coerce")
    return pd.concat([od, oe], axis=1).min(axis=1)


def worst_eye_logmar(od_series: pd.Series, oe_series: pd.Series) -> pd.Series:
    """Pior olho = máximo LogMAR por linha."""
    od = pd.to_numeric(od_series, errors="coerce")
    oe = pd.to_numeric(oe_series, errors="coerce")
    return pd.concat([od, oe], axis=1).max(axis=1)


def binocular_average_logmar(od_series: pd.Series, oe_series: pd.Series) -> pd.Series:
    """Média binocular = média aritmética OD e OE."""
    od = pd.to_numeric(od_series, errors="coerce")
    oe = pd.to_numeric(oe_series, errors="coerce")
    return pd.concat([od, oe], axis=1).mean(axis=1)


# ============================================================
# FAMÍLIA 3 — Índices clínicos compostos
# ============================================================

def calc_imc(peso_series: pd.Series, altura_series: pd.Series) -> pd.Series:
    """
    IMC = peso(kg) / altura(m)²
    Normaliza automaticamente: se altura > 3, assume cm e converte para m.
    """
    peso = pd.to_numeric(peso_series.astype(str).str.replace(",", "."), errors="coerce")
    altura = pd.to_numeric(altura_series.astype(str).str.replace(",", "."), errors="coerce")

    # Normalizar altura: se mediana > 3, provavelmente está em cm
    if altura.median() > 3:
        altura = altura / 100.0

    imc = peso / (altura ** 2)
    # Faixa razoável: 10–80 kg/m² (fora → NaN)
    imc = imc.where((imc > 10) & (imc < 80))
    return imc.round(2)


def calc_pulse_pressure(pas_series: pd.Series, pad_series: pd.Series) -> pd.Series:
    """Pressão de Pulso = PAS - PAD."""
    pas = pd.to_numeric(pas_series.astype(str).str.replace(",", "."), errors="coerce")
    pad = pd.to_numeric(pad_series.astype(str).str.replace(",", "."), errors="coerce")
    return (pas - pad).round(1)


def calc_egfr_ckdepi(creat_series: pd.Series, idade_series: pd.Series,
                      sexo_series: pd.Series) -> pd.Series:
    """
    eGFR via CKD-EPI 2021 (sem variável raça).
    Creatinina em mg/dL. Sexo: 'F'/'M' ou 'feminino'/'masculino'.
    """
    creat = pd.to_numeric(creat_series.astype(str).str.replace(",", "."), errors="coerce")
    idade = pd.to_numeric(idade_series.astype(str).str.replace(",", "."), errors="coerce")

    sexo_lower = sexo_series.astype(str).str.strip().str.lower()
    is_female = sexo_lower.isin(["f", "feminino", "fem", "female", "mulher"])

    results = []
    for i in range(len(creat)):
        cr = creat.iloc[i]
        age = idade.iloc[i]
        fem = is_female.iloc[i]

        if pd.isna(cr) or pd.isna(age):
            results.append(None)
            continue

        kappa = 0.7 if fem else 0.9
        alpha = -0.241 if fem else -0.302
        sex_factor = 1.012 if fem else 1.0

        ratio = cr / kappa
        if ratio < 1:
            egfr = 142 * (ratio ** alpha) * (0.9938 ** age) * sex_factor
        else:
            egfr = 142 * (ratio ** -1.200) * (0.9938 ** age) * sex_factor

        results.append(round(egfr, 1))

    return pd.Series(results, index=creat.index)


def hba1c_percent_to_mmol(series: pd.Series) -> pd.Series:
    """Converte HbA1c de % para mmol/mol. (% - 2.15) × 10.929"""
    v = pd.to_numeric(series.astype(str).str.replace(",", "."), errors="coerce")
    return ((v - 2.15) * 10.929).round(1)


def hba1c_mmol_to_percent(series: pd.Series) -> pd.Series:
    """Converte HbA1c de mmol/mol para %. mmol/mol / 10.929 + 2.15"""
    v = pd.to_numeric(series.astype(str).str.replace(",", "."), errors="coerce")
    return (v / 10.929 + 2.15).round(2)


# ============================================================
# DETECÇÃO AUTOMÁTICA
# ============================================================

# Mapeamentos de nomes de coluna para papéis clínicos
_COL_ROLES = {
    # Acuidade visual OD
    "od_right": {"od", "re", "avod", "av_od", "acuidade_od", "visao_od", "visão_od",
                 "acuidade od", "visao od", "av od", "right eye", "olho direito", "olho_direito"},
    # Acuidade visual OE
    "od_left":  {"oe", "le", "avoe", "av_oe", "acuidade_oe", "visao_oe", "visão_oe",
                 "acuidade oe", "visao oe", "av oe", "left eye", "olho esquerdo", "olho_esquerdo"},
    # Peso
    "peso":     {"peso", "weight", "peso_kg", "peso kg", "masa", "mass"},
    # Altura
    "altura":   {"altura", "height", "estatura", "altura_cm", "altura_m", "comprimento"},
    # PAS
    "pas":      {"pas", "pás", "pam", "pressao sistolica", "pressão sistólica",
                 "sbp", "sistolica", "sistólica", "pa sistolica"},
    # PAD
    "pad":      {"pad", "pressao diastolica", "pressão diastólica",
                 "dbp", "diastolica", "diastólica", "pa diastolica"},
    # Creatinina
    "creat":    {"creatinina", "creatinine", "cr", "crea"},
    # Idade
    "idade":    {"idade", "age", "anos", "faixa etaria", "faixa_etaria"},
    # Sexo
    "sexo":     {"sexo", "sex", "genero", "gênero", "gender"},
}


def _find_role(col_name: str) -> Optional[str]:
    """Retorna o papel clínico de uma coluna dado seu nome."""
    cn = col_name.lower().strip()
    for role, names in _COL_ROLES.items():
        if cn in names or any(cn.startswith(n.split()[0]) for n in names):
            return role
    return None


def detect_derived_candidates(df: pd.DataFrame) -> list[dict]:
    """
    Analisa o dataframe e retorna lista de variáveis derivadas sugeridas.

    Cada item:
      {
        "type": "snellen_to_logmar" | "best_eye" | "imc" | "pulse_pressure" | "egfr",
        "source_columns": [...],
        "derived_name": "...",
        "description": "...",
        "auto_apply": True/False,   # True se deve aplicar sem confirmação
      }
    """
    candidates = []
    roles: dict[str, str] = {}

    # Mapear colunas para papéis
    for col in df.columns:
        role = _find_role(col)
        if role and role not in roles:
            roles[role] = col

    # ── 1. Snellen → LogMAR (OD)
    for role, derived_suffix, label in [
        ("od_right", "(LogMAR)", "OD (LogMAR)"),
        ("od_left",  "(LogMAR)", "OE (LogMAR)"),
    ]:
        col_key = "od_right" if "right" in role else "od_left"
        if col_key in roles:
            col = roles[col_key]
            if is_snellen_column(df[col]):
                eye = "OD" if "right" in col_key else "OE"
                new_col = f"{col} (LogMAR)"
                candidates.append({
                    "type": "snellen_to_logmar",
                    "source_columns": [col],
                    "derived_name": new_col,
                    "description": f"Converter {col} de Snellen para LogMAR (-log₁₀(decimal))",
                    "auto_apply": True,
                })
                # Também oferecer decimal
                candidates.append({
                    "type": "snellen_to_decimal",
                    "source_columns": [col],
                    "derived_name": f"{col} (Decimal)",
                    "description": f"Converter {col} de Snellen para decimal (ex: 20/200 → 0,10)",
                    "auto_apply": False,
                })

    # ── 2. Melhor olho (bilateral)
    # Verificar se existem ou vão existir as colunas LogMAR de ambos os olhos
    od_col = roles.get("od_right")
    oe_col = roles.get("od_left")
    if od_col and oe_col:
        od_logmar = f"{od_col} (LogMAR)"
        oe_logmar = f"{oe_col} (LogMAR)"
        candidates.append({
            "type": "best_eye",
            "source_columns": [od_logmar, oe_logmar],
            "derived_name": "Acuidade visual (LogMAR)",
            "description": "Melhor olho = mínimo LogMAR entre OD e OE (menor = melhor visão)",
            "auto_apply": True,
            "depends_on": [od_logmar, oe_logmar],  # requer que as conversões acima ocorram primeiro
        })

    # ── 3. IMC
    if "peso" in roles and "altura" in roles:
        candidates.append({
            "type": "imc",
            "source_columns": [roles["peso"], roles["altura"]],
            "derived_name": "IMC",
            "description": f"IMC = {roles['peso']} / {roles['altura']}² (normaliza cm → m automaticamente)",
            "auto_apply": False,
        })

    # ── 4. Pressão de Pulso
    if "pas" in roles and "pad" in roles:
        candidates.append({
            "type": "pulse_pressure",
            "source_columns": [roles["pas"], roles["pad"]],
            "derived_name": "Pressão de Pulso",
            "description": f"Pressão de Pulso = {roles['pas']} − {roles['pad']}",
            "auto_apply": False,
        })

    # ── 5. eGFR (só sugere se tiver as 3 variáveis)
    if "creat" in roles and "idade" in roles and "sexo" in roles:
        candidates.append({
            "type": "egfr_ckdepi",
            "source_columns": [roles["creat"], roles["idade"], roles["sexo"]],
            "derived_name": "eGFR (CKD-EPI)",
            "description": f"Taxa de filtração glomerular estimada via CKD-EPI 2021",
            "auto_apply": False,
        })

    return candidates


def apply_derived_candidate(df: pd.DataFrame, candidate: dict) -> Optional[pd.Series]:
    """
    Aplica um candidato de variável derivada ao dataframe.
    Retorna a nova Series, ou None em caso de falha.
    """
    t = candidate["type"]
    cols = candidate["source_columns"]

    try:
        if t == "snellen_to_logmar":
            col = cols[0]
            if col not in df.columns:
                return None
            return df[col].apply(snellen_to_logmar)

        elif t == "snellen_to_decimal":
            col = cols[0]
            if col not in df.columns:
                return None
            return df[col].apply(snellen_to_decimal)

        elif t == "best_eye":
            od_col, oe_col = cols[0], cols[1]
            # Tentar usar colunas LogMAR se existirem, senão as brutas
            od = df.get(od_col, pd.Series(dtype=float))
            oe = df.get(oe_col, pd.Series(dtype=float))
            # Fallback: tentar colunas sem sufixo LogMAR
            if od.isna().all():
                base = od_col.replace(" (LogMAR)", "")
                if base in df.columns:
                    od = df[base].apply(snellen_to_logmar)
            if oe.isna().all():
                base = oe_col.replace(" (LogMAR)", "")
                if base in df.columns:
                    oe = df[base].apply(snellen_to_logmar)
            return best_eye_logmar(od, oe)

        elif t == "imc":
            return calc_imc(df[cols[0]], df[cols[1]])

        elif t == "pulse_pressure":
            return calc_pulse_pressure(df[cols[0]], df[cols[1]])

        elif t == "egfr_ckdepi":
            return calc_egfr_ckdepi(df[cols[0]], df[cols[1]], df[cols[2]])

        elif t == "cockcroft_gault":
            return calc_clearance_cockcroft(df[cols[0]], df[cols[1]], df[cols[2]], df[cols[3]])

        elif t == "fena":
            return calc_fena(df[cols[0]], df[cols[1]], df[cols[2]], df[cols[3]])

        elif t == "itb":
            return calc_itb(df[cols[0]], df[cols[1]])

        elif t == "tiffeneau":
            return calc_vef1_cvf_ratio(df[cols[0]], df[cols[1]])

        elif t == "dict_derived":
            return apply_dict_derived(df, candidate)

    except Exception as e:
        logger.warning(f"Falha ao aplicar derivada '{candidate['derived_name']}': {e}")
        return None

    return None


def apply_all_transforms(df: pd.DataFrame, candidates: list[dict],
                         accepted: Optional[list[str]] = None) -> pd.DataFrame:
    """
    Aplica todos os candidatos aceitos ao dataframe.

    Args:
        df: dataframe original
        candidates: saída de detect_derived_candidates()
        accepted: lista de derived_names aceitos pelo usuário.
                  Se None, aplica apenas os auto_apply=True.

    Returns:
        dataframe com novas colunas adicionadas.
    """
    df = df.copy()

    # Ordenar: snellen_to_logmar antes de best_eye (dependency order)
    ORDER = [
        "snellen_to_logmar", "snellen_to_decimal", "best_eye",
        "imc", "pulse_pressure", "egfr_ckdepi",
        "cockcroft_gault", "fena", "itb", "tiffeneau",
        "dict_derived",  # derivadas do JSON — sempre por último
    ]
    candidates_sorted = sorted(candidates, key=lambda c: ORDER.index(c["type"])
                                if c["type"] in ORDER else 99)

    for cand in candidates_sorted:
        name = cand["derived_name"]
        auto = cand.get("auto_apply", False)

        should_apply = (
            (accepted is None and auto) or
            (accepted is not None and name in accepted)
        )

        if not should_apply:
            continue

        if name in df.columns:
            logger.debug(f"Coluna '{name}' já existe. Pulando.")
            continue

        result = apply_derived_candidate(df, cand)
        if result is not None:
            df[name] = result
            logger.info(f"Derivada criada: '{name}' ({cand['type']})")
        else:
            logger.warning(f"Falha ao criar derivada: '{name}'")

    return df


# ============================================================
# FAMÍLIA 4 — Fórmulas adicionais de nefrologia
# ============================================================

def calc_clearance_cockcroft(peso_series: pd.Series, idade_series: pd.Series,
                              creat_series: pd.Series, sexo_series: pd.Series) -> pd.Series:
    """
    Clearance de Creatinina via Cockcroft-Gault (mL/min).
    
    CL = [(140 - idade) × peso] / (72 × Cr)   × 0.85 se feminino
    Creatinina em mg/dL, peso em kg, idade em anos.
    """
    peso   = pd.to_numeric(peso_series.astype(str).str.replace(",", "."), errors="coerce")
    idade  = pd.to_numeric(idade_series.astype(str).str.replace(",", "."), errors="coerce")
    creat  = pd.to_numeric(creat_series.astype(str).str.replace(",", "."), errors="coerce")
    sexo_low = sexo_series.astype(str).str.strip().str.lower()
    is_female = sexo_low.isin(["f", "feminino", "fem", "female", "mulher"])

    cl = ((140 - idade) * peso) / (72 * creat)
    cl = cl.where(~is_female, cl * 0.85)
    cl = cl.where((cl > 0) & (cl < 500))
    return cl.round(1)


def calc_fena(na_urina: pd.Series, cr_urina: pd.Series,
              na_sangue: pd.Series, cr_sangue: pd.Series) -> pd.Series:
    """
    Fração de Excreção de Sódio (FENa, %).
    FENa = (Na_urina × Cr_sangue) / (Na_sangue × Cr_urina) × 100
    
    < 1% → prerrenal; > 2% → renal intrínseco (KDIGO).
    """
    na_u = pd.to_numeric(na_urina.astype(str).str.replace(",", "."), errors="coerce")
    cr_u = pd.to_numeric(cr_urina.astype(str).str.replace(",", "."), errors="coerce")
    na_s = pd.to_numeric(na_sangue.astype(str).str.replace(",", "."), errors="coerce")
    cr_s = pd.to_numeric(cr_sangue.astype(str).str.replace(",", "."), errors="coerce")

    fena = (na_u * cr_s) / (na_s * cr_u) * 100
    fena = fena.where((fena >= 0) & (fena <= 100))
    return fena.round(2)


def calc_itb(pa_tornozelo: pd.Series, pa_braquial: pd.Series) -> pd.Series:
    """
    Índice Tornozelo-Braquial (ITB).
    ITB = PA_tornozelo / PA_braquial
    < 0.9 = DAP; 0.9–1.4 = normal; > 1.4 = calcificação arterial.
    """
    pa_t = pd.to_numeric(pa_tornozelo.astype(str).str.replace(",", "."), errors="coerce")
    pa_b = pd.to_numeric(pa_braquial.astype(str).str.replace(",", "."), errors="coerce")
    itb = pa_t / pa_b
    itb = itb.where((itb > 0) & (itb < 3))
    return itb.round(2)


def calc_vef1_cvf_ratio(vef1: pd.Series, cvf: pd.Series) -> pd.Series:
    """
    Índice de Tiffeneau = VEF1 / CVF.
    < 0.70 = critério espirométrico para obstrução (GOLD/SBPT).
    """
    v = pd.to_numeric(vef1.astype(str).str.replace(",", "."), errors="coerce")
    c = pd.to_numeric(cvf.astype(str).str.replace(",", "."), errors="coerce")
    ratio = v / c
    ratio = ratio.where((ratio > 0) & (ratio <= 1.5))
    return ratio.round(3)


# ============================================================
# DETECÇÃO GENÉRICA VIA domain_dictionaries.json (derived_from)
# ============================================================

def detect_from_domain_dict(df: pd.DataFrame, domain_dict_path: str = None) -> list[dict]:
    """
    Lê o domain_dictionaries.json e detecta AUTOMATICAMENTE variáveis compostas
    definidas com o nó "derived_from".

    Para cada entrada do dicionário com "derived_from":
      1. Verifica se os inputs estão presentes nas colunas do dataframe
      2. Se sim, adiciona como candidato (auto_apply=False por padrão)

    Isso permite que novas fórmulas sejam adicionadas APENAS no JSON,
    sem precisar editar o Python.
    """
    import json, os

    if domain_dict_path is None:
        # Localizar automaticamente relativo a este arquivo
        base = os.path.dirname(os.path.abspath(__file__))
        domain_dict_path = os.path.join(base, "domain_dictionaries.json")

    if not os.path.exists(domain_dict_path):
        logger.warning(f"domain_dictionaries.json não encontrado em {domain_dict_path}")
        return []

    try:
        with open(domain_dict_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        logger.warning(f"Erro ao ler domain_dictionaries.json: {e}")
        return []

    domains = data.get("domains", {})
    df_cols_lower = {c.lower().strip(): c for c in df.columns}
    candidates = []

    for domain_key, domain_data in domains.items():
        if domain_key == "_meta":
            continue
        derived_from = domain_data.get("derived_from")
        if not derived_from:
            continue

        inputs = derived_from.get("inputs", {})
        if not inputs:
            continue

        # Verificar se cada input tem ao menos uma coluna correspondente no df
        resolved_inputs = {}
        all_found = True
        for input_role, aliases in inputs.items():
            found_col = None
            for alias in aliases:
                alias_l = alias.lower().strip()
                if alias_l in df_cols_lower:
                    found_col = df_cols_lower[alias_l]
                    break
            if found_col is None:
                all_found = False
                break
            resolved_inputs[input_role] = found_col

        if not all_found:
            continue

        display_name = domain_data.get("display_name", domain_key)
        formula = derived_from.get("formula", "")
        python_expression = derived_from.get("python_expression", "")

        candidates.append({
            "type": "dict_derived",
            "domain_key": domain_key,
            "source_columns": list(resolved_inputs.values()),
            "resolved_inputs": resolved_inputs,
            "python_expression": python_expression,
            "derived_name": display_name,
            "description": f"{formula} (calculado de {', '.join(resolved_inputs.values())})",
            "formula": formula,
            "auto_apply": domain_data.get("auto_apply_derived", False),
        })

    return candidates


def apply_dict_derived(df: pd.DataFrame, candidate: dict) -> Optional[pd.Series]:
    """
    Aplica uma variável derivada definida via python_expression no domain_dictionaries.json.

    O contexto de avaliação inclui:
      - Variáveis nomeadas pelos input_roles, convertidas para pd.Series numéricas
      - Funções safe: pd, np, math
    """
    resolved = candidate.get("resolved_inputs", {})
    expr = candidate.get("python_expression", "")

    if not expr:
        logger.warning(f"Derivada '{candidate['derived_name']}' sem python_expression. Ignorando.")
        return None

    ctx = {"pd": pd, "np": np, "math": math}
    for role, col in resolved.items():
        if col not in df.columns:
            return None
        series = pd.to_numeric(df[col].astype(str).str.replace(",", "."), errors="coerce")
        ctx[role] = series

    try:
        result = eval(expr, {"__builtins__": {}}, ctx)  # noqa: S307
        if isinstance(result, pd.Series):
            return result.round(4)
        return pd.Series([result] * len(df), index=df.index)
    except Exception as e:
        logger.warning(f"Falha ao avaliar expression '{expr}': {e}")
        return None


# ============================================================
# DETECÇÃO UNIFICADA
# ============================================================

def detect_all_candidates(df: pd.DataFrame, domain_dict_path: str = None) -> list[dict]:
    """
    Detecção unificada: combina detect_derived_candidates (heurísticas hardcoded)
    com detect_from_domain_dict (definições do JSON).

    Evita duplicatas por derived_name.
    """
    seen = set()
    all_cands = []

    for cand in detect_derived_candidates(df):
        if cand["derived_name"] not in seen:
            seen.add(cand["derived_name"])
            all_cands.append(cand)

    for cand in detect_from_domain_dict(df, domain_dict_path):
        if cand["derived_name"] not in seen:
            seen.add(cand["derived_name"])
            all_cands.append(cand)

    return all_cands


# ============================================================
# SOBREVIVÊNCIA — DETECÇÃO, VALIDAÇÃO E PREPROCESSAMENTO
# ============================================================

# Padrões de nomes para detecção automática de colunas de sobrevivência
_SURVIVAL_TIME_PATTERNS = {
    "time":    {"tempo", "time", "duracao", "duration", "seguimento", "follow", "follow-up",
               "followup", "follow_up", "prazo", "periodo", "period", "meses", "months",
               "dias", "days", "semanas", "weeks", "anos", "years"},
    "event":   {"evento", "event", "status", "censura", "censor", "death", "morte",
               "obito", "óbito", "falha", "failure", "evento_obito", "event_type",
               "relapse", "recidiva", "progression", "progressao", "outcome"},
    "endpoint": {"os", "pfs", "dfs", "dss", "overall_survival", "progression_free",
                 "disease_free", "disease_specific"},
}


def detect_survival_columns(df: pd.DataFrame) -> dict:
    """
    Detecta automaticamente colunas de tempo, evento e grupo para análise de sobrevivência.
    Retorna dicionário com sugestões e nível de confiança.
    """
    result = {
        "time_col": None,
        "event_col": None,
        "group_col": None,
        "confidence": "low",
        "candidates": [],
        "warnings": [],
    }

    cols_lower = {c: c.lower().strip().replace(" ", "_").replace("-", "_")
                  for c in df.columns}

    # ── Detecção da coluna de TEMPO ──────────────────────────────
    for col, col_lower in cols_lower.items():
        # Nome da coluna
        if any(p in col_lower for p in _SURVIVAL_TIME_PATTERNS["time"]):
            result["time_col"] = col
            result["candidates"].append({"role": "time", "col": col,
                                         "reason": "Nome sugere tempo de seguimento"})
            break

    if not result["time_col"]:
        # Tentativa por tipo de dado: coluna numérica com valores positivos
        for col in df.columns:
            series = pd.to_numeric(df[col], errors='coerce').dropna()
            if len(series) > 0 and series.min() >= 0 and series.median() > 1:
                if result["time_col"] is None or len(series) > len(pd.to_numeric(df[result["time_col"]], errors='coerce').dropna()):
                    result["time_col"] = col
                    result["candidates"].append({
                        "role": "time", "col": col,
                        "reason": "Coluna numérica com valores positivos (candidata a tempo)"
                    })

    # ── Detecção da coluna de EVENTO ─────────────────────────────
    for col, col_lower in cols_lower.items():
        if any(p in col_lower for p in _SURVIVAL_TIME_PATTERNS["event"]):
            result["event_col"] = col
            result["candidates"].append({"role": "event", "col": col,
                                         "reason": "Nome sugere indicador de evento"})
            break

    if not result["event_col"]:
        # Tentativa: coluna binária (0/1) não detectada como tempo
        for col in df.columns:
            if col == result["time_col"]:
                continue
            series = df[col].dropna()
            unique_vals = set(str(v).strip().lower() for v in series.unique())
            # Verifica se é binária (0/1, sim/não, etc.)
            if len(unique_vals) == 2:
                numeric_vals = pd.to_numeric(series, errors='coerce').dropna()
                if len(numeric_vals) > 0 and set(numeric_vals.unique()).issubset({0, 1, 0.0, 1.0}):
                    result["event_col"] = col
                    result["candidates"].append({
                        "role": "event", "col": col,
                        "reason": "Coluna binária (0/1) candidata a indicador de evento"
                    })
                    break

    # ── Detecção da coluna de GRUPO ──────────────────────────────
    for col in df.columns:
        if col in (result["time_col"], result["event_col"]):
            continue
        series = df[col].dropna()
        unique_count = series.nunique()
        # Coluna categórica com 2-10 valores únicos
        if 2 <= unique_count <= 10 and series.dtype == 'object':
            result["group_col"] = col
            result["candidates"].append({
                "role": "group", "col": col,
                "reason": f"Coluna categórica com {unique_count} valores únicos"
            })
            break

    if not result["group_col"]:
        # Tentativa por padrão de nome
        for col, col_lower in cols_lower.items():
            if col in (result["time_col"], result["event_col"]):
                continue
            if any(kw in col_lower for kw in ["grupo", "group", "tratamento", "treatment",
                                                "arm", "sexo", "sex", "genero", "gender",
                                                "categoria", "category"]):
                result["group_col"] = col
                result["candidates"].append({
                    "role": "group", "col": col,
                    "reason": "Nome sugere variável de agrupamento"
                })
                break

    # ── Avaliação de confiança ───────────────────────────────────
    found = sum(1 for k in ["time_col", "event_col", "group_col"] if result[k])
    if found == 3:
        result["confidence"] = "high"
    elif found == 2:
        result["confidence"] = "medium"
    else:
        result["confidence"] = "low"

    # Warnings úteis
    if not result["time_col"]:
        result["warnings"].append("Não foi possível identificar coluna de tempo.")
    if not result["event_col"]:
        result["warnings"].append("Não foi possível identificar coluna de evento (desfecho binário).")
    if not result["group_col"]:
        result["warnings"].append("Coluna de grupo não identificada. Análise será feita sem agrupamento.")

    return result


def validate_survival_data(df: pd.DataFrame, time_col: str, event_col: str) -> dict:
    """
    Valida dados de sobrevivência antes da análise.
    Retorna dicionário com status, warnings e erros.
    """
    issues = []
    warnings = []

    # Verificar se colunas existem
    if time_col not in df.columns:
        issues.append(f"Coluna de tempo '{time_col}' não encontrada.")
    if event_col not in df.columns:
        issues.append(f"Coluna de evento '{event_col}' não encontrada.")

    if issues:
        return {"valid": False, "issues": issues, "warnings": warnings}

    # Converter para numérico
    time_series = pd.to_numeric(df[time_col], errors='coerce')
    event_series = pd.to_numeric(df[event_col], errors='coerce')

    # Verificar valores negativos no tempo
    neg_time = (time_series < 0).sum()
    if neg_time > 0:
        issues.append(f"Encontrados {neg_time} valores negativos na coluna de tempo.")

    # Verificar NaN/missing
    n_time_missing = time_series.isna().sum()
    n_event_missing = event_series.isna().sum()
    if n_time_missing > 0:
        warnings.append(f"Coluna de tempo: {n_time_missing} valores faltantes serão ignorados.")
    if n_event_missing > 0:
        warnings.append(f"Coluna de evento: {n_event_missing} valores faltantes serão ignorados.")

    # Verificar valores do evento
    valid_event_values = {0, 1, 0.0, 1.0}
    event_non_null = event_series.dropna()
    invalid_events = event_non_null[~event_non_null.isin(valid_event_values)]
    if len(invalid_events) > 0:
        unique_invalid = invalid_events.unique()[:5]
        issues.append(
            f"Coluna de evento contém valores inválidos: {list(unique_invalid)}. "
            f"Esperado 0/1 (censurado/evento)."
        )

    # Verificar tamanho amostral mínimo
    n_valid = len(time_series.dropna().dropna())
    if n_valid < 5:
        issues.append(f"Amostra muito pequena (n={n_valid}). Mínimo recomendado: 5.")

    # Verificar variância zero no tempo
    if time_series.std() == 0:
        issues.append("Coluna de tempo com variância zero (todos os valores iguais).")

    # Verificar censura mínima
    n_events = int(event_series.sum())
    n_censored = int((event_series == 0).sum())
    if n_events == 0:
        issues.append("Nenhum evento observado (todos censurados).")
    if n_censored == 0:
        warnings.append("Nenhum dado censurado — curvas KM serão degraus sem censura.")

    # Verificar proporção de censura excessiva
    if n_valid > 0:
        censoring_rate = n_censored / n_valid
        if censoring_rate > 0.9:
            warnings.append(
                f"Alta taxa de censura ({round(censoring_rate * 100, 1)}%). "
                f"Resultados podem ser imprecisos."
            )

    valid = len(issues) == 0
    return {
        "valid": valid,
        "issues": issues,
        "warnings": warnings,
        "n_valid": n_valid,
        "n_events": n_events,
        "n_censored": n_censored,
    }


def preprocess_survival(df: pd.DataFrame, time_col: str, event_col: str,
                        group_col: Optional[str] = None) -> dict:
    """
    Preprocessa dados de sobrevivência: limpa, converte tipos, aplica log-transform.
    Retorna DataFrame processado e metadados.
    """
    df = df.copy()

    # Converter colunas numéricas
    df[time_col] = pd.to_numeric(df[time_col], errors='coerce')
    df[event_col] = pd.to_numeric(df[event_col], errors='coerce')

    # Remover linhas com tempo ou evento faltante
    valid_mask = df[time_col].notna() & df[event_col].notna()
    n_removed = (~valid_mask).sum()
    df_clean = df[valid_mask].copy()

    # Remover tempos negativos
    neg_mask = df_clean[time_col] < 0
    if neg_mask.any():
        n_neg = neg_mask.sum()
        df_clean = df_clean[~neg_mask]
    else:
        n_neg = 0

    warnings = []

    # Log-transform do tempo se distribuição muito assimétrica (skew > 2)
    skewness = float(df_clean[time_col].skew())
    log_applied = False
    if abs(skewness) > 2:
        # Somente se todos os valores > 0
        if (df_clean[time_col] > 0).all():
            df_clean[f"{time_col}_log"] = np.log(df_clean[time_col])
            log_applied = True
            warnings.append(f"Log-transform aplicada (skew={skewness:.2f}).")
        else:
            warnings.append(f"Distribuição assimétrica (skew={skewness:.2f}), mas valores ≤ impedem log-transform.")

    # Garantir que evento é 0/1
    df_clean[event_col] = df_clean[event_col].clip(0, 1).astype(int)

    # Forçar tempo para float
    df_clean[time_col] = df_clean[time_col].astype(float)

    # Garantir que não há duplicatas de paciente (manter primeiro)
    # Nota: se houver coluna de ID, remover duplicatas — mas por segurança
    # mantemos todas as linhas por padrão

    metadata = {
        "n_original": len(df),
        "n_clean": len(df_clean),
        "n_removed_missing": int(n_removed),
        "n_removed_negative": int(n_neg),
        "skewness": round(skewness, 4),
        "log_applied": log_applied,
        "time_range": [float(df_clean[time_col].min()), float(df_clean[time_col].max())],
    }

    return {"dataframe": df_clean, "metadata": metadata}


def compute_nnt(surv1: 'SurvivalFunction', surv2: 'SurvivalFunction',
                times: List[float]) -> dict:
    """
    Calcula Number Needed to Treat a partir de duas curvas de sobrevivência.
    NNT(t) = 1 / [S_controle(t) - S_tratamento(t)]
    """
    nnt_results = {}
    for t in times:
        try:
            s1 = float(surv1(t))
            s2 = float(surv2(t))
            diff = s1 - s2
            if abs(diff) > 1e-10:
                nnt_val = round(1.0 / diff, 1)
                nnt_results[f"T={t}"] = {
                    "s_control": round(s1, 4),
                    "s_treatment": round(s2, 4),
                    "abs_diff": round(diff, 4),
                    "nnt": nnt_val,
                    "interpretation": f"NNT={nnt_val} pacientes tratados por {t} meses para prevenir 1 evento."
                }
            else:
                nnt_results[f"T={t}"] = {
                    "s_control": round(s1, 4),
                    "s_treatment": round(s2, 4),
                    "abs_diff": round(diff, 4),
                    "nnt": None,
                    "interpretation": "Diferença de sobrevivência ≈ 0 — NNT não calculável."
                }
        except Exception:
            nnt_results[f"T={t}"] = {
                "interpretation": f"Não foi possível calcular NNT em T={t}."
            }
    return nnt_results
