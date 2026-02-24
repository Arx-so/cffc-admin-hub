import type { AppUser } from "@/data/mock";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Ban, ShieldCheck, ShieldOff, Eye, UserPlus, Search, Loader2 } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";

const roleLabels: Record<AppUser["role"], string> = {
  user: "Usuário",
  athlete: "Atleta",
  professional: "Profissional",
  admin: "Admin",
};

export interface UserManagementProps {
  filtered: AppUser[];
  isLoading: boolean;
  error: Error | null;
  search: string;
  setSearch: (v: string) => void;
  selectedUser: AppUser | null;
  setSelectedUser: (u: AppUser | null) => void;
  newAdminEmail: string;
  setNewAdminEmail: (v: string) => void;
  toggleBlockMutation: UseMutationResult<void, Error, string, unknown>;
  removeValidationMutation: UseMutationResult<void, Error, string, unknown>;
  addValidationMutation: UseMutationResult<void, Error, string, unknown>;
  createAdminMutation: UseMutationResult<void, Error, string, unknown>;
  createAdmin: () => void;
}

export function UserManagement({
  filtered,
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
}: UserManagementProps) {
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
        Erro ao carregar utilizadores. Tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">Gerencie contas, permissões e validações</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" /> Criar Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo Administrador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="email@admin.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} />
              </div>
              <Button className="w-full" onClick={createAdmin} disabled={createAdminMutation.isPending}>
                Criar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou email..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={user.status === "ativo" ? "text-success border-success/30" : "text-destructive border-destructive/30"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.validated ? "✓" : "✗"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Ver histórico" onClick={() => setSelectedUser(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={user.status === "ativo" ? "Bloquear" : "Desbloquear"}
                        onClick={() => toggleBlockMutation.mutate(user.id)}
                        disabled={toggleBlockMutation.isPending}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                      {user.validated && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Remover validação"
                          onClick={() => removeValidationMutation.mutate(user.id)}
                          disabled={removeValidationMutation.isPending}
                        >
                          <ShieldOff className="h-4 w-4" />
                        </Button>
                      )}
                      {!user.validated && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Validar conta"
                          onClick={() => addValidationMutation.mutate(user.id)}
                          disabled={addValidationMutation.isPending}
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Histórico do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Nome:</span> {selectedUser.name}</div>
                <div><span className="text-muted-foreground">Email:</span> {selectedUser.email}</div>
                <div><span className="text-muted-foreground">Cargo:</span> {roleLabels[selectedUser.role]}</div>
                <div><span className="text-muted-foreground">Status:</span> {selectedUser.status}</div>
                <div><span className="text-muted-foreground">Validado:</span> {selectedUser.validated ? "Sim" : "Não"}</div>
                <div><span className="text-muted-foreground">Criado em:</span> {selectedUser.createdAt}</div>
              </div>
              <p className="text-xs text-muted-foreground italic">Histórico detalhado será conectado ao backend.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
