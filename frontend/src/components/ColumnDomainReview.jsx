/**
 * ColumnDomainReview.jsx
 * Modal de revisão de domínios especializado — v2 com 3 modos de seleção.
 *
 * Modos por card:
 *   • Automático  — aceita a sugestão do backend (padrão)
 *   • IA          — ativa AiDomainSuggestion para streaming
 *   • Catálogo    — abre DomainCatalog para busca manual
 *
 * Quando a IA não encontra domínio no sistema, SuggestDomainModal é aberto.
 */

import React, { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, ChevronRight, CheckCircle2, AlertTriangle, Info,
  BookOpen, FlaskConical, Eye, Activity, Clock, Scale,
  ChevronDown, ChevronUp, Sparkles, Zap, List, Bot,
  Lightbulb
} from "lucide-react";

import AiDomainSuggestion from "./AiDomainSuggestion";
import DomainCatalog from "./DomainCatalog";
import SuggestDomainModal from "./SuggestDomainModal";

// ─── Utilitários ──────────────────────────────────────────────────────────────

const CONFIDENCE_CONFIG = {
  high:    { color: "#10b981", label: "Alta confiança",   bg: "rgba(16,185,129,0.1)"   },
  medium:  { color: "#f59e0b", label: "Confiança média",  bg: "rgba(245,158,11,0.1)"   },
  low:     { color: "#ef4444", label: "Baixa confiança",  bg: "rgba(239,68,68,0.1)"    },
  unknown: { color: "#64748b", label: "Desconhecido",     bg: "rgba(100,116,139,0.1)"  },
};

const SOURCE_LABELS = {
  dictionary:     "Dicionário clínico",
  ai_library:     "IA + Literatura",
  ai_generic:     "IA (sem biblioteca)",
  manual_catalog: "Catálogo manual",
  ai_suggestion:  "Sugestão da IA",
  unknown:        "Desconhecido",
};

const DOMAIN_ICONS = {
  visual_acuity_snellen: Eye,
  intraocular_pressure:  Activity,
  pain_scale_vas_nrs:    Activity,
  likert_scale_5:        Scale,
  likert_scale_7:        Scale,
  bmi_calculable:        Scale,
  bmi_direct:            Scale,
  mixed_time_units:      Clock,
  _default:              FlaskConical,
};

function DomainIcon({ domain, size = 18 }) {
  const Icon = DOMAIN_ICONS[domain] || DOMAIN_ICONS._default;
  return <Icon size={size} />;
}

// ─── Seletor de modo (tabs "Automático / IA / Catálogo") ──────────────────────

const MODES = [
  { key: "auto",    label: "Ver Sugestão", Icon: Zap,  title: "Ver o que o sistema detectou automaticamente" },
  { key: "ai",      label: "Sugerir com IA", Icon: Bot, title: "Ativar IA para sugerir a categoria correta" },
  { key: "catalog", label: "Catálogo",       Icon: List, title: "Selecionar manualmente do catálogo" },
];

