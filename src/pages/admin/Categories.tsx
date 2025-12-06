import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, GripVertical } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CategoryForm {
  id?: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  display_order: number | null;
}

const initialForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  color: "#3B82F6",
};

function SortableRow({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button
          className="cursor-grab touch-none p-1 hover:bg-muted rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <div
          className="h-6 w-6 rounded-full"
          style={{ backgroundColor: category.color || "#3B82F6" }}
        />
      </TableCell>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell className="text-muted-foreground">{category.slug}</TableCell>
      <TableCell className="max-w-xs truncate text-muted-foreground">
        {category.description}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function Categories() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CategoryForm>(initialForm);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("categories")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && categories) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);

      // Optimistic update
      queryClient.setQueryData(["admin-categories"], newCategories);

      // Update all display_order values
      const updates = newCategories.map((cat, index) => ({
        id: cat.id,
        display_order: index + 1,
      }));

      reorderMutation.mutate(updates);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-");
      const payload = { ...data, slug };

      if (data.id) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const maxOrder = categories?.length ? Math.max(...categories.map(c => c.display_order ?? 0)) : 0;
        const { error } = await supabase.from("categories").insert({ ...payload, display_order: maxOrder + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: form.id ? "Categoria atualizada!" : "Categoria criada!" });
      setDialogOpen(false);
      setForm(initialForm);
    },
    onError: () => {
      toast({ title: "Erro ao guardar categoria", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Categoria eliminada" });
    },
    onError: () => {
      toast({ title: "Erro ao eliminar categoria", variant: "destructive" });
    },
  });

  const handleEdit = (category: Category) => {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      color: category.color || "#3B82F6",
    });
    setDialogOpen(true);
  };

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="py-12 text-center text-muted-foreground">
          Apenas administradores podem gerir categorias.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Categorias</h1>
            <p className="text-muted-foreground">
              Gerir categorias de artigos. Arraste para reordenar.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setForm(initialForm)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {form.id ? "Editar Categoria" : "Nova Categoria"}
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveMutation.mutate(form);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="auto-gerado se vazio"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={form.color}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, color: e.target.value }))
                      }
                      className="h-10 w-20 cursor-pointer p-1"
                    />
                    <Input
                      value={form.color}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, color: e.target.value }))
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : categories?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Nenhuma categoria encontrada
                  </TableCell>
                </TableRow>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={categories?.map((c) => c.id) ?? []}
                    strategy={verticalListSortingStrategy}
                  >
                    {categories?.map((category) => (
                      <SortableRow
                        key={category.id}
                        category={category}
                        onEdit={handleEdit}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}