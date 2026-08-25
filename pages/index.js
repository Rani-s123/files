import { useState, useEffect } from "react";
import Constellation from "../components/Constellation";
import SupportScreen from "../components/SupportScreen";
import PredictionCheck from "../components/PredictionCheck";
import EvidenceBase from "../components/EvidenceBase";
import FileUploader from "../components/FileUploader";
import FileManager from "../components/FileManager";
import FileViewerModal from "../components/FileViewerModal";
import { DISTORTIONS, EMOTIONS } from "../lib/distortions";
import { loadEntries, saveEntry, deleteEntry, deleteAll, exportEntries } from "../lib/storage";
import {
  loadPredictions, savePrediction, resolvePrediction, snoozePrediction,
  deletePrediction, deleteAllPredictions, duePredictions, pendingPredictions, evidenceBase,
} from "../lib/predictions";
import { linkFilesToEntry, getFilesForEntry, getAllFiles } from "../lib/fileStorage";

const STEP = { WRITE: "write", WORKING: "working", REFLECT: "reflect", SUPPORT: "support" };
const TAB = { RECORD: "record", PATTERNS: "patterns", FILES: "files" };

export default function Home() {
  const [tab, setTab] = useState(TAB.RECORD);
  const [step, setStep] = useState(STEP.WRITE);

  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [emotions, setEmotions] = useState([]);
  const [intensity, setIntensity] = useState(6);
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [analysis, setAnalysis] = useState(null);
  const [support, setSupport] = useState(null);
  const [error, setError] = useState("");

  const [ownAlternative, setOwnAlternative] = useState("");
  const [afterIntensity, setAfterIntensity] = useState(null);

  const [entries, setEntries] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [filesCount, setFilesCount] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [keepPrediction, setKeepPrediction] = useState(true);

  useEffect(() => {
    setEntries(loadEntries());
    setPredictions(loadPredictions());
    refreshFilesCount();
    setMounted(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is an enhancement, never a requirement */
      });
    }
  }, []);

  async function refreshFilesCount() {
    const files = await getAllFiles().catch(() => []);
    setFilesCount(files.length);
  }

  const due = mounted ? duePredictions(predictions) : [];
  const pending = mounted ? pendingPredictions(predictions) : [];
  const evidence = mounted ? evidenceBase(predictions) : null;

  function toggleEmotion(e) {
    setEmotions((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }

  async function analyse() {
    if (!thought.trim()) return;
    setStep(STEP.WORKING);
    setError("");
    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ situation, thought, emotions, intensity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.crisis) {
        setSupport(data);
        setStep(STEP.SUPPORT);
        return;
      }

      setAnalysis(data);
      setAfterIntensity(intensity);
      setStep(STEP.REFLECT);
    } catch (err) {
      setError(err.message);
      setStep(STEP.WRITE);
    }
  }

  async function save() {
    const next = saveEntry({
      situation, thought, emotions,
      intensityBefore: intensity,
      intensityAfter: afterIntensity,
      distortions: analysis.distortions || [],
      alternative: ownAlternative.trim() || analysis.alternative,
      usedOwnWords: Boolean(ownAlternative.trim()),
    });
    setEntries(next);

    const createdId = next[0]?.id;
    if (createdId && attachedFiles.length > 0) {
      await linkFilesToEntry(attachedFiles.map((f) => f.id), createdId);
      refreshFilesCount();
    }

    if (analysis.prediction?.claim && keepPrediction) {
      setPredictions(savePrediction({
        claim: analysis.prediction.claim,
        horizon: analysis.prediction.horizon,
        entryId: createdId,
        thought,
      }));
    }

    reset();
    setTab(TAB.PATTERNS);
  }

  function handleResolve(id, outcome, note) {
    setPredictions(resolvePrediction(id, outcome, note));
  }
  function handleSnooze(id) { setPredictions(snoozePrediction(id)); }
  function handleDismissPrediction(id) { setPredictions(deletePrediction(id)); }

  function reset() {
    setStep(STEP.WRITE);
    setSituation(""); setThought(""); setEmotions([]); setIntensity(6);
    setAttachedFiles([]);
    setAnalysis(null); setSupport(null); setOwnAlternative(""); setAfterIntensity(null);
    setKeepPrediction(true);
  }

  function handleDelete(id) {
    setEntries(deleteEntry(id));
  }

  function handleDeleteAll() {
    if (!window.confirm("Delete every entry? This can't be undone, and nothing is stored anywhere else.")) return;
    deleteAll();
    deleteAllPredictions();
    setEntries([]);
    setPredictions([]);
    setFilesCount(0);
  }

  return (
    <div style={s.page}>
      <a href="#main" style={s.skip}>Skip to content</a>

      <header style={s.header}>
        <div style={s.brand}>
          <span style={s.mark} aria-hidden="true" />
          <span style={s.brandName}>Thought Record</span>
        </div>
        <nav style={s.nav} aria-label="Sections">
          <button
            style={{ ...s.tab, ...(tab === TAB.RECORD ? s.tabOn : {}) }}
            onClick={() => setTab(TAB.RECORD)}
            aria-current={tab === TAB.RECORD ? "page" : undefined}
          >
            Write
            {mounted && due.length > 0 && (
              <span style={s.badge} aria-label={`${due.length} to check back on`}>{due.length}</span>
            )}
          </button>
          <button
            style={{ ...s.tab, ...(tab === TAB.PATTERNS ? s.tabOn : {}) }}
            onClick={() => setTab(TAB.PATTERNS)}
            aria-current={tab === TAB.PATTERNS ? "page" : undefined}
          >Patterns{mounted && entries.length ? ` (${entries.length})` : ""}</button>
          <button
            style={{ ...s.tab, ...(tab === TAB.FILES ? s.tabOn : {}) }}
            onClick={() => setTab(TAB.FILES)}
            aria-current={tab === TAB.FILES ? "page" : undefined}
          >Files{mounted && filesCount ? ` (${filesCount})` : ""}</button>
        </nav>
      </header>

      <main style={s.main} id="main">
        <div style={s.col}>
          {tab === TAB.RECORD && (
            <>
              {step === STEP.WRITE && due.length > 0 && (
                <PredictionCheck
                  prediction={due[0]}
                  onResolve={handleResolve}
                  onSnooze={handleSnooze}
                  onDismiss={handleDismissPrediction}
                />
              )}
              {step === STEP.WRITE && (
                <Write
                  {...{ situation, setSituation, thought, setThought, emotions,
                        toggleEmotion, intensity, setIntensity, attachedFiles, setAttachedFiles,
                        analyse, error }}
                />
              )}
              {step === STEP.WORKING && <Working />}
              {step === STEP.SUPPORT && support && (
                <SupportScreen
                  support={support.support}
                  modelCalled={support.modelCalled}
                  allowContinue={support.support.allowContinue}
                  onContinue={() => { setSupport(null); setStep(STEP.WRITE); }}
                  onBack={reset}
                />
              )}
              {step === STEP.REFLECT && analysis && (
                <Reflect
                  {...{ analysis, thought, intensity, afterIntensity, setAfterIntensity,
                        ownAlternative, setOwnAlternative, save, reset,
                        keepPrediction, setKeepPrediction, attachedFiles }}
                />
              )}
            </>
          )}

          {tab === TAB.PATTERNS && (
            <Patterns
              entries={entries}
              evidence={evidence}
              pending={pending}
              selected={selectedPattern}
              onSelect={setSelectedPattern}
              onDelete={handleDelete}
              onDeleteAll={handleDeleteAll}
              onExport={exportEntries}
              mounted={mounted}
            />
          )}

          {tab === TAB.FILES && (
            <FileManager
              entries={entries}
              onFilesUpdated={setFilesCount}
            />
          )}
        </div>
      </main>

      <footer style={s.footer}>
        <p style={s.footerText}>
          Everything you write stays in this browser. No account, no database, no sync.
          Only the single thought you&apos;re working on is ever sent, and it&apos;s never stored.
        </p>
        <p style={s.footerText}>
          This is a self-help tool based on cognitive behavioural therapy. It isn&apos;t therapy
          and it can&apos;t diagnose anything. If you&apos;re struggling,{" "}
          <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">talking to someone</a> helps.
        </p>
      </footer>
    </div>
  );
}

