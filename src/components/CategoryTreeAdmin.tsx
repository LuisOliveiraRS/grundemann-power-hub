import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight, ChevronDown, Plus, Trash2, Edit, FolderTree,
  Save, X, GripVertical, Eye, EyeOff, ArrowUp, ArrowDown, ExternalLink,
} from "lucide-react";

interface MenuCat {
  id: string; name: string; slug: string; parent_id: string | null;
  display_order: number; icon: string; image_url: string;
  description: string; is_active: boolean; external_url: string | null;
}

const CategoryTreeAdmin = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<MenuCat[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", description: "", icon: "", image_url: "", external_url: "" });
  const [addingTo, setAddingTo] = useState<string | null>(null); // parent_id or "__root__"
  const [newForm, setNewForm] = useState({ name: "", slug: "", description: "", icon: "", image_url: "", external_url: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from("menu_categories").select("*").order("display_order").order("name");
    setItems((data || []) as MenuCat[]);
  };

  const getChildren = (parentId: string | null): MenuCat[] => {
    return items
      .filter(i => i.parent_id === parentId)
      .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
  };

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getDepth = (id: string): number => {
    const item = items.find(i => i.id === id);
    if (!item?.parent_id) return 0;
    return 1 + getDepth(item.parent_id);
  };

  const addCategory = async () => {
    const parentId = addingTo === "__root__" ? null : addingTo;
    const slug = newForm.slug || newForm.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const siblings = getChildren(parentId);
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.display_order)) + 1 : 0;

    const { error } = await supabase.from("menu_categories").insert({
      name: newForm.name.trim(),
      slug,
      parent_id: parentId,
      display_order: maxOrder,
      icon: newForm.icon || "",
      image_url: newForm.image_url || "",
      description: newForm.description || "",
      external_url: newForm.external_url || null,
    });

    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Categoria criada!" });
    setAddingTo(null);
    setNewForm({ name: "", slug: "", description: "", icon: "", image_url: "", external_url: "" });
    if (parentId) setExpanded(prev => new Set(prev).add(parentId));
    loadData();
  };

  const startEdit = (item: MenuCat) => {
    setEditing(item.id);
    setEditForm({ name: item.name, slug: item.slug, description: item.description, icon: item.icon, image_url: item.image_url, external_url: item.external_url || "" });
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from("menu_categories").update({
      name: editForm.name.trim(),
      slug: editForm.slug,
      description: editForm.description,
      icon: editForm.icon,
      image_url: editForm.image_url,
      external_url: editForm.external_url || null,
    }).eq("id", id);
    if (error) { toast({ title: "Erro", variant: "destructive" }); return; }
    toast({ title: "Atualizado!" });
    setEditing(null);
    loadData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("menu_categories").update({ is_active: !current }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !current } : i));
  };

  const deleteItem = async (id: string) => {
    const children = items.filter(i => i.parent_id === id);
    if (children.length > 0) {
      toast({ title: "Não é possível excluir", description: "Remova as subcategorias filhas primeiro.", variant: "destructive" });
      return;
    }
    if (!confirm("Excluir esta categoria?")) return;
    await supabase.from("menu_categories").delete().eq("id", id);
    toast({ title: "Excluído!" });
    loadData();
  };

  const moveOrder = async (id: string, direction: "up" | "down") => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const siblings = getChildren(item.parent_id);
    const idx = siblings.findIndex(s => s.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    // First normalize all siblings to sequential order to avoid conflicts
    const updates = siblings.map((s, i) => 
      supabase.from("menu_categories").update({ display_order: i * 10 }).eq("id", s.id)
    );
    await Promise.all(updates);

    // Now swap the two items
    const newSiblings = [...siblings];
    [newSiblings[idx], newSiblings[swapIdx]] = [newSiblings[swapIdx], newSiblings[idx]];
    
    const swapUpdates = newSiblings.map((s, i) =>
      supabase.from("menu_categories").update({ display_order: i * 10 }).eq("id", s.id)
    );
    await Promise.all(swapUpdates);
    loadData();
  };

  const changeParent = async (id: string, newParentId: string | null) => {
    // Prevent setting parent to self or descendant
    const descendants = getAllDescendants(id);
    if (newParentId && (newParentId === id || descendants.includes(newParentId))) {
      toast({ title: "Operação inválida", description: "Não pode mover para um descendente", variant: "destructive" });
      return;
    }
    await supabase.from("menu_categories").update({ parent_id: newParentId }).eq("id", id);
    toast({ title: "Categoria movida!" });
    loadData();
  };

  const getAllDescendants = (id: string): string[] => {
    const children = items.filter(i => i.parent_id === id);
    return children.flatMap(c => [c.id, ...getAllDescendants(c.id)]);
  };

  const renderTree = (parentId: string | null, depth: number): React.ReactNode => {
    const children = getChildren(parentId);
    if (children.length === 0 && addingTo !== (parentId || "__root__")) return null;

    return (
      <div className={depth > 0 ? "ml-6 border-l-2 border-border pl-3" : ""}>
        {children.map((item, idx) => {
          const hasChildren = items.some(i => i.parent_id === item.id);
          const isExpanded = expanded.has(item.id);
          const isEditing = editing === item.id;

          return (
            <div key={item.id} className="mb-1">
              <div className={`flex items-center gap-2 py-2 px-3 rounded-lg group transition-colors ${!item.is_active ? "opacity-50" : ""} ${isEditing ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"}`}>
                <button onClick={() => toggle(item.id)} className="p-0.5 flex-shrink-0">
                  {hasChildren ? (isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />) : <span className="w-5" />}
                </button>

                {isEditing ? (
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nome" className="h-8 text-sm" autoFocus />
                      <Input value={editForm.slug} onChange={e => setEditForm({ ...editForm, slug: e.target.value })} placeholder="Slug SEO" className="h-8 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={editForm.icon} onChange={e => setEditForm({ ...editForm, icon: e.target.value })} placeholder="Ícone (ex: Fuel)" className="h-8 text-sm" />
                      <Input value={editForm.image_url} onChange={e => setEditForm({ ...editForm, image_url: e.target.value })} placeholder="URL da imagem" className="h-8 text-sm" />
                    </div>
                    <Input value={editForm.external_url} onChange={e => setEditForm({ ...editForm, external_url: e.target.value })} placeholder="Link externo (ex: https://exemplo.com) — deixe vazio para link interno" className="h-8 text-sm" />
                    <Input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Descrição" className="h-8 text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={() => saveEdit(item.id)}><Save className="h-3 w-3 mr-1" /> Salvar</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(null)}><X className="h-3 w-3 mr-1" /> Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{item.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 flex-shrink-0">/{item.slug}</Badge>
                        {item.external_url && <Badge variant="secondary" className="text-[10px] px-1.5 flex-shrink-0 bg-accent/20 text-accent-foreground"><ExternalLink className="h-2.5 w-2.5 mr-0.5" /> Externo</Badge>}
                        {!item.is_active && <Badge variant="secondary" className="text-[10px]"><EyeOff className="h-2.5 w-2.5 mr-0.5" /> Oculta</Badge>}
                        {item.icon && <Badge variant="outline" className="text-[10px]">{item.icon}</Badge>}
                      </div>
                      {item.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveOrder(item.id, "up")} title="Mover para cima" disabled={idx === 0}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveOrder(item.id, "down")} title="Mover para baixo" disabled={idx === children.length - 1}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setAddingTo(item.id); setExpanded(prev => new Set(prev).add(item.id)); }} title="Adicionar subcategoria">
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(item)} title="Editar">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toggleActive(item.id, item.is_active)} title={item.is_active ? "Desativar" : "Ativar"}>
                        {item.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>

                      {/* Change parent dropdown */}
                      <select
                        className="h-6 text-[10px] border border-input rounded px-1 bg-background w-auto max-w-[80px]"
                        value=""
                        onChange={e => {
                          const val = e.target.value;
                          if (val === "__root__") changeParent(item.id, null);
                          else if (val) changeParent(item.id, val);
                        }}
                        title="Mover para..."
                      >
                        <option value="">Mover...</option>
                        {item.parent_id && <option value="__root__">⬆ Raiz</option>}
                        {items.filter(i => i.id !== item.id && !getAllDescendants(item.id).includes(i.id) && i.id !== item.parent_id).map(i => (
                          <option key={i.id} value={i.id}>→ {i.name}</option>
                        ))}
                      </select>

                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteItem(item.id)} title="Excluir">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
              {isExpanded && renderTree(item.id, depth + 1)}
            </div>
          );
        })}

        {/* Add form */}
        {addingTo === (parentId || "__root__") && (
          <div className="py-2 px-3 ml-5 space-y-2 bg-primary/5 rounded-lg border border-primary/20 mb-2">
            <div className="grid grid-cols-2 gap-2">
              <Input value={newForm.name} onChange={e => { setNewForm({ ...newForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }); }}
                placeholder="Nome da categoria" className="h-8 text-sm" autoFocus
                onKeyDown={e => { if (e.key === "Enter") addCategory(); if (e.key === "Escape") setAddingTo(null); }} />
              <Input value={newForm.slug} onChange={e => setNewForm({ ...newForm, slug: e.target.value })} placeholder="Slug SEO" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input value={newForm.icon} onChange={e => setNewForm({ ...newForm, icon: e.target.value })} placeholder="Ícone (opcional)" className="h-8 text-sm" />
              <Input value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} placeholder="Descrição (opcional)" className="h-8 text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={addCategory}>Criar</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingTo(null)}>Cancelar</Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const rootCount = items.filter(i => !i.parent_id).length;
  const totalCount = items.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-primary" /> Árvore de Categorias
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {rootCount} categorias raiz · {totalCount} total · Suporta níveis ilimitados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExpanded(new Set(items.map(i => i.id)))}>
            Expandir Tudo
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExpanded(new Set())}>
            Recolher Tudo
          </Button>
          <Button onClick={() => setAddingTo("__root__")} className="shadow-md">
            <Plus className="h-4 w-4 mr-2" /> Nova Categoria Raiz
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        {renderTree(null, 0)}
        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Nenhuma categoria criada. Clique em "Nova Categoria Raiz" para começar.
          </p>
        )}
      </div>
    </div>
  );
};

export default CategoryTreeAdmin;
