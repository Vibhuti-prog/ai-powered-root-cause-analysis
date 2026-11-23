import { Input, Label, Select, Textarea } from "@/components/ui/controls";
import { FieldRow, SectionCard } from "@/components/ui/patterns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateField } from "@/store/rcaSlice";
import { DEVIATION_TYPES, SEVERITIES, STAGES } from "@/types/rca";
import type { Investigation } from "@/types/rca";

export function DeviationSection() {
  const dispatch = useAppDispatch();
  const inv = useAppSelector((s) => s.rca.current);

  const set = <K extends keyof Investigation>(field: K, value: Investigation[K]) =>
    dispatch(updateField({ field, value }));

  return (
    <SectionCard
      title="Deviation Record"
      description="Facts extracted by AI from the source material. Correct anything that is wrong or missing before the investigation proceeds."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Investigation title</Label>
          <Input value={inv.title} onChange={(e) => set("title", e.target.value)} placeholder="Short title" />
        </div>
        <div className="space-y-1.5">
          <Label>Deviation type</Label>
          <Select value={inv.deviation_type} onChange={(e) => set("deviation_type", e.target.value)}>
            <option value="">Select type…</option>
            {DEVIATION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Product / API</Label>
          <Input value={inv.product_name} onChange={(e) => set("product_name", e.target.value)} placeholder="e.g. Amlodipine besylate API" />
        </div>
        <div className="space-y-1.5">
          <Label>Batch number</Label>
          <Input value={inv.batch_number} onChange={(e) => set("batch_number", e.target.value)} placeholder="Batch ID" />
        </div>
        <div className="space-y-1.5">
          <Label>Batch size</Label>
          <Input value={inv.batch_size} onChange={(e) => set("batch_size", e.target.value)} placeholder="e.g. 180 kg" />
        </div>
        <div className="space-y-1.5">
          <Label>Manufacturing stage</Label>
          <Select value={inv.stage} onChange={(e) => set("stage", e.target.value)}>
            <option value="">Select stage…</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Equipment / system</Label>
          <Input value={inv.equipment_id} onChange={(e) => set("equipment_id", e.target.value)} placeholder="e.g. HPLC-07" />
        </div>
        <div className="space-y-1.5">
          <Label>Severity</Label>
          <Select value={inv.severity} onChange={(e) => set("severity", e.target.value as Investigation["severity"])}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date detected</Label>
          <Input type="date" value={inv.deviation_date ?? ""} onChange={(e) => set("deviation_date", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Detected by</Label>
          <Input value={inv.deviation_detected_by} onChange={(e) => set("deviation_detected_by", e.target.value)} placeholder="Name / role" />
        </div>
      </div>

      <FieldRow label="What happened">
        <Textarea
          rows={5}
          value={inv.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Detailed description of the deviation…"
        />
      </FieldRow>
      <FieldRow label="Immediate / containment action">
        <Textarea
          rows={3}
          value={inv.immediate_action}
          onChange={(e) => set("immediate_action", e.target.value)}
          placeholder="Actions already taken to contain the issue…"
        />
      </FieldRow>
      <FieldRow label="Regulatory / compliance impact">
        <Textarea
          rows={2}
          value={inv.regulatory_impact}
          onChange={(e) => set("regulatory_impact", e.target.value)}
          placeholder="Impact on filings, specifications, GMP compliance…"
        />
      </FieldRow>
    </SectionCard>
  );
}