function Write({ situation, setSituation, thought, setThought, emotions, toggleEmotion, intensity, setIntensity, attachedFiles, setAttachedFiles, analyse, error }) {
  return (
    <div style={s.rise}>
      <h1 style={s.h1}>
        What&apos;s the thought<br />
        <em style={s.em}>that keeps coming back?</em>
      </h1>
      <p style={s.lede}>
        Write it as bluntly as it arrives in your head. You don&apos;t need to be fair to
        yourself here — that comes later.
      </p>

      <Field n="1" label="What happened?" hint="Just the facts. Where you were, who was there, what occurred.">
        <textarea
          style={s.input} rows={2} value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="I sent a message and they haven't replied in two days."
        />
      </Field>

      <Field n="2" label="What went through your mind?" hint="The thought itself, in its own words.">
        <textarea
          style={{ ...s.input, ...s.inputThought }} rows={4} value={thought}
          onChange={(e) => setThought(e.target.value)}
          placeholder="They're obviously done with me. I always ruin things eventually."
        />
      </Field>

      <Field n="3" label="What did you feel?" hint="Pick as many as fit.">
        <div style={s.chips}>
          {EMOTIONS.map((e) => (
            <button
              key={e}
              onClick={() => toggleEmotion(e)}
              aria-pressed={emotions.includes(e)}
              style={{ ...s.emotionChip, ...(emotions.includes(e) ? s.emotionChipOn : {}) }}
            >{e}</button>
          ))}
        </div>

        <div style={s.sliderRow}>
          <label style={s.sliderLabel} htmlFor="intensity">How strong, right now</label>
          <div style={s.sliderWrap}>
            <input
              id="intensity" type="range" min="1" max="10" value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              style={s.slider}
              aria-valuemin={1} aria-valuemax={10} aria-valuenow={intensity}
              aria-valuetext={`${intensity} out of 10`}
            />
            <span style={s.sliderVal}>{intensity}</span>
          </div>
        </div>
      </Field>

      <Field n="4" label="Attachments & Voice Notes (Optional)" hint="Attach journal photos, evidence documents, or record a voice note.">
        <FileUploader attachedFiles={attachedFiles} onFilesChange={setAttachedFiles} />
      </Field>

      {error && <p style={s.error} role="alert">{error}</p>}

      <button style={s.primary} onClick={analyse} disabled={!thought.trim()}>
        Look at this thought together
      </button>
    </div>
  );
}

