import { Link } from "react-router-dom";
import { ArrowLeft, FlaskConical, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/controls";
import { AiPanel } from "@/components/ai/AiPanel";
import { DeviationSection } from "@/components/workspace/DeviationSection";
import { FiveWhysSection } from "@/components/workspace/FiveWhysSection";
import { FishboneSection } from "@/components/workspace/FishboneSection";
import { RootCausesSection } from "@/components/workspace/RootCausesSection";
import { MissingInfoSection } from "@/components/workspace/MissingInfoSection";
import { CapaSection } from "@/components/workspace/CapaSection";
import { StatusBadge } from "@/components/ui/patterns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { saveInvestigation, updateField } from "@/store/rcaSlice";
import type { InvestigationStatus } from "@/types/rca";

export function Workspace() {
  const dispatch = useAppDispatch();
  const { current, saving, saveError } = useAppSelector((s) => s.rca);
  const hasId = Boolean(current.id);

  const save = async () => {
    const result = await dispatch(saveInvestigation(current));
    if (saveInvestigation.fulfilled.match(result)) {
      dispatch(updateField({ field: "status", value: current.status }));
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-teal-700" />
              <span className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                {current.investigation_ref || "New Investigation"}
              </span>
              <StatusBadge status={current.status} />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">
              {current.title || "Untitled Investigation"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
            value={current.status}
            onChange={(e) =>
              dispatch(
                updateField({ field: "status", value: e.target.value as InvestigationStatus }),
              )
            }
          >
            <option value="draft">Draft</option>
            <option value="in_review">In review</option>
            <option value="approved">Approved</option>
            <option value="closed">Closed</option>
          </select>
          <Button onClick={save} disabled={saving || !hasId}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save investigation"}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not save the investigation: {saveError}
        </div>
      )}
      {!hasId && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          This investigation is not created yet. Submit source material in the AI panel
          and save — or go back and start a new investigation to get a reference number.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr]">
        <div className="xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)]">
          <AiPanel />
        </div>
        <div className="space-y-5">
          <DeviationSection />
          <FiveWhysSection />
          <FishboneSection />
          <RootCausesSection />
          <MissingInfoSection />
          <CapaSection />
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700" />
            All AI-generated content is a suggestion. Review and edit before saving —
            confirmed root causes and the CAPA plan require approval by a qualified
            quality professional.
          </div>
        </div>
      </div>
    </div>
  );
}
