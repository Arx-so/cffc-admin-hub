import { useState } from "react";
import { mockValidations } from "@/data/mock";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Validations() {
  const [validations, setValidations] = useState(mockValidations);
  const { toast } = useToast();

  const approve = (id: string) => {
    setValidations((v) => v.map((val) => val.id === id ? { ...val, status: "aprovado" as const } : val));
    toast({ title: "Profissional aprovado" });
  };

  const reject = (id: string) => {
    setValidations((v) => v.map((val) => val.id === id ? { ...val, status: "rejeitado" as const } : val));
    toast({ title: "Profissional rejeitado" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Validação de Profissionais</h1>
        <p className="text-muted-foreground mt-1">Verifique documentos e aprove contas de profissionais</p>
      </div>

      <div className="grid gap-4">
        {validations.map((val) => (
          <Card key={val.id} className="border-border/50">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{val.name}</p>
                  <p className="text-sm text-muted-foreground">{val.profession} · {val.document}</p>
                  <p className="text-xs text-muted-foreground">{val.email} · {val.createdAt}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {val.status === "pendente" ? (
                  <>
                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => approve(val.id)}>
                      <Check className="h-4 w-4 mr-1" /> Aprovar
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => reject(val.id)}>
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
        ))}
      </div>
    </div>
  );
}
