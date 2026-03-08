import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
  user_id: string;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <button key={i} type="button" disabled={!interactive}
        onClick={() => onRate?.(i)}
        className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}>
        <Star className={`h-5 w-5 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      </button>
    ))}
  </div>
);

const ProductReviews = ({ productId, productName }: ProductReviewsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: "", comment: "" });
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => { loadReviews(); }, [productId]);

  const loadReviews = async () => {
    const { data } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    setReviews((data || []) as Review[]);
    if (user) {
      const { data: own } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .maybeSingle();
      setHasReviewed(!!own);
    }
    setLoading(false);
  };

  const submitReview = async () => {
    if (!user) return;
    if (!form.comment.trim()) { toast({ title: "Escreva um comentário", variant: "destructive" }); return; }
    setSubmitting(true);
    // Check if user purchased this product
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("id, order_id")
      .eq("product_id", productId);
    let isVerified = false;
    if (orderItems && orderItems.length > 0) {
      const orderIds = orderItems.map(oi => oi.order_id);
      const { data: userOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .in("id", orderIds)
        .eq("status", "delivered");
      isVerified = (userOrders && userOrders.length > 0) || false;
    }
    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating: form.rating,
      title: form.title || null,
      comment: form.comment.trim(),
      is_verified_purchase: isVerified,
    });
    if (error) {
      toast({ title: "Erro ao enviar avaliação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Avaliação enviada!", description: "Será publicada após aprovação." });
      setShowForm(false);
      setForm({ rating: 5, title: "", comment: "" });
      setHasReviewed(true);
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({ stars: r, count: reviews.filter(rv => rv.rating === r).length }));

  return (
    <div className="mt-8 border-t border-border pt-8">
      <h2 className="font-heading text-2xl font-bold mb-6">Avaliações de Clientes</h2>

      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <p className="font-heading text-5xl font-extrabold text-foreground">{avgRating.toFixed(1)}</p>
            <StarRating rating={Math.round(avgRating)} />
            <p className="text-sm text-muted-foreground mt-1">{reviews.length} avaliação(ões)</p>
          </div>
          <div className="col-span-2 space-y-1.5">
            {ratingCounts.map(rc => (
              <div key={rc.stars} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right">{rc.stars}★</span>
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: reviews.length ? `${(rc.count / reviews.length) * 100}%` : "0%" }} />
                </div>
                <span className="w-6 text-muted-foreground">{rc.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {user && !hasReviewed && (
        <div className="mb-8">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Star className="h-4 w-4 mr-2" /> Avaliar este produto
            </Button>
          ) : (
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-heading font-bold">Sua Avaliação</h3>
              <div>
                <p className="text-sm font-medium mb-1">Nota</p>
                <StarRating rating={form.rating} onRate={(r) => setForm(f => ({ ...f, rating: r }))} interactive />
              </div>
              <Input placeholder="Título da avaliação (opcional)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={100} />
              <Textarea placeholder="Escreva seu comentário sobre o produto..." value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} maxLength={1000} rows={4} />
              <div className="flex gap-2">
                <Button onClick={submitReview} disabled={submitting}>{submitting ? "Enviando..." : "Enviar Avaliação"}</Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {reviews.length === 0 && !loading && (
        <p className="text-muted-foreground text-center py-8">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
      )}

      <div className="space-y-4">
        {reviews.map(r => (
          <div key={r.id} className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <StarRating rating={r.rating} />
                {r.is_verified_purchase && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <CheckCircle className="h-3 w-3" /> Compra Verificada
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
            {r.title && <p className="font-semibold text-sm mb-1">{r.title}</p>}
            <p className="text-sm text-muted-foreground">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;

export const getReviewAggregateSchema = (reviews: Review[], productName: string) => {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return {
    "@type": "AggregateRating",
    ratingValue: avg.toFixed(1),
    reviewCount: reviews.length,
    bestRating: "5",
    worstRating: "1",
  };
};
