import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchVideoMediaByStatus,
  updateMediaStatus,
  deleteMedia,
  type FetchVideoMediaResult,
} from "@/processes/media";
import { fetchModerationSettings, updateAutoModerationEnabled } from "@/processes/moderationSettings";
import { insertAdmLog } from "@/processes/admLogs";
import type { MediaVideoWithSignedUrls } from "@/types/media";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores";

const PAGE_SIZE = 20;

export type VideoTab = "pending" | "approved" | "rejected";

export type VideoStatusAction = "aprovado" | "rejeitado";

export interface DeleteVideoParams {
  id: string;
  url: string;
  thumbUrl: string | null;
  athleteUserId: string;
  tab: VideoTab;
  page: number;
}

export interface UpdateVideoStatusParams {
  id: string;
  status: VideoStatusAction;
  athleteUserId: string;
  /** Aba de onde a ação partiu (para atualizar o cache correto) */
  sourceTab: VideoTab;
  /** Página atual da aba de origem */
  sourcePage: number;
  /** Vídeo completo para adicionar à lista de destino no cache */
  video?: MediaVideoWithSignedUrls;
}

function statusToDb(status: VideoStatusAction): "approved" | "rejected" {
  return status === "aprovado" ? "approved" : "rejected";
}

export interface TabListState {
  items: MediaVideoWithSignedUrls[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  totalCount: number;
  totalPages: number;
  pageSize: number;
}

export function useVideos() {
  const queryClient = useQueryClient();
  const admId = useAuthStore((s) => s.user?.id);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<VideoTab>("pending");
  const [pages, setPages] = useState<Record<VideoTab, number>>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const setPage = (tab: VideoTab, page: number) => {
    setPages((prev) => ({ ...prev, [tab]: page }));
  };

  const pendingQuery = useQuery({
    queryKey: queryKeys.videos.listByStatus("pending", pages.pending, PAGE_SIZE),
    queryFn: () => fetchVideoMediaByStatus(pages.pending, PAGE_SIZE, "pending"),
    enabled: activeTab === "pending",
  });

  const approvedQuery = useQuery({
    queryKey: queryKeys.videos.listByStatus("approved", pages.approved, PAGE_SIZE),
    queryFn: () => fetchVideoMediaByStatus(pages.approved, PAGE_SIZE, "approved"),
    enabled: activeTab === "approved",
  });

  const rejectedQuery = useQuery({
    queryKey: queryKeys.videos.listByStatus("rejected", pages.rejected, PAGE_SIZE),
    queryFn: () => fetchVideoMediaByStatus(pages.rejected, PAGE_SIZE, "rejected"),
    enabled: activeTab === "rejected",
  });

  const toTabState = (
    data: FetchVideoMediaResult | undefined,
    isLoading: boolean,
    error: Error | null,
    page: number
  ): TabListState => {
    const items = data?.items ?? [];
    const totalCount = data?.totalCount ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    return {
      items,
      isLoading,
      error,
      page,
      totalCount,
      totalPages,
      pageSize: PAGE_SIZE,
    };
  };

  const pending = toTabState(
    pendingQuery.data,
    pendingQuery.isLoading,
    pendingQuery.error as Error | null,
    pages.pending
  );
  const approved = toTabState(
    approvedQuery.data,
    approvedQuery.isLoading,
    approvedQuery.error as Error | null,
    pages.approved
  );
  const rejected = toTabState(
    rejectedQuery.data,
    rejectedQuery.isLoading,
    rejectedQuery.error as Error | null,
    pages.rejected
  );

  const updateVideoStatusMutation = useMutation({
    mutationFn: async ({ id, status, athleteUserId }: UpdateVideoStatusParams) => {
      await updateMediaStatus(id, statusToDb(status));
      return { id, status, athleteUserId };
    },
    onSuccess: (
      _,
      { id, status, athleteUserId, sourceTab, sourcePage, video: videoItem }
    ) => {
      const targetStatus: "approved" | "rejected" = statusToDb(status);
      queryClient.setQueryData<FetchVideoMediaResult>(
        queryKeys.videos.listByStatus(sourceTab, sourcePage, PAGE_SIZE),
        (old) => {
          if (!old) return old;
          return {
            items: old.items.filter((v) => v.id !== id),
            totalCount: Math.max(0, old.totalCount - 1),
          };
        }
      );
      if (videoItem) {
        const resolvedItem: MediaVideoWithSignedUrls = {
          ...videoItem,
          status: targetStatus,
        };
        const key = queryKeys.videos.listByStatus(targetStatus, 0, PAGE_SIZE);
        queryClient.setQueryData<FetchVideoMediaResult>(key, (old) => {
          const list = old?.items ?? [];
          return {
            items: [resolvedItem, ...list],
            totalCount: (old?.totalCount ?? 0) + 1,
          };
        });
      }
      if (admId) {
        insertAdmLog({
          admId,
          userId: athleteUserId,
          type: status === "aprovado" ? "media_approved" : "media_rejected",
          metadata: { mediaId: id },
        });
      }
      toast({ title: status === "aprovado" ? "Vídeo aprovado" : "Vídeo rejeitado" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar vídeo", description: err.message, variant: "destructive" });
    },
  });

  const moderationSettingsQuery = useQuery({
    queryKey: queryKeys.moderationSettings,
    queryFn: fetchModerationSettings,
  });

  const toggleAutoModerationMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!admId) throw new Error("Usuário não autenticado");
      await updateAutoModerationEnabled(enabled, admId);
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.moderationSettings });
      if (admId) {
        insertAdmLog({
          admId,
          type: "moderation_settings_updated",
          metadata: { autoModerationEnabled: enabled },
        });
      }
      toast({
        title: enabled ? "Moderação automática ativada" : "Moderação automática desativada",
        description: enabled
          ? "Novos vídeos voltarão a passar pelas checagens automáticas."
          : "Novos vídeos serão aprovados automaticamente, sem checagens.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar moderação automática", description: err.message, variant: "destructive" });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (params: DeleteVideoParams) => {
      await deleteMedia({ id: params.id, url: params.url, thumbUrl: params.thumbUrl });
      return params;
    },
    onSuccess: ({ id, tab, page, athleteUserId }) => {
      queryClient.setQueryData<FetchVideoMediaResult>(
        queryKeys.videos.listByStatus(tab, page, PAGE_SIZE),
        (old) => {
          if (!old) return old;
          return {
            items: old.items.filter((v) => v.id !== id),
            totalCount: Math.max(0, old.totalCount - 1),
          };
        }
      );
      if (admId) {
        insertAdmLog({
          admId,
          userId: athleteUserId,
          type: "media_deleted",
          metadata: { mediaId: id },
        });
      }
      toast({ title: "Vídeo excluído" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao excluir vídeo", description: err.message, variant: "destructive" });
    },
  });

  return {
    activeTab,
    setActiveTab,
    setPage,
    pending,
    approved,
    rejected,
    updateVideoStatusMutation,
    deleteVideoMutation,
    autoModerationEnabled: moderationSettingsQuery.data?.autoModerationEnabled ?? true,
    isModerationSettingsLoading: moderationSettingsQuery.isLoading,
    toggleAutoModerationMutation,
  };
}
