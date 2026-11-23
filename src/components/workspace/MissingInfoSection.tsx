import { useState } from "react";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button, Input, Select } from "@/components/ui/controls";
import { PriorityBadge, SectionCard } from "@/components/ui/patterns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addMissingInfo,
  removeMissingInfo,
  updateMissingInfo,
} from "@/store/rcaSlice";
import { uid } from "@/lib/investigation";
import type { MissingInfo } from "@/types/rca";

export function MissingInfoSection() {
  const dispatch = useAppDispatch();
  const missing = useAppSelector((s) => s.rca.current.missing_info);
  const [newItem, setNewItem] = useState("");

  const request = (m: MissingInfo) =>
    dispatch(updateMissingInfo({ ...m, status: m.status === "requested" ? "open" : "requested" }));

  const resolve = (m: MissingInfo) =>
    dispatch(updateMissingInfo({ ...m, status: m.status === "resolved" ? "requested" : "resolved" }));

  const addManual = () => {
    if (!newItem.trim()) return;
    dispatch(
      addMissingInfo({
        id: uid("gap"),
        item: newItem.trim(),
        area: "General",
        priority: "medium",
        rationale: "Requested by investigator",
        requested_from: "",
        status: "open",
      }),
    );
    setNewItem("");
  };

  const openCount = missing.filter((m) => m.status !== "resolved").length;

  return (
    <SectionCard
      title="Missing Evidence & Information Gaps"
      description="What AI could not confirm from the available material. Request these items to strengthen the investigation before confirming root causes."
      actions={
        openCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" /> {openCount} open
          </span>
        ) : null
      }
    >
      {missing.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No information gaps identified. AI will list missing evidence here after the
          Analyze step.
        </div>
      )}
      <ul className="space-y-2">
        {missing.map((m) => (
          <li
            key={m.id}
            className={
              "rounded-lg border p-3 " +
              (m.status === "resolved"
                ? "border-emerald-200 bg-emerald-50/50"
                : m.status === "requested"
                  ? "border-blue-200 bg-blue-50/40"
                  : "border-amber-200 bg-amber-50/40")
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={m.priority} />
                  <span className="text-xs text-slate-500">{m.area}</span>
                  {m.requested_from && (
                    <span className="text-xs text-slate-400">· from {m.requested_from}</span>
                  )}
                  {m.status === "requested" && (
                    <span className="text-xs font-medium text-blue-700">requested</span>
                  )}
                  {m.status === "resolved" && (
                    <span className="text-xs font-medium text-emerald-700">received</span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{m.item}</p>
                {m.rationale && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{m.rationale}</p>
                )}
                <Input
                  value={m.requested_from}
                  onChange={(e) =>
                    dispatch(updateMissingInfo({ ...m, requested_from: e.target.value }))
                  }
                  placeholder="Request from (role / department)…"
                  className="mt-2 h-7 max-w-xs text-xs"
                />
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button variant="outline" size="sm" onClick={() => request(m)}>
                  {m.status === "requested" ? "Undo request" : "Request"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => resolve(m)}>
                  {m.status === "resolved" ? "Reopen" : "Mark received"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="self-center text-slate-400 hover:text-red-600"
                  onClick={() => dispatch(removeMissingInfo(m.id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addManual()}
          placeholder="Add another evidence item to request…"
          className="text-sm"
        />
        <Button variant="outline" onClick={addManual} className="shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </SectionCard>
  );
}
