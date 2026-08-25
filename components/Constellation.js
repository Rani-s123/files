import { DISTORTIONS, DISTORTION_KEYS } from "../lib/distortions";

// The constellation.
//
// A list of "you used all-or-nothing thinking 7 times" is a table. What people
// actually want to know is which patterns are *theirs* — the shape of their own
// thinking, and whether it's changing.
//
// So each distortion is a star. Brightness and size grow with how often it has
// appeared. Stars that recur together in the same entry are joined, because the
// useful insight is rarely one distortion — it's that catastrophising and
// fortune telling always arrive together, at 1am, about work.
//
// Positions are deterministic from the taxonomy key, so a person's constellation
// looks the same every time they open it. It becomes a familiar sky.

function seededPosition(key, i, total) {
  // Golden-angle distribution, jittered by a hash of the key, so the layout is
  // stable and evenly spread rather than clustered.
  let hash = 0;
  for (let c = 0; c < key.length; c++) hash = (hash * 31 + key.charCodeAt(c)) % 10000;

  const angle = i * 2.39996 + (hash % 100) / 100;
  const radius = 0.32 + ((hash % 37) / 37) * 0.5;
  return {
    x: 50 + Math.cos(angle) * radius * 42,
    y: 50 + Math.sin(angle) * radius * 38,
  };
}

export default function Constellation({ entries = [], onSelect, selected }) {
  const counts = {};
  const cooccur = {};

  for (const entry of entries) {
    const keys = (entry.distortions || []).map((d) => d.key).filter(Boolean);
    for (const k of keys) counts[k] = (counts[k] || 0) + 1;
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const pair = [keys[i], keys[j]].sort().join("|");
        cooccur[pair] = (cooccur[pair] || 0) + 1;
      }
    }
  }

  const present = DISTORTION_KEYS.filter((k) => counts[k]);
  const maxCount = Math.max(1, ...Object.values(counts));

  if (!present.length) {
    return (
      <div style={s.empty}>
        <div style={s.emptyStars}>
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              style={{
                ...s.emptyStar,
                left: `${18 + i * 16}%`,
                top: `${30 + (i % 3) * 18}%`,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}
        </div>
        <p style={s.emptyText}>
          Your patterns appear here once you&apos;ve worked through a few thoughts.
          Nothing to see yet — that&apos;s fine.
        </p>
      </div>
    );
  }

  const positions = {};
  present.forEach((k, i) => { positions[k] = seededPosition(k, i, present.length); });

  const links = Object.entries(cooccur)
    .filter(([pair]) => {
      const [a, b] = pair.split("|");
      return positions[a] && positions[b];
    })
    .map(([pair, n]) => {
      const [a, b] = pair.split("|");
      return { a, b, n };
    });
  const maxLink = Math.max(1, ...links.map((l) => l.n));

  return (
    <div>
      <div style={s.sky}>
        <svg viewBox="0 0 100 100" style={s.svg} preserveAspectRatio="xMidYMid meet" role="img"
             aria-label={`Pattern map showing ${present.length} recurring thinking patterns`}>
          {links.map((l, i) => (
            <line
              key={i}
              x1={positions[l.a].x} y1={positions[l.a].y}
              x2={positions[l.b].x} y2={positions[l.b].y}
              stroke="var(--held)"
              strokeWidth={0.15 + (l.n / maxLink) * 0.35}
              opacity={0.12 + (l.n / maxLink) * 0.3}
            />
          ))}

          {present.map((k) => {
            const p = positions[k];
            const weight = counts[k] / maxCount;
            const r = 0.9 + weight * 2.4;
            const isSel = selected === k;
            return (
              <g key={k} onClick={() => onSelect?.(isSel ? null : k)} style={{ cursor: "pointer" }}>
                <circle cx={p.x} cy={p.y} r={r * 3.2} fill="var(--held)" opacity={isSel ? 0.16 : 0.06} />
                <circle
                  cx={p.x} cy={p.y} r={r}
                  fill={isSel ? "var(--warm)" : "var(--held)"}
                  opacity={0.55 + weight * 0.45}
                />
                <title>{DISTORTIONS[k].name} — {counts[k]} time{counts[k] > 1 ? "s" : ""}</title>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={s.legend}>
        {present
          .sort((a, b) => counts[b] - counts[a])
          .map((k) => {
            const isSel = selected === k;
            return (
              <button
                key={k}
                onClick={() => onSelect?.(isSel ? null : k)}
                style={{ ...s.chip, ...(isSel ? s.chipOn : {}) }}
              >
                <span style={{ ...s.chipDot, background: isSel ? "var(--warm)" : "var(--held)" }} />
                {DISTORTIONS[k].short}
                <span style={s.chipCount}>{counts[k]}</span>
              </button>
            );
          })}
      </div>

      {selected && DISTORTIONS[selected] && (
        <div style={s.detail}>
          <p style={s.detailName}>{DISTORTIONS[selected].name}</p>
          <p style={s.detailDesc}>{DISTORTIONS[selected].description}</p>
          <p style={s.detailCounter}>{DISTORTIONS[selected].counter}</p>
        </div>
      )}
    </div>
  );
}

const s = {
  sky: {
    position: "relative",
    width: "100%",
    aspectRatio: "1 / 0.68",
    background: "radial-gradient(ellipse at 50% 45%, #1E2638 0%, var(--night) 72%)",
    borderRadius: 10,
    border: "1px solid var(--edge-soft)",
    overflow: "hidden",
  },
  svg: { width: "100%", height: "100%", display: "block" },
  legend: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 },
  chip: {
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "6px 11px", borderRadius: 999,
    background: "var(--surface)", border: "1px solid var(--edge)",
    color: "var(--muted)", fontSize: 12.5,
  },
  chipOn: { borderColor: "var(--warm)", color: "var(--text)", background: "var(--surface-lift)" },
  chipDot: { width: 5, height: 5, borderRadius: "50%" },
  chipCount: { fontSize: 11, color: "var(--faint)" },
  detail: {
    marginTop: 16, padding: "16px 18px",
    background: "var(--surface)", border: "1px solid var(--edge)",
    borderLeft: "2px solid var(--warm)", borderRadius: 8,
    animation: "rise .3s ease-out",
  },
  detailName: { fontFamily: "var(--font-display)", fontSize: 17, margin: "0 0 6px" },
  detailDesc: { fontSize: 14, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 10px" },
  detailCounter: { fontSize: 14, lineHeight: 1.6, color: "var(--warm)", fontStyle: "italic", margin: 0 },
  empty: {
    position: "relative",
    width: "100%", aspectRatio: "1 / 0.55",
    background: "radial-gradient(ellipse at 50% 45%, #1E2638 0%, var(--night) 72%)",
    borderRadius: 10, border: "1px solid var(--edge-soft)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 28,
  },
  emptyStars: { position: "absolute", inset: 0 },
  emptyStar: {
    position: "absolute", width: 3, height: 3, borderRadius: "50%",
    background: "var(--held)", animation: "breathe 4s ease-in-out infinite",
  },
  emptyText: {
    position: "relative", textAlign: "center", fontSize: 14, lineHeight: 1.65,
    color: "var(--faint)", maxWidth: 300, margin: 0,
  },
};
