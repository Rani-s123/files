import { DISTORTION_KEYS } from "./distortions";

// Deterministic fallback for deployments without an AI key.
export function demoAnalysis({ thought, situation, intensity }) {
  const text = `${situation || ""} ${thought}`.toLowerCase();
  const distortions = [];

  const add = (key, evidence, gentle) => {
    if (DISTORTION_KEYS.includes(key) && distortions.length < 3) {
      distortions.push({ key, evidence, gentle });
    }
  };

  if (/always|never|everyone|no one|nobody|nothing/.test(text)) {
    add("overgeneralisation", "always / never / everyone / no one", "A single painful moment may be getting treated as a pattern with no exceptions.");
  }
  if (/obviously|they think|he thinks|she thinks|they hate|they're upset|they are upset/.test(text)) {
    add("mind_reading", "assuming what someone else is thinking", "The thought may be filling in another person's mind before you have direct evidence.");
  }
  if (/will|going to|won't|wont|never happen|definitely|certainly|for sure/.test(text)) {
    add("fortune_telling", "a prediction stated as settled", "A feared outcome can feel certain even though the future is still open.");
  }
  if (/i am a|i'm a|i am an|i'm an|idiot|failure|unlovable|worthless|stupid/.test(text)) {
    add("labelling", "a fixed label applied to yourself", "A difficult action or moment may be getting turned into a definition of who you are.");
  }
  if (/should|must|have to|supposed to/.test(text)) {
    add("should_statements", "should / must / have to", "A rigid rule may be adding pressure on top of what already happened.");
  }

  const prediction = /\b(will|won't|wont|going to|never)\b/.test(text)
    ? { claim: `I will check whether this prediction comes true: “${thought.trim()}”`, horizon: "days" }
    : null;

  return {
    crisis: false,
    demoMode: true,
    distortions,
    ...(distortions.length ? {} : { noDistortionNote: "This may be a painful thought, but the words alone do not prove that a thinking pattern is distorting it." }),
    question: "What do you know for certain, and what part is your mind filling in?",
    evidenceFor: "What facts seem to support this thought?",
    evidenceAgainst: "What facts, context, or alternative explanations might complicate it?",
    alternative: "This is difficult, and I may not know the whole story yet. I can take the next useful step without treating the worst possibility as a fact.",
    alternativeNote: `The situation and your feelings still matter; the certainty has been softened${intensity ? ` at intensity ${intensity}/10` : ""}.`,
    prediction,
  };
}
