export interface Product {
  id: string; name: string; description: string | null; sku: string | null;
  price: number; original_price: number | null; stock_quantity: number;
  is_active: boolean; is_featured: boolean; free_shipping?: boolean; category_id: string | null;
  subcategory_id?: string | null; image_url: string | null; created_at: string;
  additional_images?: string[] | null; video_url?: string | null;
  reseller_id?: string | null; fuel_type?: string | null; slug?: string | null;
  menu_category_id?: string | null; brand?: string | null; hp?: string | null;
  engine_model?: string | null; specifications?: any; documents?: string[] | null;
  weight_kg?: number | null; width_cm?: number | null; height_cm?: number | null;
  length_cm?: number | null; tags?: string[] | null;
}

export interface FornecedorOption {
  id: string;
  company_name: string;
  user_id: string;
}

/** @deprecated Use FornecedorOption instead */
export type ResellerOption = FornecedorOption;

export interface PaymentInfo {
  id: string; order_id: string; status: string; payment_method: string | null;
  mp_payment_id: string | null; amount: number; paid_at: string | null;
}

export interface OrderItem {
  id: string; product_name: string; quantity: number; price_at_purchase: number;
}

export interface OrderWithItems {
  id: string; user_id: string; status: string; total_amount: number;
  created_at: string; shipping_address: string | null; notes: string | null;
  tracking_code?: string | null;
  items?: OrderItem[];
  profile?: ProfileFull | null;
  payment?: PaymentInfo | null;
}

export interface Category {
  id: string; name: string; slug: string; description: string | null; image_url: string | null; is_visible?: boolean;
}

export interface Subcategory {
  id: string; name: string; slug: string; category_id: string; description: string | null;
}

export interface ProfileFull {
  user_id: string; full_name: string; email: string; phone: string | null;
  city: string | null; state: string | null; address: string | null;
  address_number: string | null; address_complement: string | null;
  neighborhood: string | null; zip_code: string | null;
  cpf_cnpj: string | null; company_name: string | null; notes: string | null;
}

export interface Testimonial {
  id: string; customer_name: string; customer_city: string;
  rating: number; comment: string; is_approved: boolean; created_at: string;
}

export interface ProductCategoryLink {
  product_id: string;
  category_id: string;
  subcategory_id: string | null;
}

export type AdminTab =
  | "dashboard" | "products" | "orders" | "categories" | "clients"
  | "testimonials" | "reports" | "sellers" | "quotes" | "roles"
  | "marketing" | "mechanics" | "mechanic-videos" | "articles"
  | "catalogs" | "exploded-views" | "stock" | "subscribers" | "rewards"
  | "seo" | "shipping" | "analytics" | "price-research" | "appearance"
  | "site-report" | "reseller-content" | "reseller-files" | "product-resellers" | "compatibility"
  | "diagnostics" | "intelligence" | "supplier-financial" | "banners";

export const statusLabel: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", processing: "Processando",
  shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
};

export const statusColor: Record<string, string> = {
  pending: "bg-accent/20 text-accent-foreground",
  confirmed: "bg-primary/20 text-primary",
  processing: "bg-secondary/10 text-secondary-foreground",
  shipped: "bg-primary text-primary-foreground",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive/20 text-destructive",
};

export const roleTypeLabel: Record<string, string> = {
  admin: "Admin", seller: "Vendedor", fornecedor: "Fornecedor",
  oficina: "Oficina", mecanico: "Mecânico", locadora: "Locadora", cliente: "Cliente",
};

export const roleTypeColor: Record<string, string> = {
  admin: "bg-destructive/20 text-destructive",
  seller: "bg-primary/20 text-primary",
  fornecedor: "bg-accent/20 text-accent-foreground",
  oficina: "bg-secondary/20 text-secondary-foreground",
  mecanico: "bg-primary/15 text-primary",
  locadora: "bg-primary/20 text-primary",
  cliente: "bg-muted text-muted-foreground",
};

export const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const exportCSV = (data: Record<string, any>[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map(row => headers.map(h => {
    const val = row[h];
    const str = val == null ? "" : String(val);
    return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};
