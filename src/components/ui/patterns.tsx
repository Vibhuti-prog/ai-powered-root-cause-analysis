import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const severityStyles: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge className={cn("border", severityStyles[severity] ?? severityStyles.medium)}>
      {severity.toUpperCase()}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    in_review: "bg-blue-50 text-blue-700 border-blue-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed: "bg-slate-100 text-slate-400 border-slate-200",
  };
  return (
    <Badge className={cn("border", styles[status] ?? styles.draft)}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles: Record<string, string> = {
    low: "bg-amber-50 text-amber-700 border-amber-200",
    medium: "bg-blue-50 text-blue-700 border-blue-200",
    high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <Badge className={cn("border", styles[confidence] ?? styles.low)}>
      {confidence} confidence
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    low: "bg-slate-100 text-slate-600 border-slate-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    high: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <Badge className={cn("border", styles[priority] ?? styles.medium)}>{priority}</Badge>
  );
}

export function SourceBadge({ source }: { source: "ai" | "user" }) {
  return source === "ai" ? (
    <Badge className="border border-violet-200 bg-violet-50 text-violet-700">
      <SparklesIcon /> AI
    </Badge>
  ) : (
    <Badge className="border border-slate-200 bg-slate-100 text-slate-600">User</Badge>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

export function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr] sm:items-start sm:gap-4">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div>{children}</div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

export function useCountSummary(items: { status?: string }[]) {
  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const s = item.status ?? "none";
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [items]);
}
