import { useState } from "react";
import type { ProfessionalValidationRow } from "./types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, X, FileText, Loader2, Download } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";

type PendingAction = { documentId: string; profileId: string; status: "aprovado" | "rejeitado" };

export interface ValidationsProps {
  validationsPending: ProfessionalValidationRow[];
  validationsApproved: ProfessionalValidationRow[];
  validationsRejected: ProfessionalValidationRow[];
  isLoading: boolean;
  error: Error | null;
  updateStatusMutation: UseMutationResult<void, Error, { documentId: string; profileId: string; status: "aprovado" | "rejeitado" }, unknown>;
  downloadDocument: (storagePath: string, fileName?: string) => Promise<void>;
}

export function Validations({
  validationsPending,
  validationsApproved,
  validationsRejected,
  isLoading,
  error,
  updateStatusMutation,
  downloadDocument,
}: ValidationsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const handleConfirmClick = (action: PendingAction) => {
    setPendingAction(action);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (!pendingAction) return;
    updateStatusMutation.mutate(pendingAction);
    setConfirmOpen(false);
    setPendingAction(null);
  };

  const handleConfirmCancel = () => {
    setConfirmOpen(false);
    setPendingAction(null);
  };

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
        Erro ao carregar validações. Tente novamente.
      </div>
    );
  }

  const renderCard = (val: ProfessionalValidationRow, canApproveReject: boolean) => (
    <Card key={val.id} className="border-border/50">
      <CardContent className="flex items-center justify-between p-5">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium">{val.name}</p>
            <p className="text-sm text-muted-foreground">{val.profession} · {val.document}</p>
            <p className="text-xs text-muted-foreground">{val.email} · {val.createdAt}</p>
            <Button
              size="sm"
              variant="outline"
              className="w-fit"
              disabled={!val.documentUrl}
              onClick={() => val.documentUrl && downloadDocument(val.documentUrl, `documento-${val.name.replace(/\s+/g, "-")}`)}
            >
              <Download className="h-4 w-4 mr-1" /> Baixar
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4 flex-wrap">
          {canApproveReject ? (
            <>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => handleConfirmClick({ documentId: val.documentId, profileId: val.id, status: "aprovado" })}
                disabled={updateStatusMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" /> Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => handleConfirmClick({ documentId: val.documentId, profileId: val.id, status: "rejeitado" })}
                disabled={updateStatusMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" /> Rejeitar
              </Button>
            </>
          ) : (
            <Badge variant={val.status === "aprovado" ? "default" : "destructive"}>
              {val.status}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const listEmpty = (
    <p className="text-sm text-muted-foreground py-6 text-center">Nenhum item nesta lista.</p>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Validação de Profissionais</h1>
        <p className="text-muted-foreground mt-1">Verifique documentos e aprove contas de profissionais</p>
      </div>

      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="aprovados">Aprovados</TabsTrigger>
          <TabsTrigger value="rejeitados">Rejeitados</TabsTrigger>
        </TabsList>
        <TabsContent value="pendentes" className="relative mt-4">
          {updateStatusMutation.isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[1px] min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div className="grid gap-4">
            {validationsPending.length === 0 ? listEmpty : validationsPending.map((val) => renderCard(val, true))}
          </div>
        </TabsContent>
        <TabsContent value="aprovados" className="mt-4">
          <div className="grid gap-4">
            {validationsApproved.length === 0 ? listEmpty : validationsApproved.map((val) => renderCard(val, false))}
          </div>
        </TabsContent>
        <TabsContent value="rejeitados" className="mt-4">
          <div className="grid gap-4">
            {validationsRejected.length === 0 ? listEmpty : validationsRejected.map((val) => renderCard(val, false))}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !open && handleConfirmCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.status === "aprovado" ? "Confirmar aprovação" : "Confirmar rejeição"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.status === "aprovado"
                ? "Tem certeza que deseja aprovar este documento? O profissional será validado."
                : "Tem certeza que deseja rejeitar este documento? O profissional não será validado."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConfirmCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              className={pendingAction?.status === "rejeitado" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            >
              {pendingAction?.status === "aprovado" ? "Aprovar" : "Rejeitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
