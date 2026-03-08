import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface FavoriteButtonProps {
  productId: string;
  productName?: string;
  isFavorite: boolean;
  onToggle: (productId: string, productName?: string) => void;
  size?: "sm" | "md";
  className?: string;
}

const FavoriteButton = ({ productId, productName, isFavorite, onToggle, size = "sm", className = "" }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate("/auth"); return; }
    onToggle(productId, productName);
  };

  const sizeClasses = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses} rounded-full flex items-center justify-center transition-all duration-200 ${
        isFavorite
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
          : "bg-card/80 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      } backdrop-blur-sm border border-border shadow-sm ${className}`}
      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart className={`${iconSize} ${isFavorite ? "fill-current" : ""}`} />
    </button>
  );
};

export default FavoriteButton;
