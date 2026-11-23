import { useState } from "react";
import {
  AlertTriangle,
  Bot,
  FileText,
  Loader2,
  Mail,
  Settings,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button, Label, Textarea } from "@/components/ui/controls";
import { Badge } from "@/components/ui/Badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAiError, runAnalysis, runCapa, runExtraction } from "@/store/rcaSlice";
import { getGroqKey, setGroqKey } from "@/lib/ai";
import { useIntakeInput } from "@/lib/intake";

type Tab = "intake" | "analyze" | "capa";

const SAMPLE_EMAIL = `Subject: Batch AP-2609-114 - HPLC purity failure at final API release

From: QC Lab (M. Fernandez)
To: Quality Assurance

During final release testing of batch AP-2609-114 (Amlodipine besylate API, 180 kg), the HPLC assay returned 96.8% purity against a specification of >=99.0% (OOS). The result was confirmed on repeat injection. The batch was placed on QC hold.

The failure was detected during routine release HPLC by analyst R. Kumar on the decisional HPLC unit HPLC-07. Chromatograms show an elevated unknown impurity peak at RRT 1.32. Batch AP-2609-113, purified on the same line one week earlier, passed specification.

Immediate actions: batch rejected pending investigation, unit HPLC-07 taken out of service for review, sample retained for further testing.
`;

function AiRunButton({
  status,
  label,
  disabled,
  onClick,
}: {
  status: "idle" | "running" | "done" | "error";
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || status === "running"}
      className="w-full"
    >
      {status === "running" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {status === "running" ? "AI working…" : label}
    </Button>
  );
}

function RunError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        {error}
        <button className="ml-2 underline" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}

function KeyDialog({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState(getGroqKey());
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Settings className="h-4 w-4" /> Groq API key
        </div>
        <p className="mb-3 text-xs leading-relaxed text-slate-500">
          If a server-side key is already configured, no key is needed. Otherwise paste a
          Groq key (create one at console.groq.com/keys). It is stored only in this
          browser.
        </p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="gsk_..."
          className="mb-3 h-9 w-full rounded-md border border-slate-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setGroqKey(value.trim());
              onClose();
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AiPanel() {
  const dispatch = useAppDispatch();
  const { current, extract, analyze, capa } = useAppSelector((s) => s.rca);
  const [tab, setTab] = useState<Tab>("intake");
  const [pasted, setPasted] = useState("");
  const [showKey, setShowKey] = useState(false);
  const { isParsing, parseError, handleFiles, submitText } = useIntakeInput(
    (input) => {
      dispatch(
        runExtraction({
          text: input.text,
          source: { name: input.name, type: input.type, excerpt: "" },
        }),
      );
    },
  );

  const canAnalyze = current.description.trim().length > 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: "intake", label: "1. Intake" },
    { id: "analyze", label: "2. Analyze" },
    { id: "capa", label: "3. CAPA" },
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {showKey && <KeyDialog onClose={() => setShowKey(false)} />}
      <div className="border-b border-slate-200 bg-gradient-to-r from-teal-700 to-teal-600 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <div>
              <div className="text-sm font-semibold leading-tight">AI Assistant</div>
              <div className="text-xs text-teal-100">Groq · llama-3.3-70b-versatile</div>
            </div>
          </div>
          <button
            className="rounded-md p-1.5 text-teal-100 hover:bg-white/10"
            onClick={() => setShowKey(true)}
            title="Groq API key settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 bg-slate-50">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "flex-1 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors " +
              (tab === t.id
                ? "border-teal-600 text-teal-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {tab === "intake" && (
          <>
            <p className="text-xs leading-relaxed text-slate-500">
              Submit a deviation source document, pasted text, or email. AI extracts the
              key facts and fills the investigation form for your review.
            </p>

            <label
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition-colors hover:border-teal-500 hover:bg-teal-50/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
            >
              <Upload className="h-5 w-5 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">
                {isParsing ? "Reading document…" : "Drop a PDF / text file, or click to browse"}
              </span>
              <input
                type="file"
                accept=".pdf,.txt,.md,.csv,.log,text/plain"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs text-slate-400">or paste text / email</span>
              </div>
            </div>

            <Textarea
              rows={7}
              placeholder="Paste deviation email or narrative text here…"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
            />
            <Button
              variant="outline"
              className="w-full"
              disabled={isParsing || !pasted.trim()}
              onClick={() => {
                submitText(pasted, "Pasted text", "text");
                setPasted("");
              }}
            >
              <Sparkles className="h-4 w-4" /> Extract &amp; fill form
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setPasted(SAMPLE_EMAIL);
              }}
            >
              <Mail className="h-4 w-4" /> Load sample deviation email
            </Button>

            {parseError && <RunError error={parseError} onRetry={() => dispatch(clearAiError("extract"))} />}
            {extract.error && <RunError error={extract.error} onRetry={() => dispatch(clearAiError("extract"))} />}
            {extract.status === "done" && (
              <div className="flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs leading-relaxed text-teal-800">
                <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Extracted and prefilled the form. Review every field before saving.
                  {current.source_documents.length > 0 && (
                    <span className="mt-1 block">
                      {current.source_documents.length} source document(s) attached.
                    </span>
                  )}
                </span>
              </div>
            )}
          </>
        )}

        {tab === "analyze" && (
          <>
            <p className="text-xs leading-relaxed text-slate-500">
              Based on the deviation record, AI drafts the problem statement, a 5 Whys
              chain, fishbone candidates, potential root causes with supporting evidence,
              and a list of missing information.
            </p>
            <AiRunButton
              status={analyze.status}
              label={current.five_whys.length ? "Re-run investigation analysis" : "Run 5 Whys & fishbone analysis"}
              disabled={!canAnalyze}
              onClick={() => dispatch(runAnalysis(current))}
            />
            {!canAnalyze && (
              <p className="text-xs text-amber-600">
                Add a deviation description first (complete the Intake step).
              </p>
            )}
            {analyze.error && <RunError error={analyze.error} onRetry={() => dispatch(clearAiError("analyze"))} />}
            {analyze.status === "done" && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs leading-relaxed text-teal-800">
                Drafted {current.five_whys.length} why-steps, {current.fishbone.reduce((n, f) => n + f.causes.length, 0)} fishbone
                candidates, {current.root_causes.length} potential root cause(s) and{" "}
                {current.missing_info.length} information gap(s). All items are editable
                suggestions until you confirm them.
              </div>
            )}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
              <div className="mb-1 font-medium text-slate-600">Evidence rule</div>
              Root causes stay marked <Badge className="mx-1 border border-amber-200 bg-amber-50 text-amber-700">suggested</Badge>
              until a qualified person confirms them with evidence in the workspace.
            </div>
          </>
        )}

        {tab === "capa" && (
          <>
            <p className="text-xs leading-relaxed text-slate-500">
              AI drafts impact assessments (product quality, patient safety, data
              integrity) and corrective / preventive actions linked to your root causes,
              each with a short rationale.
            </p>
            <AiRunButton
              status={capa.status}
              label="Recommend CAPA plan"
              disabled={current.root_causes.length === 0}
              onClick={() => dispatch(runCapa(current))}
            />
            {current.root_causes.length === 0 && (
              <p className="text-xs text-amber-600">
                Run the analysis step first to identify root causes.
              </p>
            )}
            {capa.error && <RunError error={capa.error} onRetry={() => dispatch(clearAiError("capa"))} />}
            {capa.status === "done" && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs leading-relaxed text-teal-800">
                Proposed {current.capa.length} CAPA action(s) and impact assessments.
                Review, assign owners and due dates, then save the investigation.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
