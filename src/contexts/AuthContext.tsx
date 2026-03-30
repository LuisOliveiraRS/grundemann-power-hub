/* eslint-disable react-refresh/only-export-components, @typescript-eslint/no-explicit-any */
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

type RoleData = { role: string };
type ProfileData = { full_name?: string; partner_type?: string; is_approved?: boolean };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

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
    let adminFlag = false;
    let rolesData: RoleData[] = [];

    try {
      const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin' as any);
      if (!isAdminError && Boolean(isAdminData)) {
        adminFlag = true;
      }
    } catch (error) {
      console.warn('is_admin rpc falhou; consultando roles diretamente', error);
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (!error && Array.isArray(data)) {
        rolesData = data as unknown as RoleData[];
      }

      if (!adminFlag) {
        adminFlag = rolesData.some((item) => item.role === 'admin');
      }
    } catch (error) {
      console.warn('Não foi possível ler user_roles', error);
    }

    setIsAdmin(adminFlag);
    setIsSeller(rolesData.some((item) => item.role === 'seller'));
    setIsFornecedor(rolesData.some((item) => item.role === 'fornecedor'));
    setIsMecanico(rolesData.some((item) => item.role === 'mecanico'));
    setIsOficina(rolesData.some((item) => item.role === 'oficina'));
    setIsLocadora(rolesData.some((item) => item.role === 'locadora'));
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.rpc('get_my_profile' as any, { user_id: userId })
    if (error) {
      console.error('Falha ao buscar profile:', error)
      setUserName('')
      setPartnerType(null)
      setIsApprovedPartner(false)
      return
    }

    const profileData = Array.isArray(data) ? data : []

    if (profileData.length > 0) {
      const profile = profileData[0]
      setUserName(profile.full_name ? profile.full_name.split(' ')[0] : '')
      setPartnerType(profile.partner_type || null)
      setIsApprovedPartner(Boolean(profile.is_approved))
    } else {
      setUserName('')
      setPartnerType(null)
      setIsApprovedPartner(false)
    }
  }, [])

  const resetRoles = () => {
    setIsAdmin(false);
    setIsSeller(false);
    setIsFornecedor(false);
    setIsMecanico(false);
    setIsOficina(false);
    setIsLocadora(false);
  };

  const handleSession = useCallback(async (newSession: Session | null) => {
    setIsLoading(true);
    setSession(newSession);
    setUser(newSession?.user ?? null);

    if (newSession?.user?.id) {
      try {
        await Promise.all([
          checkRoles(newSession.user.id),
          loadProfile(newSession.user.id),
        ]);
      } catch (error) {
        console.error("Falha ao carregar sessão de usuário:", error);
        resetRoles();
        setUserName("");
        setPartnerType(null);
        setIsApprovedPartner(false);
      }
    } else {
      resetRoles();
      setUserName("");
      setPartnerType(null);
      setIsApprovedPartner(false);
    }

    setIsLoading(false);
  }, [checkRoles, loadProfile]);

  useEffect(() => {
    let initialized = false;
    let mounted = true;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted && !initialized) {
        initialized = true;
        await handleSession(session);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        if (initialized) {
          await handleSession(session);
        } else {
          initialized = true;
          await handleSession(session);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAdmin,
        isSeller,
        isFornecedor,
        isMecanico,
        isOficina,
        isLocadora,
        isLoading,
        userName,
        partnerType,
        isApprovedPartner,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// observe: partner helpers are in src/contexts/partnerHelpers.ts for fast refresh safety
