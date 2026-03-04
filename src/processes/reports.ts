import { supabase } from "@/lib/supabase";
import type { Report, ReportRow, ReportStatus } from "@/types/report";

export async function fetchReports(): Promise<Report[]> {
  const { data: rows, error } = await supabase
    .from("report")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!rows?.length) return [];

  const reportRows = rows as ReportRow[];
  const reporterIds = [...new Set(reportRows.map((r) => r.reporter_user_id))];
  const targetProfileIds = [
    ...new Set(
      reportRows.filter((r) => r.target_type === "profile").map((r) => r.target_id)
    ),
  ];
  const allProfileIds = [...new Set([...reporterIds, ...targetProfileIds])];

  const { data: profiles } = await supabase
    .from("profile")
    .select("id, name")
    .in("id", allProfileIds);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.name ?? "—"])
  );

  return reportRows.map((r) => ({
    id: r.id,
    type: r.target_type,
    reason: r.reason,
    status: r.status,
    reportedBy: nameById.get(r.reporter_user_id) ?? "—",
    reportedUser:
      r.target_type === "profile"
        ? nameById.get(r.target_id) ?? "—"
        : r.target_id,
    createdAt: formatDate(r.created_at),
    targetUserId: r.target_type === "profile" ? r.target_id : undefined,
  }));
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus
): Promise<void> {
  const { error } = await supabase
    .from("report")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from("report").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
