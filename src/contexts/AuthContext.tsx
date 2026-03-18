import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSeller: boolean;
  isFornecedor: boolean;
  isMecanico: boolean;
  isOficina: boolean;
  isLocadora: boolean;
  isLoading: boolean;
  userName: string;
  partnerType: string | null;
  isApprovedPartner: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  isSeller: false,
  isFornecedor: false,
  isMecanico: false,
  isOficina: false,
  isLocadora: false,
  isLoading: true,
  userName: "",
  partnerType: null,
  isApprovedPartner: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [isFornecedor, setIsFornecedor] = useState(false);
  const [isMecanico, setIsMecanico] = useState(false);
  const [isOficina, setIsOficina] = useState(false);
  const [isLocadora, setIsLocadora] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [partnerType, setPartnerType] = useState<string | null>(null);
  const [isApprovedPartner, setIsApprovedPartner] = useState(false);

  const checkRoles = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data || []).map((r: any) => r.role);
    setIsAdmin(roles.includes("admin"));
    setIsSeller(roles.includes("seller"));
    setIsFornecedor(roles.includes("fornecedor"));
    setIsMecanico(roles.includes("mecanico"));
    setIsOficina(roles.includes("oficina"));
    setIsLocadora(roles.includes("locadora"));
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .single();
    if (profile?.full_name) {
      setUserName(profile.full_name.split(" ")[0]);
    }

    const { data: mechanic } = await supabase
      .from("mechanics")
      .select("partner_type, is_approved")
      .eq("user_id", userId)
      .single();
    if (mechanic) {
      setPartnerType(mechanic.partner_type as string);
      setIsApprovedPartner(mechanic.is_approved);
    } else {
      setPartnerType(null);
      setIsApprovedPartner(false);
    }
  }, []);

  const handleSession = useCallback(async (newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);
    if (newSession?.user) {
      await Promise.all([
        checkRoles(newSession.user.id),
        loadProfile(newSession.user.id),
      ]);
    } else {
      setIsAdmin(false);
      setIsSeller(false);
      setIsFornecedor(false);
      setIsMecanico(false);
      setIsOficina(false);
      setIsLocadora(false);
      setUserName("");
      setPartnerType(null);
      setIsApprovedPartner(false);
    }
    setIsLoading(false);
  }, [checkRoles, loadProfile]);

  useEffect(() => {
    let initialized = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!initialized) {
        initialized = true;
        handleSession(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (initialized) {
          handleSession(session);
        } else {
          initialized = true;
          handleSession(session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Helper to get the dashboard path for a partner type
  const getPartnerDashboardPath = (type: string | null): string => {
    switch (type) {
      case "fornecedor": return "/fornecedor";
      case "oficina": return "/oficina";
      case "locadora": return "/locadora";
      case "mecanico": return "/mecanico";
      default: return "/minha-conta";
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isSeller, isLoading, userName, partnerType, isApprovedPartner, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export helper for partner dashboard routing
export const getPartnerDashboardPath = (type: string | null): string => {
  switch (type) {
    case "fornecedor": return "/fornecedor";
    case "oficina": return "/oficina";
    case "locadora": return "/locadora";
    case "mecanico": return "/mecanico";
    default: return "/minha-conta";
  }
};

export const getPartnerLabel = (type: string | null): string => {
  switch (type) {
    case "fornecedor": return "Área Fornecedor";
    case "oficina": return "Área Oficina";
    case "locadora": return "Área Locadora";
    case "mecanico": return "Área Mecânico";
    default: return "Minha Conta";
  }
};
