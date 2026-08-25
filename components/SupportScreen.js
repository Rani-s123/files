// Support screen.
//
// When this shows, the exercise is gone. Not minimised, not collapsed below —
// gone. Someone who has just written that they want to die should not have to
// look at a half-filled worksheet, and should not be given the option to carry
// on with it as though nothing was said.
//
// Visual language deliberately breaks from the rest of the app: warm rather
// than cool, no periwinkle, no constellation. This is a different moment and
// it should not look like a feature.

export default function SupportScreen({ support, onBack, allowContinue, onContinue, modelCalled }) {
  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h2 style={s.heading}>{support.heading}</h2>
        <p style={s.body}>{support.body}</p>

        <div style={s.actions}>
          {support.actions.map((a, i) =>
            a.href ? (
              <a key={i} href={a.href} target="_blank" rel="noopener noreferrer" style={s.action}>
                <span style={s.actionLabel}>{a.label}</span>
                {a.note && <span style={s.actionNote}>{a.note}</span>}
                <span style={s.arrow} aria-hidden="true">→</span>
              </a>
            ) : (
              <div key={i} style={{ ...s.action, cursor: "default" }}>
                <span style={s.actionLabel}>{a.label}</span>
                {a.note && <span style={s.actionNote}>{a.note}</span>}
              </div>
            )
          )}
        </div>

        {support.footer && <p style={s.footer}>{support.footer}</p>}

        {modelCalled === false && (
          <p style={s.privacy}>
            What you wrote stayed on your device. It wasn&apos;t sent anywhere.
          </p>
        )}
      </div>

      <div style={s.exits}>
        {allowContinue && (
          <button style={s.continueBtn} onClick={onContinue}>
            I&apos;d still like to work through this
          </button>
        )}
        <button style={s.backBtn} onClick={onBack}>Go back</button>
      </div>
    </div>
  );
}

const s = {
  wrap: { animation: "rise .4s ease-out" },
  card: {
    background: "linear-gradient(160deg, #2A2419 0%, var(--surface) 65%)",
    border: "1px solid var(--warm-dim)",
    borderRadius: 12,
    padding: "30px 28px",
  },
  heading: {
    fontFamily: "var(--font-display)",
    fontSize: 25,
    fontWeight: 400,
    lineHeight: 1.3,
    color: "var(--warm)",
    margin: "0 0 16px",
  },
  body: { fontSize: 16, lineHeight: 1.7, color: "var(--text)", margin: "0 0 26px" },
  actions: { display: "flex", flexDirection: "column", gap: 9 },
  action: {
    position: "relative",
    display: "flex", flexDirection: "column", gap: 3,
    padding: "15px 44px 15px 17px",
    background: "rgba(240,181,99,.07)",
    border: "1px solid var(--warm-dim)",
    borderRadius: 8,
    textDecoration: "none",
    color: "var(--text)",
  },
  actionLabel: { fontSize: 15, fontWeight: 500, lineHeight: 1.4 },
  actionNote: { fontSize: 13, color: "var(--muted)" },
  arrow: {
    position: "absolute", right: 17, top: "50%", transform: "translateY(-50%)",
    color: "var(--warm)", fontSize: 16,
  },
  footer: { fontSize: 14.5, lineHeight: 1.7, color: "var(--muted)", margin: "24px 0 0" },
  privacy: {
    fontSize: 13, lineHeight: 1.6, color: "var(--faint)",
    margin: "20px 0 0", paddingTop: 18, borderTop: "1px solid var(--warm-dim)",
  },
  exits: { display: "flex", flexDirection: "column", gap: 10, marginTop: 22, alignItems: "center" },
  continueBtn: {
    fontSize: 14, color: "var(--muted)", textDecoration: "underline",
    textUnderlineOffset: 4, padding: "6px 4px",
  },
  backBtn: { fontSize: 14, color: "var(--faint)", padding: "6px 4px" },
};
