import type { Report } from "@/types/report";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Ban, XCircle, Loader2 } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";

const statusColors: Record<Report["status"], string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  content_removed: "bg-success/15 text-success border-success/30",
  user_blocked: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabels: Record<Report["status"], string> = {
  pending: "Pendente",
  content_removed: "Conteúdo removido",
  user_blocked: "Usuário bloqueado",
  rejected: "Rejeitada",
};

const typeLabels: Record<Report["type"], string> = {
  video: "Vídeo",
  profile: "Perfil",
  validation: "Validação",
};

export interface ReportsProps {
  reportsPending: Report[];
  reportsContentRemoved: Report[];
  reportsUserBlocked: Report[];
  reportsRejected: Report[];
  isLoading: boolean;
  error: Error | null;
  removeContentMutation: UseMutationResult<void, Error, Report, unknown>;
  removeReportMutation: UseMutationResult<void, Error, Report, unknown>;
  blockUserMutation: UseMutationResult<void, Error, Report, unknown>;
}

const listEmpty = (
  <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma denúncia nesta lista.</p>
);

function ReportCard({
  report,
  canAct,
  removeContentMutation,
  removeReportMutation,
  blockUserMutation,
}: {
  report: Report;
  canAct: boolean;
  removeContentMutation: ReportsProps["removeContentMutation"];
  removeReportMutation: ReportsProps["removeReportMutation"];
  blockUserMutation: ReportsProps["blockUserMutation"];
}) {
  return (
    <Card key={report.id} className="border-border/50">
      <CardContent className="flex items-center justify-between p-5">
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs font-medium">
              {typeLabels[report.type]}
            </Badge>
            <Badge variant="outline" className={statusColors[report.status]}>
              {statusLabels[report.status]}
            </Badge>
          </div>
          <p className="font-medium">{report.reason}</p>
          <p className="text-sm text-muted-foreground">
            Denunciado: <span className="text-foreground">{report.reportedUser}</span> · por{" "}
            {report.reportedBy} · {report.createdAt}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {canAct && report.status === "pending" && (
            <>
              {report.type !== "profile" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeContentMutation.mutate(report)}
                  disabled={removeContentMutation.isPending}
                  title="Remover conteúdo"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeReportMutation.mutate(report)}
                disabled={removeReportMutation.isPending}
                title="Remover denúncia"
              >
                <XCircle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => blockUserMutation.mutate(report)}
                disabled={blockUserMutation.isPending}
                title="Bloquear usuário"
              >
                <Ban className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function Reports({
  reportsPending,
  reportsContentRemoved,
  reportsUserBlocked,
  reportsRejected,
  isLoading,
  error,
  removeContentMutation,
  removeReportMutation,
  blockUserMutation,
}: ReportsProps) {
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
        Erro ao carregar denúncias. Tente novamente.
      </div>
    );
  }

  const renderList = (reports: Report[], canAct: boolean) =>
    reports.length === 0
      ? listEmpty
      : reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            canAct={canAct}
            removeContentMutation={removeContentMutation}
            removeReportMutation={removeReportMutation}
            blockUserMutation={blockUserMutation}
          />
        ));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Denúncias</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie denúncias de conteúdo e usuários
        </p>
      </div>

      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="conteudo_removido">Conteúdo removido</TabsTrigger>
          <TabsTrigger value="usuario_bloqueado">Usuário bloqueado</TabsTrigger>
          <TabsTrigger value="rejeitadas">Rejeitadas</TabsTrigger>
        </TabsList>
        <TabsContent value="pendentes" className="relative mt-4">
          {removeContentMutation.isPending ||
          removeReportMutation.isPending ||
          blockUserMutation.isPending ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[1px] min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : null}
          <div className="grid gap-4">
            {renderList(reportsPending, true)}
          </div>
        </TabsContent>
        <TabsContent value="conteudo_removido" className="mt-4">
          <div className="grid gap-4">{renderList(reportsContentRemoved, false)}</div>
        </TabsContent>
        <TabsContent value="usuario_bloqueado" className="mt-4">
          <div className="grid gap-4">{renderList(reportsUserBlocked, false)}</div>
        </TabsContent>
        <TabsContent value="rejeitadas" className="mt-4">
          <div className="grid gap-4">{renderList(reportsRejected, false)}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
