import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReportsByStatus, updateReportStatus, deleteReport } from "@/processes/reports";
import { insertAdmLog } from "@/processes/admLogs";
import type { Report } from "@/types/report";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores";

export function useReports() {
  const queryClient = useQueryClient();
  const admId = useAuthStore((s) => s.user?.id);
  const { toast } = useToast();

  const pending = useQuery({
    queryKey: queryKeys.reports.byStatus("pending"),
    queryFn: () => fetchReportsByStatus("pending"),
  });
  const contentRemoved = useQuery({
    queryKey: queryKeys.reports.byStatus("content_removed"),
    queryFn: () => fetchReportsByStatus("content_removed"),
  });
  const userBlocked = useQuery({
    queryKey: queryKeys.reports.byStatus("user_blocked"),
    queryFn: () => fetchReportsByStatus("user_blocked"),
  });
  const rejected = useQuery({
    queryKey: queryKeys.reports.byStatus("rejected"),
    queryFn: () => fetchReportsByStatus("rejected"),
  });

  const reportsPending = pending.data ?? [];
  const reportsContentRemoved = contentRemoved.data ?? [];
  const reportsUserBlocked = userBlocked.data ?? [];
  const reportsRejected = rejected.data ?? [];

  const isLoading =
    pending.isLoading ||
    contentRemoved.isLoading ||
    userBlocked.isLoading ||
    rejected.isLoading;
  const error =
    pending.error ?? contentRemoved.error ?? userBlocked.error ?? rejected.error;

  const invalidateReports = () =>
    queryClient.invalidateQueries({ queryKey: ["reports"] });

  const removeContentMutation = useMutation({
    mutationFn: (report: Report) =>
      updateReportStatus(report.id, "content_removed"),
    onSuccess: (_data, report) => {
      invalidateReports();
      insertAdmLog({
        admId: admId!,
        userId: report.targetUserId,
        type: "report_handled",
        metadata: { reportId: report.id, status: "content_removed" },
      });
      toast({ title: "Conteúdo removido" });
    },
  });

  const removeReportMutation = useMutation({
    mutationFn: (report: Report) => deleteReport(report.id),
    onSuccess: (_data, report) => {
      invalidateReports();
      insertAdmLog({
        admId: admId!,
        userId: report.targetUserId,
        type: "report_handled",
        metadata: { reportId: report.id, status: "rejected" },
      });
      toast({ title: "Denúncia removida" });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: (report: Report) =>
      updateReportStatus(report.id, "user_blocked"),
    onSuccess: (_data, report) => {
      invalidateReports();
      insertAdmLog({
        admId: admId!,
        userId: report.targetUserId,
        type: "report_handled",
        metadata: { reportId: report.id, status: "user_blocked" },
      });
      toast({ title: "Usuário bloqueado" });
    },
  });

  return {
    reportsPending,
    reportsContentRemoved,
    reportsUserBlocked,
    reportsRejected,
    isLoading,
    error: error as Error | null,
    removeContentMutation,
    removeReportMutation,
    blockUserMutation,
  };
}
