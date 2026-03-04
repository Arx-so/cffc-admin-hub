import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReports, updateReportStatus, deleteReport } from "@/processes/reports";
import { insertAdmLog } from "@/processes/admLogs";
import type { Report } from "@/types/report";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores";

export function useReports() {
  const queryClient = useQueryClient();
  const admId = useAuthStore((s) => s.user?.id);
  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: queryKeys.reports.all,
    queryFn: fetchReports,
  });
  const { toast } = useToast();

  const invalidateReports = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });

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
    reports,
    isLoading,
    error: error as Error | null,
    removeContentMutation,
    removeReportMutation,
    blockUserMutation,
  };
}
