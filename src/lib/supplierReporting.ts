import { supabase } from "@/integrations/supabase/client";

export const VALID_SUPPLIER_ORDER_STATUSES = ["confirmed", "processing", "shipped", "delivered"] as const;

export type SupplierReportPeriod = "all" | "30d" | "90d" | "year";

interface SupplierProductRow {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  original_price: number | null;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  reseller_id: string | null;
}

interface SupplierLinkRow {
  product_id: string;
  stock_quantity: number;
  custom_price: number | null;
  reseller_price: number | null;
  store_commission_pct: number | null;
  is_active: boolean;
}

export interface SupplierSalesData {
  product_id: string;
  total_qty: number;
  total_value: number;
  total_supplier_revenue: number;
  total_store_revenue: number;
}

export interface SupplierReportProduct extends SupplierProductRow {
  reseller_stock: number | null;
  custom_price: number | null;
  reseller_price: number | null;
  store_commission_pct: number | null;
  is_legacy_owner: boolean;
  salePrice: number;
  supplierUnitCost: number;
  storeMarkupPct: number;
  storeUnitRevenue: number;
  stock: number;
  inventorySaleValue: number;
  inventorySupplierCost: number;
  inventoryStoreRevenue: number;
}

export interface SupplierReportSummary {
  totalProducts: number;
  totalStock: number;
  totalInventorySaleValue: number;
  totalInventorySupplierCost: number;
  totalInventoryStoreRevenue: number;
  totalSold: number;
  totalSalesRevenue: number;
  totalSupplierRevenueFromSales: number;
  totalStoreRevenueFromSales: number;
}

export interface SupplierReportData {
  products: SupplierReportProduct[];
  salesData: SupplierSalesData[];
  summary: SupplierReportSummary;
}

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const toNumber = (value: unknown) => Number(value ?? 0) || 0;

const getFromDate = (period: SupplierReportPeriod) => {
  if (period === "all") return null;

  const now = new Date();
  if (period === "30d") return new Date(now.getTime() - 30 * 86400000);
  if (period === "90d") return new Date(now.getTime() - 90 * 86400000);
  return new Date(now.getFullYear(), 0, 1);
};

const buildMarkupPct = (salePrice: number, supplierUnitCost: number, storedPct: number | null) => {
  if (storedPct != null) return storedPct;
  if (salePrice <= 0 || supplierUnitCost <= 0) return 0;
  return roundCurrency(((salePrice - supplierUnitCost) / supplierUnitCost) * 100);
};

const buildProductFinancials = (
  product: SupplierProductRow,
  link: SupplierLinkRow | undefined,
  resellerId: string,
): SupplierReportProduct => {
  const isLegacyOwner = product.reseller_id === resellerId;
  const salePrice = roundCurrency(toNumber(isLegacyOwner ? product.price : (link?.custom_price ?? product.price)));
  const supplierUnitCost = roundCurrency(toNumber(link?.reseller_price));
  const stock = isLegacyOwner
    ? toNumber(product.stock_quantity)
    : toNumber(link?.stock_quantity ?? product.stock_quantity);
  const inventorySaleValue = roundCurrency(salePrice * stock);
  const inventorySupplierCost = roundCurrency(supplierUnitCost * stock);
  const inventoryStoreRevenue = roundCurrency(Math.max(0, inventorySaleValue - inventorySupplierCost));

  return {
    ...product,
    reseller_stock: link?.stock_quantity ?? null,
    custom_price: link?.custom_price ?? null,
    reseller_price: link?.reseller_price ?? null,
    store_commission_pct: link?.store_commission_pct ?? null,
    is_legacy_owner: isLegacyOwner,
    salePrice,
    supplierUnitCost,
    storeMarkupPct: buildMarkupPct(salePrice, supplierUnitCost, link?.store_commission_pct ?? null),
    storeUnitRevenue: roundCurrency(Math.max(0, salePrice - supplierUnitCost)),
    stock,
    inventorySaleValue,
    inventorySupplierCost,
    inventoryStoreRevenue,
  };
};

export const buildSupplierSummary = (
  products: SupplierReportProduct[],
  salesData: SupplierSalesData[],
): SupplierReportSummary => ({
  totalProducts: products.length,
  totalStock: products.reduce((sum, product) => sum + product.stock, 0),
  totalInventorySaleValue: roundCurrency(products.reduce((sum, product) => sum + product.inventorySaleValue, 0)),
  totalInventorySupplierCost: roundCurrency(products.reduce((sum, product) => sum + product.inventorySupplierCost, 0)),
  totalInventoryStoreRevenue: roundCurrency(products.reduce((sum, product) => sum + product.inventoryStoreRevenue, 0)),
  totalSold: salesData.reduce((sum, sale) => sum + sale.total_qty, 0),
  totalSalesRevenue: roundCurrency(salesData.reduce((sum, sale) => sum + sale.total_value, 0)),
  totalSupplierRevenueFromSales: roundCurrency(salesData.reduce((sum, sale) => sum + sale.total_supplier_revenue, 0)),
  totalStoreRevenueFromSales: roundCurrency(salesData.reduce((sum, sale) => sum + sale.total_store_revenue, 0)),
});

