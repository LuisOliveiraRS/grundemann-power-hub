import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5551981825748";

interface WhatsAppButtonProps {
  message?: string;
  floating?: boolean;
  label?: string;
  className?: string;
}

const WhatsAppButton = ({ message = "Olá! Gostaria de mais informações.", floating = true, label, className = "" }: WhatsAppButtonProps) => {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  if (!floating) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 rounded-lg bg-[hsl(142,70%,45%)] px-6 py-3 font-heading font-bold text-white hover:bg-[hsl(142,70%,40%)] transition-colors shadow-lg ${className}`}
      >
        <MessageCircle className="h-5 w-5" />
        {label || "Fale pelo WhatsApp"}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-14 w-14 rounded-full bg-[hsl(142,70%,45%)] text-white shadow-2xl hover:bg-[hsl(142,70%,40%)] hover:scale-110 transition-all duration-300 animate-bounce-slow"
      aria-label="WhatsApp"
      style={{ animationDuration: "3s" }}
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
};

export default WhatsAppButton;
