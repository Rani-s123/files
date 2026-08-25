# Thought Record

**A private, evidence-based CBT thought record. Your writing never leaves this browser by default.**

Built for [Hack for Humanity | Summer 2026](https://hack-for-humanity-summer-26.devpost.com/).

> **Important:** Thought Record is a self-help reflection tool, not therapy, diagnosis, or crisis care. If you may be in immediate danger or thinking about harming yourself, contact local emergency services or find immediate support at [findahelpline.com](https://findahelpline.com). A qualified clinician should review consequential mental-health safety decisions.

## The problem

CBT thought records are useful, but many digital versions ask people to put their most sensitive writing in a permanent account. Thought Record takes a different approach: journal records and attachments stay local, and only the single thought being worked on is sent to the optional analysis route when the person explicitly presses the button.

## What it does

The app guides a person through a standard thought record without forcing a positive spin. It identifies only genuinely present thinking patterns, asks one specific Socratic question, offers a balanced alternative, invites the person to rewrite it in their own words, and tracks intensity before and after.

When a thought contains a checkable prediction, the app can bring it back later so the person can compare the prediction with what actually happened. The Patterns view builds a local evidence base instead of presenting a generic wellness score.

## Safety comes before AI

A deterministic safety screen runs before the model is called. It checks for acute self-harm risk, harm from another person, and high distress. Acute-risk and abuse disclosures are not reframed: the exercise is replaced with support guidance, and the text is not sent to the model. High distress is handled with a gentler choice rather than an automatic block.

The model prompt also forbids diagnosis, medication advice, minimisation, and toxic positivity. If the model detects crisis after the deterministic screen passes, that flag is honoured and the reframing result is discarded. These safeguards are product behavior, not just documentation.

## Privacy model

| Data | Default behavior |
|---|---|
| Thought records | Browser `localStorage` only |
| Attached files | Local IndexedDB storage |
| AI request | Only the current thought record, when analysis is requested |
| Server retention | Journal entries are not persisted server-side |
| Deletion | First-class delete-everything action |
| Export | JSON export is available |

There is no account, database, sync, or analytics. Clearing browser data removes the local records. Do not use the app as the only support route during a crisis.

## Local setup

Requirements: Node.js 18 or newer.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For a production build:

```bash
npm run check:safety
npm run build
npm start
```

The app runs in deterministic demo mode when `ANTHROPIC_API_KEY` is absent. To enable the optional single-thought analysis route, copy `.env.example` to `.env.local` and add your own key. Never commit `.env.local` or share a key in a screenshot, issue, or chat.

## Deployment

This is a standard Next.js application. Deploy the repository root to Vercel, Netlify, Render, or another Node-compatible host with `npm run build` as the build command. The app works without paid AI credits in deterministic demo mode. Add `ANTHROPIC_API_KEY` only as a server-side environment variable if optional model analysis is intentionally enabled.

After deployment, test a neutral thought, a single distress phrase, a combined high-distress example, an acute-risk phrase, and a harm-from-others example. Confirm the support links open in a new tab, the privacy message is visible, keyboard focus is clear, and reduced-motion settings are respected.

## Safety verification

Run the dependency-free regression guard with:

```bash
npm run check:safety
```

It verifies 10 documented examples across neutral, distress, high-distress, acute-risk, and harm-from-others categories. This is a software regression check, not a clinical validation study.

## Hackathon demo path

Hack for Humanity requires a GitHub repository and a video demo of no more than four minutes. The video should explain the problem and how the project addresses it. A strong walkthrough is:

1. Write a normal difficult thought and select an intensity.
2. Run the reflection flow and show evidence prompts, the balanced alternative, and the rewrite step.
3. Save the record and open Patterns to show the local evidence base.
4. Enter an acute-risk example and show that the thought record disappears before model analysis and is replaced by support guidance.
5. End with the privacy footer, export action, and delete-everything control.

## Accessibility

The interface includes a skip link, semantic landmarks, `aria-current` navigation, pressed-state emotion controls, labelled sliders, live status and error regions, contextual delete labels, visible keyboard focus, coarse-pointer touch targets, reduced-motion support, and higher-contrast support. Test the main flow with keyboard-only navigation and a screen reader if available.

## Built with

Next.js 14, React 18, browser `localStorage`, IndexedDB for attachments, an optional server-side Anthropic API route, and a custom SVG constellation. The interface uses a dark, low-stimulation visual system.

## License

MIT — see [LICENSE](./LICENSE).
