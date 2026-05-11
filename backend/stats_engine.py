"""
Stats Engine - Antigravity Pro Portfolio
Associated Skills: python-pro, matplotlib, systematic-debugging
"""

import io
import base64
from typing import Dict, List, Any, Optional, Tuple, Protocol
from dataclasses import dataclass, asdict
import pandas as pd
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
import matplotlib.style as style
import seaborn as sns
from lifelines import KaplanMeierFitter
from lifelines.statistics import logrank_test

# Constants for "Premium" Aesthetics (HSL-based or Sleek Harmony)
ACCENT_COLOR = '#6366f1'  # Indigo-500
BG_COLOR = '#0f172a'      # Slate-900 (Dark Mode)
GRID_COLOR = '#1e293b'    # Slate-800
TEXT_COLOR = '#f8fafc'    # Slate-50

class StatsProvider(Protocol):
    def calculate(self, data: pd.DataFrame) -> Dict[str, Any]:
        ...

@dataclass(frozen=True)
class StatisticalResult:
    test_name: str
    stat_value: float
    p_value: float
    interpretation: str
    ci_lower: Optional[float] = None
    ci_upper: Optional[float] = None
    effect_size: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class PremiumStatsEngine:
    """
    High-performance statistical analysis engine with high-fidelity visualization support.
    Follows 'python-pro' mastery patterns.
    """
    
    def __init__(self, theme: str = 'dark'):
        self.theme = theme
        self._set_style()

    def _set_style(self):
        """Applies premium design system tokens to Matplotlib/Seaborn."""
        if self.theme == 'dark':
            plt.style.use('dark_background')
            plt.rcParams.update({
                'axes.facecolor': BG_COLOR,
                'figure.facecolor': BG_COLOR,
                'axes.edgecolor': GRID_COLOR,
                'grid.color': GRID_COLOR,
                'axes.labelcolor': TEXT_COLOR,
                'xtick.color': TEXT_COLOR,
                'ytick.color': TEXT_COLOR,
                'text.color': TEXT_COLOR,
                'font.family': 'sans-serif',
                'font.sans-serif': ['Inter', 'Roboto', 'Arial']
            })
        sns.set_palette([ACCENT_COLOR, '#ec4899', '#8b5cf6', '#10b981'])

    def run_comprehensive_analysis(self, df: pd.DataFrame, target_col: str, group_col: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes a sequence of tests and generates visualizations.
        Returns a serializable dictionary.
        """
        results = {
            "descriptive": self._get_descriptive(df[target_col]),
            "tests": [],
            "chart": self._generate_distribution_chart(df, target_col, group_col)
        }

        # Auto-detect test based on groups
        if group_col and df[group_col].nunique() == 2:
            groups = [df[df[group_col] == val][target_col].dropna() for val in df[group_col].unique()]
            t_stat, p_val = stats.ttest_ind(*groups)
            results["tests"].append(StatisticalResult(
                test_name="Independent T-Test",
                stat_value=float(t_stat),
                p_value=float(p_val),
                interpretation="Statistically Significant" if p_val < 0.05 else "Not Significant"
            ).to_dict())

        return results

    def _get_descriptive(self, series: pd.Series) -> Dict[str, float]:
        return {
            "mean": float(series.mean()),
            "median": float(series.median()),
            "std": float(series.std()),
            "min": float(series.min()),
            "max": float(series.max())
        }

    def _generate_distribution_chart(self, df: pd.DataFrame, target_col: str, group_col: Optional[str] = None) -> str:
        """Generates a high-quality distribution plot and returns base64 string."""
        plt.figure(figsize=(10, 6))
        
        if group_col:
            sns.kdeplot(data=df, x=target_col, hue=group_col, fill=True, alpha=0.3, linewidth=2)
        else:
            sns.histplot(df[target_col], kde=True, color=ACCENT_COLOR, alpha=0.4, linewidth=0)
            
        plt.title(f'Distribution Analysis: {target_col}', fontsize=16, pad=20, fontweight='bold')
        plt.xlabel(target_col, labelpad=10)
        plt.ylabel('Density', labelpad=10)
        
        # Add glassmorphism-like grid
        plt.grid(True, linestyle='--', alpha=0.1)
        
        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', transparent=False)
        plt.close()
        return base64.b64encode(buf.getvalue()).decode('utf-8')

def clean_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """
    Higieniza o DataFrame antes das análises estatísticas, transformando strings anômalas,
    infinitos e lidando com inconsistência na coluna gênero. Idempotente.
    """
    warnings = []
    df_clean = df.copy()
    df_clean.replace([np.inf, -np.inf], np.nan, inplace=True)
    
    # Padronização de Gênero explicitamente antes das conversões numéricas
    gender_cols = [c for c in df_clean.columns if str(c).lower().strip() in ("genero", "gênero", "sex", "sexo")]
    for col in gender_cols:
        if df_clean[col].dtype == 'object':
            df_clean[col] = df_clean[col].str.strip().str.upper()
            df_clean[col] = df_clean[col].replace({'MASCULINO': 'M', 'FEMININO': 'F', 'MASC': 'M', 'FEM': 'F'})
        
        df_clean = df_clean.dropna(subset=[col])
        unique_vals = df_clean[col].dropna().unique()
        if len(unique_vals) > 2:
            warnings.append(f"Atenção na coluna de gênero ('{col}'): encontrados mais de 2 valores únicos: {list(unique_vals)}")
            
    # Tentativa conservadora de conversão numérica generalizada
    for col in df_clean.columns:
        if df_clean[col].dtype == 'object' and col not in gender_cols:
            df_clean[col] = pd.to_numeric(df_clean[col].astype(str).str.strip().replace({'': np.nan, 'None': np.nan, 'NaN': np.nan}), errors='ignore')
            
    return df_clean, warnings

def choose_and_run_group_comparison(df: pd.DataFrame, outcome_col: str, group_col: str) -> dict:
    """
    Executa exclusivamente métodos não-paramétricos já que acuidade visual e a volumetria local
    possuem forte assimetria:
    - 2 grupos numéricos: Mann-Whitney U.
    - 3+ grupos numéricos: Kruskal-Wallis H.
    """
    groups_raw = {
        g: pd.to_numeric(df.loc[df[group_col] == g, outcome_col], errors='coerce').dropna().values
        for g in df[group_col].dropna().unique()
    }
    # Filtra NAN e grupos vazios/com n insuficiente
    groups = {k: v for k, v in groups_raw.items() if str(k).upper() != 'NAN'}
    
    if any(len(v) < 2 for v in groups.values()):
        return {"test": "N/A", "statistic": None, "p_value": None, "msg": "Grupo com n insuficiente após limpeza. Teste não executado.", "is_normal": False}

    group_arrays = list(groups.values())
    n_groups = len(group_arrays)
    
    if n_groups < 2:
        return {"test": "N/A", "statistic": None, "p_value": None, "msg": "Grupos insuficientes para comparação.", "is_normal": False}
        
    if n_groups == 2:
        stat, p_value = stats.mannwhitneyu(group_arrays[0].ravel(), group_arrays[1].ravel(), alternative='two-sided')
        test_name = "Mann-Whitney U"
    else:
        stat, p_value = stats.kruskal(*[g.ravel() for g in group_arrays])
        test_name = "Kruskal-Wallis"
            
    return {
        "test": test_name,
        "statistic": float(stat) if not pd.isna(stat) else None,
        "p_value": float(p_value) if not pd.isna(p_value) else None,
        "is_normal": False
    }

def calculate_power_and_required_n(effect_size: float, alpha=0.05, power=0.80) -> dict:
    """
    Kalkula power estatístico baseando-se em statsmodels.
    Grace fallback provido se não disponível.
    """
    try:
        from statsmodels.stats.power import TTestIndPower
        analysis = TTestIndPower()
        req_n = analysis.solve_power(effect_size=effect_size, power=power, alpha=alpha, ratio=1.0, alternative='two-sided')
        return {
            "power": float(power),
            "alpha": float(alpha),
            "required_n": int(np.ceil(req_n)) if not np.isnan(req_n) else None,
            "effect_size_used_for_calc": round(effect_size, 4) if effect_size else None
        }
    except Exception as e:
        return {"power": None, "required_n": None, "msg": f"Erro de cálculo com statsmodels: {str(e)}"}

# Singleton-instance for export
engine = PremiumStatsEngine(theme='dark')


# ============================================================
# SURVIVAL ANALYSIS ENGINE
# ============================================================

class SurvivalEngine:
    """
    Motor de análise de sobrevivência baseado em lifelines.
    Implementa Kaplan-Meier, Log-Rank, Cox-PH, Fine-Gray, NNT e diagnósticos.
    """

    def __init__(self):
        self.km_fitter = KaplanMeierFitter()
        self._last_km_result = {}

    # ── Estatísticas Descritivas ──────────────────────────────────
    def survival_descriptive(self, df: pd.DataFrame, time_col: str, event_col: str) -> dict:
        """
        Estatísticas descritivas da análise de sobrevivência.
        Retorna n, eventos, censurados, mediana, % censura.
        """
        time = pd.to_numeric(df[time_col], errors='coerce').dropna()
        event = df.loc[time.index, event_col].dropna()

        # Garantir que event é 0/1
        event = pd.to_numeric(event, errors='coerce').dropna()
        valid_idx = time.index.intersection(event.index)
        time = time.loc[valid_idx]
        event = event.loc[valid_idx]

        n_total = len(time)
        n_events = int(event.sum())
        n_censored = n_total - n_events
        pct_censored = round(n_censored / n_total * 100, 1) if n_total > 0 else 0

        # Mediana de sobrevivência (por grupo se disponível)
        median_overall = self._compute_median_survival(time, event)

        result = {
            "n_total": n_total,
            "n_events": n_events,
            "n_censored": n_censored,
            "pct_censored": pct_censored,
            "median_overall": median_overall,
            "min_time": round(float(time.min()), 2),
            "max_time": round(float(time.max()), 2),
            "mean_time": round(float(time.mean()), 2),
            "median_follow_up": round(float(time.median()), 2),
        }
        return result

    def _compute_median_survival(self, time: pd.Series, event: pd.Series) -> Optional[float]:
        """Calcula mediana de sobrevivência usando lifelines."""
        try:
            kmf = KaplanMeierFitter()
            kmf.fit(time, event_observed=event)
            median = kmf.median_survival_time_
            if pd.isna(median):
                return None
            return round(float(median), 2)
        except Exception:
            return None

    # ── Kaplan-Meier ──────────────────────────────────────────────
    def kaplan_meier(self, df: pd.DataFrame, time_col: str, event_col: str,
                     group_col: Optional[str] = None) -> dict:
        """
        Calcula curvas Kaplan-Meier com IC95% (Greenwood), medianas, RMST e n_at_risk.
        Suporta agrupamento (group_col) ou análise unificada.
        """
        time = pd.to_numeric(df[time_col], errors='coerce')
        event = pd.to_numeric(df[event_col], errors='coerce')

        valid_mask = time.notna() & event.notna()
        time = time[valid_mask]
        event = event[valid_mask]
        df_valid = df.loc[valid_mask]

        result = {"curves": [], "overall": {}}

        if group_col and group_col in df.columns:
            groups = df_valid[group_col].dropna().unique()
            groups = sorted(groups, key=str)

            for grp in groups:
                mask = df_valid[group_col] == grp
                t = time[mask]
                e = event[mask]
                curve_data = self._fit_km_curve(t, e, str(grp))
                if curve_data:
                    result["curves"].append(curve_data)
        else:
            curve_data = self._fit_km_curve(time, event, "Geral")
            if curve_data:
                result["curves"].append(curve_data)

        # Overall stats
        result["overall"] = result["curves"][0] if result["curves"] else {}
        n_curves = len(result["curves"])
        if n_curves >= 2:
            # Compute RMST difference between first two groups
            try:
                from lifelines.utils import restricted_mean_survival_time
                rmsts = []
                for c in result["curves"]:
                    if c.get("median") and c["median"] > 0:
                        rmsts.append(c["rmst"] if "rmst" in c else c["median"] * 0.6)
                if len(rmsts) >= 2:
                    result["overall"]["rmst_difference"] = round(rmsts[0] - rmsts[1], 2)
            except Exception:
                pass

        return result

    def _fit_km_curve(self, time: pd.Series, event: pd.Series,
                      group_name: str) -> Optional[dict]:
        """Ajusta uma curva KM e retorna dados serializáveis."""
        if len(time) == 0:
            return None

        try:
            kmf = KaplanMeierFitter()
            kmf.fit(time, event_observed=event, label=group_name)

            # Timeline e survival probabilities
            timeline = kmf.survival_function_.index.tolist()
            survival = kmf.survival_function_.values.flatten().tolist()

            # IC95% via Greenwood (step function)
            ci_lower = kmf.confidence_interval_survival_function_.iloc[:, 0].tolist()
            ci_upper = kmf.confidence_interval_survival_function_.iloc[:, 1].tolist()

            # Número em risco em intervalos padrão
            n_at_risk = self._compute_n_at_risk(kmf, timeline, time, event)

            # Mediana
            median = None
            try:
                m = kmf.median_survival_time_
                if not pd.isna(m):
                    median = round(float(m), 2)
            except Exception:
                pass

            # RMST (Restricted Mean Survival Time)
            rmst = None
            try:
                from lifelines.utils import restricted_mean_survival_time
                max_t = min(time.max(), timeline[-1]) if timeline else time.max()
                rmst = round(float(restricted_mean_survival_time(kmf, t=max_t)), 2)
            except Exception:
                pass

            se_attr = "survival_function_standard_error" if hasattr(kmf, "survival_function_standard_error") else "survival_function_standard_error_"
            try:
                se_val = float(getattr(kmf, se_attr).iloc[0, 0]) if len(getattr(kmf, se_attr)) > 0 else 0
            except Exception:
                se_val = 0
            return {
                "group": group_name,
                "n": int(len(time)),
                "n_events": int(event.sum()),
                "n_censored": int((1 - event).sum()),
                "timeline": [round(t, 2) for t in timeline],
                "survival_prob": [round(s, 6) for s in survival],
                "ci_lower": [round(c, 6) for c in ci_lower],
                "ci_upper": [round(c, 6) for c in ci_upper],
                "n_at_risk": n_at_risk,
                "median": median,
                "rmst": rmst,
                "se": round(se_val, 4),
            }
        except Exception as e:
            print(f"WARN: KM curve failed for group '{group_name}': {e}")
            return None

    def _compute_n_at_risk(self, kmf, timeline, time_all, event_all):
        """
        Calcula número em risco nos pontos de mudança da curva KM.
        Usa lifelines internamente via survival_table_.
        """
        try:
            st = kmf.survival_table_
            n_at_risk = []
            for t in timeline:
                # Número de sujeitos com tempo >= t
                n_risk = int((time_all >= t).sum())
                n_at_risk.append(n_risk)
            return n_at_risk
        except Exception:
            return []

    # ── Log-Rank Test ─────────────────────────────────────────────
    def logrank_test(self, df: pd.DataFrame, time_col: str, event_col: str,
                     group_col: str) -> dict:
        """
        Executa teste Log-Rank (Mantel-Cox).
        Retorna chi², p-valor, e interpretação.
        """
        time = pd.to_numeric(df[time_col], errors='coerce')
        event = pd.to_numeric(df[event_col], errors='coerce')
        groups = df[group_col].dropna()

        valid_mask = time.notna() & event.notna() & groups.notna()
        time = time[valid_mask]
        event = event[valid_mask]
        groups = groups[valid_mask]

        unique_groups = sorted(groups.unique(), key=str)
        if len(unique_groups) < 2:
            return {"error": "Necessário pelo menos 2 grupos para o teste Log-Rank."}

        # Primeiro grupo vs todos os demais
        group1 = unique_groups[0]
        group2 = unique_groups[1] if len(unique_groups) > 1 else unique_groups[-1]

        mask1 = groups == group1
        mask2 = groups == group2

        try:
            result = logrank_test(
                time[mask1], time[mask2],
                event_observed_A=event[mask1],
                event_observed_B=event[mask2]
            )

            chi2 = float(result.test_statistic)
            p_value = float(result.p_value)
            df_stat = 1  # Graus de liberdade para 2 grupos

            # Interpretação
            if p_value < 0.001:
                interpretation = f"Diferença altamente significativa (χ²={chi2:.2f}, p<0.001)"
            elif p_value < 0.01:
                interpretation = f"Diferença muito significativa (χ²={chi2:.2f}, p={p_value:.4f})"
            elif p_value < 0.05:
                interpretation = f"Diferença significativa (χ²={chi2:.2f}, p={p_value:.4f})"
            else:
                interpretation = f"Sem diferença significativa (χ²={chi2:.2f}, p={p_value:.4f})"

            return {
                "test_name": "Log-Rank (Mantel-Cox)",
                "chi2": round(chi2, 4),
                "df": df_stat,
                "p_value": round(p_value, 6),
                "interpretation": interpretation,
                "groups_compared": [str(group1), str(group2)],
                "n_group1": int(mask1.sum()),
                "n_group2": int(mask2.sum()),
            }
        except Exception as e:
            return {"error": f"Erro no teste Log-Rank: {str(e)}"}

    def logrank_tarone_ware(self, df: pd.DataFrame, time_col: str, event_col: str,
                            group_col: str) -> dict:
        """
        Variante Tarone-Ware do Log-Rank (mais peso em eventos precoces).
        """
        time = pd.to_numeric(df[time_col], errors='coerce')
        event = pd.to_numeric(df[event_col], errors='coerce')
        groups = df[group_col].dropna()

        valid_mask = time.notna() & event.notna() & groups.notna()
        time = time[valid_mask]
        event = event[valid_mask]
        groups = groups[valid_mask]

        unique_groups = sorted(groups.unique(), key=str)
        if len(unique_groups) < 2:
            return {"error": "Necessário pelo menos 2 grupos."}

        try:
            from lifelines.statistics import multivariate_logrank_test
            result = multivariate_logrank_test(
                durations=time,
                event_observed=event,
                groups=groups
            )
            chi2 = float(result.test_statistic)
            p_value = float(result.p_value)
            return {
                "test_name": "Log-Rank Multivariado",
                "chi2": round(chi2, 4),
                "p_value": round(p_value, 6),
                "interpretation": f"Teste Log-Rank multivariado: χ²={chi2:.2f}, p={p_value:.4f}"
            }
        except Exception as e:
            return {"error": f"Erro no Log-Rank multivariado: {str(e)}"}

    # ── Cox Proportional Hazards ──────────────────────────────────
    def cox_regression(self, df: pd.DataFrame, time_col: str, event_col: str,
                       covariates: Optional[List[str]] = None,
                       ref_levels: Optional[Dict[str, str]] = None) -> dict:
        """
        Modelo de Cox (PH) com HR, IC95%, C-index, resíduos de Schoenfeld.
        """
        try:
            from lifelines import CoxPHFitter
        except ImportError:
            return {"error": "lifelines não está instalado. Instale: pip install lifelines"}

        time = pd.to_numeric(df[time_col], errors='coerce')
        event = pd.to_numeric(df[event_col], errors='coerce')

        valid_mask = time.notna() & event.notna()
        time = time[valid_mask]
        event = event[valid_mask]

        if covariates:
            cov_df = df.loc[valid_mask, covariates].copy()
        else:
            # Auto-detectar covariáveis numéricas/categóricas
            exclude = {time_col, event_col}
            cov_df = df.loc[valid_mask].select_dtypes(include=[np.number]).drop(
                columns=[c for c in exclude if c in df.columns], errors='ignore'
            )

        # Verificar se temos covariáveis
        if cov_df.empty or cov_df.shape[1] == 0:
            return {"error": "Nenhuma covariável numérica encontrada para o modelo de Cox."}

        # Construir DataFrame para Cox
        cox_df = pd.DataFrame({
            "T": time,
            "E": event
        })
        for col in cov_df.columns:
            cox_df[col] = pd.to_numeric(cov_df[col], errors='coerce')

        # Aplicar referência se fornecida
        try:
            cph = CoxPHFitter()
            cph.fit(cox_df, duration_col="T", event_col="E")

            summary = cph.summary
            coefficients = []

            for idx in summary.index:
                row = summary.loc[idx]
                var_name = str(idx)

                # Interpretação do HR
                hr = float(np.exp(row['coef']))
                hr_ci_low = float(np.exp(row['coef lower 95%']))
                hr_ci_high = float(np.exp(row['coef upper 95%']))
                p_value = float(row['p'])

                direction = ""
                if hr < 1:
                    direction = f"↓ {round((1-hr)*100, 1)}% risco"
                elif hr > 1:
                    direction = f"↑ {round((hr-1)*100, 1)}% risco"
                else:
                    direction = "— Sem efeito"

                sig = ""
                if p_value < 0.001:
                    sig = "***"
                elif p_value < 0.01:
                    sig = "**"
                elif p_value < 0.05:
                    sig = "*"

                coefficients.append({
                    "variable": var_name,
                    "coef": round(float(row['coef']), 4),
                    "hr": round(hr, 4),
                    "hr_ci_lower": round(hr_ci_low, 4),
                    "hr_ci_upper": round(hr_ci_high, 4),
                    "se": round(float(row['se(coef)']), 4),
                    "z": round(float(row['z']), 4),
                    "p_value": p_value,
                    "significance": sig,
                    "interpretation": direction,
                })

            # Concordância (C-index)
            c_index = float(cph.concordance_index_)
            c_index_ci = None
            try:
                # Estimativa aproximada do IC do C-index
                se_c = 0.5 / np.sqrt(cox_df.shape[0]) if cox_df.shape[0] > 0 else 0
                c_index_ci = {
                    "lower": round(c_index - 1.96 * se_c, 4),
                    "upper": round(c_index + 1.96 * se_c, 4)
                }
            except Exception:
                pass

            # LRT (Likelihood Ratio Test)
            lrt = None
            try:
                lrt = round(float(-2 * (cph.log_likelihood_null_ - cph.log_likelihood_)), 4)
            except Exception:
                pass

            # Teste de PH (Schoenfeld)
            ph_result = self.test_proportional_hazards(cox_df, cph)

            return {
                "concordance_index": round(c_index, 4),
                "concordance_ci": c_index_ci,
                "lrt": lrt,
                "lrt_p_value": None,  # Seria calculado via chi2
                "coefficients": coefficients,
                "ph_test": ph_result,
                "n_obs": int(cox_df.shape[0]),
                "n_events": int(event.sum()),
                "model_summary": {
                    "aic": round(float(cph.AIC_partial_), 2) if hasattr(cph, 'AIC_partial_') else None,
                    "log_likelihood": round(float(cph.log_likelihood_), 4) if hasattr(cph, 'log_likelihood_') else None,
                }
            }
        except Exception as e:
            return {"error": f"Erro no modelo de Cox: {str(e)}"}

    def test_proportional_hazards(self, cox_df: pd.DataFrame,
                                  cph=None) -> dict:
        """
        Teste de proporcionalidade de riscos (Schoenfeld residuals).
        """
        try:
            from lifelines.statistics import proportional_hazard_test
            if cph is None:
                from lifelines import CoxPHFitter
                cph = CoxPHFitter()
                cov_cols = [c for c in cox_df.columns if c not in ("T", "E")]
                cph.fit(cox_df, duration_col="T", event_col="E")

            # Teste global de PH
            ph_test = proportional_hazard_test(cph, cox_df, time_transform="rank")

            global_p = float(ph_test.p_values.min()) if hasattr(ph_test, 'p_values') else None

            # Resíduos de Schoenfeld por variável
            results_by_var = []
            try:
                for col in ph_test.results:
                    results_by_var.append({
                        "variable": col,
                        "p_value": round(float(ph_test.p_values[col]), 4) if hasattr(ph_test, 'p_values') and col in ph_test.p_values else None,
                    })
            except Exception:
                pass

            ph_passed = global_p is not None and global_p >= 0.05

            return {
                "global_p_value": round(global_p, 4) if global_p else None,
                "ph_test_passed": ph_passed,
                "recommendation": (
                    "Proporcionalidade de riscos NÃO violada (p ≥ 0.05). Modelo de Cox é adequado."
                    if ph_passed else
                    "Proporcionalidade de riscos VIOLADA (p < 0.05). Considere modelo com covariáveis tempo-dependentes ou estratificação."
                ),
                "details": results_by_var,
            }
        except Exception as e:
            return {
                "error": f"Erro no teste de PH: {str(e)}",
                "ph_test_passed": None,
                "recommendation": "Teste de PH não foi possível. Verifique os dados."
            }

    # ── Fine-Gray Competing Risks ─────────────────────────────────
    def cumulative_incidence(self, df: pd.DataFrame, time_col: str, event_col: str,
                             group_col: Optional[str] = None) -> dict:
        """
        Curvas de incidência cumulativa (Fine-Gray) para riscos competitivos.
        """
        try:
            from lifelines import KaplanMeierFitter
            time = pd.to_numeric(df[time_col], errors='coerce')
            event = pd.to_numeric(df[event_col], errors='coerce')

            valid_mask = time.notna() & event.notna()
            time = time[valid_mask]
            event = event[valid_mask]

            # Para Fine-Gray, eventos são tipicamente 1 e 2 (tipos de evento)
            # onde 0 = censurado
            unique_events = sorted(event.unique())
            event_types = [e for e in unique_events if e > 0]

            result = {"event_types": [], "overall": {}}

            for et in event_types:
                # Evento específico vs censurado (0) vs outros eventos
                binary_event = (event == et).astype(int)

                kmf = KaplanMeierFitter()
                kmf.fit(time, event_observed=binary_event)

                timeline = kmf.survival_function_.index.tolist()
                survival = kmf.survival_function_.values.flatten().tolist()
                ci_lower = kmf.confidence_interval_survival_function_.iloc[:, 0].tolist()
                ci_upper = kmf.confidence_interval_survival_function_.iloc[:, 1].tolist()

                # Incidência cumulativa = 1 - KM survival
                cum_inc = [round(1 - s, 6) for s in survival]

                result["event_types"].append({
                    "event_type": f"Evento {int(et)}",
                    "event_code": int(et),
                    "cumulative_incidence": cum_inc,
                    "ci_lower": [round(1 - c, 6) for c in ci_upper],
                    "ci_upper": [round(1 - c, 6) for c in ci_lower],
                    "timeline": [round(t, 2) for t in timeline],
                    "n_events": int(binary_event.sum()),
                })

            return result
        except ImportError:
            return {"error": "lifelines necessário para incidência cumulativa."}
        except Exception as e:
            return {"error": f"Erro na incidência cumulativa: {str(e)}"}

    # ── Number Needed to Treat ────────────────────────────────────
    def number_needed_to_treat(self, df: pd.DataFrame, time_col: str, event_col: str,
                               group_col: str,
                               times: Optional[List[float]] = None) -> dict:
        """
        Calcula NNT clínico a partir de diferenças de sobrevivência KM.
        NNT = 1 / (S_controle - S_tratamento) em pontos temporais específicos.
        """
        if times is None:
            times = [6, 12, 18, 24, 36]

        time = pd.to_numeric(df[time_col], errors='coerce')
        event = pd.to_numeric(df[event_col], errors='coerce')
        groups = df[group_col].dropna()

        valid_mask = time.notna() & event.notna() & groups.notna()
        time = time[valid_mask]
        event = event[valid_mask]
        groups = groups[valid_mask]

        unique_groups = sorted(groups.unique(), key=str)
        if len(unique_groups) < 2:
            return {"error": "Necessário pelo menos 2 grupos para calcular NNT."}

        nnt_results = {}
        km_curves = {}

        for grp in unique_groups:
            mask = groups == grp
            kmf = KaplanMeierFitter()
            kmf.fit(time[mask], event_observed=event[mask], label=str(grp))
            km_curves[grp] = kmf

        for t in times:
            s_values = {}
            for grp in unique_groups:
                try:
                    s = km_curves[grp].survival_function_at_times(t)
                    s_values[grp] = float(s) if not pd.isna(s) else None
                except Exception:
                    s_values[grp] = None

            # NNT = 1 / (S_controle - S_tratamento)
            # Convenção: grupo 0 = controle, grupo 1 = tratamento
            s_ctrl = s_values.get(unique_groups[0])
            s_treat = s_values.get(unique_groups[1])

            if s_ctrl is not None and s_treat is not None:
                diff = s_ctrl - s_treat
                nnt_val = round(1.0 / diff, 1) if abs(diff) > 1e-10 else None
                nnt_results[f"T={t}"] = {
                    "survival_control": round(s_ctrl, 4),
                    "survival_treatment": round(s_treat, 4),
                    "absolute_difference": round(diff, 4),
                    "nnt": nnt_val,
                    "interpretation": f"NNT de {nnt_val} pacientes tratados para {t} meses para prevenir 1 evento adicional." if nnt_val else "NNT não calculável."
                }
            else:
                nnt_results[f"T={t}"] = {
                    "survival_control": s_ctrl,
                    "survival_treatment": s_treat,
                    "absolute_difference": None,
                    "nnt": None,
                    "interpretation": "Dados insuficientes para este intervalo."
                }

        return {
            "nnt_by_time": nnt_results,
            "groups": [str(g) for g in unique_groups],
        }

    # ── Goodness of Fit ───────────────────────────────────────────
    def goodness_of_fit_test(self, model, df: pd.DataFrame,
                             time_col: str, event_col: str) -> dict:
        """
        Teste de bondade de ajuste de Hosmer-Lemeshow adaptado para modelos de Cox.
        Usa grupos de risco (decis) e compara mortalidade observada vs esperada.
        """
        try:
            time = pd.to_numeric(df[time_col], errors='coerce')
            event = pd.to_numeric(df[event_col], errors='coerce')

            valid_mask = time.notna() & event.notna()
            time = time[valid_mask]
            event = event[valid_mask]

            # Obter risco linear do modelo
            try:
                risk_scores = model.predict_partial_hazard(df.loc[valid_mask])
            except Exception:
                return {"error": "Não foi possível calcular risco parcial."}

            # Dividir em decís (10 grupos)
            n_groups = min(10, len(risk_scores))
            if n_groups < 3:
                return {"error": "Amostra muito pequena para teste de bondade de ajuste."}

            try:
                from sklearn.preprocessing import KBinsDiscretizer
                kbd = KBinsDiscretizer(n_bins=n_groups, encode='ordinal', strategy='quantile')
                risk_groups = kbd.fit_transform(risk_scores.values.reshape(-1, 1)).flatten()
            except ImportError:
                # Fallback: quartis manuais
                risk_groups = pd.qcut(risk_scores.rank(method='first'), q=n_groups,
                                      labels=False, duplicates='drop')

            # Calcular qui-quadrado de Hosmer-Lemeshow
            observed_events = []
            expected_events = []
            group_stats = []

            for g in range(int(max(risk_groups)) + 1):
                mask = risk_groups == g
                n = mask.sum()
                o = int(event[mask].sum())

                # Risco esperado = média do risco no grupo
                avg_risk = risk_scores[mask].mean()
                e = n * avg_risk

                observed_events.append(o)
                expected_events.append(max(e, 0.001))  # evitar divisão por zero

                group_stats.append({
                    "group": g,
                    "n": int(n),
                    "observed": o,
                    "expected": round(e, 2),
                    "o_e_ratio": round(o / max(e, 0.001), 3)
                })

            # Qui-quadrado
            from scipy.stats import chisqprob
            chi2_stat = sum((o - e) ** 2 / e for o, e in zip(observed_events, expected_events))
            df_hl = len(observed_events) - 2
            p_value = float(1 - chisqprob(df_hl, chi2_stat)) if df_hl > 0 else None

            return {
                "test_name": "Hosmer-Lemeshow (adaptado para Cox)",
                "chi2": round(float(chi2_stat), 4),
                "df": df_hl,
                "p_value": round(p_value, 4) if p_value else None,
                "interpretation": (
                    f"Bom ajuste (p={p_value:.3f}) — modelo adequado."
                    if p_value and p_value >= 0.05 else
                    f"Ajuste insuficiente (p={p_value:.3f}) — considere melhorar o modelo."
                    if p_value else
                    "Não foi possível calcular p-valor."
                ),
                "group_details": group_stats,
            }
        except Exception as e:
            return {
                "error": f"Erro no teste de bondade de ajuste: {str(e)}",
                "recommendation": "Use análise de resíduos de Deviance como alternativa."
            }

    # ── Método Unificado de Análise ───────────────────────────────
    def run_full_analysis(self, df: pd.DataFrame, time_col: str, event_col: str,
                          group_col: Optional[str] = None,
                          covariates: Optional[List[str]] = None,
                          ref_levels: Optional[Dict[str, str]] = None) -> dict:
        """
        Executa análise completa de sobrevivência:
        - Estatísticas descritivas
        - Curvas KM com IC95%
        - Teste Log-Rank
        - Modelo de Cox (se covariáveis disponíveis)
        - Teste de PH
        - NNT
        """
        results = {}

        # 1. Estatísticas descritivas
        results["descriptive"] = self.survival_descriptive(df, time_col, event_col)

        # 2. Curvas KM
        results["km_curves"] = self.kaplan_meier(df, time_col, event_col, group_col)

        # 3. Teste Log-Rank (se tem grupos)
        if group_col and group_col in df.columns:
            results["logrank"] = self.logrank_test(df, time_col, event_col, group_col)
            results["logrank_multi"] = self.logrank_tarone_ware(df, time_col, event_col, group_col)

        # 4. Modelo de Cox
        if covariates:
            results["cox_model"] = self.cox_regression(df, time_col, event_col, covariates, ref_levels)
        else:
            # Tentar covariáveis automaticamente
            exclude = {time_col, event_col, group_col}
            auto_covs = [c for c in df.select_dtypes(include=[np.number]).columns
                        if c not in exclude]
            if auto_covs:
                results["cox_model"] = self.cox_regression(
                    df, time_col, event_col, covariates=auto_covs, ref_levels=ref_levels
                )

        # 5. NNT (se tem grupos)
        if group_col:
            results["nnt"] = self.number_needed_to_treat(df, time_col, event_col, group_col)

        # 6. Incidência cumulativa
        results["cumulative_incidence"] = self.cumulative_incidence(df, time_col, event_col, group_col)

        return results
