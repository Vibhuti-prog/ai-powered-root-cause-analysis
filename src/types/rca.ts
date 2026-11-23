export type Severity = "low" | "medium" | "high" | "critical";
export type Confidence = "low" | "medium" | "high";
export type RootCauseStatus = "suggested" | "confirmed" | "rejected";
export type GapStatus = "open" | "requested" | "resolved";
export type CapaStatus = "proposed" | "in_progress" | "completed";
export type InvestigationStatus = "draft" | "in_review" | "approved" | "closed";

export interface WhyStep {
  why: string;
  answer: string;
}

export interface FishboneCategory {
  category: string;
  causes: string[];
}

export interface RootCause {
  id: string;
  description: string;
  category: string;
  evidence: string[];
  confidence: Confidence;
  contributing_factors: string[];
  rationale: string;
  status: RootCauseStatus;
  source: "ai" | "user";
}

export interface MissingInfo {
  id: string;
  item: string;
  area: string;
  priority: "high" | "medium" | "low";
  rationale: string;
  requested_from: string;
  status: GapStatus;
}

export interface CapaItem {
  id: string;
  type: "corrective" | "preventive";
  title: string;
  description: string;
  rationale: string;
  owner: string;
  due_date: string;
  priority: "high" | "medium" | "low";
  status: CapaStatus;
  linked_root_cause: string;
  source: "ai" | "user";
}

export interface ImpactItem {
  area: string;
  assessment: string;
}

export interface SourceDocument {
  name: string;
  type: "pdf" | "text" | "email";
  submitted_at: string;
  excerpt: string;
}

export interface Investigation {
  id: string;
  investigation_ref: string;
  title: string;
  status: InvestigationStatus;
  product_name: string;
  batch_number: string;
  batch_size: string;
  stage: string;
  equipment_id: string;
  deviation_type: string;
  severity: Severity;
  deviation_date: string | null;
  deviation_detected_by: string;
  description: string;
  immediate_action: string;
  regulatory_impact: string;
  impact_assessment: ImpactItem[];
  five_whys: WhyStep[];
  fishbone: FishboneCategory[];
  root_causes: RootCause[];
  missing_info: MissingInfo[];
  capa: CapaItem[];
  source_documents: SourceDocument[];
  ai_processed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviationExtract {
  title: string;
  product_name: string;
  batch_number: string;
  batch_size: string;
  stage: string;
  equipment_id: string;
  deviation_type: string;
  severity: Severity;
  deviation_date: string;
  deviation_detected_by: string;
  description: string;
  immediate_action: string;
  regulatory_impact: string;
  extraction_notes: string;
  missing_fields: string[];
}

export interface AnalysisResult {
  problem_statement: string;
  five_whys: WhyStep[];
  fishbone: FishboneCategory[];
  root_causes: Omit<RootCause, "id" | "status" | "source">[];
  missing_info: Omit<MissingInfo, "id" | "status">[];
}

export interface CapaResult {
  impact_assessment: ImpactItem[];
  capa: Omit<CapaItem, "id" | "owner" | "due_date" | "status" | "source">[];
}

export const DEVIATION_TYPES = [
  "Out of Specification (OOS)",
  "Out of Trend (OOT)",
  "Process Deviation",
  "Equipment Failure",
  "Material Issue",
  "Documentation Error",
  "Environmental Monitoring Excursion",
  "Sampling Error",
  "Other",
];

export const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

export const STAGES = [
  "Fermentation / Cell Culture",
  "Cell Harvest / Lysis",
  "Purification / Chromatography",
  "Crystallization",
  "Drying / Milling",
  "Final Blending",
  "Packaging / Storage",
  "Quality Control Laboratory",
  "Other",
];

export const FISHBONE_CATEGORIES = [
  "Man",
  "Machine",
  "Material",
  "Method",
  "Measurement",
  "Environment",
];
