import { supabase } from "@/integrations/supabase/client";

export interface SyncPaymentStatusResult {
  ok: boolean;
  synced?: boolean;
  payment_status?: string;
  order_status?: string;
  mercadopago_status?: string;
  error?: string;
}

export const syncPaymentStatus = async (orderId: string) => {
  const { data, error } = await supabase.functions.invoke("sync-payment-status", {
    body: { order_id: orderId },
  });

  if (error) throw error;
  return (data ?? { ok: false }) as SyncPaymentStatusResult;
};
