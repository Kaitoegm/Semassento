/**
 * DomainCatalog.jsx — Catálogo com grid de 5 categorias
 * Redesenhado para facilitar seleção de categorias e domínios.
 */

import React, {
  useState, useEffect, useCallback, useMemo, useRef
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Check, BookOpen, Loader2,
  FlaskConical, BarChart2, Activity, Eye, TrendingDown,
  ChevronRight, ChevronDown,
} from "lucide-react";
import { fetchDomainCatalog } from "../api";

// ── 5 Categorias consolidadas ─────────────────────────────────────────────────
const CATEGORY_META = {
  "Exames Laboratoriais": {
    Icon: FlaskConical,
    color: "#22d3ee",    // ciano
    bg: "rgba(34,211,238,0.1)",
    border: "rgba(34,211,238,0.25)",
    desc: "Hemograma, glicemia, creatinina…",
  },
  "Escalas Clínicas": {
    Icon: BarChart2,
    color: "#f59e0b",    // âmbar
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    desc: "EVA, Likert, escores, questionários…",
  },
  "Sinais Vitais e Medidas": {
    Icon: Activity,
    color: "#f43f5e",    // rosa-vermelho
    bg: "rgba(244,63,94,0.1)",
    border: "rgba(244,63,94,0.25)",
    desc: "PA, FC, IMC, idade, sexo…",
  },
  "Oftalmologia": {
    Icon: Eye,
    color: "#10b981",    // verde esmeralda
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
    desc: "AV, PIO, campimetria…",
  },
  "Desfechos e Sobrevida": {
    Icon: TrendingDown,
    color: "#818cf8",    // índigo
    bg: "rgba(129,140,248,0.1)",
    border: "rgba(129,140,248,0.25)",
    desc: "Tempo, evento, mortalidade…",
  },
};

const ALL_CATS = Object.keys(CATEGORY_META);

// ── Highlight de texto ────────────────────────────────────────────────────────
function highlight(text, query) {
  if (!query.trim()) return text;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  return String(text).split(regex).map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={{ background: "rgba(99,102,241,0.35)", color: "#a5b4fc", borderRadius: 2, padding: "0 1px" }}>{part}</mark>
      : part
  );
}

// ── Tile de categoria (grid) ──────────────────────────────────────────────────
function CategoryTile({ catKey, active, count, onClick }) {
  const meta = CATEGORY_META[catKey] || { Icon: FlaskConical, color: "#818cf8", bg: "rgba(129,140,248,0.1)", border: "rgba(129,140,248,0.25)", desc: "" };
  const { Icon, color, bg, border, desc } = meta;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        padding: "12px 14px", borderRadius: 12, cursor: "pointer",
        background: active ? bg : "rgba(255,255,255,0.02)",
        border: `1px solid ${active ? border : "rgba(255,255,255,0.06)"}`,
        textAlign: "left", transition: "all 0.18s",
        boxShadow: active ? `0 0 0 1px ${border}, inset 0 0 20px ${bg}` : "none",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Glow de fundo quando ativo */}
      {active && (
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(circle at 30% 30%, ${bg} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: active ? bg : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? border : "rgba(255,255,255,0.06)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 8, zIndex: 1,
      }}>
        <Icon size={16} style={{ color: active ? color : "#374151" }} />
      </div>

      <div style={{
        fontSize: 12, fontWeight: 700, color: active ? color : "#6b7280",
        lineHeight: 1.3, marginBottom: 3, zIndex: 1,
      }}>
        {catKey}
      </div>

      <div style={{ fontSize: 10, color: "#374151", lineHeight: 1.4, zIndex: 1 }}>
        {desc}
      </div>

      {count != null && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          fontSize: 9, fontWeight: 700,
          padding: "2px 5px", borderRadius: 8,
          background: active ? border : "rgba(255,255,255,0.04)",
          color: active ? color : "#374151",
        }}>
          {count}
        </div>
      )}
    </motion.button>
  );
}

