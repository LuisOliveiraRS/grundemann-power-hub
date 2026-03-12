import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuCategories, MenuCategoryNode } from "@/hooks/useMenuCategories";
import {
  ChevronDown, ChevronRight, User, Package, Phone, MessageCircle,
  Fuel, Zap, Cog, Wrench, Settings, ShieldCheck, BookOpen, LogOut, Home,
  FileText, LayoutDashboard
} from "lucide-react";

const iconMap: Record<string, any> = {
  Fuel, Zap, Cog, Wrench, Settings, ShieldCheck,
  "geradores-diesel": Fuel,
  "geradores-gasolina": Zap,
  "pecas-componentes": Cog,
  "pecas-e-componentes": Cog,
  "manutencao": Wrench,
  "acessorios": Settings,
  "servicos-tecnicos": ShieldCheck,
};

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileMenu = ({ open, onOpenChange }: MobileMenuProps) => {
  const { user, isAdmin, isSeller, userName, signOut } = useAuth();
  const navigate = useNavigate();
  const { tree } = useMenuCategories();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
  };

  const getIcon = (node: MenuCategoryNode) => iconMap[node.icon] || iconMap[node.slug] || Cog;

  const renderCategoryTree = (nodes: MenuCategoryNode[], depth: number = 0) => {
    return nodes.map(node => {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedIds.has(node.id);
      const Icon = depth === 0 ? getIcon(node) : null;

      return (
        <div key={node.id}>
          <button
            onClick={() => {
              if (hasChildren) toggleExpand(node.id);
              else go(`/categoria/${node.fullPath}`);
            }}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground ${depth > 0 ? "text-muted-foreground hover:text-foreground" : ""}`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            {Icon && <Icon className="h-4 w-4 text-primary flex-shrink-0" />}
            {depth > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
            <span className="flex-1 text-left">{node.name}</span>
            {hasChildren && (
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            )}
          </button>

          {hasChildren && isExpanded && (
            <div className={depth === 0 ? "ml-4 pl-3 border-l-2 border-primary/20 space-y-0.5 mb-1" : "space-y-0.5"}>
              <button
                onClick={() => go(`/categoria/${node.fullPath}`)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground font-semibold"
                style={{ paddingLeft: `${12 + (depth + 1) * 16}px` }}
              >
                Ver todos <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </button>
              {renderCategoryTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
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
              <button onClick={() => go("/minha-conta")} className="flex items-center gap-3 w-full text-left">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{userName || "Minha Conta"}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</p>
                </div>
              </button>
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

          {/* Categories - recursive accordion */}
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categorias</p>
            {renderCategoryTree(tree)}
          </div>

          {/* Institutional links */}
          <div className="p-2 border-t border-border">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Institucional</p>
            <button onClick={() => go("/quem-somos")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">Quem Somos</button>
            <button onClick={() => go("/contato")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">Fale Conosco</button>
            <button onClick={() => go("/central-tecnica")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
              <BookOpen className="h-4 w-4 text-muted-foreground" /> Central Técnica
            </button>
            <button onClick={() => go("/catalogo-interativo")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
              <Wrench className="h-4 w-4 text-muted-foreground" /> Catálogo Interativo
            </button>
            <button onClick={() => go("/mecanico")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground font-semibold text-accent">
              <ShieldCheck className="h-4 w-4 text-accent" /> Revendedores - Oficinas e Mecânicos
            </button>
            <button onClick={() => go("/orcamento")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
              <FileText className="h-4 w-4 text-muted-foreground" /> Solicitar Orçamento
            </button>
            <button onClick={() => go("/calculadora-de-carga")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-primary">
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
