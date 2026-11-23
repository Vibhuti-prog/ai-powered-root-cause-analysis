import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus2, FlaskConical, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/controls";
import { SeverityBadge, StatusBadge } from "@/components/ui/patterns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchInvestigations,
  loadInvestigation,
  saveInvestigation,
  startNewInvestigation,
} from "@/store/rcaSlice";
import { supabase } from "@/lib/supabase";
import { nextRef } from "@/lib/investigation";
import type { Investigation } from "@/types/rca";

export function Dashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { investigations, loadingList } = useAppSelector((s) => s.rca);

  useEffect(() => {
    dispatch(fetchInvestigations());
  }, [dispatch]);

  const startNew = async () => {
    dispatch(startNewInvestigation());
    const ref = nextRef(investigations.map((i) => i.investigation_ref));
    const { data, error } = await supabase
      .from("rca_investigations")
      .insert({ investigation_ref: ref, title: "" })
      .select()
      .single();
    if (error || !data) {
      navigate("/investigation");
      return;
    }
    dispatch(loadInvestigation(data as Investigation));
    navigate("/investigation");
  };

  const open = (inv: Investigation) => {
    dispatch(loadInvestigation(inv));
    navigate("/investigation");
  };

  const remove = async (id: string) => {
    await supabase.from("rca_investigations").delete().eq("id", id);
    dispatch(fetchInvestigations());
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Root Cause Analysis
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Investigate API manufacturing deviations: record the event, run AI-assisted
            5 Whys and fishbone analysis, confirm root causes, and track CAPA.
          </p>
        </div>
        <Button onClick={startNew}>
          <FilePlus2 className="h-4 w-4" /> New Investigation
        </Button>
      </div>

      {loadingList ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading investigations…
        </div>
      ) : investigations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FlaskConical className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-700">
            No investigations yet
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-500">
            Start one by submitting a deviation email, document, or pasted text — AI
            extracts the details and drafts the investigation for your review.
          </p>
          <Button className="mt-4" onClick={startNew}>
            <FilePlus2 className="h-4 w-4" /> New Investigation
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Product / Batch</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {investigations.map((inv) => (
                <tr
                  key={inv.id}
                  className="cursor-pointer transition-colors hover:bg-teal-50/40"
                  onClick={() => open(inv)}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-teal-800">
                    {inv.investigation_ref || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {inv.title || "Untitled"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {inv.deviation_type || "Deviation type not set"}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                    {inv.product_name || "—"}
                    {inv.batch_number && (
                      <span className="text-slate-400"> · {inv.batch_number}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={inv.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-300 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(inv.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
