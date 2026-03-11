import { CreditCard, QrCode, Banknote, ShieldCheck } from "lucide-react";

const PaymentBadges = ({ compact = false }: { compact?: boolean }) => {
  const badges = [
    { label: "Visa", icon: "💳", bg: "bg-[#1a1f71]", text: "text-background", fontClass: "font-black italic text-[10px]" },
    { label: "Mastercard", icon: "🔴", bg: "bg-foreground", text: "text-background", fontClass: "font-bold text-[10px]" },
    { label: "PIX", iconEl: <QrCode className="h-3.5 w-3.5" />, bg: "bg-[#32bcad]", text: "text-background", fontClass: "font-black text-[10px]" },
    { label: "Boleto", iconEl: <Banknote className="h-3.5 w-3.5" />, bg: "bg-muted", text: "text-foreground", fontClass: "font-bold text-[10px]" },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {badges.map(b => (
          <span key={b.label} className={`inline-flex items-center gap-1 ${b.bg} ${b.text} rounded px-2 py-1 ${b.fontClass}`}>
            {b.iconEl || <span className="text-[10px]">{b.icon}</span>}
            {b.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {badges.map(b => (
        <span key={b.label} className={`inline-flex items-center gap-1.5 ${b.bg} ${b.text} rounded-lg px-3 py-1.5 ${b.fontClass}`}>
          {b.iconEl || <span>{b.icon}</span>}
          {b.label}
        </span>
      ))}
    </div>
  );
};

export const TrustBadges = () => (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 bg-background/5">
      <ShieldCheck className="h-4 w-4 text-primary" />
      <span className="text-[10px] font-bold uppercase tracking-wider">Google Safe</span>
    </div>
    <div className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 bg-background/5">
      <span className="text-sm">🏆</span>
      <span className="text-[10px] font-bold uppercase tracking-wider">Reclame Aqui</span>
    </div>
  </div>
);

export default PaymentBadges;
