const ACUTE = [
  "kill myself", "killing myself", "end my life", "ending my life",
  "want to die", "wanna die", "better off dead", "not want to be here",
  "don't want to be here", "dont want to be here", "no reason to live",
  "nothing to live for", "suicidal", "suicide", "take my own life",
  "hurt myself", "hurting myself", "harm myself", "harming myself",
  "self harm", "self-harm", "cut myself", "cutting myself", "overdose",
  "od on", "everyone would be better without me", "world would be better without me",
  "can't go on", "cant go on", "give up on life", "end it all", "make it stop forever",
];

const DISTRESS = [
  "panic attack", "can't breathe", "cant breathe", "hyperventilating",
  "haven't eaten in", "havent eaten in", "haven't slept in", "havent slept in",
  "can't stop crying", "cant stop crying", "falling apart", "can't function",
  "cant function", "hopeless", "worthless", "no one cares", "nobody cares",
  "completely alone", "unbearable",
];

const HARM_FROM_OTHERS = [
  "hits me", "hit me", "hurts me", "threatened me", "threatens me",
  "afraid of him", "afraid of her", "afraid of them", "not safe at home",
  "won't let me leave", "wont let me leave",
];

function matches(text, phrases) {
  const normalized = ` ${text.toLowerCase().replace(/[^\w\s'-]/g, " ")} `;
  return phrases.filter((phrase) =>
    normalized.includes(` ${phrase} `) ||
    normalized.includes(`${phrase} `) ||
    normalized.includes(` ${phrase}`)
  );
}

function screen(text) {
  if (!text?.trim()) return { level: "none" };
  const acute = matches(text, ACUTE);
  if (acute.length) return { level: "acute" };
  const harm = matches(text, HARM_FROM_OTHERS);
  if (harm.length) return { level: "harm_from_others" };
  const distress = matches(text, DISTRESS);
  if (distress.length >= 2) return { level: "high_distress" };
  if (distress.length === 1) return { level: "distress" };
  return { level: "none" };
}

const cases = [
  ["They haven't replied. They probably hate me.", "none"],
  ["I feel hopeless about my job situation", "distress"],
  ["I honestly want to die, nothing matters", "acute"],
  ["everyone would be better without me", "acute"],
  ["he hits me when he's angry and I'm afraid of him", "harm_from_others"],
  ["I feel worthless and completely alone", "high_distress"],
  ["I am tired after a long day", "none"],
  ["I can't breathe and I am falling apart", "high_distress"],
  ["She threatened me and I am afraid of her", "harm_from_others"],
  ["I want to finish this difficult assignment", "none"],
];

let failures = 0;
for (const [input, expected] of cases) {
  const actual = screen(input).level;
  if (actual !== expected) {
    failures += 1;
    console.error(`FAIL: expected ${expected}, got ${actual}: ${input}`);
  }
}

if (failures) {
  console.error(`${failures}/${cases.length} safety cases failed`);
  process.exit(1);
}

console.log(`PASS: ${cases.length}/${cases.length} deterministic safety cases`);