function ModeSelector({ activeMode, onSelect }) {
  return (
    <div style={{
      display: "flex", gap: 4, marginTop: 14, marginBottom: 2,
      padding: "4px", background: "#080f1c", borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.05)",
    }}>
      {MODES.map(({ key, label, Icon, title }) => {
        const isActive = activeMode === key;
        return (
          <motion.button
            key={key}
            onClick={() => onSelect(key)}
            title={title}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 5,
              padding: "7px 10px", borderRadius: 7,
              background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
              border: isActive ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent",
              color: isActive ? "#a5b4fc" : "#4b5563",
              fontSize: 12, fontWeight: isActive ? 600 : 400,
              cursor: "pointer", transition: "all 0.18s",
            }}
            aria-pressed={isActive}
          >
            <Icon size={12} />
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Pill de domínio aplicado ─────────────────────────────────────────────────

function AppliedDomainPill({ domain, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "5px 10px 5px 12px", borderRadius: 20, marginTop: 8,
        background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
        fontSize: 12, color: "#6ee7b7", fontWeight: 500,
      }}
    >
      <CheckCircle2 size={13} style={{ color: "#10b981" }} />
      {domain.display_name}
      <button
        onClick={onClear}
        style={{
          background: "none", border: "none", color: "#10b981",
          cursor: "pointer", padding: "0 2px", lineHeight: 1,
          opacity: 0.7, transition: "opacity 0.15s",
        }}
        title="Remover seleção"
        aria-label="Remover domínio selecionado"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}

// ─── Card de resolução individual ─────────────────────────────────────────────

function ColumnResolutionCard({ resolution, index, onChange }) {
  const [expanded, setExpanded] = useState(false);
  // mode começa como null — sem modo selecionado, card está neutro
  const [mode, setMode] = useState(null);
  const [appliedDomain, setAppliedDomain] = useState(null);
  const [suggestTarget, setSuggestTarget] = useState(null);
  const [showConfidenceMenu, setShowConfidenceMenu] = useState(false);

  // Se o usuário já applied um domínio, usa ele. Senão, neutro.
  const isConfirmed = !!appliedDomain;

  // Opções de transformação: só do domínio aplicado (IA ou catálogo)
  const options = appliedDomain?.transformations || [];

  const selectedTransformation = resolution.userChoice ?? "none";

  // Callbacks ─────────────────────────────────────────────────────────────────

  const handleTransformationChange = useCallback((val) => {
    onChange(resolution.column, { userChoice: val });
  }, [resolution.column, onChange]);

  const handleDomainApply = useCallback((domainData) => {
    setAppliedDomain(domainData);
    setMode(null);
    onChange(resolution.column, {
      userChoice: domainData.transformation || "none",
      domainOverride: domainData,
    });
  }, [resolution.column, onChange]);

  // Confirmar a sugestão automática do backend
  const handleConfirmAuto = useCallback(() => {
    const autoData = {
      domain: resolution.domain,
      display_name: resolution.display_name || resolution.domain?.replace(/_/g, " ") || "Desconhecido",
      transformation: resolution.suggested_transformation || "none",
      transformations: resolution.transformation_options || [],
      rationale: resolution.rationale,
      confidence: resolution.confidence,
      source: resolution.source || "dictionary",
    };
    setAppliedDomain(autoData);
    setMode(null);
    onChange(resolution.column, {
      userChoice: autoData.transformation,
      domainOverride: autoData,
    });
  }, [resolution, onChange]);

  const handleClearApplied = useCallback(() => {
    setAppliedDomain(null);
    setMode(null);
    onChange(resolution.column, { userChoice: undefined, domainOverride: null });
  }, [resolution.column, onChange]);

  const handleModeSelect = useCallback((newMode) => {
    setMode(prev => (prev === newMode ? null : newMode));
  }, []);

  const handleAiNotFound = useCallback((aiResult) => {
    setSuggestTarget(aiResult);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        background: "#111827",
        border: `1px solid ${appliedDomain ? "rgba(16,185,129,0.2)" : "#1f2937"}`,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
        transition: "border-color 0.3s",
      }}
    >
      {/* Header do card */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px", cursor: "pointer", userSelect: "none",
        }}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-label={`Expandir detalhes da coluna ${resolution.column}`}
      >
        {/* Ícone de domínio */}
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: appliedDomain ? "rgba(16,185,129,0.1)" : conf.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: appliedDomain ? "#10b981" : conf.color, flexShrink: 0,
          transition: "all 0.3s",
        }}>
          {appliedDomain
            ? <CheckCircle2 size={18} />
            : <DomainIcon domain={resolution.domain} size={18} />
          }
        </div>

        {/* Nome da coluna + estado */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>
              {resolution.column}
            </span>

            {/* Badge de tipo de dado (sempre visível) */}
            {resolution.sample_values?.length > 0 && (
              <span style={{
                fontSize: 10, padding: "2px 7px",
                borderRadius: 20, background: "rgba(100,116,139,0.08)",
                color: "#4b5563", border: "1px solid #1f2937",
                fontFamily: "monospace",
              }}>
                {resolution.sample_values.slice(0, 2).join(", ")}{resolution.sample_values.length > 2 ? "…" : ""}
              </span>
            )}
          </div>

          {/* Status: confirmado ou aguardando */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            {appliedDomain ? (
              <AppliedDomainPill domain={appliedDomain} onClear={handleClearApplied} />
            ) : (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 10px", borderRadius: 6,
                background: "rgba(71,85,105,0.12)", border: "1px solid rgba(71,85,105,0.2)",
                color: "#475569", fontSize: 12,
              }}>
                <Info size={12} />
                Categoria não definida — expanda para classificar
              </div>
            )}
          </div>
        </div>

        {/* Toggle expand */}
        <div style={{ color: "#475569", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Corpo expandido */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden", borderTop: "1px solid #1a2234" }}
          >
            <div style={{ padding: "16px 16px 20px" }}>

              {/* Se já selecionado: mostrar domínio aplicado + opções de transformação */}
              {appliedDomain && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 12px", borderRadius: 8, marginBottom: 12,
                    background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)",
                  }}>
                    <CheckCircle2 size={15} style={{ color: "#10b981", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#6ee7b7" }}>
                        {appliedDomain.display_name}
                      </div>
                      {appliedDomain.rationale && (
                        <div style={{ fontSize: 11, color: "#475569", marginTop: 2, lineHeight: 1.4 }}>
                          {appliedDomain.rationale}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seleção de transformação */}
                  {options.length > 0 && (
                    <div>
                      <div style={{
                        fontSize: 11, color: "#475569", fontWeight: 600,
                        marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>
                        Transformação
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {options.map((opt) => {
                          const isSelected = (selectedTransformation) === opt.key;
                          return (
                            <label
                              key={opt.key}
                              style={{
                                display: "flex", alignItems: "flex-start", gap: 10,
                                padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                                background: isSelected ? "rgba(99,102,241,0.12)" : "#0f172a",
                                border: `1px solid ${isSelected ? "rgba(99,102,241,0.4)" : "#1f2937"}`,
                                transition: "all 0.15s",
                              }}
                            >
                              <input
                                type="radio"
                                name={`tf_${resolution.column}`}
                                value={opt.key}
                                checked={isSelected}
                                onChange={() => handleTransformationChange(opt.key)}
                                style={{ marginTop: 2, accentColor: "#6366f1" }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? "#a5b4fc" : "#cbd5e1" }}>
                                  {opt.label}
                                </div>
                                {opt.warning && (
                                  <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 3 }}>⚠ {opt.warning}</div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Amostras — sempre visíveis dentro do corpo */}
              {resolution.sample_values?.length > 0 && !appliedDomain && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 10, color: "#374151", fontWeight: 700,
                    marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    Valores de amostra
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {resolution.sample_values.map((v, i) => (
                      <span key={i} style={{
                        fontFamily: "monospace", fontSize: 12,
                        padding: "3px 8px", borderRadius: 5,
                        background: "#0f172a", color: "#64748b", border: "1px solid #1f2937",
                      }}>{v}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Seletor de modo (só aparece se ainda não aplicou) ── */}
              {!appliedDomain && (
                <ModeSelector activeMode={mode} onSelect={handleModeSelect} />
              )}

              {/* Painel: Ver Sugestão (automática do backend) */}
              <AnimatePresence mode="wait">
                {mode === "auto" && !appliedDomain && (
                  <motion.div
                    key="auto-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ overflow: "hidden" }}
                  >
                    {resolution.domain ? (
                      <div style={{
                        marginTop: 12,
                        background: "rgba(99,102,241,0.07)",
                        border: "1px solid rgba(99,102,241,0.2)",
                        borderRadius: 10, padding: "14px 16px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <DomainIcon domain={resolution.domain} size={16} style={{ color: "#818cf8" }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc" }}>
                              {resolution.display_name || resolution.domain?.replace(/_/g, " ")}
                            </div>
                            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                              Detectado automaticamente · {CONFIDENCE_CONFIG[resolution.confidence]?.label || "Confiança desconhecida"}
                            </div>
                          </div>
                        </div>
                        {resolution.rationale && (
                          <div style={{
                            fontSize: 11, color: "#64748b", lineHeight: 1.5,
                            marginBottom: 12, paddingLeft: 4,
                          }}>
                            {resolution.rationale}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                          <motion.button
                            onClick={handleConfirmAuto}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              flex: 1, display: "flex", alignItems: "center", gap: 6,
                              justifyContent: "center", padding: "8px 14px",
                              borderRadius: 8, background: "linear-gradient(135deg, #4338ca, #6366f1)",
                              border: "none", color: "#fff", fontSize: 12, fontWeight: 600,
                              cursor: "pointer", boxShadow: "0 3px 10px rgba(99,102,241,0.3)",
                            }}
                          >
                            <CheckCircle2 size={13} />
                            Confirmar esta categoria
                          </motion.button>
                          <button
                            onClick={() => setMode(null)}
                            style={{
                              padding: "8px 14px", borderRadius: 8,
                              background: "transparent", border: "1px solid #1f2937",
                              color: "#475569", fontSize: 12, cursor: "pointer",
                            }}
                          >
                            Ignorar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        marginTop: 12, padding: "12px 14px",
                        background: "rgba(71,85,105,0.08)", borderRadius: 9,
                        border: "1px solid rgba(71,85,105,0.15)",
                        fontSize: 12, color: "#475569", textAlign: "center",
                      }}>
                        Nenhuma sugestão automática disponível para esta coluna.
                        <br />
                        <span style={{ fontSize: 11, color: "#374151" }}>Use Sugerir com IA ou o Catálogo.</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Painel IA */}
                {mode === "ai" && !appliedDomain && (
                  <motion.div
                    key="ai-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ overflow: "hidden" }}
                  >
                    <AiDomainSuggestion
                      resolution={resolution}
                      onApply={handleDomainApply}
                      onNotFound={handleAiNotFound}
                    />
                  </motion.div>
                )}

                {/* Catálogo */}
                {mode === "catalog" && !appliedDomain && (
                  <motion.div
                    key="catalog-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ overflow: "hidden" }}
                  >
                    <DomainCatalog
                      resolution={resolution}
                      onApply={handleDomainApply}
                      onClose={() => setMode("auto")}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de sugestão ao desenvolvedor (teleportado aqui para manter encapsulamento) */}
      {suggestTarget && (
        <SuggestDomainModal
          resolution={resolution}
          aiResult={suggestTarget}
          onClose={() => setSuggestTarget(null)}
          onSent={() => setSuggestTarget(null)}
        />
      )}
    </motion.div>
  );
}

// ─── Card de aviso bilateral (OD/OE) ─────────────────────────────────────────

function BilateralWarningCard({ warning, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: "rgba(16,185,129,0.06)",
        border: "1px solid rgba(16,185,129,0.2)",
        borderRadius: 10, marginBottom: 10, overflow: "hidden",
      }}
    >
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", cursor: "pointer", userSelect: "none",
        }}
      >
        <Eye size={16} style={{ color: "#10b981", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#6ee7b7" }}>
            Par bilateral detectado:{" "}
            <span style={{ fontFamily: "monospace" }}>{warning.right_column}</span>
            {" + "}
            <span style={{ fontFamily: "monospace" }}>{warning.left_column}</span>
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
            {warning.display_name} — regra clínica disponível
          </div>
        </div>
        {expanded
          ? <ChevronUp size={14} style={{ color: "#475569" }} />
          : <ChevronDown size={14} style={{ color: "#475569" }} />
        }
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(16,185,129,0.12)" }}
          >
            <div style={{ padding: "12px 14px 14px" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 8 }}>
                {warning.clinical_rule}
              </div>
              {warning.derived_column_suggestion && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "7px 10px", borderRadius: 6,
                  background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)",
                  fontSize: 12, color: "#34d399",
                }}>
                  <Lightbulb size={13} />
                  Coluna derivada sugerida:{" "}
                  <span style={{ fontFamily: "monospace", marginLeft: 4 }}>
                    {warning.derived_column_suggestion}
                  </span>
                </div>
              )}
              {warning.reference && (
                <div style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>
                  📚 {warning.reference}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ColumnDomainReview({
  isOpen,
  resolutions = [],
  bilateralWarnings = [],
  derivedCandidates = [],
  onConfirm,
  onSkip,
}) {
  const [choices, setChoices] = useState({});
  const [confirming, setConfirming] = useState(false);

  const handleChange = useCallback((columnName, update) => {
    setChoices(prev => ({
      ...prev,
      [columnName]: { ...(prev[columnName] || {}), ...update },
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    const finalChoices = resolutions.map(r => {
      const ch = choices[r.column] || {};
      return {
        column: r.column,
        domain: ch.domainOverride?.domain || r.domain,
        display_name: ch.domainOverride?.display_name || r.display_name,
        transformation: ch.userChoice ?? r.suggested_transformation ?? "none",
        source: ch.domainOverride?.source || r.source,
      };
    });
    // Inclui candidatos derivados para que o Dashboard saiba quais criar
    await onConfirm(finalChoices, derivedCandidates);
    setConfirming(false);
  }, [resolutions, choices, derivedCandidates, onConfirm]);

  const needsAttention = resolutions.length > 0 || bilateralWarnings.length > 0 || derivedCandidates.length > 0;
  if (!isOpen || !needsAttention) return null;

  const totalColumns = resolutions.length;
  const confirmedCount = resolutions.filter(r => {
    const ch = choices[r.column];
    return ch?.domainOverride || (ch?.userChoice ?? r.suggested_transformation) !== "none" || r.domain === null;
  }).length;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 800,
          background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px 16px",
        }}
      >
        <motion.div
          key="panel"
          initial={{ scale: 0.96, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          style={{
            background: "#0b1221",
            borderRadius: 16,
            boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.15)",
            width: "100%",
            maxWidth: 720,
            maxHeight: "88vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "22px 24px 16px",
            borderBottom: "1px solid #1a2234",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Sparkles size={20} style={{ color: "#818cf8" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>
                  Revisão de Categorias Especializadas
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                  {totalColumns > 0
                    ? `${totalColumns} coluna${totalColumns > 1 ? "s" : ""} detectada${totalColumns > 1 ? "s" : ""}. Confirme ou refine com IA / catálogo.`
                    : "Revise os avisos clínicos antes de prosseguir."
                  }
                </p>

                {/* Legenda dos modos */}
                <div style={{
                  display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap",
                }}>
                  {MODES.map(({ key, label, Icon }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#374151" }}>
                      <Icon size={11} />
                      <strong style={{ color: "#475569" }}>{label}</strong>
                      {key === "auto" && " — aceita sugestão automática"}
                      {key === "ai" && " — ativa IA com streaming"}
                      {key === "catalog" && " — busca manual no catálogo"}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={onSkip}
                title="Pular revisão"
                style={{
                  background: "none", border: "none", color: "#475569",
                  cursor: "pointer", padding: 4, borderRadius: 6,
                }}
                aria-label="Fechar revisão"
              >
                <X size={20} />
              </button>
            </div>

            {/* Barra de progresso */}
            {totalColumns > 0 && (
              <div style={{
                marginTop: 16, height: 3, borderRadius: 2,
                background: "#1a2234", overflow: "hidden",
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(confirmedCount / totalColumns) * 100}%` }}
                  style={{ height: "100%", background: "#6366f1", borderRadius: 2 }}
                />
              </div>
            )}
          </div>

          {/* Corpo com scroll */}
          <div style={{ overflowY: "auto", flex: 1, padding: "18px 24px" }}>

            {/* Pares bilaterais */}
            {bilateralWarnings.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 7, marginBottom: 10,
                  color: "#10b981", fontSize: 12, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  <Eye size={13} />
                  Regras Bilaterais (OD/OE)
                </div>
                {bilateralWarnings.map((w, i) => (
                  <BilateralWarningCard key={`${w.right_column}_${w.left_column}`} warning={w} index={i} />
                ))}
              </div>
            )}

            {/* Cards de coluna */}
            {resolutions.length > 0 && (
              <div>
                {bilateralWarnings.length > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 7, marginBottom: 10,
                    color: "#818cf8", fontSize: 12, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    <FlaskConical size={13} />
                    Categorias por Coluna
                  </div>
                )}
                {resolutions.map((res, i) => (
                  <ColumnResolutionCard
                    key={res.column}
                    resolution={{ ...res, ...choices[res.column] }}
                    index={i}
                    onChange={handleChange}
                  />
                ))}
              </div>
            )}

            {/* Variáveis Derivadas Automáticas */}
            {derivedCandidates.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 7, marginBottom: 10,
                  color: "#f59e0b", fontSize: 12, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  <Sparkles size={13} />
                  Variáveis Derivadas (criadas automaticamente)
                </div>
                <div style={{
                  background: "rgba(245,158,11,0.05)",
                  border: "1px solid rgba(245,158,11,0.18)",
                  borderRadius: 10, padding: "12px 16px",
                }}>
                  <div style={{ color: "#fbbf24", fontWeight: 600, marginBottom: 10, fontSize: 13 }}>
                    As seguintes variáveis serão criadas automaticamente e ficarão disponíveis como desfecho:
                  </div>
                  {derivedCandidates.map((c, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 10px", borderRadius: 7, marginBottom: 6,
                      background: "rgba(245,158,11,0.06)",
                      border: "1px solid rgba(245,158,11,0.12)",
                    }}>
                      <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: "monospace", color: "#fbbf24", fontWeight: 600, fontSize: 13 }}>
                          {c.derived_name}
                        </span>
                        {c.formula && (
                          <span style={{ color: "#64748b", marginLeft: 8, fontSize: 11 }}>
                            ({c.formula})
                          </span>
                        )}
                        {c.sources && (
                          <span style={{ color: "#475569", marginLeft: 6, fontSize: 11 }}>
                            ← {Array.isArray(c.sources) ? c.sources.join(" + ") : c.sources}
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontSize: 10, padding: "2px 7px", borderRadius: 20,
                        background: "rgba(16,185,129,0.1)", color: "#34d399",
                        border: "1px solid rgba(16,185,129,0.2)", whiteSpace: "nowrap",
                      }}>
                        {c.type === "best_eye" ? "Melhor olho" :
                         c.type === "snellen_to_logmar" ? "LogMAR" :
                         c.type === "imc" ? "IMC" :
                         c.type || "derivada"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nota de rodapé */}
            <div style={{
              display: "flex", gap: 8, padding: "10px 12px",
              background: "rgba(100,116,139,0.06)", borderRadius: 8,
              border: "1px solid #1a2234", marginTop: 4,
              fontSize: 11, color: "#475569", lineHeight: 1.6,
            }}>
              <Info size={13} style={{ color: "#4b5563", marginTop: 1, flexShrink: 0 }} />
              <span>
                Use o modo <strong style={{ color: "#818cf8" }}>Automático</strong> para
                aceitar a detecção, <strong style={{ color: "#818cf8" }}>Sugerir IA</strong> para
                uma análise aprofundada, ou <strong style={{ color: "#818cf8" }}>Catálogo</strong> para
                busca manual. Se uma categoria ainda não existe, envie uma sugestão ao desenvolvedor.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 24px",
            borderTop: "1px solid #1a2234",
            background: "#0b1221",
            flexShrink: 0,
          }}>
            <button
              onClick={onSkip}
              style={{
                padding: "9px 18px", borderRadius: 8,
                background: "transparent", border: "1px solid #253354",
                color: "#475569", fontSize: 13, cursor: "pointer",
              }}
            >
              Pular (usar padrões)
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {totalColumns > 0 && (
                <span style={{ fontSize: 12, color: "#475569" }}>
                  {confirmedCount}/{totalColumns} revisada{confirmedCount !== 1 ? "s" : ""}
                </span>
              )}
              <motion.button
                onClick={handleConfirm}
                disabled={confirming}
                whileHover={!confirming ? { scale: 1.02 } : {}}
                whileTap={!confirming ? { scale: 0.97 } : {}}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 22px", borderRadius: 8,
                  background: confirming ? "#2c3359" : "linear-gradient(135deg, #4f46e5, #6366f1)",
                  border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: confirming ? "not-allowed" : "pointer",
                  boxShadow: confirming ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
                  transition: "all 0.2s",
                }}
                id="domain-review-confirm-btn"
              >
                {confirming ? "Aplicando…" : "Confirmar e Continuar"}
                {!confirming && <ChevronRight size={15} />}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
