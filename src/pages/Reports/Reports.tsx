import type { Report } from "@/types/report";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Check, Gavel, Loader2 } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";

const statusColors: Record<Report["status"], string> = {
  open: "bg-warning/15 text-warning border-warning/30",
  reviewed: "bg-muted text-muted-foreground border-border",
  actioned: "bg-success/15 text-success border-success/30",
};

const statusLabels: Record<Report["status"], string> = {
  open: "Aberta",
  reviewed: "Revisada",
  actioned: "Acionada",
};

const reasonLabels: Record<Report["reason"], string> = {
  spam: "Spam",
  nudity_or_violence: "Nudez ou violência",
  harassment_or_bullying: "Assédio ou bullying",
  fake_profile: "Perfil falso",
  other: "Outro",
};

export interface ReportsProps {
  reportsOpen: Report[];
  reportsReviewed: Report[];
  reportsActioned: Report[];
  isLoading: boolean;
  error: Error | null;
  markReviewedMutation: UseMutationResult<void, Error, Report, unknown>;
  markActionedMutation: UseMutationResult<void, Error, Report, unknown>;
  deleteReportMutation: UseMutationResult<void, Error, Report, unknown>;
}

const listEmpty = (
  <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma denúncia nesta lista.</p>
);

function ReportCard({
  report,
  canAct,
  markReviewedMutation,
  markActionedMutation,
  deleteReportMutation,
}: {
  report: Report;
  canAct: boolean;
  markReviewedMutation: ReportsProps["markReviewedMutation"];
  markActionedMutation: ReportsProps["markActionedMutation"];
  deleteReportMutation: ReportsProps["deleteReportMutation"];
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="flex items-center justify-between p-5">
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs font-medium">
              {report.hasMedia ? "Vídeo" : "Perfil"}
            </Badge>
            <Badge variant="outline" className={statusColors[report.status]}>
              {statusLabels[report.status]}
            </Badge>
          </div>
          <p className="font-medium">{reasonLabels[report.reason]}</p>
          {report.details && (
            <p className="text-sm text-muted-foreground">{report.details}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Denunciado: <span className="text-foreground">{report.reportedUser}</span>
            {report.mediaTitle ? ` · ${report.mediaTitle}` : ""} · por {report.reportedBy} ·{" "}
            {report.createdAt}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {canAct && report.status === "open" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => markReviewedMutation.mutate(report)}
                disabled={markReviewedMutation.isPending}
                title="Marcar como revisada"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => markActionedMutation.mutate(report)}
                disabled={markActionedMutation.isPending}
                title="Marcar como acionada"
              >
                <Gavel className="h-4 w-4" />
              </Button>
            </>
          )}
          {canAct && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => deleteReportMutation.mutate(report)}
              disabled={deleteReportMutation.isPending}
              title="Excluir denúncia"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function Reports({
  reportsOpen,
  reportsReviewed,
  reportsActioned,
  isLoading,
  error,
  markReviewedMutation,
  markActionedMutation,
  deleteReportMutation,
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

  const isMutating =
    markReviewedMutation.isPending ||
    markActionedMutation.isPending ||
    deleteReportMutation.isPending;

  const renderList = (reports: Report[], canAct: boolean) =>
    reports.length === 0
      ? listEmpty
      : reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            canAct={canAct}
            markReviewedMutation={markReviewedMutation}
            markActionedMutation={markActionedMutation}
            deleteReportMutation={deleteReportMutation}
          />
        ));

  const renderTab = (reports: Report[], canAct: boolean) => (
    <div className="relative mt-4">
      {isMutating ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[1px] min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : null}
      <div className="grid gap-4">{renderList(reports, canAct)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Denúncias</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie denúncias de conteúdo e usuários
        </p>
      </div>

      <Tabs defaultValue="abertas" className="w-full">
        <TabsList>
          <TabsTrigger value="abertas">Abertas</TabsTrigger>
          <TabsTrigger value="revisadas">Revisadas</TabsTrigger>
          <TabsTrigger value="acionadas">Acionadas</TabsTrigger>
        </TabsList>
        <TabsContent value="abertas">{renderTab(reportsOpen, true)}</TabsContent>
        <TabsContent value="revisadas">{renderTab(reportsReviewed, true)}</TabsContent>
        <TabsContent value="acionadas">{renderTab(reportsActioned, true)}</TabsContent>
      </Tabs>
    </div>
  );
}
