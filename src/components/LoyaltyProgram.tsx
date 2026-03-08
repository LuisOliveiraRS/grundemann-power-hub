import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, Gift, Trophy, Zap, Clock, CheckCircle, Award, Ticket } from "lucide-react";

interface PointEntry {
  id: string;
  points: number;
  type: string;
  description: string;
  created_at: string;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: string;
  reward_value: number;
  image_url: string | null;
}

interface Redemption {
  id: string;
  points_spent: number;
  status: string;
  created_at: string;
  reward_id: string;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  is_used: boolean;
  expires_at: string | null;
  created_at: string;
}

const tierConfig = [
  { name: "Bronze", min: 0, max: 499, color: "text-amber-700", bg: "bg-amber-100", icon: Star },
  { name: "Prata", min: 500, max: 1499, color: "text-muted-foreground", bg: "bg-muted", icon: Award },
  { name: "Ouro", min: 1500, max: 4999, color: "text-yellow-500", bg: "bg-yellow-50", icon: Trophy },
  { name: "Diamante", min: 5000, max: Infinity, color: "text-primary", bg: "bg-primary/10", icon: Zap },
];

const LoyaltyProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [totalPoints, setTotalPoints] = useState(0);
  const [history, setHistory] = useState<PointEntry[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [tab, setTab] = useState<"rewards" | "history" | "redemptions" | "coupons">("rewards");

  useEffect(() => {
    if (user) {
      loadPoints();
      loadRewards();
      loadRedemptions();
      loadCoupons();
    }
  }, [user]);

  const loadPoints = async () => {
    const { data } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) {
      setHistory(data as PointEntry[]);
      const total = data.reduce((sum, p) => {
        return sum + (p.type === "earn" ? p.points : -p.points);
      }, 0);
      setTotalPoints(Math.max(0, total));
    }
  };

  const loadRewards = async () => {
    const { data } = await supabase
      .from("rewards")
      .select("*")
      .eq("is_active", true)
      .order("points_required", { ascending: true });
    if (data) setRewards(data as Reward[]);
  };

  const loadRedemptions = async () => {
    const { data } = await supabase
      .from("reward_redemptions")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setRedemptions(data as Redemption[]);
  };

  const loadCoupons = async () => {
    const { data } = await supabase
      .from("discount_coupons")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setCoupons(data as Coupon[]);
  };

  const redeemReward = async (reward: Reward) => {
    if (totalPoints < reward.points_required) {
      toast({ title: "Pontos insuficientes", description: `Você precisa de ${reward.points_required} pontos.`, variant: "destructive" });
      return;
    }
    setRedeeming(reward.id);
    // Insert redemption
    const { error: redeemError } = await supabase.from("reward_redemptions").insert({
      user_id: user!.id,
      reward_id: reward.id,
      points_spent: reward.points_required,
      status: "pending",
    });
    if (redeemError) {
      toast({ title: "Erro", description: redeemError.message, variant: "destructive" });
      setRedeeming(null);
      return;
    }
    // Deduct points (admin-managed, but we record the deduction)
    // Points deduction would be handled by admin approval in production
    toast({ title: "Resgate solicitado! 🎉", description: `${reward.name} será processado em breve.` });
    setRedeeming(null);
    loadRedemptions();
  };

  const currentTier = tierConfig.find(t => totalPoints >= t.min && totalPoints <= t.max) || tierConfig[0];
  const nextTier = tierConfig[tierConfig.indexOf(currentTier) + 1];
  const progressToNext = nextTier
    ? ((totalPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  const TierIcon = currentTier.icon;

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold flex items-center gap-2">
            <div className="bg-primary/10 rounded-lg p-2"><Gift className="h-5 w-5 text-primary" /></div>
            Programa de Fidelidade
          </h2>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentTier.bg}`}>
            <TierIcon className={`h-5 w-5 ${currentTier.color}`} />
            <span className={`font-heading font-bold text-sm ${currentTier.color}`}>{currentTier.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-xl p-5 text-center">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="font-heading text-3xl font-bold text-foreground">{totalPoints}</p>
            <p className="text-sm text-muted-foreground">Pontos Disponíveis</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 text-center">
            <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-heading text-3xl font-bold text-foreground">{redemptions.length}</p>
            <p className="text-sm text-muted-foreground">Resgates Realizados</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 text-center">
            <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="font-heading text-3xl font-bold text-foreground">{currentTier.name}</p>
            <p className="text-sm text-muted-foreground">Nível Atual</p>
          </div>
        </div>

        {nextTier && (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso para <strong className={nextTier.color}>{nextTier.name}</strong></span>
              <span className="font-semibold">{totalPoints}/{nextTier.min} pontos</span>
            </div>
            <Progress value={progressToNext} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">Faltam {nextTier.min - totalPoints} pontos para o próximo nível</p>
          </div>
        )}

        <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm font-semibold text-primary mb-1">💡 Como ganhar pontos?</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• A cada R$ 1,00 em compras = 1 ponto</li>
            <li>• Avaliação de produto = 50 pontos</li>
            <li>• Indicação de amigo = 100 pontos</li>
            <li>• Primeira compra = 200 pontos bônus</li>
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-1">
        {[
          { id: "rewards" as const, label: "Recompensas", icon: Gift },
          { id: "coupons" as const, label: `Cupons${coupons.filter(c => !c.is_used).length > 0 ? ` (${coupons.filter(c => !c.is_used).length})` : ""}`, icon: Ticket },
          { id: "history" as const, label: "Histórico", icon: Clock },
          { id: "redemptions" as const, label: "Meus Resgates", icon: CheckCircle },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? "bg-card border border-b-0 border-border text-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Rewards */}
      {tab === "rewards" && (
        <div>
          {rewards.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading font-bold text-lg mb-2">Nenhuma recompensa disponível</h3>
              <p className="text-muted-foreground">Em breve teremos recompensas exclusivas para você!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map(r => {
                const canRedeem = totalPoints >= r.points_required;
                return (
                  <div key={r.id} className={`bg-card rounded-xl border shadow-sm overflow-hidden transition-all ${canRedeem ? "border-primary/30 hover:shadow-md" : "border-border opacity-75"}`}>
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 flex items-center justify-center h-32">
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.name} className="max-h-full object-contain" />
                      ) : (
                        <Gift className="h-16 w-16 text-primary/30" />
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-heading font-bold text-sm">{r.name}</h4>
                      {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant={canRedeem ? "default" : "secondary"} className="text-xs">
                          <Star className="h-3 w-3 mr-1" /> {r.points_required} pts
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {r.reward_type === "discount" ? `R$ ${Number(r.reward_value).toFixed(0)} off` : `${r.reward_value}% off`}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        disabled={!canRedeem || redeeming === r.id}
                        onClick={() => redeemReward(r)}
                      >
                        {redeeming === r.id ? "Resgatando..." : canRedeem ? "Resgatar" : "Pontos Insuficientes"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="bg-card rounded-xl border border-border">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading font-bold text-lg mb-2">Nenhuma movimentação</h3>
              <p className="text-muted-foreground">Faça sua primeira compra para ganhar pontos!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${entry.type === "earn" ? "bg-primary/10" : "bg-destructive/10"}`}>
                      {entry.type === "earn" ? (
                        <Zap className="h-4 w-4 text-primary" />
                      ) : (
                        <Gift className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-heading font-bold ${entry.type === "earn" ? "text-primary" : "text-destructive"}`}>
                    {entry.type === "earn" ? "+" : "-"}{entry.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Redemptions */}
      {tab === "redemptions" && (
        <div className="bg-card rounded-xl border border-border">
          {redemptions.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading font-bold text-lg mb-2">Nenhum resgate</h3>
              <p className="text-muted-foreground">Resgate suas recompensas na aba acima!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {redemptions.map(rd => {
                const reward = rewards.find(r => r.id === rd.reward_id);
                return (
                  <div key={rd.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">{reward?.name || "Recompensa"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(rd.created_at).toLocaleDateString("pt-BR")} • {rd.points_spent} pontos
                      </p>
                    </div>
                    <Badge variant={rd.status === "approved" ? "default" : rd.status === "rejected" ? "destructive" : "secondary"}>
                      {rd.status === "pending" ? "Pendente" : rd.status === "approved" ? "Aprovado" : "Rejeitado"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Coupons */}
      {tab === "coupons" && (
        <div className="bg-card rounded-xl border border-border">
          {coupons.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading font-bold text-lg mb-2">Nenhum cupom</h3>
              <p className="text-muted-foreground">Resgate recompensas para ganhar cupons de desconto!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {coupons.map(c => {
                const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                return (
                  <div key={c.id} className={`p-4 flex items-center justify-between ${c.is_used || isExpired ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${c.is_used ? "bg-muted" : "bg-primary/10"}`}>
                        <Ticket className={`h-5 w-5 ${c.is_used ? "text-muted-foreground" : "text-primary"}`} />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-sm">{c.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.discount_type === "percentage" ? `${c.discount_value}% de desconto` : c.discount_type === "freeShipping" ? "Frete Grátis" : `R$ ${Number(c.discount_value).toFixed(2).replace(".", ",")} de desconto`}
                        </p>
                        {c.expires_at && (
                          <p className="text-[10px] text-muted-foreground">
                            Válido até {new Date(c.expires_at).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={c.is_used ? "secondary" : isExpired ? "destructive" : "default"}>
                      {c.is_used ? "Usado" : isExpired ? "Expirado" : "Disponível"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoyaltyProgram;
