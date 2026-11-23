import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  CapaItem,
  ImpactItem,
  Investigation,
  MissingInfo,
  RootCause,
  SourceDocument,
  WhyStep,
  FishboneCategory,
} from "@/types/rca";
import { supabase } from "@/lib/supabase";
import {
  aiAnalyze,
  aiCapa,
  aiExtract,
} from "@/lib/ai";
import {
  applyAnalysis,
  applyCapa,
  applyExtract,
  buildAnalysisContext,
  newInvestigation,
} from "@/lib/investigation";

export interface AiRunState {
  status: "idle" | "running" | "done" | "error";
  error: string | null;
}

interface RcaState {
  investigations: Investigation[];
  current: Investigation;
  loadingList: boolean;
  saving: boolean;
  saveError: string | null;
  extract: AiRunState;
  analyze: AiRunState;
  capa: AiRunState;
  lastExtractionNotes: string | null;
  lastImpactAssessment: ImpactItem[];
}

const initialState: RcaState = {
  investigations: [],
  current: newInvestigation(),
  loadingList: false,
  saving: false,
  saveError: null,
  extract: { status: "idle", error: null },
  analyze: { status: "idle", error: null },
  capa: { status: "idle", error: null },
  lastExtractionNotes: null,
  lastImpactAssessment: [],
};