function Working() {
  return (
    <div style={s.working} role="status" aria-live="polite">
      <div style={s.workingDots} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ ...s.workingDot, animationDelay: `${i * 0.35}s` }} />
        ))}
      </div>
      <p style={s.workingText}>Reading it slowly.</p>
    </div>
  );
}

function Reflect({ analysis, thought, intensity, afterIntensity, setAfterIntensity, ownAlternative, setOwnAlternative, save, reset, keepPrediction, setKeepPrediction }) {
  const hasDistortions = analysis.distortions?.length > 0;

  return (
    <div style={s.rise}>
      {analysis.gentleSupport && (
        <div style={s.gentleBar}>
          That sounds hard.{" "}
          <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">
            Someone&apos;s there if you want to talk
          </a>{" "}
          — you don&apos;t have to be in crisis to reach out.
        </div>
      )}

      <p style={s.stepMark}>The thought, held at arm&apos;s length</p>
      <blockquote style={s.quote}>{thought}</blockquote>

      {hasDistortions ? (
        <>
          <p style={s.stepMark}>What this thought is doing</p>
          {analysis.distortions.map((d) => (
            <div key={d.key} style={s.distortion}>
              <p style={s.distortionName}>{DISTORTIONS[d.key]?.name || d.key}</p>
              <p style={s.distortionEvidence}>&ldquo;{d.evidence}&rdquo;</p>
              <p style={s.distortionGentle}>{d.gentle}</p>
            </div>
          ))}
        </>
      ) : (
        <div style={s.noDistortion}>
          <p style={s.noDistortionText}>{analysis.noDistortionNote}</p>
        </div>
      )}

      <p style={s.stepMark}>A question worth sitting with</p>
      <p style={s.question}>{analysis.question}</p>

      <div style={s.evidenceGrid}>
        <div style={s.evidenceCol}>
          <p style={s.evidenceLabel}>What supports it</p>
          <p style={s.evidenceText}>{analysis.evidenceFor}</p>
        </div>
        <div style={s.evidenceCol}>
          <p style={s.evidenceLabel}>What complicates it</p>
          <p style={s.evidenceText}>{analysis.evidenceAgainst}</p>
        </div>
      </div>

      <p style={s.stepMark}>Something closer to the whole picture</p>
      <blockquote style={s.quoteWarm}>{analysis.alternative}</blockquote>
      <p style={s.altNote}>{analysis.alternativeNote}</p>

      <div style={s.ownBox}>
        <label style={s.ownLabel} htmlFor="own">
          Now say it in your own words — that&apos;s the part that sticks
        </label>
        <textarea
          id="own" style={{ ...s.input, ...s.inputWarm }} rows={3}
          value={ownAlternative} onChange={(e) => setOwnAlternative(e.target.value)}
          placeholder="Rewrite it however it actually sounds to you."
        />
      </div>

      <div style={s.afterRow}>
        <label style={s.sliderLabel} htmlFor="after">How strong does the feeling seem now?</label>
        <div style={s.sliderWrap}>
          <input
            id="after" type="range" min="1" max="10" value={afterIntensity ?? intensity}
            onChange={(e) => setAfterIntensity(Number(e.target.value))}
            style={{ ...s.slider, accentColor: "var(--warm)" }}
            aria-valuemin={1} aria-valuemax={10} aria-valuenow={afterIntensity ?? intensity}
            aria-valuetext={`${afterIntensity ?? intensity} out of 10`}
          />
          <span style={{ ...s.sliderVal, color: "var(--warm)" }}>{afterIntensity ?? intensity}</span>
        </div>
        {afterIntensity !== null && afterIntensity < intensity && (
          <p style={s.shift}>Down from {intensity}. That shift is the whole point of the exercise.</p>
        )}
        {afterIntensity !== null && afterIntensity >= intensity && (
          <p style={s.shiftNone}>
            Still at {afterIntensity}. That&apos;s completely normal — one record rarely moves it,
            and some thoughts are about real things that haven&apos;t changed yet.
          </p>
        )}
      </div>

      {analysis.prediction?.claim && (
        <div style={s.predictionBox}>
          <p style={s.stepMark}>There&apos;s a prediction in here</p>
          <blockquote style={s.predictionClaim}>{analysis.prediction.claim}</blockquote>
          <p style={s.predictionNote}>
            That&apos;s something reality will answer. If you keep it, this will come back
            and ask what actually happened — and over time you&apos;ll have your own record
            instead of someone telling you not to worry.
          </p>
          <label style={s.checkRow}>
            <input
              type="checkbox"
              checked={keepPrediction}
              onChange={(e) => setKeepPrediction(e.target.checked)}
              style={s.checkbox}
            />
            <span>Check back on this later</span>
          </label>
        </div>
      )}

      <button style={s.primary} onClick={save}>Keep this record</button>
      <button style={s.secondary} onClick={reset}>Discard and start over</button>
    </div>
  );
}

