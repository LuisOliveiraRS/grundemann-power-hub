import { Phone, MessageCircle, Mail, MapPin, ShieldCheck, FileText, RotateCcw, Calculator, CreditCard, QrCode, Banknote } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-grundemann.png";
import PaymentBadges, { TrustBadges } from "@/components/PaymentBadges";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80 pb-14 md:pb-0">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <img src={logo} alt="Gründemann Geradores" className="h-36 w-auto" />
            <p className="mt-4 text-sm leading-relaxed">
              Especialistas em geradores diesel e gasolina. Venda de peças, manutenção preventiva e corretiva.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-background/5 border border-background/10">
              <p className="text-xs font-semibold text-background">Gründemann Geradores LTDA</p>
              <p className="text-xs mt-1">CNPJ: 48.530.708/0001-80</p>
              <p className="text-xs mt-1 flex items-start gap-1.5">
                <MapPin className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                Rua Luiz Bernardo da Silva, 190 - Pinheiro, São Leopoldo/RS - CEP 93042-110
              </p>
            </div>
          </div>

          {/* Institucional */}
          <div>
            <h4 className="font-heading text-sm font-bold text-background uppercase tracking-wider mb-4">Institucional</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/quem-somos" className="hover:text-primary transition-colors">Quem Somos</Link></li>
              <li><Link to="/contato" className="hover:text-primary transition-colors">Fale Conosco</Link></li>
              <li><Link to="/mecanico" className="hover:text-primary transition-colors">Área do Mecânico</Link></li>
              <li><Link to="/central-tecnica" className="hover:text-primary transition-colors">Central Técnica</Link></li>
              <li><Link to="/catalogo-interativo" className="hover:text-primary transition-colors">Catálogo Interativo</Link></li>
              <li><Link to="/calculadora-de-carga" className="hover:text-primary transition-colors flex items-center gap-1.5"><Calculator className="h-3 w-3" /> Calculadora de Carga</Link></li>
            </ul>
          </div>

          {/* Categorias */}
          <div>
            <h4 className="font-heading text-sm font-bold text-background uppercase tracking-wider mb-4">Categorias</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/categoria/geradores-diesel" className="hover:text-primary transition-colors">Geradores Diesel</Link></li>
              <li><Link to="/categoria/geradores-gasolina" className="hover:text-primary transition-colors">Geradores Gasolina</Link></li>
              <li><Link to="/categoria/pecas-e-componentes" className="hover:text-primary transition-colors">Peças e Componentes</Link></li>
              <li><Link to="/categoria/manutencao" className="hover:text-primary transition-colors">Manutenção</Link></li>
              <li><Link to="/categoria/acessorios" className="hover:text-primary transition-colors">Acessórios</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-heading text-sm font-bold text-background uppercase tracking-wider mb-4">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:+5551981825748" className="hover:text-primary transition-colors">(51) 98182-5748</a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <a href="https://wa.me/5551981825748" className="hover:text-primary transition-colors">(51) 98182-5748</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>adair.grundemann@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment & Trust Badges */}
        <div className="mt-10 pt-6 border-t border-background/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-background uppercase tracking-wider mb-2">Formas de Pagamento</p>
              <PaymentBadges />
            </div>
            <div>
              <p className="text-xs font-bold text-background uppercase tracking-wider mb-2">Segurança & Confiança</p>
              <TrustBadges />
            </div>
          </div>
        </div>
      </div>

      {/* Legal links bar */}
      <div className="border-t border-background/10">
        <div className="container py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
            <Link to="/privacidade" className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Política de Privacidade
            </Link>
            <Link to="/termos" className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium">
              <FileText className="h-3.5 w-3.5" />
              Termos de Uso
            </Link>
            <Link to="/trocas-e-devolucoes" className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium">
              <RotateCcw className="h-3.5 w-3.5" />
              Trocas e Devoluções
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-background/10">
        <div className="container py-4 text-center text-xs text-background/50">
          <p>© 2026 Gründemann Geradores LTDA — CNPJ: 48.530.708/0001-80 — Todos os direitos reservados.</p>
          <p className="mt-1">
            Design By{" "}
            <a href="https://www.luisoliveira.com.br" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              Luís Oliveira
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
