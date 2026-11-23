import { useState } from "react";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Button, Input, Select } from "@/components/ui/controls";
import { PriorityBadge, SectionCard, SourceBadge } from "@/components/ui/patterns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addCapaItem, removeCapaItem, updateCapaItem } from "@/store/rcaSlice";
import { uid } from "@/lib/investigation";
import type { CapaItem } from "@/types/rca";

export function CapaSection() {
  const dispatch = useAppDispatch();
  const capa = useAppSelector((s) => s.rca.current.capa);
  const impact = useAppSelector((s) => s.rca.current.impact_assessment);
  const rootCauses = useAppSelector((s) => s.rca.current.root_causes);
  const [newTitle, setNewTitle] = useState("");

  const update = (item: CapaItem, patch: Partial<CapaItem>) =>
    dispatch(updateCapaItem({ ...item, ...patch }));

  const addManual = (type: CapaItem["type"]) => {
    const item: CapaItem = {
      id: uid("capa"),
      type,
      title: "",
      description: "",
      rationale: "",
      owner: "",
      due_date: "",
      priority: "medium",
      status: "proposed",
      linked_root_cause: "",
      source: "user",
    };
    dispatch(addCapaItem(item));
    setNewTitle("");
  };

  const corrective = capa.filter((c) => c.type === "corrective");
  const preventive = capa.filter((c) => c.type === "preventive");

  const renderGroup = (title: string, items: CapaItem[]) => (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title} ({items.length})
      </h4>
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={c.priority} />
              <SourceBadge source={c.source} />
              <span className="text-xs text-slate-500">
                {c.linked_root_cause || "No linked root cause"}
              </span>
            </div>
            <Input
              value={c.title}
              onChange={(e) => update(c, { title: e.target.value })}
              placeholder="Action title…"
              className="mt-2 font-medium"
            />
            <textarea
              value={c.description}
              onChange={(e) => update(c, { description: e.target.value })}
              placeholder="What will be done…"
              rows={2}
              className="mt-2 flex w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
            <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
              <span className="font-medium text-slate-600">Why: </span>
              {c.rationale || "—"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
              <div className="col-span-2 md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Owner</label>
                <Input
                  value={c.owner}
                  onChange={(e) => update(c, { owner: e.target.value })}
                  placeholder="Assign owner…"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Due date</label>
                <Input
                  type="date"
                  value={c.due_date}
                  onChange={(e) => update(c, { due_date: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Priority</label>
                <Select
                  value={c.priority}
                  onChange={(e) => update(c, { priority: e.target.value as CapaItem["priority"] })}
                  className="h-8 text-xs"
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
                <Select
                  value={c.status}
                  onChange={(e) => update(c, { status: e.target.value as CapaItem["status"] })}
                  className="h-8 text-xs"
                >
                  <option value="proposed">proposed</option>
                  <option value="in_progress">in progress</option>
                  <option value="completed">completed</option>
                </Select>
              </div>
            </div>
            {rootCauses.length > 0 && (
              <div className="mt-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Linked root cause
                </label>
                <Select
                  value={c.linked_root_cause}
                  onChange={(e) => update(c, { linked_root_cause: e.target.value })}
                  className="h-8 text-xs"
                >
                  <option value="">No link</option>
                  {rootCauses.map((rc) => (
                    <option key={rc.id} value={rc.description}>
                      {rc.description.slice(0, 90)}
                      {rc.description.length > 90 ? "…" : ""}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="mt-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-red-600"
                onClick={() => dispatch(removeCapaItem(c.id))}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <SectionCard
      title="CAPA Plan"
      description="Corrective actions fix this deviation and its confirmed root causes; preventive actions stop recurrence and similar events elsewhere. AI drafts each with a rationale — assign owners and dates before saving."
    >
      {impact.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ShieldCheck className="h-4 w-4 text-teal-700" /> AI impact assessment (draft)
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {impact.map((imp, i) => (
              <div key={i} className="rounded-md bg-white p-3 shadow-sm">
                <div className="text-xs font-semibold text-slate-700">{imp.area}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{imp.assessment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {capa.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No CAPA actions yet. Run the CAPA step in the AI panel after confirming root
          causes, or add actions manually below.
        </div>
      )}

      {corrective.length > 0 && renderGroup("Corrective actions", corrective)}
      {preventive.length > 0 && renderGroup("Preventive actions", preventive)}

      <div className="flex flex-wrap gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New action title…"
          className="max-w-xs text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (newTitle.trim()) {
              const item: CapaItem = {
                id: uid("capa"),
                type: "corrective",
                title: newTitle.trim(),
                description: "",
                rationale: "Added manually by investigator",
                owner: "",
                due_date: "",
                priority: "medium",
                status: "proposed",
                linked_root_cause: "",
                source: "user",
              };
              dispatch(addCapaItem(item));
              setNewTitle("");
            }
          }}
        >
          <Plus className="h-4 w-4" /> Add corrective
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (newTitle.trim()) {
              const item: CapaItem = {
                id: uid("capa"),
                type: "preventive",
                title: newTitle.trim(),
                description: "",
                rationale: "Added manually by investigator",
                owner: "",
                due_date: "",
                priority: "medium",
                status: "proposed",
                linked_root_cause: "",
                source: "user",
              };
              dispatch(addCapaItem(item));
              setNewTitle("");
            }
          }}
        >
          <Plus className="h-4 w-4" /> Add preventive
        </Button>
      </div>
    </SectionCard>
  );
}
