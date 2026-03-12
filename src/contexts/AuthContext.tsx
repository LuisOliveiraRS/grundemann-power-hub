import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSeller: boolean;
  isLoading: boolean;
  userName: string;
  partnerType: string | null; // 'mecanico' | 'oficina' | 'revendedor' | null
  isApprovedPartner: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  isSeller: false,
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
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [partnerType, setPartnerType] = useState<string | null>(null);
  const [isApprovedPartner, setIsApprovedPartner] = useState(false);

  const checkRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data || []).map((r: any) => r.role);
    setIsAdmin(roles.includes("admin"));
    setIsSeller(roles.includes("seller"));
  };

  const loadProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .single();
    if (profile?.full_name) {
      setUserName(profile.full_name.split(" ")[0]); // First name only
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
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            checkRoles(session.user.id);
            loadProfile(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsSeller(false);
          setUserName("");
          setPartnerType(null);
          setIsApprovedPartner(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkRoles(session.user.id);
        loadProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isSeller, isLoading, userName, partnerType, isApprovedPartner, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
