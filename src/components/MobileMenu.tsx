import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Menu, X, ChevronDown, ChevronRight, User, Package, Phone, MessageCircle,
  Fuel, Zap, Cog, Wrench, Settings, ShieldCheck, BookOpen, LogOut, Home,
  Heart, FileText, LayoutDashboard
} from "lucide-react";

const iconMap: Record<string, any> = {
  "geradores-diesel": Fuel,
  "geradores-gasolina": Zap,
  "pecas-componentes": Cog,
  "pecas-e-componentes": Cog,
  "manutencao": Wrench,
  "acessorios": Settings,
  "servicos-tecnicos": ShieldCheck,
};

const defaultCategories = [
  { id: "1", name: "Geradores Diesel", slug: "geradores-diesel" },
  { id: "2", name: "Geradores Gasolina", slug: "geradores-gasolina" },
  { id: "3", name: "Peças e Componentes", slug: "pecas-e-componentes" },
  { id: "4", name: "Manutenção", slug: "manutencao" },
  { id: "5", name: "Acessórios", slug: "acessorios" },
  { id: "6", name: "Serviços Técnicos", slug: "servicos-tecnicos" },
];

interface DBCategory { id: string; name: string; slug: string; is_visible?: boolean; }
interface Subcategory { id: string; name: string; slug: string; category_id: string; }

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileMenu = ({ open, onOpenChange }: MobileMenuProps) => {
  const { user, isAdmin, isSeller, signOut } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from("categories").select("id, name, slug, is_visible").order("name"),
      supabase.from("subcategories").select("id, name, slug, category_id").order("name"),
    ]).then(([catRes, subRes]) => {
      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      if (subRes.data) setSubcategories(subRes.data as Subcategory[]);
    });
  }, [open]);

  const visibleCategories = categories.filter(c => c.is_visible !== false);
  const items = visibleCategories.length > 0 ? visibleCategories : defaultCategories;
  const getSubcats = (catId: string) => subcategories.filter(s => s.category_id === catId);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="font-heading text-lg">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* User section */}
          <div className="p-4 border-b border-border bg-muted/30">
            {user ? (
              <div className="space-y-2">
                <button onClick={() => go("/minha-conta")} className="flex items-center gap-3 w-full text-left">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Minha Conta</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</p>
                  </div>
                </button>
              </div>
            ) : (
              <button onClick={() => go("/auth")} className="flex items-center gap-3 w-full text-left">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Entrar / Cadastrar</p>
                  <p className="text-xs text-muted-foreground">Acesse sua conta</p>
                </div>
              </button>
            )}
          </div>

          {/* Quick links */}
          <div className="p-2 border-b border-border">
            <button onClick={() => go("/")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground">
              <Home className="h-4 w-4 text-muted-foreground" /> Início
            </button>
            <button onClick={() => go("/produtos")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground">
              <Package className="h-4 w-4 text-muted-foreground" /> Todos os Produtos
            </button>
            {isAdmin && (
              <button onClick={() => go("/admin")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-primary">
                <LayoutDashboard className="h-4 w-4" /> Painel Admin
              </button>
            )}
            {isSeller && !isAdmin && (
              <button onClick={() => go("/vendedor")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-primary">
                <LayoutDashboard className="h-4 w-4" /> Painel Vendedor
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categorias</p>
            {items.map((cat) => {
              const subs = getSubcats(cat.id);
              const hasSubs = subs.length > 0;
              const isExpanded = expandedCat === cat.id;
              const Icon = iconMap[cat.slug] || Cog;

              return (
                <div key={cat.id}>
                  <button
                    onClick={() => {
                      if (hasSubs) setExpandedCat(isExpanded ? null : cat.id);
                      else go(`/categoria/${cat.slug}`);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="flex-1 text-left">{cat.name}</span>
                    {hasSubs && (
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    )}
                  </button>
                  {hasSubs && isExpanded && (
                    <div className="ml-7 pl-3 border-l-2 border-primary/20 space-y-0.5 mb-1">
                      <button onClick={() => go(`/categoria/${cat.slug}`)} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground font-semibold">
                        Ver todos
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </button>
                      {subs.map((sub) => (
                        <button key={sub.id} onClick={() => go(`/categoria/${cat.slug}/${sub.slug}`)} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground">
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Institutional links */}
          <div className="p-2 border-t border-border">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Institucional</p>
            <button onClick={() => go("/quem-somos")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
              Quem Somos
            </button>
            <button onClick={() => go("/contato")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
              Fale Conosco
            </button>
            <button onClick={() => go("/central-tecnica")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
              <BookOpen className="h-4 w-4 text-muted-foreground" /> Central Técnica
            </button>
            <button onClick={() => go("/catalogo-interativo")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
              <Wrench className="h-4 w-4 text-muted-foreground" /> Catálogo Interativo
            </button>
            <button onClick={() => go("/mecanico")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Área do Mecânico
            </button>
            <button onClick={() => go("/orcamento")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
              <FileText className="h-4 w-4 text-muted-foreground" /> Solicitar Orçamento
            </button>
            <button onClick={() => go("/calculadora-de-carga")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground font-medium text-primary">
              <Wrench className="h-4 w-4 text-primary" /> Calculadora de Carga
            </button>
          </div>

          {/* Contact */}
          <div className="p-4 border-t border-border bg-muted/30">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Contato</p>
            <a href="tel:+555181825748" className="flex items-center gap-2 text-sm text-foreground mb-2">
              <Phone className="h-4 w-4 text-primary" /> (51) 8182-5748
            </a>
            <a href="https://wa.me/555181825748" className="flex items-center gap-2 text-sm text-foreground">
              <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp
            </a>
          </div>
        </div>

        {/* Logout */}
        {user && (
          <div className="p-3 border-t border-border">
            <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-destructive/10 transition-colors text-sm font-medium text-destructive">
              <LogOut className="h-4 w-4" /> Sair da conta
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
