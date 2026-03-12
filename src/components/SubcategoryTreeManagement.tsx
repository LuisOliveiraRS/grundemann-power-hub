import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronDown, Plus, Trash2, Edit, FolderTree, Save, X } from "lucide-react";

interface Category { id: string; name: string; slug: string; }
interface Subcategory { id: string; name: string; slug: string; category_id: string; parent_id: string | null; description: string | null; }

const SubcategoryTreeManagement = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addingTo, setAddingTo] = useState<{ parentType: "category" | "subcategory"; parentId: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [catRes, subRes] = await Promise.all([
      supabase.from("categories").select("id, name, slug").order("name"),
      supabase.from("subcategories").select("*").order("name"),
    ]);
    setCategories((catRes.data || []) as Category[]);
    setSubcategories((subRes.data || []) as Subcategory[]);
  };

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getChildren = (parentId: string | null, categoryId: string): Subcategory[] => {
    return subcategories.filter(s => s.category_id === categoryId && s.parent_id === parentId);
  };

  const addSubcategory = async () => {
    if (!addingTo || !newName.trim()) return;
    const slug = newSlug.trim() || newName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const categoryId = addingTo.parentType === "category"
      ? addingTo.parentId
      : subcategories.find(s => s.id === addingTo.parentId)?.category_id || "";

    const { error } = await supabase.from("subcategories").insert({
      name: newName.trim(), slug,
      category_id: categoryId,
      parent_id: addingTo.parentType === "subcategory" ? addingTo.parentId : null,
    });

    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Subcategoria criada!" });
    setAddingTo(null); setNewName(""); setNewSlug("");
    loadData();
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("subcategories").update({ name: editName.trim() }).eq("id", id);
    if (error) { toast({ title: "Erro", variant: "destructive" }); return; }
    toast({ title: "Subcategoria atualizada!" });
    setEditing(null);
    loadData();
  };

  const deleteSubcategory = async (id: string) => {
    const children = subcategories.filter(s => s.parent_id === id);
    if (children.length > 0) {
      toast({ title: "Não é possível excluir", description: "Remova as subcategorias filhas primeiro.", variant: "destructive" });
      return;
    }
    if (!confirm("Excluir esta subcategoria?")) return;
    await supabase.from("subcategories").delete().eq("id", id);
    toast({ title: "Subcategoria excluída!" });
    loadData();
  };

  const renderSubTree = (parentId: string | null, categoryId: string, depth: number) => {
    const children = getChildren(parentId, categoryId);
    if (children.length === 0 && !addingTo) return null;

    return (
      <div className={depth > 0 ? "ml-6 border-l-2 border-border pl-3" : ""}>
        {children.map(sub => {
          const hasChildren = subcategories.some(s => s.parent_id === sub.id);
          const isExpanded = expanded.has(sub.id);
          const isEditing = editing === sub.id;

          return (
            <div key={sub.id} className="mb-1">
              <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 group">
                <button onClick={() => toggle(sub.id)} className="p-0.5">
                  {hasChildren ? (isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />) : <span className="w-5" />}
                </button>
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-sm" autoFocus
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(sub.id); if (e.key === "Escape") setEditing(null); }} />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(sub.id)}><Save className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-medium flex-1">{sub.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">{sub.slug}</Badge>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setAddingTo({ parentType: "subcategory", parentId: sub.id }); setExpanded(prev => new Set(prev).add(sub.id)); }}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditing(sub.id); setEditName(sub.name); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteSubcategory(sub.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
              {isExpanded && renderSubTree(sub.id, categoryId, depth + 1)}
            </div>
          );
        })}
        {addingTo && ((addingTo.parentType === "category" && addingTo.parentId === categoryId && parentId === null) || (addingTo.parentType === "subcategory" && addingTo.parentId === parentId)) && (
          <div className="flex items-center gap-2 py-1.5 px-2 ml-5">
            <Input value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }}
              placeholder="Nome da subcategoria" className="h-7 text-sm flex-1" autoFocus
              onKeyDown={e => { if (e.key === "Enter") addSubcategory(); if (e.key === "Escape") setAddingTo(null); }} />
            <Button size="sm" className="h-7 text-xs" onClick={addSubcategory}>Criar</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingTo(null)}>Cancelar</Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2"><FolderTree className="h-6 w-6 text-primary" /> Árvore de Subcategorias</h2>
          <p className="text-muted-foreground text-sm mt-1">Gerencie subcategorias aninhadas em formato de árvore</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        {categories.map(cat => {
          const isExpanded = expanded.has(cat.id);
          const childCount = subcategories.filter(s => s.category_id === cat.id).length;

          return (
            <div key={cat.id} className="mb-2">
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted/50 font-medium">
                <button onClick={() => toggle(cat.id)} className="p-0.5">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <FolderTree className="h-4 w-4 text-primary" />
                <span className="font-heading font-bold">{cat.name}</span>
                <Badge variant="secondary" className="text-[10px] ml-1">{childCount} sub</Badge>
                <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto" onClick={() => {
                  setAddingTo({ parentType: "category", parentId: cat.id });
                  setExpanded(prev => new Set(prev).add(cat.id));
                }}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {isExpanded && renderSubTree(null, cat.id, 0)}
            </div>
          );
        })}
        {categories.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma categoria criada.</p>}
      </div>
    </div>
  );
};

export default SubcategoryTreeManagement;
