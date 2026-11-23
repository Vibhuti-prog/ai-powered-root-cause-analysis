import { Plus, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui/controls";
import { SectionCard } from "@/components/ui/patterns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setFiveWhys } from "@/store/rcaSlice";
import type { WhyStep } from "@/types/rca";

const DEFAULT_WHYS = [
  "Why did the specification failure occur?",
  "Why did that condition arise?",
  "Why did that condition arise?",
  "Why did that condition arise?",
  "Why did that condition arise?",
];

export function FiveWhysSection() {
  const dispatch = useAppDispatch();
  const steps = useAppSelector((s) => s.rca.current.five_whys);

  const update = (i: number, patch: Partial<WhyStep>) => {
    const next = steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    dispatch(setFiveWhys(next));
  };

  const add = () => {
    const i = steps.length;
    const next = [
      ...steps,
      { why: i < 5 ? DEFAULT_WHYS[i] ?? "" : "", answer: "" },
    ];
    dispatch(setFiveWhys(next));
  };

  const remove = (i: number) => {
    dispatch(setFiveWhys(steps.filter((_, idx) => idx !== i)));
  };

  return (
    <SectionCard
      title="5 Whys Analysis"
      description="Drill from the symptom to the underlying systemic cause. AI drafts the chain; edit the questions and answers to match the evidence you hold."
    >
      {steps.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No 5 Whys chain yet. Run the Analyze step in the AI panel to draft one, or add
          steps manually.
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={add}>
              <Plus className="h-4 w-4" /> Add first why
            </Button>
          </div>
        </div>
      ) : (
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li
              key={i}
              className="relative rounded-lg border border-slate-200 bg-slate-50/60 p-4 pl-12"
            >
              <span className="absolute left-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-[11px] font-semibold text-white">
                {i + 1}
              </span>
              {i > 0 && (
                <span className="absolute -top-3 left-6 h-3 w-px bg-slate-300" />
              )}
              <div className="space-y-2">
                <Input
                  value={s.why}
                  onChange={(e) => update(i, { why: e.target.value })}
                  placeholder={`Why #${i + 1}…`}
                  className="font-medium"
                />
                <textarea
                  value={s.answer}
                  onChange={(e) => update(i, { answer: e.target.value })}
                  placeholder="Answer, backed by evidence…"
                  rows={2}
                  className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 text-slate-400 hover:text-red-600"
                onClick={() => remove(i)}
                title="Remove step"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ol>
      )}
      {steps.length > 0 && (
        <div>
          <Button variant="outline" size="sm" onClick={add} disabled={steps.length >= 5}>
            <Plus className="h-4 w-4" /> Add why ({steps.length}/5)
          </Button>
        </div>
      )}
    </SectionCard>
  );
}
