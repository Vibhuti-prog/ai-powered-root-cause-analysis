import { useCallback, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
// Vite bundles the worker; point pdf.js at it explicitly.
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

type ExtractKind = "pdf" | "text" | "email";

export async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ");
    pages.push(pageText);
  }
  await pdf.destroy();
  return pages.join("\n\n");
}

export interface ExtractedInput {
  text: string;
  name: string;
  type: ExtractKind;
}

export function useIntakeInput(onSubmit: (input: ExtractedInput) => void) {
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const submitText = useCallback(
    (text: string, name: string, type: ExtractKind) => {
      if (!text.trim()) {
        setParseError("The content is empty. Paste some text or choose a file.");
        return;
      }
      setParseError(null);
      onSubmit({ text, name, type });
    },
    [onSubmit],
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      setIsParsing(true);
      setParseError(null);
      try {
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const text = await extractPdfText(file);
          submitText(text, file.name, "pdf");
        } else if (
          file.type.startsWith("text/") ||
          /\.(txt|md|csv|log)$/i.test(file.name)
        ) {
          const text = await file.text();
          submitText(text, file.name, "text");
        } else {
          setParseError("Unsupported file type. Please use a PDF or text file.");
        }
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : "Could not read the file.",
        );
      } finally {
        setIsParsing(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [submitText],
  );

  return { isParsing, parseError, handleFiles, submitText, fileRef, setParseError };
}
