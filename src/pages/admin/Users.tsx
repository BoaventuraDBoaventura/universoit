import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, MoreHorizontal, Shield, UserCog, User, Plus, Mail, Ban, CheckCircle, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

type AppRole = "admin" | "editor" | "user";

interface UserWithRoles {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: AppRole[];
  banned?: boolean;
}

interface CreateUserForm {
  email: string;
  password: string;
  full_name: string;
  role: AppRole;
}

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: "",
    password: "",
    full_name: "",
    role: "user",
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    role: AppRole;
    action: "add" | "remove";
    userName: string;
  } | null>(null);
  
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Fetch users banned status
      let usersStatus: { id: string; banned: boolean }[] = [];
      try {
        const { data } = await supabase.functions.invoke("manage-user", {
          body: { action: "list_users_status" },
        });
        if (data?.users) {
          usersStatus = data.users;
        }
      } catch (e) {
        console.error("Error fetching users status:", e);
      }

      // Combine profiles with roles
      const usersWithRoles: UserWithRoles[] = profiles.map((profile) => {
        const status = usersStatus.find(u => u.id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          roles: userRoles
            .filter((r) => r.user_id === profile.id)
            .map((r) => r.role as AppRole),
          banned: status?.banned || false,
        };
      });

      return usersWithRoles;
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (form: CreateUserForm) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar utilizador");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Utilizador criado",
        description: "O utilizador foi criado com sucesso.",
      });
      setCreateDialogOpen(false);
      setCreateForm({ email: "", password: "", full_name: "", role: "user" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar utilizador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Role adicionado",
        description: "O role foi adicionado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send password reset email mutation
  const sendPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await supabase.functions.invoke("manage-user", {
        body: { action: "send_password_reset", email },
      });
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Email enviado",
        description: "Email de redefinição de password enviado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await supabase.functions.invoke("manage-user", {
        body: { action: "ban_user", userId },
      });
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Utilizador desativado",
        description: "O utilizador foi desativado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await supabase.functions.invoke("manage-user", {
        body: { action: "unban_user", userId },
      });
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Utilizador ativado",
        description: "O utilizador foi ativado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Role removido",
        description: "O role foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Email e password são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(createForm);
  };

  const handleRoleChange = (
    userId: string,
    role: AppRole,
    action: "add" | "remove",
    userName: string
  ) => {
    // Prevent self-demotion from admin
    if (userId === currentUser?.id && role === "admin" && action === "remove") {
      toast({
        title: "Operação não permitida",
        description: "Não pode remover o seu próprio role de administrador.",
        variant: "destructive",
      });
      return;
    }

    // Require confirmation for admin changes
    if (role === "admin") {
      setConfirmDialog({ open: true, userId, role, action, userName });
      return;
    }

    // Execute directly for non-admin roles
    if (action === "add") {
      addRoleMutation.mutate({ userId, role });
    } else {
      removeRoleMutation.mutate({ userId, role });
    }
  };

  const confirmRoleChange = () => {
    if (!confirmDialog) return;
    
    if (confirmDialog.action === "add") {
      addRoleMutation.mutate({ userId: confirmDialog.userId, role: confirmDialog.role });
    } else {
      removeRoleMutation.mutate({ userId: confirmDialog.userId, role: confirmDialog.role });
    }
    setConfirmDialog(null);
  };

  const exportToCSV = () => {
    if (!users) return;

    const csvContent = [
      ["Nome", "Email", "Roles", "Data de Registo"].join(","),
      ...users.map((user) =>
        [
          user.full_name || "Sem nome",
          user.email || "Sem email",
          user.roles.join(";") || "user",
          format(new Date(user.created_at), "dd/MM/yyyy"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `utilizadores_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const filteredUsers = users?.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "editor":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case "admin":
        return <Shield className="h-3 w-3" />;
      case "editor":
        return <UserCog className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Utilizadores</h1>
            <p className="text-muted-foreground">
              {users?.length || 0} utilizadores registados
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Utilizador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar novo utilizador</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar um novo utilizador no sistema.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome completo</Label>
                    <Input
                      id="full_name"
                      value={createForm.full_name}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, full_name: e.target.value })
                      }
                      placeholder="João Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, email: e.target.value })
                      }
                      placeholder="joao@exemplo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, password: e.target.value })
                      }
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={createForm.role}
                      onValueChange={(value: AppRole) =>
                        setCreateForm({ ...createForm, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Utilizador</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? "A criar..." : "Criar utilizador"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizador</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Data de Registo</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    A carregar...
                  </TableCell>
                </TableRow>
              ) : filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum utilizador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {user.full_name || "Sem nome"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email || "Sem email"}
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <Ban className="h-3 w-3" />
                          Desativado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={getRoleBadgeVariant(role)}
                              className="flex items-center gap-1"
                            >
                              {getRoleIcon(role)}
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            user
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "d MMM yyyy", { locale: pt })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!user.roles.includes("admin") && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleRoleChange(user.id, "admin", "add", user.full_name || user.email || "utilizador")
                              }
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Promover a Admin
                            </DropdownMenuItem>
                          )}
                          {user.roles.includes("admin") && user.id !== currentUser?.id && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleRoleChange(user.id, "admin", "remove", user.full_name || user.email || "utilizador")
                              }
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Remover Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {!user.roles.includes("editor") && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleRoleChange(user.id, "editor", "add", user.full_name || user.email || "utilizador")
                              }
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              Adicionar Editor
                            </DropdownMenuItem>
                          )}
                          {user.roles.includes("editor") && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleRoleChange(user.id, "editor", "remove", user.full_name || user.email || "utilizador")
                              }
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              Remover Editor
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {user.email && (
                            <DropdownMenuItem
                              onClick={() => sendPasswordResetMutation.mutate(user.email!)}
                              disabled={sendPasswordResetMutation.isPending}
                            >
                              <KeyRound className="h-4 w-4 mr-2" />
                              Enviar reset de password
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {user.id !== currentUser?.id && (
                            user.banned ? (
                              <DropdownMenuItem
                                onClick={() => unbanUserMutation.mutate(user.id)}
                                disabled={unbanUserMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Ativar utilizador
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => banUserMutation.mutate(user.id)}
                                disabled={banUserMutation.isPending}
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Desativar utilizador
                              </DropdownMenuItem>
                            )
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog?.open}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de role</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === "add"
                ? `Tem a certeza que deseja promover "${confirmDialog?.userName}" a administrador? Esta ação dará acesso total ao sistema.`
                : `Tem a certeza que deseja remover o role de administrador de "${confirmDialog?.userName}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Users;
