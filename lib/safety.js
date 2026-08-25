// Safety layer.
//
// This runs BEFORE anything else touches the text, and it runs in code rather
// than in a model, because the failure mode here is not "slightly worse output"
// — it is a person in crisis being handed a cognitive-reframing exercise
// instead of a route to actual help.
//
// Design principles:
//  1. Deterministic first. A model deciding whether someone is in crisis is a
//     model that can be wrong in the one direction that matters most.
//  2. Err toward showing support. A false positive costs a person seeing a
//     helpline they didn't need. A false negative costs much more.
//  3. Never reframe a crisis disclosure. "Let's look for the thinking error in
//     that" is the wrong response to someone describing wanting to die.

// Phrases indicating active risk. Deliberately broad — see principle 3.
const ACUTE = [
  "kill myself", "killing myself", "end my life", "ending my life",
  "want to die", "wanna die", "better off dead", "not want to be here",
  "don't want to be here", "dont want to be here", "no reason to live",
  "nothing to live for", "suicidal", "suicide", "take my own life",
  "hurt myself", "hurting myself", "harm myself", "harming myself",
  "self harm", "self-harm", "cut myself", "cutting myself",
  "overdose", "od on", "everyone would be better without me",
  "world would be better without me", "can't go on", "cant go on",
  "give up on life", "end it all", "make it stop forever",
];

// Signals of acute distress that aren't necessarily crisis, but where a
// reframing exercise is the wrong tool and a gentler response is right.
const DISTRESS = [
  "panic attack", "can't breathe", "cant breathe", "hyperventilating",
  "haven't eaten in", "havent eaten in", "haven't slept in", "havent slept in",
  "can't stop crying", "cant stop crying", "falling apart",
  "can't function", "cant function", "hopeless", "worthless",
  "no one cares", "nobody cares", "completely alone", "unbearable",
];

// Signals someone may be describing harm from another person.
const HARM_FROM_OTHERS = [
  "hits me", "hit me", "hurts me", "threatened me", "threatens me",
  "afraid of him", "afraid of her", "afraid of them", "not safe at home",
  "won't let me leave", "wont let me leave",
];

function matches(text, phrases) {
  const t = ` ${text.toLowerCase().replace(/[^\w\s'-]/g, " ")} `;
  return phrases.filter((p) => t.includes(` ${p} `) || t.includes(`${p} `) || t.includes(` ${p}`));
}

export function screen(text) {
  if (!text?.trim()) return { level: "none", matched: [] };

  const acute = matches(text, ACUTE);
  if (acute.length) return { level: "acute", matched: acute };

  const harm = matches(text, HARM_FROM_OTHERS);
  if (harm.length) return { level: "harm_from_others", matched: harm };

  const distress = matches(text, DISTRESS);
  if (distress.length >= 2) return { level: "high_distress", matched: distress };
  if (distress.length === 1) return { level: "distress", matched: distress };

  return { level: "none", matched: [] };
}

// Whether a thought record is the right tool right now.
export function shouldReframe(level) {
  return level === "none" || level === "distress";
}

// Support information. Deliberately not a wall of numbers — a person in
// distress needs one clear next step, not a directory to evaluate.
export const SUPPORT = {
  acute: {
    heading: "This sounds really heavy, and it matters more than a journal entry.",
    body: "What you've written suggests you might be in real pain right now. A thought record isn't the right tool for this moment — talking to a person is. You don't have to have the words ready or know what to say.",
    actions: [
      { label: "Find a crisis line in your country", href: "https://findahelpline.com", note: "Free, confidential, available now" },
      { label: "If you're in immediate danger, call your local emergency number", href: null, note: null },
    ],
    footer: "If there's someone you trust — a friend, family member, doctor — reaching out to them counts too. You don't have to do this alone.",
  },
  harm_from_others: {
    heading: "It sounds like you might not be safe.",
    body: "What you've written suggests someone may be hurting you or making you afraid. That isn't something to reframe — your safety comes first, and what's happening isn't your fault.",
    actions: [
      { label: "Find a support line in your country", href: "https://findahelpline.com", note: "Confidential support, including for abuse and domestic violence" },
      { label: "If you're in immediate danger, call your local emergency number", href: null, note: null },
    ],
    footer: "You deserve support with this, not a thinking exercise.",
  },
  high_distress: {
    heading: "That sounds like a lot to be carrying.",
    body: "You can still work through a thought record if you want to — but when distress is this high, thinking exercises often land better once the intensity has come down a little. Slowing your breathing, stepping outside, or talking to someone can help first.",
    actions: [
      { label: "Talk to someone now, if you'd like", href: "https://findahelpline.com", note: "Free and confidential — you don't need to be in crisis to call" },
    ],
    footer: null,
    allowContinue: true,
  },
};

// What we tell the model about what it must not do. Included in every prompt.
export const MODEL_SAFETY_RULES = `
SAFETY RULES — these override every other instruction:
- You are NOT a therapist and NOT a diagnostic tool. Never diagnose, never name a disorder as applying to this person, never say what condition they "have" or "might have".
- Never suggest medication, dosages, or changes to treatment.
- If the writing contains any indication of self-harm, suicidal thinking, or someone hurting the person, STOP. Do not analyse the thought, do not identify distortions, do not reframe. Set "crisis": true and return nothing else of substance.
- Never tell someone their distress is irrational, an overreaction, or "just a thinking error". Cognitive distortions are patterns in how a thought is phrased, not evidence the feeling is wrong. Feelings are always valid even when a thought is distorted.
- Never minimise a real problem. If someone's situation is genuinely bad, say so — a reframe of a true difficulty is not "it's fine", it's "this is hard AND here is what is also true".
- Do not be relentlessly positive. Toxic positivity is a failure mode here, not a safe default.
`.trim();
