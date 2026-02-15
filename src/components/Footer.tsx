import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import logo from "@/assets/logo-grundemann.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <img src={logo} alt="Gründemann Geradores" className="h-24 w-auto brightness-0 invert" />
            <p className="mt-4 text-sm leading-relaxed">
              Especialistas em geradores diesel e gasolina. Venda de peças, manutenção preventiva e corretiva.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading text-sm font-bold text-background uppercase tracking-wider mb-4">Institucional</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Quem Somos</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Trocas e Devoluções</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading text-sm font-bold text-background uppercase tracking-wider mb-4">Categorias</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Geradores Diesel</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Geradores Gasolina</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Peças e Componentes</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Manutenção</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Acessórios</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-sm font-bold text-background uppercase tracking-wider mb-4">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>(51) 8182-5748</span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span>(51) 8182-5748</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>adair.grundemann@gmail.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>Rua Luiz Bernardo da Silva, 190 - Pinheiro, São Leopoldo/RS - CEP 93042-110</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-background/10">
        <div className="container py-4 text-center text-xs text-background/50">
          © 2026 Gründemann Geradores. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
