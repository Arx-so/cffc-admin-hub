import type { PendingVideo } from "@/data/mock";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";

export interface VideosProps {
  pending: PendingVideo[];
  resolved: PendingVideo[];
  isLoading: boolean;
  error: Error | null;
  updateVideoStatusMutation: UseMutationResult<void, Error, { id: string; status: "aprovado" | "rejeitado" }, unknown>;
}

export function Videos({
  pending,
  resolved,
  isLoading,
  error,
  updateVideoStatusMutation,
}: VideosProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Erro ao carregar vídeos. Tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vídeos em Análise</h1>
        <p className="text-muted-foreground mt-1">Analise e aprove vídeos dos atletas</p>
      </div>

      {pending.length === 0 && (
        <p className="text-muted-foreground text-center py-12">Nenhum vídeo pendente</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pending.map((video) => (
          <Card key={video.id} className="overflow-hidden border-border/50">
            <div className="aspect-video relative">
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="font-medium">{video.title}</p>
                <p className="text-sm text-muted-foreground">{video.athleteName} · {video.uploadedAt}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                  onClick={() => updateVideoStatusMutation.mutate({ id: video.id, status: "aprovado" })}
                  disabled={updateVideoStatusMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" /> Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-destructive hover:bg-destructive/10"
                  onClick={() => updateVideoStatusMutation.mutate({ id: video.id, status: "rejeitado" })}
                  disabled={updateVideoStatusMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" /> Rejeitar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Resolvidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resolved.map((video) => (
              <Card key={video.id} className="border-border/50 opacity-60">
                <CardContent className="flex items-center gap-4 p-4">
                  <img src={video.thumbnail} alt={video.title} className="w-20 h-14 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{video.title}</p>
                    <p className="text-xs text-muted-foreground">{video.athleteName}</p>
                  </div>
                  <Badge variant={video.status === "aprovado" ? "default" : "destructive"}>
                    {video.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
