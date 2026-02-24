import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReports, Report } from "@/data/mock";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";

export function useReports() {
  const queryClient = useQueryClient();
  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: queryKeys.reports.all,
    queryFn: fetchReports,
  });
  const { toast } = useToast();

  const removeContentMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 200));
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Report[]>(queryKeys.reports.all, (prev) =>
        prev ? prev.map((rep) => (rep.id === id ? { ...rep, status: "resolvido" as const } : rep)) : []
      );
      toast({ title: "Conteúdo removido" });
    },
  });

  const removeReportMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 200));
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Report[]>(queryKeys.reports.all, (prev) =>
        prev ? prev.filter((rep) => rep.id !== id) : []
      );
      toast({ title: "Denúncia removida" });
    },
  });

  const blockUser = (name: string) => {
    toast({ title: `Usuário ${name} bloqueado` });
  };

  return {
    reports,
    isLoading,
    error,
    removeContentMutation,
    removeReportMutation,
    blockUser,
  };
}
