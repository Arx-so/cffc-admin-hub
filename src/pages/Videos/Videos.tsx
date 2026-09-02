import { useState } from "react";
import type { MediaVideoWithSignedUrls } from "@/types/media";
import type {
  UpdateVideoStatusParams,
  DeleteVideoParams,
  VideoStatusAction,
  VideoTab,
  TabListState,
} from "./useVideos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { VideoPreview } from "@/components/VideoPreview";
import { VideoPlayerDialog, type PlayingVideo } from "@/components/VideoPlayerDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Loader2, ChevronLeft, ChevronRight, AlertTriangle, Trash2 } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface VideosProps {
  activeTab: VideoTab;
  setActiveTab: (tab: VideoTab) => void;
  setPage: (tab: VideoTab, page: number) => void;
  pending: TabListState;
  approved: TabListState;
  rejected: TabListState;
  updateVideoStatusMutation: UseMutationResult<void, Error, UpdateVideoStatusParams, unknown>;
  deleteVideoMutation: UseMutationResult<void, Error, DeleteVideoParams, unknown>;
  autoModerationEnabled: boolean;
  isModerationSettingsLoading: boolean;
  toggleAutoModerationMutation: UseMutationResult<boolean, Error, boolean, unknown>;
}

type PendingAction = {
  id: string;
  status: VideoStatusAction;
  athleteUserId: string;
  athleteName: string;
  sourceTab: VideoTab;
  sourcePage: number;
} | null;
type PendingDelete = {
  id: string;
  url: string;
  thumbUrl: string | null;
  athleteUserId: string;
  athleteName: string;
  tab: VideoTab;
  page: number;
} | null;

