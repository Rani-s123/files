// Cognitive distortions.
//
// These are the categories from Burns' adaptation of Beck's cognitive therapy —
// the same set used in clinical thought records for four decades. They are here
// as a fixed taxonomy rather than something the model invents freshly each time,
// so the pattern data accumulated across entries is actually comparable.
//
// Each carries the counter-question a therapist would ask, because naming a
// distortion is not the intervention — the question that follows it is.

export const DISTORTIONS = {
  all_or_nothing: {
    name: "All-or-nothing thinking",
    short: "All-or-nothing",
    description: "Seeing things in absolute categories — always/never, perfect/failure — with no middle ground.",
    counter: "Where would this sit on a scale from 0 to 100, rather than at one end?",
  },
  overgeneralisation: {
    name: "Overgeneralisation",
    short: "Overgeneralising",
    description: "Treating a single event as a never-ending pattern.",
    counter: "Is this one instance, or has it genuinely happened every time?",
  },
  mental_filter: {
    name: "Mental filter",
    short: "Mental filter",
    description: "Focusing on a single negative detail so it colours everything else.",
    counter: "What else was in the picture that this thought left out?",
  },
  discounting_positives: {
    name: "Discounting the positive",
    short: "Discounting positives",
    description: "Dismissing good things as not counting — luck, a fluke, or what anyone would have done.",
    counter: "If a friend had done this, would you call it nothing?",
  },
  mind_reading: {
    name: "Mind reading",
    short: "Mind reading",
    description: "Assuming you know what someone else is thinking, usually that it's negative about you.",
    counter: "What do you actually know they think, as opposed to what you're assuming?",
  },
  fortune_telling: {
    name: "Fortune telling",
    short: "Fortune telling",
    description: "Predicting a bad outcome as though it were already settled fact.",
    counter: "What's the evidence this will happen, and what other outcomes are possible?",
  },
  catastrophising: {
    name: "Catastrophising",
    short: "Catastrophising",
    description: "Jumping to the worst possible outcome and treating it as likely.",
    counter: "What's the most likely outcome, not the worst one? And could you cope if the worst did happen?",
  },
  emotional_reasoning: {
    name: "Emotional reasoning",
    short: "Emotional reasoning",
    description: "Taking a feeling as proof of a fact — I feel like a failure, so I am one.",
    counter: "Is this something you know, or something you're feeling right now?",
  },
  should_statements: {
    name: "Should statements",
    short: "Shoulds",
    description: "Rigid rules about how you or others must behave, which mostly produce guilt or resentment.",
    counter: "Where did this rule come from, and would you hold someone else to it?",
  },
  labelling: {
    name: "Labelling",
    short: "Labelling",
    description: "Turning a behaviour into a fixed identity — I made a mistake becomes I'm an idiot.",
    counter: "What specifically happened, described without the label?",
  },
  personalisation: {
    name: "Personalisation",
    short: "Personalising",
    description: "Taking responsibility for something you didn't fully control.",
    counter: "What else contributed to this that had nothing to do with you?",
  },
  blame: {
    name: "Blame",
    short: "Blame",
    description: "Placing the whole cause on others and overlooking your own part in what you can change.",
    counter: "What part of this is actually within your control?",
  },
};

export const DISTORTION_KEYS = Object.keys(DISTORTIONS);

// Compact list for the model prompt.
export function taxonomyForPrompt() {
  return DISTORTION_KEYS
    .map((k) => `- ${k}: ${DISTORTIONS[k].name} — ${DISTORTIONS[k].description}`)
    .join("\n");
}

// Common emotions, offered as chips so people don't have to find the word
// themselves when they're already depleted.
export const EMOTIONS = [
  "anxious", "sad", "angry", "ashamed", "guilty", "lonely",
  "overwhelmed", "frustrated", "hurt", "afraid", "embarrassed", "numb",
];