function Patterns({ entries, evidence, pending, selected, onSelect, onDelete, onDeleteAll, onExport, mounted }) {
  if (!mounted) return null;

  const shifts = entries.filter((e) => typeof e.intensityAfter === "number" && typeof e.intensityBefore === "number");
  const avgShift = shifts.length
    ? shifts.reduce((s2, e) => s2 + (e.intensityBefore - e.intensityAfter), 0) / shifts.length
    : null;

  const filtered = selected
    ? entries.filter((e) => (e.distortions || []).some((d) => d.key === selected))
    : entries;

  return (
    <div style={s.rise}>
      <h1 style={s.h1}>Your patterns</h1>
      <p style={s.lede}>
        The same few thinking habits tend to show up again and again. Seeing which ones
        are yours is what makes them easier to catch in the moment.
      </p>

      <Constellation entries={entries} selected={selected} onSelect={onSelect} />

      <p style={s.stepMark}>What actually happened</p>
      <EvidenceBase base={evidence} pending={pending} />

      {entries.length > 0 && (
        <div style={s.stats}>
          <div style={s.stat}>
            <span style={s.statVal}>{entries.length}</span>
            <span style={s.statLabel}>records kept</span>
          </div>
          {avgShift !== null && (
            <div style={s.stat}>
              <span style={{ ...s.statVal, color: avgShift > 0 ? "var(--warm)" : "var(--muted)" }}>
                {avgShift > 0 ? "−" : ""}{Math.abs(avgShift).toFixed(1)}
              </span>
              <span style={s.statLabel}>average shift in intensity</span>
            </div>
          )}
        </div>
      )}

      {entries.length > 0 && (
        <>
          <p style={s.stepMark}>
            {selected ? `Records with ${DISTORTIONS[selected]?.short?.toLowerCase()}` : "Everything you've written"}
          </p>
          {filtered.map((e) => (
            <article key={e.id} style={s.entry}>
              <div style={s.entryTop}>
                <time style={s.entryDate}>
                  {new Date(e.savedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </time>
                {typeof e.intensityBefore === "number" && typeof e.intensityAfter === "number" && (
                  <span style={s.entryShift}>
                    {e.intensityBefore} → <span style={{ color: "var(--warm)" }}>{e.intensityAfter}</span>
                  </span>
                )}
              </div>
              <p style={s.entryThought}>{e.thought}</p>
              <p style={s.entryAlt}>{e.alternative}</p>
              <EntryAttachments entryId={e.id} />
              {e.distortions?.length > 0 && (
                <div style={{ ...s.entryTags, marginTop: 8 }}>
                  {e.distortions.map((d) => (
                    <span key={d.key} style={s.entryTag}>{DISTORTIONS[d.key]?.short || d.key}</span>
                  ))}
                </div>
              )}
              <button
                style={s.deleteBtn}
                onClick={() => onDelete(e.id)}
                aria-label={`Delete record from ${new Date(e.savedAt).toLocaleDateString()}`}
              >Delete</button>
            </article>
          ))}

          <div style={s.dataRow}>
            <button style={s.dataBtn} onClick={onExport}>Export everything</button>
            <button style={{ ...s.dataBtn, color: "var(--faint)" }} onClick={onDeleteAll}>Delete everything</button>
          </div>
        </>
      )}
    </div>
  );
}

function EntryAttachments({ entryId }) {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);

  useEffect(() => {
    if (entryId) {
      getFilesForEntry(entryId).then(setFiles).catch(() => []);
    }
  }, [entryId]);

  if (!files || files.length === 0) return null;

  return (
    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
      {files.map((f) => (
        <button
          key={f.id}
          onClick={() => setActiveFile(f)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 9px",
            borderRadius: 6,
            background: "var(--surface-lift)",
            border: "1px solid var(--edge)",
            fontSize: 12,
            color: "var(--text)",
          }}
        >
          {f.type === "image" ? "📷" : f.type === "audio" ? "🎙️" : "📄"}
          <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {f.name}
          </span>
        </button>
      ))}
      {activeFile && (
        <FileViewerModal file={activeFile} onClose={() => setActiveFile(null)} />
      )}
    </div>
  );
}

