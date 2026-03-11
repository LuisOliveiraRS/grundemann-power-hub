import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Clock, ShoppingCart, ArrowRight, QrCode, Banknote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { syncPaymentStatus } from "@/lib/paymentSync";

const terminalPaymentStatuses = ["approved", "rejected", "cancelled", "refunded"];

const PaymentPending = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const orderId = searchParams.get("order_id");
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [orderStatus, setOrderStatus] = useState<string>("pending");
  const [syncing, setSyncing] = useState(false);

  const isWaiting = useMemo(
    () => !terminalPaymentStatuses.includes(paymentStatus) && orderStatus !== "confirmed",
    [paymentStatus, orderStatus]
  );

  const loadStatus = async () => {
    if (!orderId || !user) return;

    const [{ data: order }, { data: payment }] = await Promise.all([
      supabase
        .from("orders")
        .select("total_amount, status")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("payments")
        .select("status")
        .eq("order_id", orderId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (order) {
      setOrderTotal(Number(order.total_amount));
      setOrderStatus(order.status);
    }

    if (payment?.status) {
      setPaymentStatus(payment.status);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, [orderId, user]);

  useEffect(() => {
    if (!orderId || !user) return;

    const channel = supabase
      .channel(`payment-pending-${orderId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "payments",
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        const status = (payload.new as { status?: string } | null)?.status;
        if (status) setPaymentStatus(status);
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        const status = (payload.new as { status?: string } | null)?.status;
        if (status) setOrderStatus(status);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, user]);

  useEffect(() => {
    if (!orderId || !user || !isWaiting) return;

    const interval = window.setInterval(async () => {
      try {
        setSyncing(true);
        await syncPaymentStatus(orderId);
        await loadStatus();
      } catch (error) {
        console.error("Payment sync error:", error);
      } finally {
        setSyncing(false);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [orderId, user, isWaiting]);

  useEffect(() => {
    if (!orderId) return;

    if (paymentStatus === "approved" || orderStatus === "confirmed") {
      navigate(`/pedido-confirmado?order_id=${orderId}`, { replace: true });
      return;
    }

    if (["rejected", "cancelled", "refunded"].includes(paymentStatus) || orderStatus === "cancelled") {
      navigate(`/pagamento-erro?order_id=${orderId}`, { replace: true });
    }
  }, [navigate, orderId, orderStatus, paymentStatus]);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <div className="flex-1 bg-muted/50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-card rounded-2xl border border-border shadow-xl max-w-lg w-full p-8 md:p-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="bg-accent/20 rounded-full p-6 inline-flex mb-6"
          >
            <Clock className="h-16 w-16 text-accent-foreground" />
          </motion.div>

          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">
            Pagamento Pendente ⏳
          </h1>
          <p className="text-muted-foreground mb-6">
            Seu pedido foi criado com sucesso! O pagamento está sendo processado.
          </p>

          {orderId && (
            <div className="bg-muted/50 border border-border rounded-xl p-5 text-left mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pedido</span>
                <span className="font-mono font-bold text-sm">#{orderId.slice(0, 8)}</span>
              </div>
              {orderTotal !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-heading font-bold text-lg text-price">
                    R$ {orderTotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-xs bg-accent/20 text-accent-foreground px-3 py-1 rounded-full font-semibold border border-accent/30">
                  Aguardando Pagamento
                </span>
              </div>
            </div>
          )}

          <div className="bg-muted/30 border border-border rounded-xl p-4 mb-6 text-left space-y-3">
            <p className="text-sm font-semibold">O que acontece agora?</p>
            <div className="flex items-start gap-3">
              <QrCode className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">PIX</p>
                <p className="text-xs text-muted-foreground">Confirmação instantânea após o pagamento.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Banknote className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Boleto</p>
                <p className="text-xs text-muted-foreground">Confirmação em até 2 dias úteis após o pagamento.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Você receberá uma notificação quando o pagamento for confirmado.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/produtos")}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Continuar Comprando
            </Button>
            <Button onClick={() => navigate("/minha-conta")}>
              Acompanhar Pedido
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentPending;
