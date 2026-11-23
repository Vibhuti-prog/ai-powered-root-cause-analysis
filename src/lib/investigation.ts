import type {
  AnalysisResult,
  CapaItem,
  CapaResult,
  DeviationExtract,
  Investigation,
  MissingInfo,
  RootCause,
  WhyStep,
} from "@/types/rca";

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export function newInvestigation(): Investigation {
  return {
    id: "",
    investigation_ref: "",
    title: "",
    status: "draft",
    product_name: "",
    batch_number: "",
    batch_size: "",
    stage: "",
    equipment_id: "",
    deviation_type: "",
    severity: "medium",
    deviation_date: null,
    deviation_detected_by: "",
    description: "",
    immediate_action: "",
    regulatory_impact: "",
    impact_assessment: [],
    five_whys: [],
    fishbone: [],
    root_causes: [],
    missing_info: [],
    capa: [],
    source_documents: [],
    ai_processed: false,
    created_at: "",
    updated_at: "",
  };
}

function mergeExtract(
  inv: Investigation,
  extract: Partial<DeviationExtract>,
): Investigation {
  return {
    ...inv,
    title: extract.title?.trim() || inv.title,
    product_name: extract.product_name || inv.product_name,
    batch_number: extract.batch_number || inv.batch_number,
    batch_size: extract.batch_size || inv.batch_size,
    stage: extract.stage || inv.stage,
    equipment_id: extract.equipment_id || inv.equipment_id,
    deviation_type: extract.deviation_type || inv.deviation_type,
    severity: (extract.severity as Investigation["severity"]) || inv.severity,
    deviation_date:
      extract.deviation_date && /^\d{4}-\d{2}-\d{2}$/.test(extract.deviation_date)
        ? extract.deviation_date
        : inv.deviation_date,
    deviation_detected_by: extract.deviation_detected_by || inv.deviation_detected_by,
    description: extract.description || inv.description,
    immediate_action: extract.immediate_action || inv.immediate_action,
    regulatory_impact: extract.regulatory_impact || inv.regulatory_impact,
  };
}

export function applyExtract(inv: Investigation, extract: DeviationExtract): Investigation {
  const merged = mergeExtract(inv, extract);
  return {
    ...merged,
    ai_processed: true,
  };
}

export function applyAnalysis(
  inv: Investigation,
  analysis: AnalysisResult,
): Investigation {
  const rootCauses: RootCause[] = (analysis.root_causes ?? []).map((rc) => ({
    id: uid("rc"),
    description: rc.description,
    category: rc.category,
    evidence: rc.evidence ?? [],
    confidence: rc.confidence,
    contributing_factors: rc.contributing_factors ?? [],
    rationale: rc.rationale,
    status: "suggested",
    source: "ai" as const,
  }));
  const missingInfo: MissingInfo[] = (analysis.missing_info ?? []).map((m) => ({
    id: uid("gap"),
    item: m.item,
    area: m.area,
    priority: m.priority,
    rationale: m.rationale,
    requested_from: m.requested_from,
    status: "open" as const,
  }));
  return {
    ...inv,
    five_whys: analysis.five_whys ?? [],
    fishbone: analysis.fishbone ?? [],
    root_causes: mergeRootCauses(inv.root_causes, rootCauses),
    missing_info: mergeMissingInfo(inv.missing_info, missingInfo),
  };
}

export function applyCapa(inv: Investigation, result: CapaResult): Investigation {
  const items: CapaItem[] = (result.capa ?? []).map((c) => ({
    id: uid("capa"),
    type: c.type,
    title: c.title,
    description: c.description,
    rationale: c.rationale,
    owner: "",
    due_date: "",
    priority: c.priority,
    status: "proposed" as const,
    linked_root_cause: c.linked_root_cause ?? "",
    source: "ai" as const,
  }));
  return {
    ...inv,
    impact_assessment: result.impact_assessment ?? inv.impact_assessment,
    capa: mergeCapa(inv.capa, items),
  };
}

function sameText(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function mergeRootCauses(
  existing: RootCause[],
  incoming: RootCause[],
): RootCause[] {
  const merged = [...existing];
  for (const rc of incoming) {
    if (!merged.some((e) => sameText(e.description, rc.description))) {
      merged.push(rc);
    }
  }
  return merged;
}

export function mergeMissingInfo(
  existing: MissingInfo[],
  incoming: MissingInfo[],
): MissingInfo[] {
  const merged = [...existing];
  for (const m of incoming) {
    if (!merged.some((e) => sameText(e.item, m.item))) {
      merged.push(m);
    }
  }
  return merged;
}

export function mergeCapa(existing: CapaItem[], incoming: CapaItem[]): CapaItem[] {
  const merged = [...existing];
  for (const c of incoming) {
    if (!merged.some((e) => sameText(e.title, c.title))) {
      merged.push(c);
    }
  }
  return merged;
}

export function nextRef(existing: string[]): string {
  const year = new Date().getFullYear();
  const nums = existing
    .map((r) => /RCA-(\d{4})-(\d+)/.exec(r))
    .filter((m): m is RegExpExecArray => !!m && Number(m[1]) === year)
    .map((m) => Number(m[2]));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `RCA-${year}-${String(next).padStart(3, "0")}`;
}

export function whyChainText(steps: WhyStep[]): string {
  return steps
    .map((s, i) => `Why ${i + 1}: ${s.why}\nAnswer: ${s.answer}`)
    .join("\n");
}

export function buildAnalysisContext(inv: Investigation): Record<string, unknown> {
  return {
    title: inv.title,
    product_name: inv.product_name,
    batch_number: inv.batch_number,
    batch_size: inv.batch_size,
    stage: inv.stage,
    equipment_id: inv.equipment_id,
    deviation_type: inv.deviation_type,
    severity: inv.severity,
    deviation_date: inv.deviation_date,
    deviation_detected_by: inv.deviation_detected_by,
    description: inv.description,
    immediate_action: inv.immediate_action,
    regulatory_impact: inv.regulatory_impact,
    additional_evidence: inv.source_documents.map((d) => ({
      name: d.name,
      type: d.type,
      excerpt: d.excerpt,
    })),
    problem_statement: inv.five_whys[0]?.why ?? "",
    five_whys_so_far: inv.five_whys.length ? inv.five_whys : undefined,
    fishbone_so_far: inv.fishbone.length ? inv.fishbone : undefined,
    root_causes_so_far: inv.root_causes.length ? inv.root_causes : undefined,
  };
}