function Field({ n, label, hint, children }) {
  return (
    <div style={s.field}>
      <div style={s.fieldHead}>
        <span style={s.fieldNum}>{n}</span>
        <div>
          <p style={s.fieldLabel}>{label}</p>
          {hint && <p style={s.fieldHint}>{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  skip: {
    position: "absolute", left: -9999, top: 8, zIndex: 100,
    padding: "10px 16px", background: "var(--surface-lift)",
    color: "var(--text)", borderRadius: 6, fontSize: 14, textDecoration: "none",
  },
  badge: {
    display: "inline-block", marginLeft: 7, padding: "1px 7px",
    borderRadius: 999, background: "var(--warm)", color: "#241B0C",
    fontSize: 11.5, fontWeight: 600,
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "18px 22px", borderBottom: "1px solid var(--edge-soft)",
    position: "sticky", top: 0, background: "var(--night)", zIndex: 10,
  },
  brand: { display: "flex", alignItems: "center", gap: 9 },
  mark: {
    width: 7, height: 7, borderRadius: "50%", background: "var(--held)",
    boxShadow: "0 0 10px var(--held)",
  },
  brandName: { fontFamily: "var(--font-display)", fontSize: 16, letterSpacing: .2 },
  nav: { display: "flex", gap: 2 },
  tab: {
    padding: "7px 13px", borderRadius: 999, fontSize: 13.5,
    color: "var(--faint)", transition: "color .2s, background .2s",
  },
  tabOn: { color: "var(--text)", background: "var(--surface)" },
  main: { flex: 1, display: "flex", justifyContent: "center", padding: "44px 20px 60px" },
  col: { width: "100%", maxWidth: 580 },
  rise: { animation: "rise .4s ease-out" },

  h1: {
    fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 400,
    lineHeight: 1.18, letterSpacing: -.4, margin: "0 0 16px",
  },
  em: { color: "var(--held)", fontStyle: "italic" },
  lede: { fontSize: 15.5, lineHeight: 1.7, color: "var(--muted)", margin: "0 0 42px" },

  field: { marginBottom: 34 },
  fieldHead: { display: "flex", gap: 13, marginBottom: 13 },
  fieldNum: {
    flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
    border: "1px solid var(--edge)", color: "var(--faint)",
    fontSize: 11.5, display: "flex", alignItems: "center", justifyContent: "center",
    marginTop: 1,
  },
  fieldLabel: { fontSize: 16, margin: 0, lineHeight: 1.4 },
  fieldHint: { fontSize: 13.5, color: "var(--faint)", margin: "3px 0 0", lineHeight: 1.5 },

  input: {
    width: "100%", padding: "13px 15px",
    background: "var(--surface)", border: "1px solid var(--edge)",
    borderRadius: 8, color: "var(--text)", fontSize: 15.5, lineHeight: 1.6,
    resize: "vertical",
  },
  inputThought: {
    fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1.65,
    borderColor: "var(--held-dim)",
  },
  inputWarm: { borderColor: "var(--warm-dim)", fontFamily: "var(--font-display)", fontSize: 17 },

  chips: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 },
  emotionChip: {
    padding: "7px 13px", borderRadius: 999, fontSize: 13.5,
    background: "var(--surface)", border: "1px solid var(--edge)", color: "var(--muted)",
    transition: "all .18s",
  },
  emotionChipOn: {
    background: "var(--held-dim)", borderColor: "var(--held)", color: "var(--text)",
  },

  sliderRow: { marginTop: 4 },
  sliderLabel: { display: "block", fontSize: 13.5, color: "var(--muted)", marginBottom: 10 },
  sliderWrap: { display: "flex", alignItems: "center", gap: 14 },
  slider: { flex: 1, accentColor: "var(--held)", height: 3 },
  sliderVal: {
    fontFamily: "var(--font-display)", fontSize: 21, color: "var(--held)",
    minWidth: 24, textAlign: "right",
  },

  primary: {
    width: "100%", padding: "15px", marginTop: 8,
    background: "var(--held)", color: "#141828",
    borderRadius: 8, fontSize: 15.5, fontWeight: 600,
  },
  secondary: {
    width: "100%", padding: "13px", marginTop: 10,
    color: "var(--faint)", fontSize: 14,
  },
  error: { color: "#E88B7A", fontSize: 14, marginBottom: 14 },

  working: { textAlign: "center", paddingTop: 90 },
  workingDots: { display: "flex", justifyContent: "center", gap: 9, marginBottom: 22 },
  workingDot: {
    width: 7, height: 7, borderRadius: "50%", background: "var(--held)",
    animation: "breathe 1.8s ease-in-out infinite",
  },
  workingText: { fontFamily: "var(--font-display)", fontSize: 17, color: "var(--muted)", fontStyle: "italic" },

  gentleBar: {
    padding: "13px 16px", marginBottom: 30,
    background: "var(--surface)", border: "1px solid var(--warm-dim)",
    borderLeft: "2px solid var(--warm)", borderRadius: 8,
    fontSize: 14, lineHeight: 1.65, color: "var(--muted)",
  },

  stepMark: {
    fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase",
    color: "var(--faint)", margin: "36px 0 14px", fontWeight: 500,
  },
  quote: {
    margin: 0, padding: "18px 22px",
    background: "var(--surface)", borderLeft: "2px solid var(--held)", borderRadius: 8,
    fontFamily: "var(--font-display)", fontSize: 19, lineHeight: 1.6, fontStyle: "italic",
  },
  quoteWarm: {
    margin: 0, padding: "20px 22px",
    background: "linear-gradient(140deg, rgba(240,181,99,.07), var(--surface) 70%)",
    borderLeft: "2px solid var(--warm)", borderRadius: 8,
    fontFamily: "var(--font-display)", fontSize: 19, lineHeight: 1.65,
  },
  altNote: { fontSize: 14, lineHeight: 1.65, color: "var(--muted)", margin: "12px 0 0" },

  distortion: {
    padding: "16px 18px", marginBottom: 9,
    background: "var(--surface)", border: "1px solid var(--edge)", borderRadius: 8,
  },
  distortionName: { fontFamily: "var(--font-display)", fontSize: 17, margin: "0 0 7px", color: "var(--held)" },
  distortionEvidence: {
    fontSize: 14.5, lineHeight: 1.6, color: "var(--text)", margin: "0 0 8px",
    fontStyle: "italic", opacity: .85,
  },
  distortionGentle: { fontSize: 14, lineHeight: 1.65, color: "var(--muted)", margin: 0 },

  noDistortion: {
    padding: "18px 20px", background: "var(--surface)",
    border: "1px solid var(--edge)", borderRadius: 8,
  },
  noDistortionText: { fontSize: 15, lineHeight: 1.7, margin: 0 },

  question: {
    fontFamily: "var(--font-display)", fontSize: 21, lineHeight: 1.55,
    fontStyle: "italic", color: "var(--text)", margin: 0,
  },

  evidenceGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 10, marginTop: 26,
  },
  evidenceCol: {
    padding: "15px 17px", background: "var(--surface)",
    border: "1px solid var(--edge)", borderRadius: 8,
  },
  evidenceLabel: { fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--faint)", margin: "0 0 8px" },
  evidenceText: { fontSize: 14.5, lineHeight: 1.65, margin: 0, color: "var(--muted)" },

  ownBox: { marginTop: 36 },
  ownLabel: { display: "block", fontSize: 15, lineHeight: 1.5, marginBottom: 12 },

  afterRow: { marginTop: 32 },
  shift: { fontSize: 14, color: "var(--warm)", margin: "12px 0 0", lineHeight: 1.6 },
  shiftNone: { fontSize: 14, color: "var(--muted)", margin: "12px 0 0", lineHeight: 1.6 },

  predictionBox: {
    marginTop: 36, padding: "20px 22px",
    background: "linear-gradient(150deg, rgba(240,181,99,.05), var(--surface) 60%)",
    border: "1px solid var(--warm-dim)", borderRadius: 10,
  },
  predictionClaim: {
    margin: "0 0 14px", padding: "14px 16px", background: "var(--night)",
    borderLeft: "2px solid var(--warm)", borderRadius: 8,
    fontFamily: "var(--font-display)", fontSize: 17, lineHeight: 1.6,
  },
  predictionNote: { fontSize: 14, lineHeight: 1.7, color: "var(--muted)", margin: "0 0 16px" },
  checkRow: {
    display: "flex", alignItems: "center", gap: 10,
    fontSize: 14.5, cursor: "pointer", color: "var(--text)",
  },
  checkbox: { width: 16, height: 16, accentColor: "var(--warm)", cursor: "pointer" },

  stats: { display: "flex", gap: 10, marginTop: 22 },
  stat: {
    flex: 1, padding: "15px 17px", background: "var(--surface)",
    border: "1px solid var(--edge)", borderRadius: 8,
  },
  statVal: { display: "block", fontFamily: "var(--font-display)", fontSize: 27, lineHeight: 1, color: "var(--held)" },
  statLabel: { display: "block", fontSize: 12.5, color: "var(--faint)", marginTop: 6 },

  entry: {
    padding: "17px 19px", marginBottom: 9,
    background: "var(--surface)", border: "1px solid var(--edge)", borderRadius: 8,
    position: "relative",
  },
  entryTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 },
  entryDate: { fontSize: 12.5, color: "var(--faint)" },
  entryShift: { fontSize: 13, color: "var(--muted)", fontFamily: "var(--font-display)" },
  entryThought: {
    fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1.6,
    fontStyle: "italic", color: "var(--muted)", margin: "0 0 10px",
    paddingLeft: 11, borderLeft: "2px solid var(--held-dim)",
  },
  entryAlt: {
    fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1.6,
    margin: "0 0 12px", paddingLeft: 11, borderLeft: "2px solid var(--warm-dim)",
  },
  entryTags: { display: "flex", flexWrap: "wrap", gap: 5 },
  entryTag: {
    fontSize: 11.5, padding: "3px 9px", borderRadius: 999,
    background: "var(--held-dim)", color: "var(--muted)",
  },
  deleteBtn: {
    position: "absolute", right: 14, bottom: 14,
    fontSize: 12, color: "var(--faint)",
  },

  dataRow: { display: "flex", gap: 10, marginTop: 26 },
  dataBtn: {
    flex: 1, padding: "12px", fontSize: 13.5,
    border: "1px solid var(--edge)", borderRadius: 8, color: "var(--muted)",
  },

  footer: {
    borderTop: "1px solid var(--edge-soft)", padding: "26px 22px 34px",
    display: "flex", flexDirection: "column", gap: 10, alignItems: "center",
  },
  footerText: {
    fontSize: 12.5, lineHeight: 1.7, color: "var(--faint)",
    margin: 0, maxWidth: 520, textAlign: "center",
  },
};
