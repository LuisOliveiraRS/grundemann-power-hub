import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Copy, Share2, Gift, CheckCircle, ExternalLink } from "lucide-react";

interface Referral {
  id: string;
  referred_id: string;
  referrer_points_credited: boolean;
  created_at: string;
}

const ReferralProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referredNames, setReferredNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      loadReferralCode();
      loadReferrals();
    }
  }, [user]);

  const loadReferralCode = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("user_id", user!.id)
      .single();
    if (data?.referral_code) setReferralCode(data.referral_code);
  };

  const loadReferrals = async () => {
    const { data } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) {
      setReferrals(data as Referral[]);
      // Load referred user names
      const ids = data.map((r: any) => r.referred_id);
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", ids);
        if (profiles) {
          const map: Record<string, string> = {};
          profiles.forEach((p: any) => { map[p.user_id] = p.full_name || "Usuário"; });
          setReferredNames(map);
        }
      }
    }
  };

  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link copiado! 📋", description: "Compartilhe com seus amigos." });
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Gründemann - Indicação",
        text: `Use meu código ${referralCode} e ganhe 50 pontos de bônus!`,
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  const totalPointsEarned = referrals.filter(r => r.referrer_points_credited).length * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 rounded-lg p-2">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-heading text-xl font-bold">Indique e Ganhe</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-xl p-5 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-heading text-3xl font-bold text-foreground">{referrals.length}</p>
            <p className="text-sm text-muted-foreground">Amigos Indicados</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 text-center">
            <Gift className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="font-heading text-3xl font-bold text-foreground">{totalPointsEarned}</p>
            <p className="text-sm text-muted-foreground">Pontos Ganhos</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-5 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-heading text-3xl font-bold text-foreground">{referrals.filter(r => r.referrer_points_credited).length}</p>
            <p className="text-sm text-muted-foreground">Indicações Confirmadas</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm font-semibold text-primary mb-3">🔗 Seu link de indicação</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-mono truncate">
              {referralLink}
            </div>
            <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
              <Copy className="h-4 w-4 mr-1" /> Copiar
            </Button>
            <Button size="sm" onClick={shareLink} className="shrink-0">
              <Share2 className="h-4 w-4 mr-1" /> Compartilhar
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Código: {referralCode}</Badge>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-4 bg-muted/30 rounded-lg p-4">
          <p className="text-sm font-semibold mb-2">🎁 Como funciona?</p>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shrink-0">1</span> Compartilhe seu link com amigos</li>
            <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shrink-0">2</span> Seu amigo se cadastra usando seu link</li>
            <li className="flex items-start gap-2"><span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shrink-0">3</span> Você ganha <strong className="text-foreground">100 pontos</strong> e seu amigo ganha <strong className="text-foreground">50 pontos</strong></li>
          </ul>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-heading font-bold text-sm">Histórico de Indicações</h3>
        </div>
        {referrals.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-bold text-lg mb-2">Nenhuma indicação ainda</h3>
            <p className="text-muted-foreground text-sm">Compartilhe seu link e comece a ganhar pontos!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {referrals.map(r => (
              <div key={r.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{referredNames[r.referred_id] || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.referrer_points_credited ? "default" : "secondary"}>
                    {r.referrer_points_credited ? "+100 pts" : "Pendente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralProgram;
