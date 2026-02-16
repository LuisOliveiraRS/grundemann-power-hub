import { useState } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, MessageCircle, Mail, MapPin, Clock, Send } from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Mensagem enviada!", description: "Entraremos em contato em breve." });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <CategoryNav />
      <div className="flex-1">
        <div className="bg-gradient-brand py-16">
          <div className="container text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-primary-foreground mb-4">Fale Conosco</h1>
            <p className="text-primary-foreground/80 text-lg">Estamos prontos para atender você!</p>
          </div>
        </div>

        <div className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-border p-8">
                <h2 className="font-heading text-xl font-bold mb-6">Envie sua mensagem</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Nome Completo *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                    <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                    <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
                    <div><Label>Assunto *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
                  </div>
                  <div><Label>Mensagem *</Label><Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></div>
                  <Button type="submit" disabled={loading} className="px-8">
                    <Send className="h-4 w-4 mr-2" /> {loading ? "Enviando..." : "Enviar Mensagem"}
                  </Button>
                </form>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { icon: Phone, title: "Telefone", value: "(51) 8182-5748", href: "tel:+555181825748" },
                { icon: MessageCircle, title: "WhatsApp", value: "(51) 8182-5748", href: "https://wa.me/555181825748" },
                { icon: Mail, title: "Email", value: "adair.grundemann@gmail.com", href: "mailto:adair.grundemann@gmail.com" },
                { icon: Clock, title: "Horário de Atendimento", value: "Seg a Sex: 8h às 18h\nSáb: 8h às 12h", href: null },
              ].map((item) => (
                <div key={item.title} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary p-2.5 text-primary-foreground"><item.icon className="h-5 w-5" /></div>
                    <div>
                      <p className="font-heading font-bold text-sm">{item.title}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm text-primary hover:underline whitespace-pre-line">{item.value}</a>
                      ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{item.value}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary p-2.5 text-primary-foreground"><MapPin className="h-5 w-5" /></div>
                  <div>
                    <p className="font-heading font-bold text-sm">Endereço</p>
                    <p className="text-sm text-muted-foreground">Rua Luiz Bernardo da Silva, 190 - Pinheiro, São Leopoldo/RS - CEP 93042-110</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
