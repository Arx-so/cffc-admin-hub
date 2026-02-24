import { useState } from "react";
import { mockReports, Report } from "@/data/mock";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Ban, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<Report["status"], string> = {
  pendente: "bg-warning/15 text-warning border-warning/30",
  resolvido: "bg-success/15 text-success border-success/30",
  rejeitado: "bg-destructive/15 text-destructive border-destructive/30",
};

const typeLabels: Record<Report["type"], string> = {
  video: "Vídeo",
  perfil: "Perfil",
  validação: "Validação",
};

export default function Reports() {
  const [reports, setReports] = useState(mockReports);
  const { toast } = useToast();

  const removeContent = (id: string) => {
    setReports((r) => r.map((rep) => rep.id === id ? { ...rep, status: "resolvido" as const } : rep));
    toast({ title: "Conteúdo removido" });
  };

  const removeReport = (id: string) => {
    setReports((r) => r.filter((rep) => rep.id !== id));
    toast({ title: "Denúncia removida" });
  };

  const blockUser = (name: string) => {
    toast({ title: `Usuário ${name} bloqueado` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Denúncias</h1>
        <p className="text-muted-foreground mt-1">Gerencie denúncias de conteúdo e usuários</p>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="border-border/50">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs font-medium">{typeLabels[report.type]}</Badge>
                  <Badge variant="outline" className={statusColors[report.status]}>{report.status}</Badge>
                </div>
                <p className="font-medium">{report.reason}</p>
                <p className="text-sm text-muted-foreground">
                  Denunciado: <span className="text-foreground">{report.reportedUser}</span> · por {report.reportedBy} · {report.createdAt}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button size="sm" variant="outline" onClick={() => removeContent(report.id)} title="Remover conteúdo">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => removeReport(report.id)} title="Remover denúncia">
                  <XCircle className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => blockUser(report.reportedUser)} title="Bloquear usuário">
                  <Ban className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
