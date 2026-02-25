import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReports, updateReportStatus, deleteReport } from "@/processes/reports";
import type { Report } from "@/types/report";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";

export function useReports() {
  const queryClient = useQueryClient();
  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: queryKeys.reports.all,
    queryFn: fetchReports,
  });
  const { toast } = useToast();

  const invalidateReports = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });

  const removeContentMutation = useMutation({
    mutationFn: (id: string) =>
      updateReportStatus(id, "conteudo_removido"),
    onSuccess: () => {
      invalidateReports();
      toast({ title: "Conteúdo removido" });
    },
  });

  const removeReportMutation = useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      invalidateReports();
      toast({ title: "Denúncia removida" });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: (id: string) =>
      updateReportStatus(id, "usuario_bloqueado"),
    onSuccess: () => {
      invalidateReports();
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
