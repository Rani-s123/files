import { callClaude, extractJson } from "../../lib/claude";
import { screen, shouldReframe, SUPPORT, MODEL_SAFETY_RULES } from "../../lib/safety";
import { taxonomyForPrompt, DISTORTION_KEYS } from "../../lib/distortions";
import { demoAnalysis } from "../../lib/demoAnalysis.js/demoAnalysis";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { situation, thought, emotions, intensity } = req.body;
    if (!thought?.trim()) return res.status(400).json({ error: "A thought is required" });
    const combined = `${situation || ""} ${thought}`;
    const screening = screen(combined);
    if (!shouldReframe(screening.level)) {
      return res.status(200).json({ crisis: true, level: screening.level, support: SUPPORT[screening.level] || SUPPORT.acute, modelCalled: false });
    }
    const system = `${MODEL_SAFETY_RULES}\n\nYou are helping someone work through a CBT thought record. You are a thinking companion, not a therapist.\nYour tone is warm, plain, unhurried, and non-clinical. Never diagnose, minimise, or use toxic positivity.\nCOGNITIVE DISTORTION TAXONOMY:\n${taxonomyForPrompt()}\n\nSituation: ${situation || "(not described)"}\nAutomatic thought: ${thought}\nEmotions: ${emotions?.length ? emotions.join(", ") : "(not specified)"}${intensity ? ` at intensity ${intensity}/10` : ""}\n\nReturn ONLY JSON with crisis, distortions, noDistortionNote, question, evidenceFor, evidenceAgainst, alternative, alternativeNote, and prediction fields.`;
    const analysis = process.env.ANTHROPIC_API_KEY
      ? extractJson(await callClaude({ system, messages: [{ role: "user", content: "Work through this thought record." }], maxTokens: 1500 }))
      : demoAnalysis({ thought, situation, intensity });
    if (analysis.crisis) return res.status(200).json({ crisis: true, level: "acute", support: SUPPORT.acute, modelCalled: true });
    analysis.distortions = (analysis.distortions || []).filter((d) => DISTORTION_KEYS.includes(d.key));
    if (screening.level === "distress") analysis.gentleSupport = true;
    res.status(200).json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
