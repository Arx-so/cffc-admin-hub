export interface Report {
  id: string;
  type: "video" | "perfil" | "validação";
  reason: string;
  status: "pendente" | "resolvido" | "rejeitado";
  reportedUser: string;
  reportedBy: string;
  createdAt: string;
}

export interface PendingVideo {
  id: string;
  athleteName: string;
  thumbnail: string;
  title: string;
  uploadedAt: string;
  status: "pendente" | "aprovado" | "rejeitado";
}

export interface ProfessionalValidation {
  id: string;
  name: string;
  email: string;
  profession: string;
  document: string;
  status: "pendente" | "aprovado" | "rejeitado";
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "athlete" | "professional" | "admin";
  status: "ativo" | "bloqueado";
  createdAt: string;
  validated: boolean;
}

export const mockReports: Report[] = [
  { id: "1", type: "video", reason: "Conteúdo impróprio", status: "pendente", reportedUser: "Carlos Silva", reportedBy: "Ana Souza", createdAt: "2026-02-20" },
  { id: "2", type: "perfil", reason: "Perfil falso", status: "pendente", reportedUser: "João Santos", reportedBy: "Maria Lima", createdAt: "2026-02-19" },
  { id: "3", type: "validação", reason: "Documento suspeito", status: "resolvido", reportedUser: "Pedro Costa", reportedBy: "Sistema", createdAt: "2026-02-18" },
  { id: "4", type: "video", reason: "Spam", status: "rejeitado", reportedUser: "Lucas Oliveira", reportedBy: "Fernanda Rocha", createdAt: "2026-02-17" },
  { id: "5", type: "perfil", reason: "Assédio", status: "pendente", reportedUser: "Rafael Mendes", reportedBy: "Juliana Alves", createdAt: "2026-02-22" },
];

export const mockPendingVideos: PendingVideo[] = [
  { id: "1", athleteName: "Carlos Silva", thumbnail: "https://images.unsplash.com/photo-1461896836934-bd45ba4e515a?w=300&h=200&fit=crop", title: "Treino de Sprint 100m", uploadedAt: "2026-02-21", status: "pendente" },
  { id: "2", athleteName: "Ana Souza", thumbnail: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300&h=200&fit=crop", title: "Rotina de Musculação", uploadedAt: "2026-02-20", status: "pendente" },
  { id: "3", athleteName: "Pedro Costa", thumbnail: "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=300&h=200&fit=crop", title: "Jogo de Futebol Amador", uploadedAt: "2026-02-19", status: "pendente" },
  { id: "4", athleteName: "Maria Lima", thumbnail: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=300&h=200&fit=crop", title: "Natação - Prova 200m", uploadedAt: "2026-02-18", status: "pendente" },
];

export const mockValidations: ProfessionalValidation[] = [
  { id: "1", name: "Dr. Roberto Almeida", email: "roberto@med.com", profession: "Médico Esportivo", document: "CRM-12345", status: "pendente", createdAt: "2026-02-21" },
  { id: "2", name: "Prof. Carla Dias", email: "carla@fit.com", profession: "Educadora Física", document: "CREF-67890", status: "pendente", createdAt: "2026-02-20" },
  { id: "3", name: "Dr. Felipe Nunes", email: "felipe@fisio.com", profession: "Fisioterapeuta", document: "CREFITO-11111", status: "aprovado", createdAt: "2026-02-18" },
];

export const mockUsers: AppUser[] = [
  { id: "1", name: "Carlos Silva", email: "carlos@email.com", role: "athlete", status: "ativo", createdAt: "2026-01-10", validated: true },
  { id: "2", name: "Ana Souza", email: "ana@email.com", role: "athlete", status: "ativo", createdAt: "2026-01-15", validated: true },
  { id: "3", name: "Dr. Roberto Almeida", email: "roberto@med.com", role: "professional", status: "ativo", createdAt: "2026-01-20", validated: true },
  { id: "4", name: "João Santos", email: "joao@email.com", role: "user", status: "bloqueado", createdAt: "2026-02-01", validated: false },
  { id: "5", name: "Admin Master", email: "admin@app.com", role: "admin", status: "ativo", createdAt: "2025-12-01", validated: true },
  { id: "6", name: "Maria Lima", email: "maria@email.com", role: "athlete", status: "ativo", createdAt: "2026-02-05", validated: true },
];