export const loadSupplierReport = async (
  resellerId: string,
  period: SupplierReportPeriod = "all",
): Promise<SupplierReportData> => {
  const [legacyRes, linkRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, sku, price, original_price, stock_quantity, image_url, is_active, reseller_id")
      .eq("reseller_id", resellerId)
      .order("name"),
    supabase
      .from("product_resellers")
      .select("product_id, stock_quantity, custom_price, reseller_price, store_commission_pct, is_active")
      .eq("reseller_id", resellerId)
      .eq("is_active", true),
  ]);

  if (legacyRes.error) throw legacyRes.error;
  if (linkRes.error) throw linkRes.error;

  const legacyProducts = (legacyRes.data || []) as SupplierProductRow[];
  const links = (linkRes.data || []) as SupplierLinkRow[];
  const linksByProductId = new Map(links.map((link) => [link.product_id, link]));
  const legacyIds = new Set(legacyProducts.map((product) => product.id));
  const extraProductIds = links.map((link) => link.product_id).filter((productId) => !legacyIds.has(productId));

  let extraProducts: SupplierProductRow[] = [];
  if (extraProductIds.length > 0) {
    const extraRes = await supabase
      .from("products")
      .select("id, name, sku, price, original_price, stock_quantity, image_url, is_active, reseller_id")
      .in("id", extraProductIds);

    if (extraRes.error) throw extraRes.error;
    extraProducts = (extraRes.data || []) as SupplierProductRow[];
  }

  const seen = new Set<string>();
  const products = [...legacyProducts, ...extraProducts]
    .filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    })
    .map((product) => buildProductFinancials(product, linksByProductId.get(product.id), resellerId));

  if (products.length === 0) {
    return {
      products: [],
      salesData: [],
      summary: buildSupplierSummary([], []),
    };
  }

  const productIds = products.map((product) => product.id);
  const itemsRes = await supabase
    .from("order_items")
    .select("product_id, quantity, price_at_purchase, order_id")
    .in("product_id", productIds);

  if (itemsRes.error) throw itemsRes.error;

  const items = itemsRes.data || [];
  if (items.length === 0) {
    return {
      products,
      salesData: [],
      summary: buildSupplierSummary(products, []),
    };
  }

  const orderIds = [...new Set(items.map((item) => item.order_id))];
  let ordersQuery = supabase
    .from("orders")
    .select("id, created_at")
    .in("id", orderIds)
    .in("status", [...VALID_SUPPLIER_ORDER_STATUSES]);

  const fromDate = getFromDate(period);
  if (fromDate) {
    ordersQuery = ordersQuery.gte("created_at", fromDate.toISOString());
  }

  const ordersRes = await ordersQuery;
  if (ordersRes.error) throw ordersRes.error;

  const validOrderIds = new Set((ordersRes.data || []).map((order) => order.id));
  const productMap = new Map(products.map((product) => [product.id, product]));
  const salesMap = new Map<string, SupplierSalesData>();

  items.forEach((item) => {
    if (!item.product_id || !validOrderIds.has(item.order_id)) return;

    const product = productMap.get(item.product_id);
    if (!product) return;

    const quantity = toNumber(item.quantity);
    const soldValue = roundCurrency(quantity * toNumber(item.price_at_purchase));
    const configuredSupplierRevenue = roundCurrency(quantity * product.supplierUnitCost);
    const supplierRevenue = roundCurrency(Math.min(soldValue, configuredSupplierRevenue));
    const storeRevenue = roundCurrency(Math.max(0, soldValue - supplierRevenue));

    const existing = salesMap.get(item.product_id) || {
      product_id: item.product_id,
      total_qty: 0,
      total_value: 0,
      total_supplier_revenue: 0,
      total_store_revenue: 0,
    };

    existing.total_qty += quantity;
    existing.total_value = roundCurrency(existing.total_value + soldValue);
    existing.total_supplier_revenue = roundCurrency(existing.total_supplier_revenue + supplierRevenue);
    existing.total_store_revenue = roundCurrency(existing.total_store_revenue + storeRevenue);
    salesMap.set(item.product_id, existing);
  });

  const salesData = Array.from(salesMap.values());

  return {
    products,
    salesData,
    summary: buildSupplierSummary(products, salesData),
  };
};
