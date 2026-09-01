import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReportsByStatus, updateReportStatus, deleteReport } from "@/processes/reports";
import { insertAdmLog } from "@/processes/admLogs";
import type { Report, ReportStatus } from "@/types/report";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores";

export function useReports() {
  const queryClient = useQueryClient();
  const admId = useAuthStore((s) => s.user?.id);
  const { toast } = useToast();

  const open = useQuery({
    queryKey: queryKeys.reports.byStatus("open"),
    queryFn: () => fetchReportsByStatus("open"),
  });
  const reviewed = useQuery({
    queryKey: queryKeys.reports.byStatus("reviewed"),
    queryFn: () => fetchReportsByStatus("reviewed"),
  });
  const actioned = useQuery({
    queryKey: queryKeys.reports.byStatus("actioned"),
    queryFn: () => fetchReportsByStatus("actioned"),
  });

  const reportsOpen = open.data ?? [];
  const reportsReviewed = reviewed.data ?? [];
  const reportsActioned = actioned.data ?? [];

  const isLoading = open.isLoading || reviewed.isLoading || actioned.isLoading;
  const error = open.error ?? reviewed.error ?? actioned.error;

  const invalidateReports = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });

  type ReportsCache = {
    prevOpen?: Report[];
    prevReviewed?: Report[];
    prevActioned?: Report[];
  };

  const rollbackReports = (ctx: ReportsCache | undefined) => {
    if (!ctx) return;
    if (ctx.prevOpen !== undefined)
      queryClient.setQueryData(queryKeys.reports.byStatus("open"), ctx.prevOpen);
    if (ctx.prevReviewed !== undefined)
      queryClient.setQueryData(queryKeys.reports.byStatus("reviewed"), ctx.prevReviewed);
    if (ctx.prevActioned !== undefined)
      queryClient.setQueryData(queryKeys.reports.byStatus("actioned"), ctx.prevActioned);
  };

  const moveFromOpen = async (report: Report, target: Exclude<ReportStatus, "open">) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.reports.all });
    const prevOpen = queryClient.getQueryData<Report[]>(queryKeys.reports.byStatus("open"));
    const targetKey = queryKeys.reports.byStatus(target);
    const prevTarget = queryClient.getQueryData<Report[]>(targetKey);
    queryClient.setQueryData(
      queryKeys.reports.byStatus("open"),
      (prevOpen ?? []).filter((r) => r.id !== report.id)
    );
    queryClient.setQueryData(targetKey, [{ ...report, status: target }, ...(prevTarget ?? [])]);
    return target === "reviewed"
      ? { prevOpen, prevReviewed: prevTarget }
      : { prevOpen, prevActioned: prevTarget };
  };

  const logHandled = (report: Report, status: ReportStatus) => {
    if (!admId) return;
    void insertAdmLog({
      admId,
      userId: report.reportedUserId,
      type: "report_handled",
      metadata: { reportId: report.id, status },
    }).catch(() => {});
  };

  const markReviewedMutation = useMutation({
    mutationFn: (report: Report) => updateReportStatus(report.id, "reviewed"),
    onMutate: (report) => moveFromOpen(report, "reviewed"),
    onError: (_err, _report, context) => {
      rollbackReports(context);
      toast({ title: "Erro ao marcar como revisada", variant: "destructive" });
    },
    onSuccess: (_data, report) => {
      invalidateReports();
      logHandled(report, "reviewed");
      toast({ title: "Denúncia marcada como revisada" });
    },
  });

  const markActionedMutation = useMutation({
    mutationFn: (report: Report) => updateReportStatus(report.id, "actioned"),
    onMutate: (report) => moveFromOpen(report, "actioned"),
    onError: (_err, _report, context) => {
      rollbackReports(context);
      toast({ title: "Erro ao marcar como acionada", variant: "destructive" });
    },
    onSuccess: (_data, report) => {
      invalidateReports();
      logHandled(report, "actioned");
      toast({ title: "Denúncia marcada como acionada" });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: (report: Report) => deleteReport(report.id),
    onMutate: async (report) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.reports.all });
      const prevOpen = queryClient.getQueryData<Report[]>(queryKeys.reports.byStatus("open"));
      const prevReviewed = queryClient.getQueryData<Report[]>(queryKeys.reports.byStatus("reviewed"));
      const prevActioned = queryClient.getQueryData<Report[]>(queryKeys.reports.byStatus("actioned"));
      const drop = (list: Report[] | undefined) => (list ?? []).filter((r) => r.id !== report.id);
      queryClient.setQueryData(queryKeys.reports.byStatus("open"), drop(prevOpen));
      queryClient.setQueryData(queryKeys.reports.byStatus("reviewed"), drop(prevReviewed));
      queryClient.setQueryData(queryKeys.reports.byStatus("actioned"), drop(prevActioned));
      return { prevOpen, prevReviewed, prevActioned };
    },
    onError: (_err, _report, context) => {
      rollbackReports(context);
      toast({ title: "Erro ao excluir denúncia", variant: "destructive" });
    },
    onSuccess: () => {
      invalidateReports();
      toast({ title: "Denúncia excluída" });
    },
  });

  return {
    reportsOpen,
    reportsReviewed,
    reportsActioned,
    isLoading,
    error: error as Error | null,
    markReviewedMutation,
    markActionedMutation,
    deleteReportMutation,
  };
}
