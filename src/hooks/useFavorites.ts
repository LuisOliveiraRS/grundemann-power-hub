import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user) { setFavoriteIds(new Set()); return; }
    const { data } = await supabase
      .from("favorites" as any)
      .select("product_id")
      .eq("user_id", user.id);
    setFavoriteIds(new Set((data || []).map((f: any) => f.product_id)));
  }, [user]);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  const toggleFavorite = useCallback(async (productId: string, productName?: string) => {
    if (!user) return false;
    setLoading(true);
    const isFav = favoriteIds.has(productId);
    if (isFav) {
      await supabase.from("favorites" as any).delete().eq("user_id", user.id).eq("product_id", productId);
      setFavoriteIds(prev => { const next = new Set(prev); next.delete(productId); return next; });
      toast({ title: "Removido dos favoritos" });
    } else {
      await supabase.from("favorites" as any).insert({ user_id: user.id, product_id: productId } as any);
      setFavoriteIds(prev => new Set(prev).add(productId));
      toast({ title: `${productName || "Produto"} adicionado aos favoritos!` });
    }
    setLoading(false);
    return !isFav;
  }, [user, favoriteIds, toast]);

  return { favoriteIds, toggleFavorite, loading, isFavorite: (id: string) => favoriteIds.has(id) };
};
