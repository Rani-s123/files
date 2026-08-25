import { useState } from "react";
import { OUTCOMES } from "../lib/predictions";

// The check-back.
//
// This is the moment the whole module exists for. Tone matters enormously here:
// the person is being asked to look at something they were frightened of, and
// the framing must never carry "see, you were wrong". Being wrong about a fear
// is not a failure of judgement — it's how fear works.

export default function PredictionCheck({ prediction, onResolve, onSnooze, onDismiss }) {
  const [note, setNote] = useState("");
  const [chosen, setChosen] = useState(null);

  const daysAgo = Math.max(
    1,
    Math.round((Date.now() - new Date(prediction.madeAt).getTime()) / 86400000)
  );

  return (
    <section style={s.card} aria-labelledby="checkback-heading">
      <p style={s.eyebrow}>Checking back</p>
      <h2 id="checkback-heading" style={s.heading}>
        {daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`} you expected this
      </h2>

      <blockquote style={s.claim}>{prediction.claim}</blockquote>

      <p style={s.ask}>What actually happened?</p>

      <div style={s.options} role="radiogroup" aria-label="What happened">
        {Object.entries(OUTCOMES).map(([key, o]) => {
          const on = chosen === key;
          return (
            <button
              key={key}
              role="radio"
              aria-checked={on}
              onClick={() => setChosen(key)}
              style={{
                ...s.option,
                ...(on ? { ...s.optionOn, borderColor: `var(--${o.tone === "faint" ? "edge" : o.tone})` } : {}),
              }}
            >
              <span
                style={{
                  ...s.dot,
                  borderColor: on ? `var(--${o.tone === "faint" ? "muted" : o.tone})` : "var(--edge)",
                  background: on ? `var(--${o.tone === "faint" ? "muted" : o.tone})` : "transparent",
                }}
                aria-hidden="true"
              />
              {o.label}
            </button>
          );
        })}
      </div>

      {chosen && chosen !== "unresolved" && (
        <div style={s.noteBox}>
          <label style={s.noteLabel} htmlFor="outcome-note">
            Anything worth remembering about how it went? (optional)
          </label>
          <textarea
            id="outcome-note"
            style={s.noteInput}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="They replied two days later, they'd just been travelling."
          />
        </div>
      )}

      <div style={s.actions}>
        <button
          style={s.primary}
          onClick={() => onResolve(prediction.id, chosen, note)}
          disabled={!chosen}
        >
          Record what happened
        </button>
        <div style={s.minorRow}>
          <button style={s.minor} onClick={() => onSnooze(prediction.id)}>
            Too soon to tell — ask again in a few days
          </button>
          <button style={s.minor} onClick={() => onDismiss(prediction.id)}>
            Remove this
          </button>
        </div>
      </div>
    </section>
  );
}

const s = {
  card: {
    background: "linear-gradient(155deg, rgba(240,181,99,.06), var(--surface) 62%)",
    border: "1px solid var(--warm-dim)",
    borderRadius: 12,
    padding: "26px 24px",
    marginBottom: 34,
    animation: "rise .4s ease-out",
  },
  eyebrow: {
    fontSize: 11.5, letterSpacing: 1.4, textTransform: "uppercase",
    color: "var(--warm)", margin: "0 0 10px", fontWeight: 500,
  },
  heading: {
    fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 400,
    lineHeight: 1.35, margin: "0 0 16px",
  },
  claim: {
    margin: "0 0 22px", padding: "15px 18px",
    background: "var(--night)", borderLeft: "2px solid var(--held)",
    borderRadius: 8, fontFamily: "var(--font-display)", fontSize: 17,
    lineHeight: 1.6, fontStyle: "italic", color: "var(--muted)",
  },
  ask: { fontSize: 15, margin: "0 0 12px" },
  options: { display: "flex", flexDirection: "column", gap: 7 },
  option: {
    display: "flex", alignItems: "center", gap: 11, width: "100%",
    padding: "13px 15px", textAlign: "left", fontSize: 14.5,
    background: "var(--night)", border: "1px solid var(--edge)",
    borderRadius: 8, color: "var(--muted)", transition: "all .18s",
  },
  optionOn: { background: "var(--surface-lift)", color: "var(--text)" },
  dot: {
    width: 13, height: 13, borderRadius: "50%", border: "1.5px solid",
    flexShrink: 0, transition: "all .18s",
  },
  noteBox: { marginTop: 18 },
  noteLabel: { display: "block", fontSize: 13.5, color: "var(--muted)", marginBottom: 9, lineHeight: 1.5 },
  noteInput: {
    width: "100%", padding: "12px 14px", background: "var(--night)",
    border: "1px solid var(--edge)", borderRadius: 8, color: "var(--text)",
    fontSize: 14.5, lineHeight: 1.6, resize: "vertical",
  },
  actions: { marginTop: 22 },
  primary: {
    width: "100%", padding: "14px", background: "var(--warm)",
    color: "#241B0C", borderRadius: 8, fontSize: 15, fontWeight: 600,
  },
  minorRow: { display: "flex", flexDirection: "column", gap: 4, marginTop: 12, alignItems: "center" },
  minor: { fontSize: 13, color: "var(--faint)", padding: "5px 4px" },
};
