/**
 * AiDomainSuggestion.jsx
 * Painel inline que mostra a sugestão de domínio via IA com streaming progressivo.
 * Exibe mensagens de "digitação" enquanto a IA pensa, e o resultado final com opções.
 */

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, CheckCircle2, AlertTriangle, XCircle,
  Send, Loader2, ChevronRight, BookOpen
} from "lucide-react";
import { streamAiDomainSuggest } from "../api";

// ─── Componente de typing dots ────────────────────────────────────────────────

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center", marginLeft: 6 }}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          style={{
            width: 4, height: 4, borderRadius: "50%",
            background: "#818cf8", display: "inline-block",
          }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

// ─── Painel principal ─────────────────────────────────────────────────────────

export default function AiDomainSuggestion({
  resolution,
  onApply,
  onNotFound,
}) {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [thinkingMsg, setThinkingMsg] = useState("");
  const [result, setResult] = useState(null);
  const [selectedTf, setSelectedTf] = useState(null);
  const abortRef = useRef(null);

  const handleRequest = useCallback(async () => {
    if (status === "loading") {
      // Cancelar stream em andamento
      if (abortRef.current) abortRef.current = false;
      setStatus("idle");
      return;
    }

    setStatus("loading");
    setResult(null);
    setSelectedTf(null);
    setThinkingMsg("Iniciando análise…");
    abortRef.current = true;

    try {
      const stream = await streamAiDomainSuggest({
        column_name: resolution.column,
        sample_values: resolution.sample_values || [],
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (abortRef.current) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const parsed = JSON.parse(line.replace(/^data:\s*/, ""));
            if (parsed.type === "thinking") {
              setThinkingMsg(parsed.message);
            } else if (parsed.type === "result") {
              setResult(parsed);
              if (parsed.found_in_system) {
                setSelectedTf(parsed.suggested_transformation || parsed.transformations?.[0]?.key || "none");
              }
              setStatus("done");
            } else if (parsed.type === "error") {
              setStatus("error");
              setThinkingMsg(parsed.message || "Erro inesperado");
            }
          } catch {
            // linha malformada, ignorar
          }
        }
      }
    } catch (err) {
      setStatus("error");
      setThinkingMsg(err.message || "Falha na conexão com a IA.");
    }
  }, [status, resolution]);

  const handleApply = useCallback(() => {
    if (!result?.found_in_system) return;
    onApply({
      domain: result.domain_key,
      display_name: result.display_name,
      transformation: selectedTf || "none",
      transformations: result.transformations || [],
      rationale: result.rationale,
      confidence: result.confidence,
      source: result.source,
    });
  }, [result, selectedTf, onApply]);

  const handleSuggest = useCallback(() => {
    if (onNotFound) onNotFound(result);
  }, [result, onNotFound]);

  return (
    <div style={{ marginTop: 14 }}>
      {/* Botão de ativação */}
      {status === "idle" && (
        <motion.button
          onClick={handleRequest}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", padding: "10px 14px", borderRadius: 9,
            background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))",
            border: "1px solid rgba(99,102,241,0.3)",
            color: "#a5b4fc", fontSize: 13, fontWeight: 600,
            cursor: "pointer", justifyContent: "center",
            transition: "all 0.2s",
          }}
          id={`ai-suggest-btn-${resolution.column}`}
        >
          <Sparkles size={15} style={{ color: "#818cf8" }} />
          ✦ Sugerir categoria com IA
        </motion.button>
      )}

      {/* Estado de carregamento */}
      <AnimatePresence mode="wait">
        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 10, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={18} style={{ color: "#818cf8" }} />
            </motion.div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#a5b4fc", fontWeight: 500 }}>
                IA analisando
                <TypingDots />
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={thinkingMsg}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  style={{ fontSize: 11, color: "#475569", marginTop: 3 }}
                >
                  {thinkingMsg}
                </motion.div>
              </AnimatePresence>
            </div>
            <button
              onClick={handleRequest}
              style={{
                background: "none", border: "none", color: "#475569",
                cursor: "pointer", fontSize: 11, padding: "4px 8px",
                borderRadius: 5, transition: "color 0.15s",
              }}
            >
              Cancelar
            </button>
          </motion.div>
        )}

        {/* Resultado */}
        {status === "done" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            {result.found_in_system ? (
              /* ── Encontrou no sistema ── */
              <div style={{
                background: "rgba(16,185,129,0.06)",
                border: "1px solid rgba(16,185,129,0.22)",
                borderRadius: 10, padding: "14px 16px",
              }}>
                {/* Cabeçalho */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: 12,
                }}>
                  <CheckCircle2 size={16} style={{ color: "#10b981", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#6ee7b7" }}>
                      {result.display_name}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                      Encontrado no sistema · Confiança: {result.confidence}
                    </div>
                  </div>
                  {/* Botão reanalisar */}
                  <button
                    onClick={() => { setStatus("idle"); setResult(null); }}
                    style={{
                      background: "none", border: "none", color: "#475569",
                      cursor: "pointer", fontSize: 11, padding: "3px 7px",
                      borderRadius: 4, transition: "color 0.15s",
                    }}
                  >
                    Reanalisar
                  </button>
                </div>

                {/* Rationale */}
                {result.rationale && (
                  <div style={{
                    display: "flex", gap: 8, padding: "8px 10px",
                    background: "rgba(16,185,129,0.06)", borderRadius: 7,
                    border: "1px solid rgba(16,185,129,0.12)", marginBottom: 12,
                  }}>
                    <BookOpen size={12} style={{ color: "#10b981", marginTop: 1, flexShrink: 0 }} />
                    <div style={{ fontSize: 11, color: "#6ee7b7", lineHeight: 1.5 }}>
                      {result.rationale}
                    </div>
                  </div>
                )}

                {/* Seletor de transformação */}
                {result.transformations?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{
                      fontSize: 10, color: "#475569", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7,
                    }}>
                      Transformação
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {result.transformations.map(tf => {
                        const isSelected = selectedTf === tf.key;
                        return (
                          <motion.label
                            key={tf.key}
                            whileHover={{ x: 2 }}
                            style={{
                              display: "flex", alignItems: "flex-start", gap: 8,
                              padding: "8px 10px", borderRadius: 7, cursor: "pointer",
                              background: isSelected ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.03)",
                              border: `1px solid ${isSelected ? "rgba(16,185,129,0.35)" : "rgba(16,185,129,0.1)"}`,
                              transition: "all 0.15s",
                            }}
                          >
                            <input
                              type="radio"
                              name={`ai_tf_${resolution.column}`}
                              value={tf.key}
                              checked={isSelected}
                              onChange={() => setSelectedTf(tf.key)}
                              style={{ marginTop: 2, accentColor: "#10b981" }}
                            />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 500, color: isSelected ? "#6ee7b7" : "#94a3b8" }}>
                                {tf.label}
                              </div>
                              {tf.warning && (
                                <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 2 }}>⚠ {tf.warning}</div>
                              )}
                            </div>
                          </motion.label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Botão aplicar */}
                <motion.button
                  onClick={handleApply}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    width: "100%", padding: "9px 14px", borderRadius: 8,
                    background: "linear-gradient(135deg, #059669, #10b981)",
                    border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", justifyContent: "center",
                    boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
                  }}
                >
                  <CheckCircle2 size={14} />
                  Aplicar esta categoria
                  <ChevronRight size={13} />
                </motion.button>
              </div>
            ) : (
              /* ── Não encontrou no sistema ── */
              <div style={{
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.22)",
                borderRadius: 10, padding: "14px 16px",
              }}>
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  marginBottom: 12,
                }}>
                  <AlertTriangle size={16} style={{ color: "#f59e0b", marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>
                      Categoria não encontrada no sistema
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, lineHeight: 1.5 }}>
                      {result.rationale
                        ? `A IA identificou como: "${result.suggested_name}" (${result.suggested_treatment})`
                        : "Não foi possível identificar esta variável com certeza."}
                    </div>
                  </div>
                </div>

                {result.warning && (
                  <div style={{
                    padding: "7px 10px", borderRadius: 6,
                    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
                    fontSize: 11, color: "#fbbf24", marginBottom: 12,
                  }}>
                    ⚠ {result.warning}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <motion.button
                    onClick={handleSuggest}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", gap: 7,
                      padding: "9px 12px", borderRadius: 8,
                      background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.15))",
                      border: "1px solid rgba(245,158,11,0.35)",
                      color: "#fbbf24", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", justifyContent: "center",
                    }}
                  >
                    <Send size={13} />
                    Sugerir nova categoria ao desenvolvedor
                  </motion.button>
                  <button
                    onClick={() => { setStatus("idle"); setResult(null); }}
                    style={{
                      padding: "9px 12px", borderRadius: 8,
                      background: "transparent", border: "1px solid #1f2937",
                      color: "#475569", fontSize: 12, cursor: "pointer",
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Erro */}
        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 14px", borderRadius: 9,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <XCircle size={15} style={{ color: "#ef4444", flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: "#f87171" }}>
              {thinkingMsg}
            </div>
            <button
              onClick={() => { setStatus("idle"); setThinkingMsg(""); }}
              style={{
                background: "none", border: "none", color: "#475569",
                cursor: "pointer", fontSize: 11
              }}
            >
              Tentar novamente
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
