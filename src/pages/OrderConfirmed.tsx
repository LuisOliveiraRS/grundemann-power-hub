import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { CheckCircle, Package, Truck, ArrowRight, ShoppingCart, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { syncPaymentStatus } from "@/lib/paymentSync";

interface OrderDetail {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: string | null;
  items: { product_name: string; quantity: number; price_at_purchase: number }[];
}

const OrderConfirmed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("loading");
  const orderId = searchParams.get("order_id");

  const loadOrder = async () => {
    if (!orderId || !user) return;
    const { data: o } = await supabase
      .from("orders")
      .select("id, total_amount, status, created_at, shipping_address")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();
    if (!o) return;
    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, quantity, price_at_purchase")
      .eq("order_id", orderId);
    setOrder({ ...o, items: items || [] } as OrderDetail);

    // Check payment status
    const { data: payment } = await supabase
      .from("payments")
      .select("status")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (payment) {
      setPaymentStatus(payment.status);
    } else {
      setPaymentStatus("pending");
    }
  };

  // Initial load
  useEffect(() => {
    if (!orderId || !user) return;
    loadOrder();
  }, [orderId, user]);

  // Realtime subscription for payment and order updates
  useEffect(() => {
    if (!orderId || !user) return;

    const channel = supabase
      .channel(`order-confirmed-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'payments',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        const newStatus = (payload.new as any)?.status;
        if (newStatus) setPaymentStatus(newStatus);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        const newOrder = payload.new as any;
        if (newOrder) {
          setOrder(prev => prev ? { ...prev, status: newOrder.status } : prev);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, user]);

  // Poll + sync fallback every 5 seconds while pending
  useEffect(() => {
    if (paymentStatus !== "pending" && paymentStatus !== "loading") return;

    const interval = setInterval(async () => {
      if (!orderId) return;
      try {
        await syncPaymentStatus(orderId);
      } catch (error) {
        console.error("OrderConfirmed sync error:", error);
      } finally {
        await loadOrder();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentStatus, orderId, user]);

  const isConfirmed = paymentStatus === "approved" || order?.status === "confirmed";
  const isPending = paymentStatus === "pending" || paymentStatus === "loading";

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <div className="flex-1 bg-muted/50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-card rounded-2xl border border-border shadow-xl max-w-lg w-full p-8 md:p-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={`rounded-full p-6 inline-flex mb-6 ${isConfirmed ? "bg-primary/10" : "bg-accent/10"}`}
          >
            {isConfirmed ? (
              <CheckCircle className="h-16 w-16 text-primary" />
            ) : isPending ? (
              <Loader2 className="h-16 w-16 text-accent animate-spin" />
            ) : (
              <Clock className="h-16 w-16 text-accent" />
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-heading text-2xl md:text-3xl font-bold mb-2"
          >
            {isConfirmed
              ? "Pagamento Confirmado! ✅"
              : isPending
                ? "Aguardando Confirmação..."
                : "Pedido Recebido"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground mb-6"
          >
            {isConfirmed
              ? "Obrigado pela sua compra! Seu pagamento foi aprovado com sucesso."
              : isPending
                ? "Estamos processando seu pagamento. Esta página atualizará automaticamente."
                : "Seu pedido foi recebido e está sendo processado."}
          </motion.p>

          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-muted/50 border border-border rounded-xl p-5 text-left mb-6 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pedido</span>
                <span className="font-mono font-bold text-sm">#{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-heading font-bold text-lg text-price">
                  R$ {Number(order.total_amount).toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  isConfirmed
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent/20 text-accent-foreground"
                }`}>
                  {isConfirmed ? "Confirmado" : isPending ? "Processando..." : order.status}
                </span>
              </div>

              {order.items.length > 0 && (
                <div className="pt-3 border-t border-border space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Package className="h-3 w-3" /> Produtos
                  </p>
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span className="font-medium">R$ {(item.quantity * Number(item.price_at_purchase)).toFixed(2).replace(".", ",")}</span>
                    </div>
                  ))}
                </div>
              )}

              {order.shipping_address && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Truck className="h-3 w-3" /> {order.shipping_address}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button variant="outline" onClick={() => navigate("/produtos")}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Continuar Comprando
            </Button>
            <Button onClick={() => navigate("/minha-conta")}>
              Ver Meus Pedidos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderConfirmed;
