import { motion } from "framer-motion";
import { Wrench, Phone, Mail, MapPin, Clock, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logoGrundemann from "@/assets/logo-grundemann.png";
import bgMaintenance from "@/assets/bg-maintenance.jpg";

const MaintenancePage = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-secondary">
      {/* Admin return button */}
      {isAdmin && (
        <Link
          to="/admin"
          className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition-all"
        >
          <Settings className="h-3.5 w-3.5" />
          Painel Admin
        </Link>
      )}
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgMaintenance})` }}
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/95 via-secondary/85 to-foreground/90" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Animated gear decorations */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-10 right-10 md:top-20 md:right-20 opacity-10"
      >
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.5">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="m15.6 10.8 1.2-.4.6-2.4-1.6-1.6-2.4.6-.4 1.2a4 4 0 0 0-2 0l-.4-1.2-2.4-.6L6.6 8l.6 2.4 1.2.4a4 4 0 0 0 0 2l-1.2.4-.6 2.4 1.6 1.6 2.4-.6.4-1.2a4 4 0 0 0 2 0l.4 1.2 2.4.6 1.6-1.6-.6-2.4-1.2-.4a4 4 0 0 0 0-2Z" />
        </svg>
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-10 left-10 md:bottom-20 md:left-20 opacity-10"
      >
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.5">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="m15.6 10.8 1.2-.4.6-2.4-1.6-1.6-2.4.6-.4 1.2a4 4 0 0 0-2 0l-.4-1.2-2.4-.6L6.6 8l.6 2.4 1.2.4a4 4 0 0 0 0 2l-1.2.4-.6 2.4 1.6 1.6 2.4-.6.4-1.2a4 4 0 0 0 2 0l.4 1.2 2.4.6 1.6-1.6-.6-2.4-1.2-.4a4 4 0 0 0 0-2Z" />
        </svg>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 py-12 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <img src={logoGrundemann} alt="Grundemann Geradores" className="h-16 md:h-20 mx-auto drop-shadow-2xl" />
        </motion.div>

        {/* Animated wrench icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30">
            <motion.div
              animate={{ rotate: [0, -15, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Wrench className="h-10 w-10 text-primary" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h1 className="font-heading text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            ESTAMOS EM
            <span className="block text-accent mt-1">MANUTENÇÃO</span>
          </h1>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-6" />
          <p className="text-white/70 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            Nosso site está passando por melhorias para oferecer uma experiência ainda melhor. Voltaremos em breve!
          </p>
        </motion.div>

        {/* Estimated time */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 backdrop-blur-sm">
            <Clock className="h-4 w-4 text-accent" />
            <span className="text-sm text-white/80 font-medium">Previsão de retorno: em breve</span>
          </div>
        </motion.div>

        {/* Contact card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8"
        >
          <h2 className="font-heading text-sm font-bold text-accent uppercase tracking-widest mb-5">
            Fale Conosco
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <a
              href="https://wa.me/5551981825748"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider">WhatsApp</p>
                <p className="text-white font-semibold group-hover:text-primary transition-colors">(51) 98182-5748</p>
              </div>
            </a>

            <a
              href="mailto:adair.grundemann@gmail.com"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider">E-mail</p>
                <p className="text-white font-semibold text-sm group-hover:text-primary transition-colors break-all">adair.grundemann@gmail.com</p>
              </div>
            </a>

            <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider">Endereço</p>
                <p className="text-white/80 text-sm">Rua Luiz Bernardo da Silva, 190 — Pinheiro, São Leopoldo/RS</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-white/30 text-xs"
        >
          © {new Date().getFullYear()} Grundemann Geradores — CNPJ 48.530.708/0001-80
        </motion.p>
      </div>
    </div>
  );
};

export default MaintenancePage;
