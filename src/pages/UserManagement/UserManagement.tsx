import type { ProfileRow } from "./types";
import { statusFromBannedUntil, ROLE_LABELS } from "./types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Ban, Unlock, ShieldCheck, ShieldOff, Eye, UserPlus, Search, Loader2, ChevronLeft, ChevronRight, History, MoreVertical } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import { ADM_LOG_TYPE_LABELS } from "@/constants/admLog";
import type { AdmLogWithNames } from "@/types/admLog";

export interface UserManagementProps {
  rows: ProfileRow[];
  totalCount: number;
  totalPages: number;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  isLoading: boolean;
  error: Error | null;
  search: string;
  setSearch: (v: string) => void;
  selectedUser: ProfileRow | null;
  setSelectedUser: (u: ProfileRow | null) => void;
  newAdminEmail: string;
  setNewAdminEmail: (v: string) => void;
  toggleBlockMutation: UseMutationResult<void, Error, string, unknown>;
  removeValidationMutation: UseMutationResult<void, Error, string, unknown>;
  addValidationMutation: UseMutationResult<void, Error, string, unknown>;
  createAdminMutation: UseMutationResult<void, Error, string, unknown>;
  createAdmin: () => void;
  createAdminModalOpen: boolean;
  setCreateAdminModalOpen: (open: boolean) => void;
  isPlaceholderData?: boolean;
  historyUser: ProfileRow | null;
  setHistoryUser: (u: ProfileRow | null) => void;
  historyLogs: AdmLogWithNames[];
  historyLogsLoading: boolean;
}

export function UserManagement({
  rows,
  totalCount,
  totalPages,
  page,
  setPage,
  pageSize,
  isLoading,
  error,
  search,
  setSearch,
  selectedUser,
  setSelectedUser,
  newAdminEmail,
  setNewAdminEmail,
  toggleBlockMutation,
  removeValidationMutation,
  addValidationMutation,
  createAdminMutation,
  createAdmin,
  createAdminModalOpen,
  setCreateAdminModalOpen,
  isPlaceholderData,
  historyUser,
  setHistoryUser,
  historyLogs,
  historyLogsLoading,
}: UserManagementProps) {
  if (isLoading && !isPlaceholderData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Erro ao carregar utilizadores. Tente novamente.
      </div>
    );
  }

  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalCount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">Gerencie contas, permissões e validações</p>
        </div>

        <Dialog open={createAdminModalOpen} onOpenChange={setCreateAdminModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" /> Convidar Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar novo Administrador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="email@admin.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} />
              </div>
              <Button className="w-full" onClick={createAdmin} disabled={createAdminMutation.isPending}>
                {createAdminMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((user) => {
                  const status = statusFromBannedUntil(user.banned_until);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={status === "ativo" ? "text-success border-success/30" : "text-destructive border-destructive/30"}
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.validated ? "✓" : "✗"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="cursor-pointer">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[180px]">
                            <DropdownMenuItem onClick={() => setHistoryUser(user)} className="cursor-pointer">
                              <History className="h-4 w-4 mr-2" />
                              Histórico
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedUser(user)} className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              Informações do Usuário
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleBlockMutation.mutate(user.id)}
                              disabled={toggleBlockMutation.isPending}
                              className={`cursor-pointer ${status === "ativo" ? "text-destructive focus:text-destructive" : "text-success focus:text-success"}`}
                            >
                              {status === "ativo" ? (
                                <>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Bloquear
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Desbloquear
                                </>
                              )}
                            </DropdownMenuItem>
                            {user.validated ? (
                              <DropdownMenuItem
                                onClick={() => removeValidationMutation.mutate(user.id)}
                                disabled={removeValidationMutation.isPending}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Remover validação
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => addValidationMutation.mutate(user.id)}
                                disabled={addValidationMutation.isPending}
                                className="cursor-pointer"
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Validar conta
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-2">
              <p className="text-sm text-muted-foreground">
                {totalCount === 0 ? "0" : `${start}-${end}`} de {totalCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Nome:</span> {selectedUser.name ?? "—"}</div>
                <div><span className="text-muted-foreground">Email:</span> {selectedUser.email}</div>
                <div><span className="text-muted-foreground">Cargo:</span> {ROLE_LABELS[selectedUser.role] ?? selectedUser.role}</div>
                <div><span className="text-muted-foreground">Status:</span> {statusFromBannedUntil(selectedUser.banned_until)}</div>
                <div><span className="text-muted-foreground">Validado:</span> {selectedUser.validated ? "Sim" : "Não"}</div>
                <div><span className="text-muted-foreground">Criado em:</span> {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "—"}</div>
                {selectedUser.phone && <div><span className="text-muted-foreground">Telefone:</span> {selectedUser.phone}</div>}
                {(selectedUser.city || selectedUser.state) && (
                  <div><span className="text-muted-foreground">Local:</span> {[selectedUser.city, selectedUser.state].filter(Boolean).join(", ") || "—"}</div>
                )}
                {selectedUser.birth_date && <div><span className="text-muted-foreground">Nascimento:</span> {new Date(selectedUser.birth_date).toLocaleDateString()}</div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyUser} onOpenChange={() => setHistoryUser(null)}>
        <DialogContent className="max-w-md max-h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="mb-4">
              Histórico {historyUser ? (historyUser.role === "admin" ? `— ações de ${historyUser.name ?? historyUser.email}` : `— ações sobre ${historyUser.name ?? historyUser.email}`) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto min-h-0 flex-1 pr-2 -mr-2">
            {historyLogsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : historyLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Nenhum registro encontrado.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {historyLogs.map((log) => (
                  <li key={log.id} className="border-b border-border/50 pb-2 last:border-0">
                    <span className="font-medium">{ADM_LOG_TYPE_LABELS[log.type]}</span>
                    {historyUser?.role === "admin" && log.user_name && (
                      <span className="text-muted-foreground"> → {log.user_name}</span>
                    )}
                    {historyUser?.role !== "admin" && log.adm_name && (
                      <span className="text-muted-foreground"> por {log.adm_name}</span>
                    )}
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
