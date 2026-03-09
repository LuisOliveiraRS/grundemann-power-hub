import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, Wrench, Package, Loader2, MessageCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: SuggestedProduct[];
}

interface SuggestedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  sku: string | null;
}

const WHATSAPP_NUMBER = "5551981825748";

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! Sou o **Mecânico Virtual Grundemann** 🔧\n\nEspecialista em motores estacionários a gasolina e diesel. Posso ajudar com:\n\n🛠️ Diagnóstico de problemas\n⚙️ Identificação de peças\n🔥 Manutenção preventiva\n💡 Dúvidas técnicas\n\nDescreva o problema ou pergunte algo como:\n• \"Motor 7hp não pega\"\n• \"Qual filtro usar no GX200?\"\n• \"Motor fumaçando muito\""
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const question = input.trim();
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mechanic`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            userQuestion: question,
            sessionId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = response.status === 429
          ? "⚠️ Muitas perguntas em pouco tempo. Aguarde um momento e tente novamente."
          : response.status === 402
          ? "⚠️ O serviço de IA está temporariamente indisponível. Por favor, entre em contato via WhatsApp para diagnóstico."
          : data?.error || "⚠️ Ocorreu um erro. Tente novamente.";
        
        setMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data?.response || "Desculpe, não consegui processar sua pergunta.",
          products: data?.products || [],
        }]);
      }
    } catch (err: any) {
      console.error("AI error:", err);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Erro de conexão. Verifique sua internet e tente novamente.",
      }]);
    }
    setLoading(false);
  };

  const getWhatsAppDiagnosticUrl = () => {
    // Build a summary of the conversation for WhatsApp
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant" && m !== messages[0]);
    
    let whatsappText = "Olá! Usei o Mecânico Virtual Grundemann e gostaria de falar com um técnico.\n\n";
    if (lastUserMsg) whatsappText += `📋 Minha dúvida: ${lastUserMsg.content}\n\n`;
    if (lastAssistantMsg) {
      const shortResponse = lastAssistantMsg.content.substring(0, 300);
      whatsappText += `🤖 Diagnóstico IA: ${shortResponse}${lastAssistantMsg.content.length > 300 ? "..." : ""}\n`;
    }
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;
  };

  // Format text with basic bold support
  const formatText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
        title="Mecânico Virtual Grundemann"
      >
        <Wrench className="h-6 w-6 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">Mecânico Virtual</p>
            <p className="text-[10px] opacity-80">Grundemann · Motores Estacionários</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-primary-foreground/20 rounded-lg transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{formatText(msg.content)}</div>
              {/* Product suggestions */}
              {msg.products && msg.products.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-border/30 pt-3">
                  <p className="text-xs font-bold flex items-center gap-1">
                    <Package className="h-3 w-3" /> Peças recomendadas:
                  </p>
                  {msg.products.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { navigate(`/produto/${p.id}`); setOpen(false); }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background transition-colors text-left"
                    >
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{p.name}</p>
                        {p.sku && <p className="text-[10px] text-muted-foreground">SKU: {p.sku}</p>}
                        <p className="text-xs font-bold text-primary">R$ {Number(p.price).toFixed(2).replace(".", ",")}</p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Analisando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp + Quick actions */}
      {messages.length > 2 && (
        <div className="px-3 pb-1 flex-shrink-0">
          <a
            href={getWhatsAppDiagnosticUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,35%)] text-xs font-semibold hover:bg-[hsl(142,70%,45%)]/20 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Falar com técnico da Grundemann
          </a>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3 flex-shrink-0">
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Descreva o problema do motor..."
            className="flex-1 text-sm"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Diagnóstico assistido por IA · Consulte sempre um mecânico profissional
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
