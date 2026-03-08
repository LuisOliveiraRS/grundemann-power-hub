import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, ArrowRight } from "lucide-react";
import logo from "@/assets/logo-grundemann.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-foreground via-secondary to-foreground min-h-[520px] flex items-center">
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Green accent bar on top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

      <div className="container relative z-10 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 mb-6"
            >
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Especialistas em Motores Estacionários
              </span>
            </motion.div>

            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight">
              <span className="text-background">PEÇAS E MOTORES</span>
              <br />
              <span className="text-background">ESTACIONÁRIOS COM</span>
              <br />
              <span className="text-primary">QUALIDADE PROFISSIONAL</span>
            </h1>

            <p className="mt-5 text-base md:text-lg text-background/70 max-w-lg leading-relaxed">
              Filtros, carburadores, peças e assistência técnica especializada para motores{" "}
              <span className="text-accent font-bold">5HP, 7HP, 10HP, 13HP e 15HP</span>.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/produtos")}
                className="group flex items-center gap-2 rounded-lg bg-primary px-8 py-4 font-heading font-extrabold text-primary-foreground text-sm uppercase tracking-wide hover:opacity-90 transition-all shadow-lg shadow-primary/30"
              >
                Ver Produtos
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="https://wa.me/5500000000000?text=Olá, gostaria de falar com um especialista Grundemann."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border-2 border-background/30 bg-background/5 px-8 py-4 font-heading font-extrabold text-background text-sm uppercase tracking-wide hover:bg-background/10 transition-all backdrop-blur-sm"
              >
                <MessageCircle className="h-4 w-4" />
                Falar com Especialista
              </a>
            </div>

            {/* Quick trust signals */}
            <div className="mt-8 flex gap-6 text-background/50 text-xs font-medium">
              <span>✓ Envio para todo Brasil</span>
              <span>✓ Garantia de qualidade</span>
              <span>✓ Suporte técnico</span>
            </div>
          </motion.div>

          {/* Right: Logo + visual element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:flex items-center justify-center relative"
          >
            {/* Glow ring */}
            <div className="absolute w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute w-60 h-60 rounded-full border-2 border-primary/20 animate-pulse" />
            <img
              src={logo}
              alt="Gründemann Geradores"
              className="relative z-10 w-72 h-auto drop-shadow-[0_20px_60px_rgba(0,151,57,0.3)]"
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom green stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
    </section>
  );
};

export default HeroSection;