function AutoFlagsNotice({ video }: { video: MediaVideoWithSignedUrls }) {
  if (video.auto_status !== "flagged" || video.auto_flags.length === 0) return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning-foreground">
      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-warning" />
      <div className="space-y-0.5">
        <p className="font-medium">Sinalizado automaticamente:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          {video.auto_flags.map((flag) => (
            <li key={flag.code}>{flag.message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PaginationBar({
  tab,
  page,
  totalCount,
  totalPages,
  pageSize,
  onPageChange,
}: {
  tab: VideoTab;
  page: number;
  totalCount: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (tab: VideoTab, page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border rounded-lg px-4 py-2">
      <p className="text-sm text-muted-foreground">
        {totalCount === 0
          ? "0"
          : `${page * pageSize + 1}-${Math.min((page + 1) * pageSize, totalCount)}`}{" "}
        de {totalCount}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(tab, page - 1)}
          disabled={page <= 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(tab, page + 1)}
          disabled={page >= totalPages - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DeleteButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      className="text-destructive hover:bg-destructive/10"
      onClick={onClick}
      disabled={disabled}
      title="Excluir vídeo"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

export function Videos({
  activeTab,
  setActiveTab,
  setPage,
  pending,
  approved,
  rejected,
  updateVideoStatusMutation,
  deleteVideoMutation,
  autoModerationEnabled,
  isModerationSettingsLoading,
  toggleAutoModerationMutation,
}: VideosProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [playingVideo, setPlayingVideo] = useState<PlayingVideo | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vídeos em Análise</h1>
          <p className="text-muted-foreground mt-1">Analise e aprove vídeos dos atletas</p>
        </div>
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
          <Switch
            id="auto-moderation-toggle"
            checked={autoModerationEnabled}
            onCheckedChange={(checked) => toggleAutoModerationMutation.mutate(checked)}
            disabled={isModerationSettingsLoading || toggleAutoModerationMutation.isPending}
          />
          <Label htmlFor="auto-moderation-toggle" className="cursor-pointer">
            Moderação automática {autoModerationEnabled ? "ativada" : "desativada"}
          </Label>
        </div>
      </div>
      {!autoModerationEnabled && (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
          <p>
            A moderação automática está desativada: todo vídeo novo é aprovado e publicado
            imediatamente, sem nenhuma checagem.
          </p>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as VideoTab)}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pending.isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {pending.error && (
            <p className="text-center py-12 text-destructive">Erro ao carregar vídeos. Tente novamente.</p>
          )}
          {!pending.isLoading && !pending.error && pending.items.length === 0 && (
            <p className="text-muted-foreground text-center py-12">Nenhum vídeo pendente</p>
          )}
          {!pending.isLoading && !pending.error && pending.items.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pending.items.map((video) => (
                  <Card key={video.id} className="overflow-hidden border-border/50">
                    <div className="aspect-video relative bg-muted overflow-hidden">
                      <VideoPreview
                        signedThumbUrl={video.signedThumbUrl}
                        signedVideoUrl={video.signedVideoUrl}
                        title={video.title}
                        onPlay={() =>
                          video.signedVideoUrl &&
                          setPlayingVideo({
                            signedVideoUrl: video.signedVideoUrl,
                            title: video.title ?? "Vídeo",
                          })
                        }
                        className="w-full h-full"
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="font-medium">{video.title ?? "Sem título"}</p>
                        <p className="text-sm text-muted-foreground">
                          {video.athleteName} · {formatDate(video.created_at)}
                        </p>
                      </div>
                      <AutoFlagsNotice video={video} />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                          onClick={() =>
                            setPendingAction({
                              id: video.id,
                              status: "aprovado",
                              athleteUserId: video.athlete_user_id,
                              athleteName: video.athleteName,
                              sourceTab: "pending",
                              sourcePage: pending.page,
                            })
                          }
                          disabled={updateVideoStatusMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setPendingAction({
                              id: video.id,
                              status: "rejeitado",
                              athleteUserId: video.athlete_user_id,
                              athleteName: video.athleteName,
                              sourceTab: "pending",
                              sourcePage: pending.page,
                            })
                          }
                          disabled={updateVideoStatusMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                        <DeleteButton
                          onClick={() =>
                            setPendingDelete({
                              id: video.id,
                              url: video.url,
                              thumbUrl: video.thumb_url,
                              athleteUserId: video.athlete_user_id,
                              athleteName: video.athleteName,
                              tab: "pending",
                              page: pending.page,
                            })
                          }
                          disabled={deleteVideoMutation.isPending}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <PaginationBar
                tab="pending"
                page={pending.page}
                totalCount={pending.totalCount}
                totalPages={pending.totalPages}
                pageSize={pending.pageSize}
                onPageChange={setPage}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-4">
          {approved.isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {approved.error && (
            <p className="text-center py-12 text-destructive">Erro ao carregar vídeos. Tente novamente.</p>
          )}
          {!approved.isLoading && !approved.error && approved.items.length === 0 && (
            <p className="text-muted-foreground text-center py-12">Nenhum vídeo aprovado</p>
          )}
          {!approved.isLoading && !approved.error && approved.items.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {approved.items.map((video) => (
                  <Card key={video.id} className="overflow-hidden border-border/50">
                    <div className="aspect-video relative bg-muted overflow-hidden">
                      <VideoPreview
                        signedThumbUrl={video.signedThumbUrl}
                        signedVideoUrl={video.signedVideoUrl}
                        title={video.title}
                        onPlay={() =>
                          video.signedVideoUrl &&
                          setPlayingVideo({
                            signedVideoUrl: video.signedVideoUrl,
                            title: video.title ?? "Vídeo",
                          })
                        }
                        className="w-full h-full"
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="font-medium">{video.title ?? "Sem título"}</p>
                        <p className="text-sm text-muted-foreground">
                          {video.athleteName} · {formatDate(video.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-2">
                          <Badge variant="default">Aprovado</Badge>
                          {video.auto_status === "approved" && (
                            <Badge variant="outline">Automático</Badge>
                          )}
                          {video.auto_status === "skipped" && (
                            <Badge variant="outline">Sem checagem (moderação desativada)</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              setPendingAction({
                                id: video.id,
                                status: "rejeitado",
                                athleteUserId: video.athlete_user_id,
                                athleteName: video.athleteName,
                                sourceTab: "approved",
                                sourcePage: approved.page,
                              })
                            }
                            disabled={updateVideoStatusMutation.isPending}
                            title="Desaprovar vídeo"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <DeleteButton
                            onClick={() =>
                              setPendingDelete({
                                id: video.id,
                                url: video.url,
                                thumbUrl: video.thumb_url,
                                athleteUserId: video.athlete_user_id,
                                athleteName: video.athleteName,
                                tab: "approved",
                                page: approved.page,
                              })
                            }
                            disabled={deleteVideoMutation.isPending}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <PaginationBar
                tab="approved"
                page={approved.page}
                totalCount={approved.totalCount}
                totalPages={approved.totalPages}
                pageSize={approved.pageSize}
                onPageChange={setPage}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-4">
          {rejected.isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {rejected.error && (
            <p className="text-center py-12 text-destructive">Erro ao carregar vídeos. Tente novamente.</p>
          )}
          {!rejected.isLoading && !rejected.error && rejected.items.length === 0 && (
            <p className="text-muted-foreground text-center py-12">Nenhum vídeo rejeitado</p>
          )}
          {!rejected.isLoading && !rejected.error && rejected.items.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rejected.items.map((video) => (
                  <Card key={video.id} className="overflow-hidden border-border/50">
                    <div className="aspect-video relative bg-muted overflow-hidden">
                      <VideoPreview
                        signedThumbUrl={video.signedThumbUrl}
                        signedVideoUrl={video.signedVideoUrl}
                        title={video.title}
                        onPlay={() =>
                          video.signedVideoUrl &&
                          setPlayingVideo({
                            signedVideoUrl: video.signedVideoUrl,
                            title: video.title ?? "Vídeo",
                          })
                        }
                        className="w-full h-full"
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="font-medium">{video.title ?? "Sem título"}</p>
                        <p className="text-sm text-muted-foreground">
                          {video.athleteName} · {formatDate(video.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="destructive">Rejeitado</Badge>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90 text-success-foreground"
                            onClick={() =>
                              setPendingAction({
                                id: video.id,
                                status: "aprovado",
                                athleteUserId: video.athlete_user_id,
                                athleteName: video.athleteName,
                                sourceTab: "rejected",
                                sourcePage: rejected.page,
                              })
                            }
                            disabled={updateVideoStatusMutation.isPending}
                            title="Aprovar vídeo"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <DeleteButton
                            onClick={() =>
                              setPendingDelete({
                                id: video.id,
                                url: video.url,
                                thumbUrl: video.thumb_url,
                                athleteUserId: video.athlete_user_id,
                                athleteName: video.athleteName,
                                tab: "rejected",
                                page: rejected.page,
                              })
                            }
                            disabled={deleteVideoMutation.isPending}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <PaginationBar
                tab="rejected"
                page={rejected.page}
                totalCount={rejected.totalCount}
                totalPages={rejected.totalPages}
                pageSize={rejected.pageSize}
                onPageChange={setPage}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      <VideoPlayerDialog
        video={playingVideo}
        onOpenChange={(open) => !open && setPlayingVideo(null)}
      />

      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction?.status === "aprovado" ? "Aprovar vídeo?" : "Rejeitar vídeo?"}
        subtitle={
          pendingAction
            ? pendingAction.status === "aprovado"
              ? `Tem certeza que deseja aprovar o vídeo de ${pendingAction.athleteName}? Esta ação não pode ser desfeita.`
              : `Tem certeza que deseja rejeitar o vídeo de ${pendingAction.athleteName}? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel={pendingAction?.status === "aprovado" ? "Aprovar" : "Rejeitar"}
        cancelLabel="Cancelar"
        variant={pendingAction?.status === "rejeitado" ? "destructive" : "success"}
        loading={updateVideoStatusMutation.isPending}
        onConfirm={() => {
          if (!pendingAction) return;
          const sourceItems =
            pendingAction.sourceTab === "pending"
              ? pending.items
              : pendingAction.sourceTab === "approved"
                ? approved.items
                : rejected.items;
          updateVideoStatusMutation.mutate(
            {
              id: pendingAction.id,
              status: pendingAction.status,
              athleteUserId: pendingAction.athleteUserId,
              sourceTab: pendingAction.sourceTab,
              sourcePage: pendingAction.sourcePage,
              video: sourceItems.find((v) => v.id === pendingAction.id),
            },
            { onSuccess: () => setPendingAction(null) }
          );
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Excluir vídeo?"
        subtitle={
          pendingDelete
            ? `Tem certeza que deseja excluir o vídeo de ${pendingDelete.athleteName}? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={deleteVideoMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteVideoMutation.mutate(pendingDelete, { onSuccess: () => setPendingDelete(null) });
        }}
      />
    </div>
  );
}
