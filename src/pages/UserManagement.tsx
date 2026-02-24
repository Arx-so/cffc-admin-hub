import { useState } from "react";
import { mockUsers, AppUser } from "@/data/mock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Ban, ShieldCheck, ShieldOff, Eye, UserPlus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const roleLabels: Record<AppUser["role"], string> = {
  user: "Usuário",
  athlete: "Atleta",
  professional: "Profissional",
  admin: "Admin",
};

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const { toast } = useToast();

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleBlock = (id: string) => {
    setUsers((u) =>
      u.map((user) =>
        user.id === id ? { ...user, status: user.status === "ativo" ? "bloqueado" as const : "ativo" as const } : user
      )
    );
    toast({ title: "Status atualizado" });
  };

  const removeValidation = (id: string) => {
    setUsers((u) => u.map((user) => user.id === id ? { ...user, validated: false } : user));
    toast({ title: "Validação removida" });
  };

  const createAdmin = () => {
    if (!newAdminEmail) return;
    const newAdmin: AppUser = {
      id: String(users.length + 1),
      name: newAdminEmail.split("@")[0],
      email: newAdminEmail,
      role: "admin",
      status: "ativo",
      createdAt: new Date().toISOString().split("T")[0],
      validated: true,
    };
    setUsers((u) => [...u, newAdmin]);
    setNewAdminEmail("");
    toast({ title: "Admin criado" });
  };

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
              <Button className="w-full" onClick={createAdmin}>Criar</Button>
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
                      <Button size="icon" variant="ghost" title={user.status === "ativo" ? "Bloquear" : "Desbloquear"} onClick={() => toggleBlock(user.id)}>
                        <Ban className="h-4 w-4" />
                      </Button>
                      {user.validated && (
                        <Button size="icon" variant="ghost" title="Remover validação" onClick={() => removeValidation(user.id)}>
                          <ShieldOff className="h-4 w-4" />
                        </Button>
                      )}
                      {!user.validated && (
                        <Button size="icon" variant="ghost" title="Validar conta" onClick={() => {
                          setUsers((u) => u.map((usr) => usr.id === user.id ? { ...usr, validated: true } : usr));
                          toast({ title: "Conta validada" });
                        }}>
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

      {/* User Detail Dialog */}
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
