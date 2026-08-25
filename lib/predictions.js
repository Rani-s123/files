// Predictions — behavioural experiments.
//
// Thought records identify a distortion. They rarely dislodge it, because being
// told a thought is catastrophising doesn't feel like evidence. What dislodges
// it is watching your own prediction fail, repeatedly, in your own life.
//
// That's the behavioural experiment: the part of CBT that produces durable
// change, and the part almost no app implements, because it requires coming
// back days later and asking what actually happened.
//
// So when someone writes "they're obviously done with me", that is not just a
// distorted thought — it is a falsifiable claim with a date attached. We keep
// it, and we come back.

const KEY = "thought-record:predictions:v1";

export const OUTCOMES = {
  as_predicted: { label: "It happened as I predicted", weight: 1, tone: "muted" },
  partly: { label: "Partly — but not as badly", weight: 0.5, tone: "held" },
  did_not: { label: "It didn't happen", weight: 0, tone: "warm" },
  unresolved: { label: "Still don't know", weight: null, tone: "faint" },
};

// How long to wait before asking. Short enough to still matter, long enough
// for reality to have had a say.
const HORIZONS = {
  hours: 1,
  days: 3,
  weeks: 14,
};

export function loadPredictions() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function persist(list) {
  if (typeof window === "undefined") return list;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked — prediction lives for this session only */
  }
  return list;
}

export function savePrediction({ claim, horizon = "days", entryId, thought }) {
  const days = HORIZONS[horizon] ?? HORIZONS.days;
  const dueAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();

  const prediction = {
    id: `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    claim,
    thought,
    entryId: entryId || null,
    madeAt: new Date().toISOString(),
    dueAt,
    horizon,
    outcome: null,
    outcomeNote: null,
    resolvedAt: null,
  };

  return persist([prediction, ...loadPredictions()]);
}

export function resolvePrediction(id, outcome, note) {
  const list = loadPredictions().map((p) =>
    p.id === id
      ? { ...p, outcome, outcomeNote: note || null, resolvedAt: new Date().toISOString() }
      : p
  );
  return persist(list);
}

export function snoozePrediction(id, days = 3) {
  const list = loadPredictions().map((p) =>
    p.id === id
      ? { ...p, dueAt: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString() }
      : p
  );
  return persist(list);
}

export function deletePrediction(id) {
  return persist(loadPredictions().filter((p) => p.id !== id));
}

export function deleteAllPredictions() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

// Predictions whose time has come and which haven't been answered.
export function duePredictions(list) {
  const now = Date.now();
  return (list || loadPredictions())
    .filter((p) => !p.outcome && new Date(p.dueAt).getTime() <= now)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
}

export function pendingPredictions(list) {
  const now = Date.now();
  return (list || loadPredictions())
    .filter((p) => !p.outcome && new Date(p.dueAt).getTime() > now)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
}

// The evidence base. This is the number the whole module exists to produce:
// how often the things you were certain about actually came true.
export function evidenceBase(list) {
  const resolved = (list || loadPredictions()).filter(
    (p) => p.outcome && p.outcome !== "unresolved"
  );

  if (!resolved.length) return { hasData: false, resolved: 0 };

  const counts = resolved.reduce((acc, p) => {
    acc[p.outcome] = (acc[p.outcome] || 0) + 1;
    return acc;
  }, {});

  const weighted = resolved.reduce((sum, p) => sum + (OUTCOMES[p.outcome]?.weight ?? 0), 0);
  const accuracy = weighted / resolved.length;

  return {
    hasData: true,
    resolved: resolved.length,
    counts,
    // How often the feared thing actually arrived, weighting "partly" as half.
    accuracy: Number(accuracy.toFixed(2)),
    didNotHappen: counts.did_not || 0,
    asPredicted: counts.as_predicted || 0,
    partly: counts.partly || 0,
  };
}

// The sentence that does the work. Written carefully: it must never imply the
// person's fear was stupid, and it must stay honest when predictions DID come
// true — because sometimes they do, and a tool that spins that has lost them.
export function evidenceSentence(base) {
  if (!base?.hasData) return null;
  const { resolved, didNotHappen, asPredicted } = base;

  if (resolved < 3) {
    return `You've checked back on ${resolved} prediction${resolved > 1 ? "s" : ""} so far. A few more and a pattern will start to show.`;
  }

  const pct = Math.round((didNotHappen / resolved) * 100);

  if (pct >= 60) {
    return `Of the ${resolved} things you were sure would happen, ${didNotHappen} didn't. That's your own evidence — not something anyone told you.`;
  }
  if (pct >= 30) {
    return `Of ${resolved} predictions, ${didNotHappen} didn't happen and ${asPredicted} did. Some fears turn out to be right; the useful question is which ones.`;
  }
  return `Most of what you predicted did happen. That's worth taking seriously — it may mean these are real problems to solve rather than thoughts to reframe.`;
}
