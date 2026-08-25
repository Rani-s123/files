import { callClaude, extractJson } from "../../lib/claude";
import { screen, shouldReframe, SUPPORT, MODEL_SAFETY_RULES } from "../../lib/safety";
import { taxonomyForPrompt, DISTORTION_KEYS } from "../../lib/distortions";

// Thought analysis.
//
// Order matters and is not negotiable: the deterministic safety screen runs
// first, and if it fires, the model is never called at all. A person writing
// about wanting to die should not have their words sent anywhere to be parsed
// for thinking errors — they should get a route to help, immediately.
//
// The request carries only the single thought being worked on. No history, no
// identifier, no previous entries. The server stores nothing.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { situation, thought, emotions, intensity } = req.body;
    if (!thought?.trim()) return res.status(400).json({ error: "A thought is required" });

    // 1. Deterministic screen — runs before anything is sent anywhere.
    const combined = `${situation || ""} ${thought}`;
    const screening = screen(combined);

    if (!shouldReframe(screening.level)) {
      return res.status(200).json({
        crisis: true,
        level: screening.level,
        support: SUPPORT[screening.level] || SUPPORT.acute,
        // The model was never called. Say so — the person should know.
        modelCalled: false,
      });
    }

    // 2. Model analysis, with the safety rules leading the prompt.
    const system = `${MODEL_SAFETY_RULES}

You are helping someone work through a CBT thought record. You are a thinking companion, not a therapist.

Your tone: warm, plain, unhurried. Write like a thoughtful friend who happens to know CBT — not like a worksheet, not like a wellness app, not like a clinician writing notes. Short sentences. No jargon unless you explain it in the same breath. Never use the word "journey". Never open with "It sounds like you're feeling..." — that phrasing is exhausted.

COGNITIVE DISTORTION TAXONOMY (use only these keys, never invent new ones):
${taxonomyForPrompt()}

WHAT THE PERSON WROTE:
Situation: ${situation || "(not described)"}
Automatic thought: ${thought}
Emotions: ${emotions?.length ? emotions.join(", ") : "(not specified)"}${intensity ? ` at intensity ${intensity}/10` : ""}

YOUR TASK:

1. IDENTIFY DISTORTIONS — at most 3, only ones genuinely present. If the thought is a fair reading of a genuinely difficult situation, return an empty array and say so. Not every painful thought is distorted, and pretending otherwise is dishonest and unhelpful.

2. ASK ONE QUESTION — the single most useful Socratic question for THIS thought. Specific to what they wrote, not a template. This should be the question that opens the smallest crack in the thought.

3. OFFER A BALANCED ALTERNATIVE — not a positive spin. A more accurate reading that holds both what is genuinely hard AND what the original thought left out. If the situation is genuinely bad, the alternative must acknowledge that. Write it in first person, as they might say it to themselves — in their register, not yours.

4. EVIDENCE PROMPTS — two short prompts: one inviting evidence for the thought, one inviting evidence against. Phrased as invitations, not challenges.

5. FIND THE PREDICTION — this is the most valuable output.

Many distressing thoughts contain a hidden prediction about the future that reality will eventually answer. "They're done with me" predicts they won't get in touch. "I'll freeze in the meeting" predicts a specific event. "Everyone will think I'm stupid" predicts a reaction.

If the thought contains such a prediction, extract it as a SPECIFIC, CHECKABLE claim — something the person can look at in a few days and say plainly whether it happened. Write it in their first person.
- Good: "They won't message me back at all this week."
- Bad: "Things will go badly." (not checkable)
- Bad: "I am fundamentally unlovable." (not a prediction, no date can answer it)

Also choose a horizon: "hours" (something happening today), "days" (a few days — the default), or "weeks" (something slower, like a relationship going quiet).

If the thought contains no checkable prediction — if it's about the past, or a judgement about identity with no future claim — set prediction to null. Do not invent one to fill the field.

Respond with ONLY a JSON object, no prose, no markdown fences:
{
  "crisis": false,
  "distortions": [
    {"key": "one of the taxonomy keys", "evidence": "the specific words from their thought that show this pattern — quote them briefly", "gentle": "one sentence naming what this pattern is doing here, without judgement"}
  ],
  "noDistortionNote": "only if distortions is empty — one or two sentences acknowledging this reads as a fair response to a hard situation",
  "question": "your single Socratic question",
  "evidenceFor": "prompt inviting evidence supporting the thought",
  "evidenceAgainst": "prompt inviting evidence that complicates it",
  "alternative": "the balanced alternative thought, first person",
  "alternativeNote": "one sentence on what changed between the two, and what stayed true",
  "prediction": {"claim": "the checkable prediction in their first person", "horizon": "hours|days|weeks"} or null
}`;

    const text = await callClaude({
      system,
      messages: [{ role: "user", content: "Work through this thought record." }],
      maxTokens: 1500,
    });

    const analysis = extractJson(text);

    // 3. Model-side crisis flag, honoured even though the screen passed.
    if (analysis.crisis) {
      return res.status(200).json({
        crisis: true,
        level: "acute",
        support: SUPPORT.acute,
        modelCalled: true,
      });
    }

    // Drop any distortion key the model invented outside the taxonomy, so the
    // pattern data stays comparable across entries.
    analysis.distortions = (analysis.distortions || []).filter((d) =>
      DISTORTION_KEYS.includes(d.key)
    );

    // A soft-distress signal doesn't block the exercise, but the person should
    // see that support exists without having to go looking for it.
    if (screening.level === "distress") {
      analysis.gentleSupport = true;
    }

    res.status(200).json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
