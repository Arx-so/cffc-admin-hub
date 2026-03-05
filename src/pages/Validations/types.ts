/** One validation row: profile + its document to approve/download (from Supabase). */
export interface ProfessionalValidationRow {
  id: string;
  documentId: string;
  name: string;
  email: string;
  profession: string;
  document: string;
  status: "pendente" | "aprovado" | "rejeitado";
  createdAt: string;
  /** Path do arquivo no bucket professional-documents (ex: "documento.pdf") */
  documentUrl: string | null;
}
