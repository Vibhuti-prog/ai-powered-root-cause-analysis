import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button, Input } from "@/components/ui/controls";
import { Badge } from "@/components/ui/Badge";
import { SectionCard } from "@/components/ui/patterns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setFishbone } from "@/store/rcaSlice";
import { FISHBONE_CATEGORIES } from "@/types/rca";
import type { FishboneCategory } from "@/types/rca";

const CATEGORY_COLORS: Record<string, string> = {
  Man: "border-sky-200 bg-sky-50",
  Machine: "border-teal-200 bg-teal-50",
  Material: "border-amber-200 bg-amber-50",
  Method: "border-emerald-200 bg-emerald-50",
  Measurement: "border-orange-200 bg-orange-50",
  Environment: "border-slate-200 bg-slate-50",
};

export function FishboneSection() {
  const dispatch = useAppDispatch();
  const fishbone = useAppSelector((s) => s.rca.current.fishbone);
  const [newCause, setNewCause] = useState<Record<string, string>>({});

  const addCause = (category: string) => {
    const value = (newCause[category] ?? "").trim();
    if (!value) return;
    const next = fishbone.map((f) =>
      f.category === category ? { ...f, causes: [...f.causes, value] } : f,
    );
    dispatch(setFishbone(next));
    setNewCause((c) => ({ ...c, [category]: "" }));
  };

  const removeCause = (category: string, index: number) => {
    const next = fishbone.map((f) =>
      f.category === category
        ? { ...f, causes: f.causes.filter((_, i) => i !== index) }
        : f,
    );
    dispatch(setFishbone(next));
  };

  const addCategory = (category: string) => {
    dispatch(setFishbone([...fishbone, { category, causes: [] }]));
  };

  const missing = FISHBONE_CATEGORIES.filter(
    (c) => !fishbone.some((f) => f.category === c),
  );

  return (
    <SectionCard
      title="Fishbone (Ishikawa) — 6M"
      description="Candidate causes grouped by the 6M categories. AI marks causes that lack supporting evidence; delete anything not relevant to this deviation."
      actions={
        missing.length > 0 ? (
          <select
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
            value=""
            onChange={(e) => e.target.value && addCategory(e.target.value)}
          >
            <option value="">+ Add category…</option>
            {missing.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        ) : null
      }
    >
      {fishbone.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No fishbone categories yet. Run the Analyze step in the AI panel to draft
          candidate causes across the 6M categories.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {fishbone.map((f) => (
            <div
              key={f.category}
              className={`rounded-lg border p-3 ${CATEGORY_COLORS[f.category] ?? "border-slate-200 bg-slate-50"}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {f.category}
                </span>
                <Badge variant="default" className="bg-white/70">
                  {f.causes.length}
                </Badge>
              </div>
              <ul className="mb-2 space-y-1">
                {f.causes.map((cause, i) => (
                  <li
                    key={i}
                    className="group flex items-start justify-between gap-2 rounded-md bg-white px-2 py-1.5 text-xs leading-snug text-slate-700 shadow-sm"
                  >
                    <span>{cause}</span>
                    <button
                      className="shrink-0 text-slate-300 transition-colors hover:text-red-500 group-hover:text-slate-400"
                      onClick={() => removeCause(f.category, i)}
                      title="Remove cause"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
                {f.causes.length === 0 && (
                  <li className="px-2 py-1 text-xs italic text-slate-400">No causes</li>
                )}
              </ul>
              <div className="flex gap-1">
                <Input
                  value={newCause[f.category] ?? ""}
                  onChange={(e) => setNewCause((c) => ({ ...c, [f.category]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addCause(f.category)}
                  placeholder="Add cause…"
                  className="h-7 bg-white text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => addCause(f.category)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
