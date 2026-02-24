import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPendingVideos, PendingVideo } from "@/data/mock";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";

export function useVideos() {
  const queryClient = useQueryClient();
  const { data: videos = [], isLoading, error } = useQuery({
    queryKey: queryKeys.videos.all,
    queryFn: fetchPendingVideos,
  });
  const { toast } = useToast();

  const updateVideoStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "aprovado" | "rejeitado" }) => {
      await new Promise((r) => setTimeout(r, 200));
      return { id, status };
    },
    onSuccess: ({ id, status }) => {
      queryClient.setQueryData<PendingVideo[]>(queryKeys.videos.all, (prev) =>
        prev ? prev.map((v) => (v.id === id ? { ...v, status } : v)) : []
      );
      toast({ title: status === "aprovado" ? "Vídeo aprovado" : "Vídeo rejeitado" });
    },
  });

  const pending = videos.filter((v) => v.status === "pendente");
  const resolved = videos.filter((v) => v.status !== "pendente");

  return {
    pending,
    resolved,
    isLoading,
    error,
    updateVideoStatusMutation,
  };
}
