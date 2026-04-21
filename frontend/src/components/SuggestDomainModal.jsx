/**
 * SuggestDomainModal.jsx
 * Modal para enviar sugestão de nova categoria ao desenvolvedor.
 * Aparece quando a IA não encontra o domínio no sistema.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, CheckCircle2, Mail, AlertTriangle, Loader2, Info
} from "lucide-react";
import { submitDomainSuggestion } from "../api";

export default function SuggestDomainModal({ resolution, aiResult, onClose, onSent }) {
  const [suggestedName, setSuggestedName] = useState(aiResult?.suggested_name || "");
  const [suggestedTreatment, setSuggestedTreatment] = useState(aiResult?.suggested_treatment || "");
  const [userNote, setUserNote] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    // Focar no campo de nome ao abrir
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const canSend = suggestedName.trim().length > 2 && status === "idle";

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const result = await submitDomainSuggestion({
        column_name: resolution.column,
        sample_values: resolution.sample_values || [],
        suggested_name: suggestedName.trim(),
        suggested_treatment: suggestedTreatment.trim() || undefined,
        user_note: userNote.trim() || undefined,
      });
      setStatus("success");
      if (onSent) onSent(result);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Falha ao enviar. Tente novamente.");
    }
  }, [canSend, resolution, suggestedName, suggestedTreatment, userNote, onSent]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onKeyDown={handleKeyDown}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px 16px",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.93, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          style={{
            background: "#0b1221",
            borderRadius: 16, padding: 28,
            width: "100%", maxWidth: 480,
            border: "1px solid rgba(245,158,11,0.2)",
            boxShadow: "0 30px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(245,158,11,0.08)",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            marginBottom: 22,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Mail size={18} style={{ color: "#fbbf24" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
                Sugerir nova categoria
              </h3>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
                Sua sugestão ajuda a melhorar o sistema para todos
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", color: "#475569",
                cursor: "pointer", padding: 6, borderRadius: 6,
                display: "flex", alignItems: "center",
                transition: "color 0.15s",
              }}
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Info da coluna */}
          <div style={{
            display: "flex", gap: 10, padding: "10px 12px",
            background: "rgba(99,102,241,0.07)", borderRadius: 9,
            border: "1px solid rgba(99,102,241,0.15)", marginBottom: 18,
          }}>
            <Info size={13} style={{ color: "#818cf8", marginTop: 1, flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: 11, color: "#64748b" }}>Coluna: </span>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "#a5b4fc", fontWeight: 600 }}>
                {resolution.column}
              </span>
              {resolution.sample_values?.length > 0 && (
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                  Amostras: {resolution.sample_values.slice(0, 4).join(", ")}
                </div>
              )}
            </div>
          </div>

          {status !== "success" ? (
            <>
              {/* Campo: nome da categoria */}
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 600,
                  color: "#64748b", marginBottom: 7,
                }}>
                  Nome da categoria *
                </label>
                <input
                  ref={inputRef}
                  value={suggestedName}
                  onChange={e => setSuggestedName(e.target.value)}
                  placeholder="Ex: Escala de Ansiedade de Hamilton (HAM-A)"
                  disabled={status === "sending"}
                  style={{
                    width: "100%", padding: "10px 13px", borderRadius: 8,
                    background: "#111827",
                    border: `1px solid ${suggestedName.length > 2 ? "rgba(99,102,241,0.35)" : "#1f2937"}`,
                    color: "#f1f5f9", fontSize: 13, outline: "none",
                    boxSizing: "border-box", transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.target.style.borderColor = suggestedName.length > 2 ? "rgba(99,102,241,0.35)" : "#1f2937"}
                />
              </div>

              {/* Campo: tratamento sugerido */}
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 600,
                  color: "#64748b", marginBottom: 7,
                }}>
                  Como tratar os dados? <span style={{ fontWeight: 400, color: "#374151" }}>(opcional)</span>
                </label>
                <input
                  value={suggestedTreatment}
                  onChange={e => setSuggestedTreatment(e.target.value)}
                  placeholder="Ex: ordinal, contínuo, categórico, score 0–100…"
                  disabled={status === "sending"}
                  style={{
                    width: "100%", padding: "10px 13px", borderRadius: 8,
                    background: "#111827", border: "1px solid #1f2937",
                    color: "#f1f5f9", fontSize: 13, outline: "none",
                    boxSizing: "border-box", transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
                  onBlur={e => e.target.style.borderColor = "#1f2937"}
                />
              </div>

              {/* Campo: nota */}
              <div style={{ marginBottom: 22 }}>
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 600,
                  color: "#64748b", marginBottom: 7,
                }}>
                  Nota adicional <span style={{ fontWeight: 400, color: "#374151" }}>(opcional)</span>
                </label>
                <textarea
                  value={userNote}
                  onChange={e => setUserNote(e.target.value)}
                  placeholder="Referência bibliográfica, contexto do estudo, regra especial…"
                  rows={3}
                  disabled={status === "sending"}
                  style={{
                    width: "100%", padding: "10px 13px", borderRadius: 8,
                    background: "#111827", border: "1px solid #1f2937",
                    color: "#f1f5f9", fontSize: 13, outline: "none",
                    boxSizing: "border-box", resize: "vertical",
                    fontFamily: "inherit", lineHeight: 1.5,
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
                  onBlur={e => e.target.style.borderColor = "#1f2937"}
                />
              </div>

              {/* Erro */}
              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex", gap: 8, padding: "9px 12px",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 8, marginBottom: 16,
                    fontSize: 12, color: "#f87171",
                  }}
                >
                  <AlertTriangle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
                  {errorMsg}
                </motion.div>
              )}

              {/* Botões */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={onClose}
                  disabled={status === "sending"}
                  style={{
                    padding: "10px 18px", borderRadius: 9,
                    background: "transparent", border: "1px solid #253354",
                    color: "#475569", fontSize: 13, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  Cancelar
                </button>
                <motion.button
                  onClick={handleSend}
                  disabled={!canSend || status === "sending"}
                  whileHover={canSend ? { scale: 1.03 } : {}}
                  whileTap={canSend ? { scale: 0.97 } : {}}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 20px", borderRadius: 9,
                    background: canSend
                      ? "linear-gradient(135deg, #d97706, #f59e0b)"
                      : "#2a2010",
                    border: "none", color: canSend ? "#fff" : "#4a3b19",
                    fontSize: 13, fontWeight: 600,
                    cursor: canSend ? "pointer" : "not-allowed",
                    boxShadow: canSend ? "0 4px 14px rgba(245,158,11,0.3)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {status === "sending" ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 size={14} />
                      </motion.div>
                      Enviando…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Enviar sugestão
                    </>
                  )}
                </motion.button>
              </div>
            </>
          ) : (
            /* ── Sucesso ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "16px 0 8px" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <CheckCircle2 size={26} style={{ color: "#10b981" }} />
              </motion.div>
              <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                Sugestão enviada!
              </h4>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                Obrigado pela contribuição. Sua sugestão será avaliada e pode ser adicionada
                ao sistema em futuras atualizações.
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: "10px 24px", borderRadius: 9,
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", boxShadow: "0 4px 14px rgba(16,185,129,0.25)",
                }}
              >
                Fechar
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
