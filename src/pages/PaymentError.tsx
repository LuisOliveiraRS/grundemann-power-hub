import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ShoppingCart, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PaymentError = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const orderId = searchParams.get("order_id");
  const [retrying, setRetrying] = useState(false);

  const retryPayment = async () => {
    if (!orderId || !user) return;
    setRetrying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { order_id: orderId },
      });
      if (error || !data) throw new Error(error?.message || "Falha ao criar pagamento");
      const paymentUrl = data.init_point || data.sandbox_init_point;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("URL de pagamento não retornada");
      }
    } catch (err: any) {
      toast({
        title: "Erro ao processar pagamento",
        description: "Tente novamente ou entre em contato conosco.",
        variant: "destructive",
      });
    } finally {
      setRetrying(false);
    }
  };

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
            className="bg-destructive/10 rounded-full p-6 inline-flex mb-6"
          >
            <XCircle className="h-16 w-16 text-destructive" />
          </motion.div>

          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">
            Pagamento não concluído ❌
          </h1>
          <p className="text-muted-foreground mb-6">
            Infelizmente o pagamento não foi aprovado. Não se preocupe, seu pedido foi salvo e você pode tentar novamente.
          </p>

          {orderId && (
            <div className="bg-muted/50 border border-border rounded-xl p-5 text-left mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pedido</span>
                <span className="font-mono font-bold text-sm">#{orderId.slice(0, 8)}</span>
              </div>
            </div>
          )}

          <div className="bg-muted/30 border border-border rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="text-sm font-semibold">Possíveis causas:</p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>Saldo insuficiente no cartão</li>
              <li>Dados do cartão incorretos</li>
              <li>Cartão bloqueado pelo banco</li>
              <li>Limite de crédito excedido</li>
            </ul>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Tente outra forma de pagamento ou entre em contato com seu banco.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/produtos")}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Continuar Comprando
            </Button>
            {orderId && (
              <Button onClick={retryPayment} disabled={retrying}>
                {retrying ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
                ) : (
                  <><CreditCard className="h-4 w-4 mr-2" /> Tentar Novamente</>
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/minha-conta")}>
              Ver Meus Pedidos
            </Button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentError;
