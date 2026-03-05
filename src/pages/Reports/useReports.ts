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

  type ReportsCache = {
    prevPending?: Report[];
    prevContentRemoved?: Report[];
    prevUserBlocked?: Report[];
    prevRejected?: Report[];
  };

  const rollbackReports = (ctx: ReportsCache | undefined) => {
    if (!ctx) return;
    if (ctx.prevPending !== undefined)
      queryClient.setQueryData(queryKeys.reports.byStatus("pending"), ctx.prevPending);
    if (ctx.prevContentRemoved !== undefined)
      queryClient.setQueryData(queryKeys.reports.byStatus("content_removed"), ctx.prevContentRemoved);
    if (ctx.prevUserBlocked !== undefined)
      queryClient.setQueryData(queryKeys.reports.byStatus("user_blocked"), ctx.prevUserBlocked);
    if (ctx.prevRejected !== undefined)
      queryClient.setQueryData(queryKeys.reports.byStatus("rejected"), ctx.prevRejected);
  };

  const removeContentMutation = useMutation({
    mutationFn: (report: Report) =>
      updateReportStatus(report.id, "content_removed"),
    onMutate: async (report) => {
      await queryClient.cancelQueries({ queryKey: ["reports"] });
      const prevPending = queryClient.getQueryData<Report[]>(queryKeys.reports.byStatus("pending"));
      const prevContentRemoved = queryClient.getQueryData<Report[]>(
        queryKeys.reports.byStatus("content_removed")
      );
      const moved = { ...report, status: "content_removed" as const };
      queryClient.setQueryData(
        queryKeys.reports.byStatus("pending"),
        (prevPending ?? []).filter((r) => r.id !== report.id)
      );
      queryClient.setQueryData(
        queryKeys.reports.byStatus("content_removed"),
        [moved, ...(prevContentRemoved ?? [])]
      );
      return { prevPending, prevContentRemoved };
    },
    onError: (_err, _report, context) => {
      rollbackReports(context);
      toast({ title: "Erro ao remover conteúdo", variant: "destructive" });
    },
    onSuccess: (_data, report) => {
      invalidateReports();
      if (admId)
        void insertAdmLog({
          admId,
          userId: report.targetUserId,
          type: "report_handled",
          metadata: { reportId: report.id, status: "content_removed" },
        }).catch(() => {});
      toast({ title: "Conteúdo removido" });
    },
  });

  const removeReportMutation = useMutation({
    mutationFn: (report: Report) => deleteReport(report.id),
    onMutate: async (report) => {
      await queryClient.cancelQueries({ queryKey: ["reports"] });
      const prevPending = queryClient.getQueryData<Report[]>(queryKeys.reports.byStatus("pending"));
      const prevRejected = queryClient.getQueryData<Report[]>(queryKeys.reports.byStatus("rejected"));
      const moved = { ...report, status: "rejected" as const };
      queryClient.setQueryData(
        queryKeys.reports.byStatus("pending"),
        (prevPending ?? []).filter((r) => r.id !== report.id)
      );
      queryClient.setQueryData(
        queryKeys.reports.byStatus("rejected"),
        [moved, ...(prevRejected ?? [])]
      );
      return { prevPending, prevRejected };
    },
    onError: (_err, _report, context) => {
      rollbackReports(context);
      toast({ title: "Erro ao remover denúncia", variant: "destructive" });
    },
    onSuccess: (_data, report) => {
      invalidateReports();
      if (admId)
        void insertAdmLog({
          admId,
          userId: report.targetUserId,
          type: "report_handled",
          metadata: { reportId: report.id, status: "rejected" },
        }).catch(() => {});
      toast({ title: "Denúncia removida" });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: (report: Report) =>
      updateReportStatus(report.id, "user_blocked"),
    onMutate: async (report) => {
      await queryClient.cancelQueries({ queryKey: ["reports"] });
      const prevPending = queryClient.getQueryData<Report[]>(queryKeys.reports.byStatus("pending"));
      const prevUserBlocked = queryClient.getQueryData<Report[]>(
        queryKeys.reports.byStatus("user_blocked")
      );
      const moved = { ...report, status: "user_blocked" as const };
      queryClient.setQueryData(
        queryKeys.reports.byStatus("pending"),
        (prevPending ?? []).filter((r) => r.id !== report.id)
      );
      queryClient.setQueryData(
        queryKeys.reports.byStatus("user_blocked"),
        [moved, ...(prevUserBlocked ?? [])]
      );
      return { prevPending, prevUserBlocked };
    },
    onError: (_err, _report, context) => {
      rollbackReports(context);
      toast({ title: "Erro ao bloquear usuário", variant: "destructive" });
    },
    onSuccess: (_data, report) => {
      invalidateReports();
      if (admId)
        void insertAdmLog({
          admId,
          userId: report.targetUserId,
          type: "report_handled",
          metadata: { reportId: report.id, status: "user_blocked" },
        }).catch(() => {});
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
