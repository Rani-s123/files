# Thought Record

**A private, evidence-based CBT thought record. Your writing never leaves your device.**

Built for [Hack for Humanity | Summer 2026](https://hack-for-humanity-summer-26.devpost.com/).

---

## The problem

CBT thought records are the most validated self-help intervention there is — four decades of clinical evidence, and the core mechanism behind most effective therapy for anxiety and depression. They also mostly exist as paper worksheets, because the digital versions have a trust problem.

To get useful help with a thought, you have to write down the thing you'd least like anyone to read. Every mental health app asks you to type that into their database. Most reserve the right to use it.

So this one doesn't have a database.

---

## What it does

You write the thought as bluntly as it arrives. The tool then works through the standard clinical thought record with you:

1. **Names the pattern** — which of the twelve recognised cognitive distortions are actually present, quoting your own words as evidence
2. **Asks one question** — the single Socratic question that opens the smallest crack in that specific thought
3. **Offers a balanced alternative** — not a positive spin. Something that holds both what's genuinely hard *and* what the original thought left out
4. **Asks you to rewrite it yourself** — because the version in your own words is the one that sticks
5. **Tracks the shift** — intensity before and after, over time

Then it shows you your **constellation**: which patterns are actually yours, and which ones always arrive together.

---

## Privacy is the architecture, not a policy page

| | |
|---|---|
| Storage | `localStorage` only. No account, no database, no sync, no analytics. |
| What the server sees | One thought, at the moment you press the button. |
| What the server keeps | Nothing. |
| Deleting everything | One button, first-class, not buried in settings. |
| Export | Full JSON, yours, any time. |

There is no login because there is nothing to log into. If you clear your browser data, it's gone — including from us, because we never had it.

Mental health writing is the most sensitive category of personal data there is. The safest way to hold it is to not hold it.

---

## Safety comes before the AI, and it runs in code

This is the part that mattered most to get right.

**The deterministic screen runs before anything is sent anywhere.** If it fires, the model is never called at all — someone writing about wanting to die should not have their words shipped to an API to be parsed for thinking errors. They should get a route to help, immediately, and the app tells them plainly that what they wrote stayed on their device.

```
✓ [none            ] reframe=true   "They haven't replied. They probably hate me."
✓ [distress        ] reframe=true   "I feel hopeless about my job situation"
✓ [acute           ] reframe=false  "I honestly want to die, nothing matters"
✓ [acute           ] reframe=false  "everyone would be better without me"
✓ [harm_from_others] reframe=false  "he hits me when he's angry and I'm afraid of him"
✓ [high_distress   ] reframe=false  "I feel worthless and completely alone..."

10/10 screening cases passed
```

Four levels, four different responses:

- **Acute risk** → the exercise disappears entirely. Not minimised, not collapsed below — gone. Replaced by support, in a visual language that deliberately breaks from the rest of the app so it doesn't read as a feature.
- **Harm from another person** → different response again, because "let's examine that thought" is a harmful reply to someone describing abuse. Their safety comes first and it isn't their fault.
- **High distress** → the exercise is offered but not pushed, with an honest note that thinking exercises land better once intensity has come down. Continuing is the person's choice.
- **Mild distress** → the exercise runs, with a quiet line that support exists without them having to go looking.

**The model is also constrained.** Every prompt leads with rules it cannot override: never diagnose, never name a disorder as applying to this person, never suggest medication, never tell someone their distress is irrational, never minimise a real problem. If the model itself detects crisis despite the screen passing, that flag is honoured too.

**Toxic positivity is treated as a failure mode, not a safe default.** If a thought is a fair reading of a genuinely bad situation, the tool says so and returns no distortions — rather than manufacturing a thinking error to look useful. Not every painful thought is distorted, and pretending otherwise is both dishonest and, to someone in pain, obviously fake.

---

## The part that actually changes anything

Thought records identify a distortion. They rarely dislodge it — being *told* a thought is catastrophising doesn't feel like evidence. What dislodges it is watching your own prediction fail, in your own life, repeatedly.

That's a **behavioural experiment**: the CBT module that produces durable change, and the one almost no app implements, because it requires coming back days later and asking what actually happened.

So when you write *"they're obviously done with me"*, the tool doesn't just name the distortion. It extracts the falsifiable claim buried inside it:

> *They won't message me back at all this week.*

That gets kept, with a date. Days later, the app opens with a check-back: **what actually happened?** Four honest options — it happened, partly, it didn't, or still don't know.

Over time this becomes your own evidence base:

```
Of the 11 things you were sure would happen, 7 didn't.
That's your own evidence — not something anyone told you.
```

**The copy stays honest when predictions come true.** A tool that spins that has lost the person:

```
Most of what you predicted did happen. That's worth taking seriously —
it may mean these are real problems to solve rather than thoughts to reframe.
```

Sometimes a fear is accurate, and the right response is help with the problem, not another reframe. The tool says so.

And if a thought contains no checkable prediction — a judgement about identity, something about the past — the model returns null rather than inventing one to fill the field.

---

## The constellation

A list saying "all-or-nothing thinking: 7 times" is a table. What people actually want to know is the *shape* of their own thinking.

So each distortion is a star, growing brighter and larger as it recurs. Stars that appear together in the same entry are joined — because the useful insight is rarely one pattern, it's that catastrophising and fortune telling always arrive together, at 1am, about work.

Positions are seeded deterministically from the taxonomy key, so your constellation looks the same every time you open it. Over weeks it becomes a familiar sky.

---

## Design

The subject is someone at 11pm with a thought looping. Every choice follows from that.

**Colour carries the emotional arc, and is never decorative.** Periwinkle `#8B9DE8` for the thought as it arrives — cool, held at arm's length. Amber `#F0B563` for the reframe — warmth returning. The interface moves from cool to warm as you work through the record. The support screen abandons both, because it's a different moment and shouldn't look like a feature.

**Type**: Newsreader for anything the person writes or reads slowly — this is writing, not data entry. Karla for interface text. The thought itself is set in the serif, at size, because it deserves to be looked at properly rather than filed into a form field.

**Base**: deep indigo-slate `#151A26` rather than black — the hour it gets used, without the harshness.

Responsive to mobile, visible keyboard focus, `prefers-reduced-motion` respected.

---

## Accessibility

- Skip link to main content, visible on keyboard focus
- Semantic landmarks, `aria-current` on navigation, `aria-pressed` on emotion toggles, `role="radiogroup"` on the check-back options
- Sliders carry `aria-valuetext` ("6 out of 10") so screen readers announce meaning, not just a number
- Live regions on the analysis state and on errors
- Delete buttons carry contextual labels rather than a bare "Delete" repeated down the list
- The constellation SVG has a text alternative describing the patterns it shows
- 44px minimum touch targets on coarse pointers
- `prefers-reduced-motion` and `prefers-contrast: more` both honoured
- Works fully offline via service worker — reading entries, browsing patterns, and answering check-backs never needed a server

---

## The evidence base

The twelve distortions are Burns' adaptation of Beck's cognitive therapy — the same taxonomy used in clinical thought records for forty years. They're a fixed set in code rather than something the model invents per-request, for two reasons: the pattern data stays comparable across entries, and a made-up distortion name is a made-up clinical claim.

Each carries the counter-question a therapist would ask, because naming a distortion isn't the intervention — the question that follows it is.

---

## Tech stack

- **Next.js** (Pages Router), React, vanilla CSS with a design-token system
- **Anthropic Claude** (`claude-sonnet-4-6`) — called server-side, once, per thought
- **Custom SVG** constellation, no chart library
- **`localStorage`** — the entire persistence layer
- **Vercel / Render** — stateless, deploys anywhere

## Structure

```
thought-record/
├── pages/
│   ├── index.js          # write → analyse → reflect → patterns
│   └── api/analyse.js    # safety screen, then analysis
├── lib/
│   ├── safety.js          # deterministic crisis screening + model rules
│   ├── distortions.js     # the CBT taxonomy + counter-questions
│   ├── predictions.js     # behavioural experiments + evidence base
│   ├── storage.js         # localStorage, export, delete-all
│   └── claude.js
├── components/
│   ├── Constellation.js   # the pattern star-map
│   ├── PredictionCheck.js # the check-back
│   ├── EvidenceBase.js    # predictions vs reality
│   └── SupportScreen.js   # replaces the exercise entirely
└── public/sw.js           # offline support
```

## Running it

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev
```

Deploy to Vercel or Render — add `ANTHROPIC_API_KEY` as an environment variable. There's no database to provision.

---

## Challenges

- **The model wanted to find a distortion in everything.** Given a thought about a genuinely bad situation, it would manufacture one to seem useful. Fixing it needed an explicit instruction that an empty distortions array is a valid and sometimes correct answer, plus a separate field for acknowledging when a thought is a fair reading of hard circumstances.
- **Crisis handling couldn't be a prompt instruction.** The first design asked the model to detect crisis and respond appropriately. That means sending the most sensitive possible text to an API and trusting a probabilistic system with the one decision where being wrong matters most. Moving the screen into deterministic code, *before* the call, changed both the safety property and the privacy property — in those cases nothing is transmitted at all.
- **The reframes read like a wellness app.** Early output was full of "it sounds like you're feeling" and "journey". Fixing tone needed explicit banned phrasings and a register instruction — write like a thoughtful friend who happens to know CBT, not like a worksheet.
- **An ID collision bug the tests caught.** Predictions were keyed on `Date.now()` alone. Two created in the same millisecond shared an ID, so resolving one resolved all of them — and the same bug existed in the entry store. Only surfaced because the prediction test created four records in a tight loop. Both now carry a random suffix.
- **Distortion names had to be a fixed taxonomy.** Letting the model name patterns freely produced plausible-sounding categories that don't exist in the literature, and made the accumulated pattern data meaningless because nothing matched across entries.

## What's next

- Optional passphrase encryption of local entries, for shared devices
- Localised support routing rather than a single international directory
- Pattern-aware check-backs — surfacing which distortion the failed prediction came from
- Optional gentle reminders, if the person asks for them

---

## This is not therapy

It's a self-help tool based on cognitive behavioural therapy. It can't diagnose anything and it isn't a substitute for professional care. If you're struggling, [talking to someone](https://findahelpline.com) helps.

## License

MIT — see [LICENSE](./LICENSE).
