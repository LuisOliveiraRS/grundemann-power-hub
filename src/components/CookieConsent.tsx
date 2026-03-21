import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_KEY = "grundemann_cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <Cookie className="h-8 w-8 text-primary shrink-0 hidden md:block" />
        <div className="flex-1 text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-1">🍪 Este site utiliza cookies</p>
          <p>
            Utilizamos cookies para melhorar sua experiência de navegação, personalizar conteúdo e analisar o tráfego do site.
            Ao clicar em "Aceitar", você concorda com o uso de cookies conforme nossa{" "}
            <Link to="/privacidade" className="text-primary underline hover:text-primary/80">
              Política de Privacidade
            </Link>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={decline} className="flex-1 md:flex-none">
            Recusar
          </Button>
          <Button size="sm" onClick={accept} className="flex-1 md:flex-none">
            Aceitar Cookies
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
