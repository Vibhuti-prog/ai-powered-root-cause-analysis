import { useState } from "react";
import { Check, ChevronDown, Plus, Trash2, X } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui/controls";
import { Badge } from "@/components/ui/Badge";
import {
  ConfidenceBadge,
  SectionCard,
  SourceBadge,
} from "@/components/ui/patterns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addRootCause,
  removeRootCause,
  updateRootCause,
} from "@/store/rcaSlice";
import { uid } from "@/lib/investigation";
import { FISHBONE_CATEGORIES } from "@/types/rca";
import type { RootCause } from "@/types/rca";

export function RootCausesSection() {
  const dispatch = useAppDispatch();
  const rootCauses = useAppSelector((s) => s.rca.current.root_causes);
  const [expanded, setExpanded] = useState<string | null>(null);

  const update = (rc: RootCause, patch: Partial<RootCause>) =>
    dispatch(updateRootCause({ ...rc, ...patch }));

  const addManual = () => {
    const rc: RootCause = {
      id: uid("rc"),
      description: "",
      category: FISHBONE_CATEGORIES[0],
      evidence: [],
      confidence: "low",
      contributing_factors: [],
      rationale: "",
      status: "suggested",
      source: "user",
    };
    dispatch(addRootCause(rc));
    setExpanded(rc.id);
  };

  return (
    <SectionCard
      title="Potential Root Causes & Contributing Factors"
      description="AI-drafted causes are suggestions. Confirm a cause only when the listed evidence supports it — confirmed causes drive the CAPA plan."
    >
      {rootCauses.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No root causes yet. Run the Analyze step in the AI panel, or add one manually.
        </div>
      )}
      <div className="space-y-3">
        {rootCauses.map((rc) => {
          const open = expanded === rc.id;
          const isConfirmed = rc.status === "confirmed";
          const isRejected = rc.status === "rejected";
          return (
            <div
              key={rc.id}
              className={
                "rounded-lg border transition-colors " +
                (isRejected
                  ? "border-slate-200 bg-slate-50 opacity-60"
                  : isConfirmed
                    ? "border-emerald-300 bg-emerald-50/40"
                    : "border-amber-200 bg-amber-50/30")
              }
            >
              <div className="flex items-start gap-3 p-3">
                <button
                  className="mt-0.5 text-slate-400 hover:text-slate-600"
                  onClick={() => setExpanded(open ? null : rc.id)}
                >
                  <ChevronDown
                    className={"h-4 w-4 transition-transform " + (open ? "rotate-180" : "")}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-slate-200 bg-white text-slate-600">
                      {rc.category}
                    </Badge>
                    <ConfidenceBadge confidence={rc.confidence} />
                    <SourceBadge source={rc.source} />
                    {isConfirmed && (
                      <Badge className="border border-emerald-200 bg-emerald-100 text-emerald-800">
                        <Check className="h-3 w-3" /> Confirmed
                      </Badge>
                    )}
                    {isRejected && (
                      <Badge className="border border-slate-200 bg-slate-100 text-slate-500">
                        <X className="h-3 w-3" /> Rejected
                      </Badge>
                    )}
                  </div>
                  {open ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Root cause description
                        </label>
                        <Textarea
                          rows={2}
                          value={rc.description}
                          onChange={(e) => update(rc, { description: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Supporting evidence (one per line)
                        </label>
                        <Textarea
                          rows={3}
                          value={rc.evidence.join("\n")}
                          onChange={(e) =>
                            update(rc, {
                              evidence: e.target.value.split("\n").filter((l) => l.trim()),
                            })
                          }
                          placeholder="e.g. Chromatogram of batch AP-2609-114 shows unknown peak at RRT 1.32"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Contributing factors (one per line)
                        </label>
                        <Textarea
                          rows={2}
                          value={rc.contributing_factors.join("\n")}
                          onChange={(e) =>
                            update(rc, {
                              contributing_factors: e.target.value
                                .split("\n")
                                .filter((l) => l.trim()),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Rationale
                        </label>
                        <Textarea
                          rows={2}
                          value={rc.rationale}
                          onChange={(e) => update(rc, { rationale: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">
                            Category
                          </label>
                          <select
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                            value={rc.category}
                            onChange={(e) => update(rc, { category: e.target.value })}
                          >
                            {FISHBONE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">
                            Confidence
                          </label>
                          <select
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
                            value={rc.confidence}
                            onChange={(e) =>
                              update(rc, {
                                confidence: e.target.value as RootCause["confidence"],
                              })
                            }
                          >
                            <option value="low">low</option>
                            <option value="medium">medium</option>
                            <option value="high">high</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                      {rc.description || <span className="italic text-slate-400">No description</span>}
                    </p>
                  )}
                  {!open && rc.evidence.length > 0 && (
                    <p className="mt-1 truncate text-xs text-slate-400">
                      Evidence: {rc.evidence.length} item(s)
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {!isConfirmed && !isRejected && (
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => update(rc, { status: "confirmed" })}
                      title="Confirm with evidence"
                    >
                      <Check className="h-3.5 w-3.5" /> Confirm
                    </Button>
                  )}
                  {isConfirmed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => update(rc, { status: "suggested" })}
                    >
                      Unconfirm
                    </Button>
                  )}
                  {!isRejected && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-600"
                      onClick={() => update(rc, { status: "rejected" })}
                      title="Reject as not a root cause"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-600"
                    onClick={() => dispatch(removeRootCause(rc.id))}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <Button variant="outline" size="sm" onClick={addManual}>
          <Plus className="h-4 w-4" /> Add root cause manually
        </Button>
      </div>
    </SectionCard>
  );
}