// ── Card de domínio individual ─────────────────────────────────────────────────
function DomainCard({ domain, query, isSelected, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{
        borderRadius: 9,
        border: `1px solid ${isSelected ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.06)"}`,
        background: isSelected ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
        overflow: "hidden", transition: "border-color 0.2s, background 0.2s",
      }}
    >
      {/* Linha principal */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer" }}
        onClick={() => onSelect(domain)}
      >
        <div style={{
          width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
          border: `2px solid ${isSelected ? "#818cf8" : "#374151"}`,
          background: isSelected ? "#818cf8" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}>
          {isSelected && <Check size={9} style={{ color: "#fff", strokeWidth: 3 }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "#a5b4fc" : "#e2e8f0", lineHeight: 1.3 }}>
            {highlight(domain.display_name, query)}
          </div>
          {domain.description && (
            <div style={{
              fontSize: 11, color: "#4b5563", marginTop: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {highlight(domain.description, query)}
            </div>
          )}
        </div>

        {domain.transformations?.length > 0 && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(p => !p); }}
            style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", padding: 4 }}
            title="Ver transformações"
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <ChevronDown size={13} />
            </motion.div>
          </button>
        )}
      </div>

      {/* Detalhes expandidos */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div style={{ padding: "10px 12px 12px", paddingLeft: 38 }}>
              {domain.transformations?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "#374151", fontWeight: 700, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Transformações disponíveis
                  </div>
                  {domain.transformations.map(tf => (
                    <div key={tf.key} style={{
                      fontSize: 11, color: "#64748b", padding: "3px 8px",
                      background: "#0f172a", borderRadius: 5, marginBottom: 3,
                      border: "1px solid #1f2937",
                    }}>
                      <span style={{ color: "#94a3b8", fontWeight: 500 }}>{tf.label}</span>
                      {tf.warning && <span style={{ color: "#f59e0b", marginLeft: 6 }}>⚠ {tf.warning}</span>}
                    </div>
                  ))}
                </div>
              )}
              {domain.examples && (
                <div style={{ fontSize: 11, color: "#374151", marginTop: 6 }}>
                  Ex: {Array.isArray(domain.examples) ? domain.examples.join(", ") : domain.examples}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Painel de confirmação da seleção ──────────────────────────────────────────
function ConfirmPanel({ domain, onApply }) {
  const [selectedTf, setSelectedTf] = useState(
    domain.transformations?.[0]?.key ?? "none"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "14px 16px",
        background: "rgba(99,102,241,0.06)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 10, marginTop: 12,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", marginBottom: 10 }}>
        Transformação para <span style={{ color: "#a5b4fc" }}>{domain.display_name}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {(domain.transformations?.length ? domain.transformations : [{ key: "none", label: "Nenhuma transformação" }]).map(tf => {
          const isSel = selectedTf === tf.key;
          return (
            <label key={tf.key} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 8, cursor: "pointer",
              background: isSel ? "rgba(99,102,241,0.12)" : "#0f172a",
              border: `1px solid ${isSel ? "rgba(99,102,241,0.4)" : "#1f2937"}`,
              transition: "all 0.15s",
            }}>
              <input
                type="radio"
                checked={isSel}
                onChange={() => setSelectedTf(tf.key)}
                style={{ accentColor: "#6366f1" }}
              />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: isSel ? "#a5b4fc" : "#cbd5e1" }}>{tf.label}</div>
                {tf.warning && <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 2 }}>⚠ {tf.warning}</div>}
              </div>
            </label>
          );
        })}
      </div>

      <motion.button
        onClick={() => onApply({
          domain: domain.domain_key,
          display_name: domain.display_name,
          transformation: selectedTf,
          transformations: domain.transformations || [],
          description: domain.description,
          source: "catalog",
        })}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 7,
          padding: "9px 0", borderRadius: 8,
          background: "linear-gradient(135deg, #4338ca, #6366f1)",
          border: "none", color: "#fff", fontSize: 12,
          fontWeight: 600, cursor: "pointer",
          boxShadow: "0 3px 12px rgba(99,102,241,0.35)",
        }}
      >
        <Check size={14} />
        Aplicar esta categoria
      </motion.button>
    </motion.div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function DomainCatalog({ resolution, onApply, onClose }) {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const searchRef = useRef(null);

  // Carregar catálogo
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDomainCatalog()
      .then(data => { if (!cancelled) { setCatalog(data); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message || "Erro ao carregar catálogo"); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  // Foco no search ao abrir
  useEffect(() => { setTimeout(() => searchRef.current?.focus(), 100); }, []);

  // Todos os domínios achatados
  const allDomains = useMemo(() => {
    if (!catalog) return [];
    const raw = catalog.catalog || catalog;
    return Object.entries(raw).flatMap(([cat, domains]) =>
      (Array.isArray(domains) ? domains : []).map(d => ({ ...d, _cat: cat }))
    );
  }, [catalog]);

  // Contagens por categoria
  const countByCat = useMemo(() => {
    const m = {};
    allDomains.forEach(d => { m[d._cat] = (m[d._cat] || 0) + 1; });
    return m;
  }, [allDomains]);

  // Domínios filtrados
  const filtered = useMemo(() => {
    let list = allDomains;
    if (activeCategory) list = list.filter(d => d._cat === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(d =>
        d.display_name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.domain_key?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allDomains, activeCategory, query]);

  const handleSelectCategory = useCallback((cat) => {
    setActiveCategory(prev => (prev === cat ? null : cat));
    setQuery("");
    setSelected(null);
  }, []);

  const handleSelectDomain = useCallback((domain) => {
    setSelected(prev => (prev?.domain_key === domain.domain_key ? null : domain));
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "32px 0", color: "#475569", fontSize: 13 }}>
      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
      Carregando catálogo…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: "16px", textAlign: "center", color: "#f87171", fontSize: 12 }}>
      Erro ao carregar catálogo: {error}
    </div>
  );

  return (
    <div style={{ marginTop: 12 }}>

      {/* Barra de busca */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#0f172a", border: "1px solid #1f2937",
        borderRadius: 8, padding: "7px 11px", marginBottom: 14,
      }}>
        <Search size={13} style={{ color: "#374151", flexShrink: 0 }} />
        <input
          ref={searchRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveCategory(null); }}
          placeholder="Buscar domínios…"
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: "#e2e8f0", fontSize: 13,
          }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", padding: 2 }}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Grid de categorias (só quando não há busca) */}
      {!query.trim() && (
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 10, color: "#374151", fontWeight: 700,
            marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            Categorias
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}>
            {ALL_CATS.map(cat => (
              <CategoryTile
                key={cat}
                catKey={cat}
                active={activeCategory === cat}
                count={countByCat[cat] || 0}
                onClick={() => handleSelectCategory(cat)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lista de domínios */}
      {(query.trim() || activeCategory) && (
        <div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 10, color: "#374151", fontWeight: 700,
            marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            <span>
              {query.trim()
                ? `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""} para "${query}"`
                : `${activeCategory} — ${filtered.length} domínio${filtered.length !== 1 ? "s" : ""}`
              }
            </span>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                style={{
                  background: "none", border: "none",
                  color: "#475569", fontSize: 11, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <X size={11} /> Limpar
              </button>
            )}
          </div>

          <div style={{
            display: "flex", flexDirection: "column", gap: 6,
            maxHeight: 220, overflowY: "auto",
            paddingRight: 2,
          }}>
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.length > 0 ? filtered.map(domain => (
                <DomainCard
                  key={domain.domain_key}
                  domain={domain}
                  query={query}
                  isSelected={selected?.domain_key === domain.domain_key}
                  onSelect={handleSelectDomain}
                />
              )) : (
                <div style={{ textAlign: "center", padding: "16px 0", color: "#374151", fontSize: 12 }}>
                  Nenhum domínio encontrado.
                  <br />
                  <span style={{ fontSize: 11, color: "#1f2937" }}>Tente outra categoria ou busca.</span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Painel de confirmação */}
      <AnimatePresence>
        {selected && (
          <ConfirmPanel domain={selected} onApply={onApply} key={selected.domain_key} />
        )}
      </AnimatePresence>
    </div>
  );
}
