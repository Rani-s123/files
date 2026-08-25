import { OUTCOMES, evidenceSentence } from "../lib/predictions";

// The evidence base.
//
// A bar showing how often feared outcomes actually arrived. Deliberately not
// framed as a score — there is no "good" number here. Someone whose predictions
// mostly come true is not failing at CBT; they may be in a genuinely difficult
// situation that needs solving rather than reframing, and the copy says so.

export default function EvidenceBase({ base, pending = [] }) {
  if (!base?.hasData) {
    return (
      <div style={s.empty}>
        <p style={s.emptyText}>
          {pending.length > 0
            ? `${pending.length} prediction${pending.length > 1 ? "s" : ""} waiting to be answered. Once a few have played out, your own record of what actually happens will build here.`
            : "When a thought contains a prediction about the future, it gets kept here — and you'll be asked later what actually happened. Over time that becomes your own evidence, rather than someone telling you not to worry."}
        </p>
      </div>
    );
  }

  const segments = [
    { key: "did_not", color: "var(--warm)" },
    { key: "partly", color: "var(--held)" },
    { key: "as_predicted", color: "var(--faint)" },
  ].filter((seg) => base.counts[seg.key]);

  return (
    <div>
      <div style={s.bar} role="img"
           aria-label={`Of ${base.resolved} resolved predictions: ${base.didNotHappen} did not happen, ${base.partly} partly happened, ${base.asPredicted} happened as predicted`}>
        {segments.map((seg) => (
          <span
            key={seg.key}
            style={{
              width: `${(base.counts[seg.key] / base.resolved) * 100}%`,
              background: seg.color,
              height: "100%",
              display: "block",
            }}
          />
        ))}
      </div>

      <div style={s.legend}>
        {segments.map((seg) => (
          <span key={seg.key} style={s.legendItem}>
            <span style={{ ...s.swatch, background: seg.color }} aria-hidden="true" />
            {OUTCOMES[seg.key].label}
            <span style={s.legendCount}>{base.counts[seg.key]}</span>
          </span>
        ))}
      </div>

      <p style={s.sentence}>{evidenceSentence(base)}</p>

      {pending.length > 0 && (
        <p style={s.pending}>
          {pending.length} more still waiting to play out.
        </p>
      )}
    </div>
  );
}

const s = {
  bar: {
    display: "flex", width: "100%", height: 10, borderRadius: 999,
    overflow: "hidden", background: "var(--surface)", border: "1px solid var(--edge)",
  },
  legend: { display: "flex", flexWrap: "wrap", gap: 14, marginTop: 12 },
  legendItem: {
    display: "inline-flex", alignItems: "center", gap: 7,
    fontSize: 13, color: "var(--muted)",
  },
  swatch: { width: 9, height: 9, borderRadius: 2 },
  legendCount: { color: "var(--faint)", fontSize: 12 },
  sentence: {
    fontFamily: "var(--font-display)", fontSize: 17, lineHeight: 1.65,
    margin: "20px 0 0", color: "var(--text)",
  },
  pending: { fontSize: 13.5, color: "var(--faint)", margin: "10px 0 0" },
  empty: {
    padding: "20px 22px", background: "var(--surface)",
    border: "1px dashed var(--edge)", borderRadius: 10,
  },
  emptyText: { fontSize: 14.5, lineHeight: 1.7, color: "var(--muted)", margin: 0 },
};