export const fetchInvestigations = createAsyncThunk(
  "rca/fetchInvestigations",
  async () => {
    const { data, error } = await supabase
      .from("rca_investigations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Investigation[];
  },
);

export const saveInvestigation = createAsyncThunk(
  "rca/saveInvestigation",
  async (inv: Investigation) => {
    const row = {
      investigation_ref: inv.investigation_ref,
      title: inv.title,
      status: inv.status,
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
      impact_assessment: inv.impact_assessment,
      five_whys: inv.five_whys,
      fishbone: inv.fishbone,
      root_causes: inv.root_causes,
      missing_info: inv.missing_info,
      capa: inv.capa,
      source_documents: inv.source_documents,
      ai_processed: inv.ai_processed,
    };
    if (inv.id) {
      const { data, error } = await supabase
        .from("rca_investigations")
        .update(row)
        .eq("id", inv.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Investigation;
    }
    const { data, error } = await supabase
      .from("rca_investigations")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Investigation;
  },
);

export const runExtraction = createAsyncThunk(
  "rca/runExtraction",
  async (input: { text: string; source: Omit<SourceDocument, "submitted_at"> }) => {
    const extract = await aiExtract(input.text);
    return { extract, source: input.source };
  },
);

export const runAnalysis = createAsyncThunk(
  "rca/runAnalysis",
  async (inv: Investigation) => {
    const result = await aiAnalyze(buildAnalysisContext(inv));
    return result;
  },
);

export const runCapa = createAsyncThunk(
  "rca/runCapa",
  async (inv: Investigation) => {
    const result = await aiCapa(buildAnalysisContext(inv));
    return result;
  },
);

function setRun(
  state: RcaState,
  key: "extract" | "analyze" | "capa",
  run: AiRunState,
) {
  state[key] = run;
}

const rcaSlice = createSlice({
  name: "rca",
  initialState,
  reducers: {
    updateField<K extends keyof Investigation>(
      state: RcaState,
      action: PayloadAction<{ field: K; value: Investigation[K] }>,
    ) {
      state.current[action.payload.field] = action.payload.value;
    },
    startNewInvestigation(state: RcaState) {
      state.current = newInvestigation();
      state.lastExtractionNotes = null;
      state.lastImpactAssessment = [];
      setRun(state, "extract", { status: "idle", error: null });
      setRun(state, "analyze", { status: "idle", error: null });
      setRun(state, "capa", { status: "idle", error: null });
    },
    loadInvestigation(state: RcaState, action: PayloadAction<Investigation>) {
      state.current = action.payload;
      state.lastExtractionNotes = null;
      state.lastImpactAssessment = action.payload.impact_assessment ?? [];
    },
    addRootCause(state: RcaState, action: PayloadAction<RootCause>) {
      state.current.root_causes.push(action.payload);
    },
    updateRootCause(state: RcaState, action: PayloadAction<RootCause>) {
      const i = state.current.root_causes.findIndex((r) => r.id === action.payload.id);
      if (i >= 0) state.current.root_causes[i] = action.payload;
    },
    removeRootCause(state: RcaState, action: PayloadAction<string>) {
      state.current.root_causes = state.current.root_causes.filter(
        (r) => r.id !== action.payload,
      );
    },
    addMissingInfo(state: RcaState, action: PayloadAction<MissingInfo>) {
      state.current.missing_info.push(action.payload);
    },
    updateMissingInfo(state: RcaState, action: PayloadAction<MissingInfo>) {
      const i = state.current.missing_info.findIndex((m) => m.id === action.payload.id);
      if (i >= 0) state.current.missing_info[i] = action.payload;
    },
    removeMissingInfo(state: RcaState, action: PayloadAction<string>) {
      state.current.missing_info = state.current.missing_info.filter(
        (m) => m.id !== action.payload,
      );
    },
    updateCapaItem(state: RcaState, action: PayloadAction<CapaItem>) {
      const i = state.current.capa.findIndex((c) => c.id === action.payload.id);
      if (i >= 0) state.current.capa[i] = action.payload;
    },
    addCapaItem(state: RcaState, action: PayloadAction<CapaItem>) {
      state.current.capa.push(action.payload);
    },
    removeCapaItem(state: RcaState, action: PayloadAction<string>) {
      state.current.capa = state.current.capa.filter((c) => c.id !== action.payload);
    },
    setFiveWhys(state: RcaState, action: PayloadAction<WhyStep[]>) {
      state.current.five_whys = action.payload;
    },
    setFishbone(state: RcaState, action: PayloadAction<FishboneCategory[]>) {
      state.current.fishbone = action.payload;
    },
    clearAiError(
      state: RcaState,
      action: PayloadAction<"extract" | "analyze" | "capa">,
    ) {
      setRun(state, action.payload, { status: "idle", error: null });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvestigations.pending, (state) => {
        state.loadingList = true;
      })
      .addCase(fetchInvestigations.fulfilled, (state, action) => {
        state.loadingList = false;
        state.investigations = action.payload;
      })
      .addCase(fetchInvestigations.rejected, (state) => {
        state.loadingList = false;
      })
      .addCase(saveInvestigation.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(saveInvestigation.fulfilled, (state, action) => {
        state.saving = false;
        state.current = action.payload;
        const i = state.investigations.findIndex((x) => x.id === action.payload.id);
        if (i >= 0) state.investigations[i] = action.payload;
        else state.investigations.unshift(action.payload);
      })
      .addCase(saveInvestigation.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.error.message ?? "Failed to save";
      })
      .addCase(runExtraction.pending, (state) => {
        setRun(state, "extract", { status: "running", error: null });
      })
      .addCase(runExtraction.fulfilled, (state, action) => {
        setRun(state, "extract", { status: "done", error: null });
        state.current = applyExtract(state.current, action.payload.extract);
        const { name, type } = action.payload.source;
        const doc: SourceDocument = {
          name,
          type,
          submitted_at: new Date().toISOString(),
          excerpt: action.payload.extract.description
            ? `${action.payload.extract.description.slice(0, 300)}`
            : action.payload.extract.extraction_notes,
        };
        state.current.source_documents.push(doc);
        state.lastExtractionNotes =
          action.payload.extract.extraction_notes ||
          (action.payload.extract.missing_fields?.length
            ? `Missing fields: ${action.payload.extract.missing_fields.join(", ")}`
            : null);
      })
      .addCase(runExtraction.rejected, (state, action) => {
        setRun(state, "extract", {
          status: "error",
          error: action.error.message ?? "Extraction failed",
        });
      })
      .addCase(runAnalysis.pending, (state) => {
        setRun(state, "analyze", { status: "running", error: null });
      })
      .addCase(runAnalysis.fulfilled, (state, action) => {
        setRun(state, "analyze", { status: "done", error: null });
        state.current = applyAnalysis(state.current, action.payload);
      })
      .addCase(runAnalysis.rejected, (state, action) => {
        setRun(state, "analyze", {
          status: "error",
          error: action.error.message ?? "Analysis failed",
        });
      })
      .addCase(runCapa.pending, (state) => {
        setRun(state, "capa", { status: "running", error: null });
      })
      .addCase(runCapa.fulfilled, (state, action) => {
        setRun(state, "capa", { status: "done", error: null });
        state.current = applyCapa(state.current, action.payload);
        state.lastImpactAssessment = action.payload.impact_assessment ?? [];
      })
      .addCase(runCapa.rejected, (state, action) => {
        setRun(state, "capa", {
          status: "error",
          error: action.error.message ?? "CAPA generation failed",
        });
      });
  },
});

export const {
  updateField,
  startNewInvestigation,
  loadInvestigation,
  addRootCause,
  updateRootCause,
  removeRootCause,
  addMissingInfo,
  updateMissingInfo,
  removeMissingInfo,
  updateCapaItem,
  addCapaItem,
  removeCapaItem,
  setFiveWhys,
  setFishbone,
  clearAiError,
} = rcaSlice.actions;

export default rcaSlice.reducer;
