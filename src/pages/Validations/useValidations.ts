import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores";
import { insertAdmLog } from "@/processes/admLogs";
import type { ProfessionalValidationRow } from "./types";

const PROFESSIONAL_DOCUMENTS_BUCKET = "professional-documents";

const statusFromDb = (s: string): ProfessionalValidationRow["status"] => {
  if (s === "approved") return "aprovado";
  if (s === "rejected") return "rejeitado";
  return "pendente";
};

type DbStatus = "pending" | "approved" | "rejected";

async function fetchProfessionalValidationsByStatus(status: DbStatus): Promise<ProfessionalValidationRow[]> {
  const { data, error } = await supabase
    .from("professional_document")
    .select("id, url, profile_id, status, created_at, profile:profile_id(id, name, email)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    url: string | null;
    profile_id: string;
    status: string;
    created_at: string;
    profile: { id: string; name: string | null; email: string } | null;
  }>;

  const byProfile = new Map<string, typeof rows[0]>();
  for (const r of rows) {
    if (!byProfile.has(r.profile_id)) byProfile.set(r.profile_id, r);
  }

  return Array.from(byProfile.values()).map((r) => {
    const profile = r.profile;
    return {
      id: r.profile_id,
      documentId: r.id,
      name: profile?.name ?? "—",
      email: profile?.email ?? "—",
      profession: "—",
      document: "Documento anexado",
      status: statusFromDb(r.status),
      createdAt: new Date(r.created_at).toLocaleDateString("pt-BR"),
      documentUrl: r.url,
    };
  });
}

function fetchPending() {
  return fetchProfessionalValidationsByStatus("pending");
}
function fetchApproved() {
  return fetchProfessionalValidationsByStatus("approved");
}
function fetchRejected() {
  return fetchProfessionalValidationsByStatus("rejected");
}

export function useValidations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const admId = useAuthStore((s) => s.user?.id);

  const pending = useQuery({
    queryKey: queryKeys.validations.byStatus("pending"),
    queryFn: fetchPending,
  });
  const approved = useQuery({
    queryKey: queryKeys.validations.byStatus("approved"),
    queryFn: fetchApproved,
  });
  const rejected = useQuery({
    queryKey: queryKeys.validations.byStatus("rejected"),
    queryFn: fetchRejected,
  });

  const validationsPending = pending.data ?? [];
  const validationsApproved = approved.data ?? [];
  const validationsRejected = rejected.data ?? [];
  const isLoading = pending.isLoading || approved.isLoading || rejected.isLoading;
  const error = pending.error ?? approved.error ?? rejected.error;

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      documentId,
      profileId,
      status,
    }: {
      documentId: string;
      profileId: string;
      status: "aprovado" | "rejeitado";
    }) => {
      const dbStatus = status === "aprovado" ? "approved" : "rejected";
      const { error } = await supabase
        .from("professional_document")
        .update({ status: dbStatus })
        .eq("id", documentId);
      if (error) throw error;
      return { documentId, profileId, status };
    },
    onSuccess: (_, { profileId, documentId, status }) => {
      queryClient.invalidateQueries({ queryKey: ["validations"] });
      if (admId) {
        void insertAdmLog({
          admId,
          userId: profileId,
          type: status === "aprovado" ? "professional_document_approved" : "professional_document_rejected",
          metadata: { documentId },
        }).catch(() => {
          // Log falhou; não quebra a UX (toast de sucesso segue)
        });
      }
      toast({
        title: status === "aprovado" ? "Profissional aprovado" : "Profissional rejeitado",
      });
    },
    onError: (err) => {
      toast({
        title: "Erro ao atualizar status",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  async function downloadDocument(storagePath: string, fileName?: string) {
    // Path no bucket (ex: "documento.pdf" ou "pasta/documento.pdf")
    if (!storagePath?.trim()) {
      toast({ title: "Nenhum arquivo associado a este documento", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.storage
      .from(PROFESSIONAL_DOCUMENTS_BUCKET)
      .download(storagePath);

    if (error) {
      toast({ title: "Erro ao baixar arquivo", variant: "destructive" });
      return;
    }

    const objectUrl = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = objectUrl;
    const baseFromPath = storagePath.split("/").pop() ?? "";
    const ext = baseFromPath.includes(".") ? baseFromPath.slice(baseFromPath.lastIndexOf(".")) : "";
    const downloadName = fileName
      ? (fileName.endsWith(ext) ? fileName : `${fileName}${ext}`)
      : baseFromPath || "documento";
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }

  return {
    validationsPending,
    validationsApproved,
    validationsRejected,
    isLoading,
    error: error ?? null,
    updateStatusMutation,
    downloadDocument,
  };
}
