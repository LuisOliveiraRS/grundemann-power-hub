import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, Wrench, Package, Loader2, MessageCircle } from "lucide-react";
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

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! Sou o **Mecânico Grundemann IA** 🔧\n\nPosso ajudar com problemas em motores estacionários, sugerir peças e filtros. Pergunte algo como:\n\n- Motor 7hp não pega\n- Qual filtro usar no motor GX200?\n- Motor está falhando, o que pode ser?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-mechanic", {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userQuestion: input.trim(),
        },
      });

      if (error) throw error;

      const assistantMsg: Message = {
        role: "assistant",
        content: data?.response || "Desculpe, não consegui processar sua pergunta. Tente novamente.",
        products: data?.products || [],
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("AI error:", err);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente em alguns instantes.",
      }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center animate-bounce"
        title="Mecânico Grundemann IA"
      >
        <Bot className="h-7 w-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">Mecânico Grundemann IA</p>
            <p className="text-[10px] opacity-80">Especialista em motores estacionários</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="p-1 hover:bg-primary-foreground/20 rounded-lg transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              {/* Product suggestions */}
              {msg.products && msg.products.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-border/30 pt-3">
                  <p className="text-xs font-bold flex items-center gap-1">
                    <Package className="h-3 w-3" /> Produtos recomendados:
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
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
      </div>
    </div>
  );
};

export default AIAssistant;
