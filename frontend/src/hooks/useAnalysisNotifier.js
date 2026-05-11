/**
 * useAnalysisNotifier
 *
 * Hook para notificar o usuário quando uma análise termina em background.
 * Funciona mesmo quando o usuário está em outra aba do site.
 *
 * API pública:
 *   requestPermission()  — pede permissão de notificação (chamar no primeiro clique do usuário)
 *   notifyDone(title, body) — dispara chime sonoro + notificação nativa do SO
 */

import { useCallback, useRef, useEffect } from 'react'

// ── Chime sintetizado via Web Audio API (sem arquivos externos) ──────────────
// Sequência de notas: Dó-Mi-Sol-Dó (acorde de dó maior, ascendente)
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    const notes = [
      { freq: 523.25, start: 0,    dur: 0.35 },  // C5
      { freq: 659.25, start: 0.18, dur: 0.35 },  // E5
      { freq: 783.99, start: 0.36, dur: 0.35 },  // G5
      { freq: 1046.5, start: 0.54, dur: 0.55 },  // C6
    ]

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)

      // Envelope suave: fade-in rápido + fade-out lento
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)

      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur + 0.05)
    })

    // Fechar contexto após o chime terminar para liberar recursos
    setTimeout(() => ctx.close(), 1500)
  } catch (e) {
    console.warn('[Chime] Web Audio API não disponível:', e)
  }
}

// ── Hook principal ───────────────────────────────────────────────────────────
export function useAnalysisNotifier() {
  const permissionRef = useRef(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  // Atualiza ref se permissão mudar externamente
  useEffect(() => {
    if (typeof Notification === 'undefined') return
    permissionRef.current = Notification.permission
  }, [])

  /**
   * Pede permissão de notificação ao usuário.
   * Chame isso num handler de clique (requer gesto do usuário em alguns browsers).
   */
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied'
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission()
      permissionRef.current = result
      return result
    }
    return Notification.permission
  }, [])

  /**
   * Dispara:
   *   1. Chime sonoro via Web Audio
   *   2. Notificação nativa do SO (se permission === 'granted')
   *
   * @param {string} title  — Título da notificação
   * @param {string} body   — Corpo do texto
   * @param {string} [icon] — URL do ícone (opcional)
   */
  const notifyDone = useCallback((title = 'Análise concluída', body = '', icon = '/favicon.ico', forceChime = false) => {
    // Toca o chime apenas se forçado
    if (forceChime) {
      playChime()
    }

    // Notificação nativa apenas se permitida e aba em background
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted' &&
      document.visibilityState !== 'visible'
    ) {
      const n = new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: 'pm-analysis-done',   // substitui notificações anteriores da mesma tag
        requireInteraction: false,
        silent: false,             // som padrão do SO (além do chime)
      })

      // Clicar na notificação traz a aba para frente
      n.onclick = () => {
        window.focus()
        n.close()
      }

      // Auto-fechar após 6 segundos
      setTimeout(() => n.close(), 6000)
    }
  }, [])

  return { requestPermission, notifyDone }
}
