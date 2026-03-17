import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Package, ShoppingCart, Users, LogOut, Tag, MessageSquare,
  TrendingUp, DollarSign, Globe, Megaphone, Wrench, Mail, Gift,
  BookOpen, Paintbrush, FileText, Truck, Boxes, BarChart3, Store, Cpu, Stethoscope
} from "lucide-react";
import logo from "@/assets/logo-grundemann.png";
import type { AdminTab } from "@/types/admin";

interface AdminSidebarProps {
  tab: AdminTab;
  setTab: (tab: AdminTab) => void;
  pendingOrders: number;
}

const sideItems = [
  { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { key: "products" as const, label: "Produtos", icon: Package },
  { key: "orders" as const, label: "Pedidos", icon: ShoppingCart },
  { key: "categories" as const, label: "Categorias", icon: Tag },
  { key: "clients" as const, label: "Clientes", icon: Users },
  { key: "testimonials" as const, label: "Depoimentos", icon: MessageSquare },
  { key: "sellers" as const, label: "Vendedores", icon: Users },
  { key: "roles" as const, label: "Permissões", icon: Users },
  { key: "mechanics" as const, label: "Área do Revendedor e Mecânico", icon: Wrench },
  { key: "marketing" as const, label: "Marketing", icon: Megaphone },
  { key: "seo" as const, label: "SEO", icon: Globe },
  { key: "shipping" as const, label: "Frete", icon: Truck },
  { key: "stock" as const, label: "Estoque & ML", icon: Boxes },
  { key: "product-resellers" as const, label: "Produto × Revendedor", icon: Store },
  { key: "compatibility" as const, label: "Compatibilidade", icon: Cpu },
  { key: "subscribers" as const, label: "Leads & Cupons", icon: Mail },
  { key: "rewards" as const, label: "Fidelidade", icon: Gift },
  { key: "analytics" as const, label: "Analytics", icon: TrendingUp },
  { key: "price-research" as const, label: "Preços Concorrência", icon: DollarSign },
  { key: "reports" as const, label: "Relatórios", icon: BarChart3 },
  { key: "site-report" as const, label: "Relatório do Site", icon: FileText },
  { key: "appearance" as const, label: "Aparência", icon: Paintbrush },
];

const mechanicSubTabs: AdminTab[] = ["mechanics", "mechanic-videos", "articles", "catalogs", "quotes", "exploded-views"];

const AdminSidebar = ({ tab, setTab, pendingOrders }: AdminSidebarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-screen flex flex-col shadow-xl">
      <div className="p-5 border-b border-sidebar-border">
        <img src={logo} alt="Gründemann" className="h-12 w-auto brightness-200" />
        <p className="text-xs text-sidebar-foreground/50 mt-2">Painel Administrativo</p>
        <button onClick={() => navigate("/")} className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-sidebar-primary/20 text-sidebar-primary-foreground hover:bg-sidebar-primary/30 transition-colors">
          <Globe className="h-4 w-4" /> Ver Loja
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sideItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === item.key || (item.key === "mechanics" && mechanicSubTabs.includes(tab))
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
            {item.key === "orders" && pendingOrders > 0 && (
              <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0 animate-pulse">{pendingOrders}</Badge>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors">
          <LogOut className="h-5 w-5" /> Sair
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
