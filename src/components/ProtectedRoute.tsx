import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, adminOnly = false, allowedRoles }: Props) => {
  const { user, isAdmin, isFornecedor, isMecanico, isOficina, isLocadora, partnerType, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles: string[] = [];
    if (isAdmin) userRoles.push("admin");
    if (isFornecedor) userRoles.push("fornecedor");
    if (isMecanico) userRoles.push("mecanico");
    if (isOficina) userRoles.push("oficina");
    if (isLocadora) userRoles.push("locadora");
    if (partnerType) userRoles.push(partnerType);

    const hasAccess = allowedRoles.some(role => userRoles.includes(role));
    if (!hasAccess) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
