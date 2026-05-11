export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Busca o catálogo completo de domínios disponíveis no sistema.
 * @returns {{ catalog: Object, total_domains: number, total_categories: number }}
 */
export async function fetchDomainCatalog() {
  const res = await fetch(`${API_BASE}/api/domain-catalog`);
  if (!res.ok) throw new Error(`Erro ao buscar catálogo: ${res.status}`);
  return res.json();
}

/**
 * Pede sugestão de domínio via IA com streaming SSE.
 * Retorna um ReadableStream que emite eventos de progresso.
 * @param {{ column_name: string, sample_values: string[], context_description?: string }} payload
 * @returns {Promise<ReadableStream>}
 */
export async function streamAiDomainSuggest(payload) {
  const res = await fetch(`${API_BASE}/api/ai-domain-suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Erro na IA: ${res.status}`);
  return res.body;
}

/**
 * Envia sugestão de novo domínio ao desenvolvedor por e-mail.
 * @param {{ column_name, sample_values, suggested_name, suggested_treatment?, user_note? }} payload
 * @returns {{ success: boolean, id: string, email_sent: boolean, message: string }}
 */
export async function submitDomainSuggestion(payload) {
  const res = await fetch(`${API_BASE}/api/suggest-domain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Erro ao enviar sugestão: ${res.status}`);
  return res.json();
}

// ── Survival Analysis API ────────────────────────────────────

/**
 * Detecta automaticamente colunas de sobrevivência no arquivo enviado.
 */
export async function survivalDetectConfig(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/data/survival-config`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Erro na detecção: ${res.status}`);
  return res.json();
}

/**
 * Executa análise completa de sobrevivência (Kaplan-Meier + Log-Rank + Cox + NNT).
 */
export async function survivalAnalyze({ file, timeCol, eventCol, groupCol, covariates, refLevels, endpointType, endpointLabel }) {
  const form = new FormData();
  form.append('file', file);
  form.append('time_col', timeCol);
  form.append('event_col', eventCol);
  if (groupCol) form.append('group_col', groupCol);
  if (covariates && covariates.length) form.append('covariates', JSON.stringify(covariates));
  if (refLevels && Object.keys(refLevels).length) form.append('ref_levels', JSON.stringify(refLevels));
  form.append('endpoint_type', endpointType || 'os');
  form.append('endpoint_label', endpointLabel || 'Overall Survival');

  const res = await fetch(`${API_BASE}/api/data/survival-analysis`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro na análise: ${res.status}`);
  }
  return res.json();
}

/**
 * Carrega dataset de exemplo para sobrevivência.
 */
export async function loadSampleSurvivalData(type = 'clinical_trial') {
  const res = await fetch(`${API_BASE}/api/data/sample/survival?dataset=${type}`);
  if (!res.ok) throw new Error(`Erro ao carregar exemplo: ${res.status}`);
  return res.json();
}
