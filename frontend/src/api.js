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
