import { useState, useEffect } from "react";
import type { MediaVideoWithSignedUrls } from "@/types/media";
import type {
  UpdateVideoStatusParams,
  VideoStatusAction,
  VideoTab,
  TabListState,
} from "./useVideos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Loader2, ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const PLACEHOLDER_THUMB =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect fill='%23e5e7eb' width='400' height='225'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'%3ESem capa%3C/text%3E%3C/svg%3E";

export interface VideosProps {
  activeTab: VideoTab;
  setActiveTab: (tab: VideoTab) => void;
  setPage: (tab: VideoTab, page: number) => void;
  pending: TabListState;
  approved: TabListState;
  rejected: TabListState;
  updateVideoStatusMutation: UseMutationResult<void, Error, UpdateVideoStatusParams, unknown>;
}

type PendingAction = {
  id: string;
  status: VideoStatusAction;
  athleteUserId: string;
  athleteName: string;
} | null;
type PlayingVideo = { signedVideoUrl: string; title: string } | null;

function VideoPreview({
  signedThumbUrl,
  signedVideoUrl,
  title,
  onPlay,
  className,
  size = "default",
}: {
  signedThumbUrl: string | null;
  signedVideoUrl: string | null;
  title: string | null;
  onPlay: () => void;
  className?: string;
  size?: "default" | "sm";
}) {
  const canPlay = !!signedVideoUrl;
  const isSm = size === "sm";
  const hasMediaToLoad = !!(signedThumbUrl || signedVideoUrl);
  const [mediaLoaded, setMediaLoaded] = useState(!hasMediaToLoad);

  useEffect(() => {
    setMediaLoaded(!hasMediaToLoad);
  }, [signedThumbUrl, signedVideoUrl, hasMediaToLoad]);

  return (
    <div
      className={`relative group ${className ?? ""}`}
      onClick={canPlay && mediaLoaded ? onPlay : undefined}
      onKeyDown={canPlay && mediaLoaded ? (e) => e.key === "Enter" && onPlay() : undefined}
      role={canPlay && mediaLoaded ? "button" : undefined}
      tabIndex={canPlay && mediaLoaded ? 0 : undefined}
    >
      {!signedThumbUrl && (
        <img
          src={PLACEHOLDER_THUMB}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
      )}
      {signedThumbUrl ? (
        <img
          src={signedThumbUrl}
          alt={title ?? "Vídeo"}
          className="absolute inset-0 w-full h-full object-cover"
          onLoad={() => setMediaLoaded(true)}
        />
      ) : signedVideoUrl ? (
        <video
          src={signedVideoUrl}
          preload="auto"
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onLoadedData={(e) => {
            const el = e.currentTarget;
            el.currentTime = 0;
            el.pause();
            setMediaLoaded(true);
          }}
          aria-label={title ?? "Vídeo"}
        />
      ) : null}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity ${
          !mediaLoaded ? "bg-muted" : "bg-black/30"
        } ${canPlay && mediaLoaded ? "group-hover:bg-black/40 cursor-pointer" : ""}`}
      >
        {!mediaLoaded ? (
          <Loader2 className={`animate-spin text-muted-foreground ${isSm ? "h-4 w-4" : "h-8 w-8"}`} />
        ) : (
          <div
            className={`rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center ${isSm ? "p-1.5" : "p-3"} ${canPlay ? "group-hover:bg-white/40 group-hover:scale-110 transition-transform" : "opacity-80"}`}
          >
            <Play className={`text-foreground fill-foreground ml-0.5 ${isSm ? "h-4 w-4" : "h-8 w-8"}`} />
          </div>
        )}
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

export function Videos({
  activeTab,
  setActiveTab,
  setPage,
  pending,
  approved,
  rejected,
  updateVideoStatusMutation,
}: VideosProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [playingVideo, setPlayingVideo] = useState<PlayingVideo>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vídeos em Análise</h1>
        <p className="text-muted-foreground mt-1">Analise e aprove vídeos dos atletas</p>
      </div>

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
                            })
                          }
                          disabled={updateVideoStatusMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
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
                      <Badge variant="default">Aprovado</Badge>
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
                      <Badge variant="destructive">Rejeitado</Badge>
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

      <Dialog open={!!playingVideo} onOpenChange={(open) => !open && setPlayingVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {playingVideo && (
            <video
              src={playingVideo.signedVideoUrl}
              controls
              autoPlay
              className="w-full aspect-video bg-black"
            />
          )}
        </DialogContent>
      </Dialog>

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
          updateVideoStatusMutation.mutate(
            {
              id: pendingAction.id,
              status: pendingAction.status,
              athleteUserId: pendingAction.athleteUserId,
              pendingPage: pending.page,
              video: pending.items.find((v) => v.id === pendingAction.id),
            },
            { onSuccess: () => setPendingAction(null) }
          );
        }}
      />
    </div>
  );
}
