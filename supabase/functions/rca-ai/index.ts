import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

interface WhyStep {
  why: string;
  answer: string;
}
interface FishboneCategory {
  category: string;
  causes: string[];
}
interface RootCause {
  description: string;
  category: string;
  evidence: string[];
  confidence: "low" | "medium" | "high";
  contributing_factors: string[];
  rationale: string;
}
interface MissingInfo {
  item: string;
  area: string;
  priority: "high" | "medium" | "low";
  rationale: string;
  requested_from: string;
}
interface CapaItem {
  type: "corrective" | "preventive";
  title: string;
  description: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  linked_root_cause: string;
}

async function callGroq(
  apiKey: string,
  system: string,
  user: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty response");
  return JSON.parse(content);
}

const SAFETY_CONTEXT = `You are an AI assistant embedded in a Root Cause Analysis (RCA) module used by quality professionals at an Active Pharmaceutical Ingredient (API) manufacturer operating under cGMP (ICH Q7/Q9/Q10, 21 CFR 211). Your output is always a SUGGESTION that a qualified quality professional will review and edit before anything is saved. Be precise, evidence-based, and conservative: never invent batch numbers, dates, or data that are not present in the provided material. Where information is absent, say so via missing-information items rather than guessing. Output STRICT JSON only.`;

async function handleExtract(
  apiKey: string,
  text: string,
): Promise<Record<string, unknown>> {
  const system = `${SAFETY_CONTEXT}

TASK: Information extraction for a deviation record. Read the raw source material (a document, pasted text, or an email) about a quality incident during API manufacturing and extract structured deviation details.

Rules:
- Only extract facts actually present in the source. Use "" for anything not stated.
- missing_fields: list the form field names you could not find in the source.
- extraction_notes: one or two sentences addressed to the quality reviewer summarizing what you extracted and what is unclear.

Return JSON with exactly these keys:
{
  "title": string,
  "product_name": string,
  "batch_number": string,
  "batch_size": string,
  "stage": string,
  "equipment_id": string,
  "deviation_type": one of ["Out of Specification (OOS)","Out of Trend (OOT)","Process Deviation","Equipment Failure","Material Issue","Documentation Error","Environmental Monitoring Excursion","Sampling/Sampling Error","Other"],
  "severity": one of ["low","medium","high","critical"],
  "deviation_date": "YYYY-MM-DD" or "",
  "deviation_detected_by": string,
  "description": string (detailed narrative of what happened, written in neutral QA language),
  "immediate_action": string (containment/corrections already taken),
  "regulatory_impact": string,
  "extraction_notes": string,
  "missing_fields": string[]
}`;
  return callGroq(apiKey, system, `SOURCE MATERIAL:\n"""\n${text}\n"""`);
}

function investigationContext(inv: Record<string, unknown>): string {
  return JSON.stringify(inv, null, 1).slice(0, 12000);
}

async function handleAnalyze(
  apiKey: string,
  inv: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const system = `${SAFETY_CONTEXT}

TASK: Investigative analysis of a recorded deviation. Using ONLY the investigation context provided (deviation description, immediate actions, batch context, and any additional evidence the investigator attached), produce:

1. problem_statement: a crisp "should be / but is" problem definition.
2. five_whys: a 5 Whys chain (3-5 steps). Each step's question probes the answer of the previous step. Stop early if you run out of supporting evidence rather than speculating.
3. fishbone: 6M categories (Man, Machine, Material, Method, Measurement, Environment) with plausible candidate causes. Mark candidates that lack supporting evidence clearly in the wording ("possible: ...").
4. root_causes: only causes that trace through the 5 Whys chain and are supported by stated evidence. If evidence does not yet support a definite root cause, return a single root cause with confidence "low" describing the most probable cause and what evidence would confirm it. contributing_factors: secondary conditions that enabled the cause. rationale: why this cause is plausible given the evidence.
5. missing_info: evidence and information gaps that block confirmation (missing batch records, chromatograms, maintenance logs, cleaning logs, training records, BPR deviations, etc.). area: which part of the investigation this blocks. requested_from: role or department that would hold it.

Return JSON with exactly these keys:
{
  "problem_statement": string,
  "five_whys": [{"why": string, "answer": string}],
  "fishbone": [{"category": string, "causes": [string]}],
  "root_causes": [{"description": string, "category": string, "evidence": [string], "confidence": one of ["low","medium","high"], "contributing_factors": [string], "rationale": string}],
  "missing_info": [{"item": string, "area": string, "priority": one of ["high","medium","low"], "rationale": string, "requested_from": string}]
}`;
  return callGroq(
    apiKey,
    system,
    `INVESTIGATION CONTEXT:\n${investigationContext(inv)}`,
  );
}

async function handleCapa(
  apiKey: string,
  inv: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const system = `${SAFETY_CONTEXT}

TASK: CAPA recommendation for the recorded deviation. Using ONLY the investigation context (deviation details, root cause analysis, and evidence), recommend:

1. impact_assessment: short assessments for the areas Product Quality, Patient Safety, Data Integrity, and Regulatory/Compliance given the deviation and batch disposition context.
2. capa: corrective actions (fix the confirmed deviation and its root cause: rework/reprocess per ICH Q7, batch disposition actions, equipment repair/recalibration, document correction, retraining on the affected procedure) and preventive actions (prevent recurrence and similar events elsewhere: procedural change, change control, engineering controls, trending/frequency changes, QMS actions). Each item needs a rationale explaining briefly why it addresses a root cause or contributing factor, and linked_root_cause: the description of the root cause it addresses (or "Preventive measure" when it is a broad preventive action).

Return JSON with exactly these keys:
{
  "impact_assessment": [{"area": string, "assessment": string}],
  "capa": [{"type": one of ["corrective","preventive"], "title": string, "description": string, "rationale": string, "priority": one of ["high","medium","low"], "linked_root_cause": string}]
}`;
  return callGroq(
    apiKey,
    system,
    `INVESTIGATION CONTEXT:\n${investigationContext(inv)}`,
  );
}

interface InvestigationPayload {
  title?: string;
  product_name?: string;
  batch_number?: string;
  description?: string;
  immediate_action?: string;
  five_whys?: WhyStep[];
  fishbone?: FishboneCategory[];
  root_causes?: RootCause[];
  missing_info?: MissingInfo[];
  capa?: CapaItem[];
  [key: string]: unknown;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const bodyKey = typeof body?.groqApiKey === "string" ? body.groqApiKey : "";
    const apiKey = Deno.env.get("GROQ_API_KEY") || bodyKey;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const action = body?.action;

    let result: Record<string, unknown>;
    if (action === "extract") {
      const text = typeof body?.text === "string" ? body.text : "";
      if (!text.trim()) {
        return new Response(
          JSON.stringify({ error: "Provide the source text to extract from" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      result = await handleExtract(apiKey, text.slice(0, 40000));
    } else if (action === "analyze" || action === "capa") {
      const inv = body?.investigation;
      if (!inv || !inv.description) {
        return new Response(
          JSON.stringify({
            error: "Provide an investigation with a deviation description",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      result =
        action === "analyze"
          ? await handleAnalyze(apiKey, inv as InvestigationPayload)
          : await handleCapa(apiKey, inv as InvestigationPayload);
    } else {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${String(action)}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
