import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShoppingCart, MapPin, CreditCard, CheckCircle, Trash2, Minus, Plus } from "lucide-react";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: { name: string; price: number; image_url: string | null } | null;
}

interface ShippingInfo {
  full_name: string; phone: string; zip_code: string;
  address: string; address_number: string; address_complement: string;
  neighborhood: string; city: string; state: string; notes: string;
}

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [shipping, setShipping] = useState<ShippingInfo>({
    full_name: "", phone: "", zip_code: "", address: "", address_number: "",
    address_complement: "", neighborhood: "", city: "", state: "", notes: "",
  });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadCart();
    loadProfile();
  }, [user]);

  const loadCart = async () => {
    const { data } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, products(name, price, image_url)")
      .eq("user_id", user!.id);
    if (data) setItems(data.map((d: any) => ({ ...d, product: d.products })));
  };

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    if (data) {
      setShipping({
        full_name: data.full_name || "", phone: data.phone || "",
        zip_code: data.zip_code || "", address: data.address || "",
        address_number: data.address_number || "", address_complement: data.address_complement || "",
        neighborhood: data.neighborhood || "", city: data.city || "",
        state: data.state || "", notes: "",
      });
    }
  };

  const updateQty = async (id: string, quantity: number) => {
    if (quantity < 1) return removeItem(id);
    await supabase.from("cart_items").update({ quantity }).eq("id", id);
    loadCart();
  };

  const removeItem = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    loadCart();
  };

  const subtotal = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0);

  const placeOrder = async () => {
    if (items.length === 0) return;
    setLoading(true);

    const fullAddress = [
      shipping.address,
      shipping.address_number && `nº ${shipping.address_number}`,
      shipping.address_complement,
      shipping.neighborhood,
      shipping.city && shipping.state ? `${shipping.city}/${shipping.state}` : shipping.city || shipping.state,
      shipping.zip_code && `CEP: ${shipping.zip_code}`,
    ].filter(Boolean).join(", ");

    // Update profile with shipping info
    await supabase.from("profiles").update({
      full_name: shipping.full_name || undefined,
      phone: shipping.phone || null,
      zip_code: shipping.zip_code || null,
      address: shipping.address || null,
      address_number: shipping.address_number || null,
      address_complement: shipping.address_complement || null,
      neighborhood: shipping.neighborhood || null,
      city: shipping.city || null,
      state: shipping.state || null,
    }).eq("user_id", user!.id);

    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user!.id,
      total_amount: subtotal,
      status: "pending" as any,
      shipping_address: fullAddress,
      notes: shipping.notes || null,
    }).select().single();

    if (error || !order) {
      toast({ title: "Erro ao criar pedido", variant: "destructive" });
      setLoading(false);
      return;
    }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.product?.name || "",
      quantity: i.quantity,
      price_at_purchase: i.product?.price || 0,
    }));

    await supabase.from("order_items").insert(orderItems);
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      status: "pending" as any,
      notes: "Pedido criado pelo cliente",
    });
    await supabase.from("cart_items").delete().eq("user_id", user!.id);

    setLoading(false);
    setStep(4);
  };

  const steps = [
    { num: 1, label: "Carrinho", icon: ShoppingCart },
    { num: 2, label: "Endereço", icon: MapPin },
    { num: 3, label: "Pagamento", icon: CreditCard },
    { num: 4, label: "Confirmação", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <div className="flex-1 bg-muted/50">
        <div className="container py-8 max-w-4xl">
          {/* Steps indicator */}
          <div className="flex items-center justify-center mb-8 gap-0">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <s.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-0.5 ${step > s.num ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Cart Review */}
          {step === 1 && (
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h2 className="font-heading text-xl font-bold">Revise seu Carrinho</h2>
              </div>
              {items.length === 0 ? (
                <div className="p-12 text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Seu carrinho está vazio</p>
                  <Button className="mt-4" onClick={() => navigate("/produtos")}>Ver Produtos</Button>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border">
                    {items.map((item) => (
                      <div key={item.id} className="p-4 flex items-center gap-4">
                        <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {item.product?.image_url && (
                            <img src={item.product.image_url} alt="" className="h-full w-full object-contain p-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.product?.name}</p>
                          <p className="text-price font-bold">R$ {(item.product?.price || 0).toFixed(2).replace(".", ",")}</p>
                        </div>
                        <div className="flex items-center gap-1 border border-border rounded-lg">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-2 hover:bg-muted transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-2 hover:bg-muted transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="font-bold text-price w-24 text-right">
                          R$ {((item.product?.price || 0) * item.quantity).toFixed(2).replace(".", ",")}
                        </p>
                        <button onClick={() => removeItem(item.id)} className="text-destructive p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} itens)</p>
                      <p className="font-heading text-2xl font-bold text-price">R$ {subtotal.toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => navigate("/produtos")}>Continuar Comprando</Button>
                      <Button onClick={() => setStep(2)}>Próximo: Endereço</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h2 className="font-heading text-xl font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Endereço de Entrega</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><Label>Nome Completo *</Label><Input value={shipping.full_name} onChange={(e) => setShipping({ ...shipping, full_name: e.target.value })} /></div>
                <div><Label>Telefone *</Label><Input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
                <div><Label>CEP *</Label><Input value={shipping.zip_code} onChange={(e) => setShipping({ ...shipping, zip_code: e.target.value })} placeholder="00000-000" /></div>
                <div className="md:col-span-2"><Label>Endereço (Rua) *</Label><Input value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} /></div>
                <div><Label>Número *</Label><Input value={shipping.address_number} onChange={(e) => setShipping({ ...shipping, address_number: e.target.value })} /></div>
                <div><Label>Complemento</Label><Input value={shipping.address_complement} onChange={(e) => setShipping({ ...shipping, address_complement: e.target.value })} /></div>
                <div><Label>Bairro *</Label><Input value={shipping.neighborhood} onChange={(e) => setShipping({ ...shipping, neighborhood: e.target.value })} /></div>
                <div><Label>Cidade *</Label><Input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} /></div>
                <div>
                  <Label>Estado *</Label>
                  <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })}>
                    <option value="">Selecione</option>
                    {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2"><Label>Observações do Pedido</Label><Textarea rows={2} value={shipping.notes} onChange={(e) => setShipping({ ...shipping, notes: e.target.value })} placeholder="Instruções especiais para entrega..." /></div>
              </div>
              <div className="p-6 border-t border-border flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <Button onClick={() => {
                  if (!shipping.full_name || !shipping.address || !shipping.city || !shipping.state) {
                    toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
                    return;
                  }
                  setStep(3);
                }}>Próximo: Pagamento</Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment / Confirmation */}
          {step === 3 && (
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h2 className="font-heading text-xl font-bold flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Resumo do Pedido</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Address summary */}
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <h3 className="font-heading font-bold text-sm mb-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Entregar em:</h3>
                  <p className="text-sm">{shipping.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {shipping.address}, {shipping.address_number} {shipping.address_complement && `- ${shipping.address_complement}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {shipping.neighborhood} - {shipping.city}/{shipping.state} - CEP: {shipping.zip_code}
                  </p>
                  {shipping.phone && <p className="text-sm text-muted-foreground">Tel: {shipping.phone}</p>}
                </div>

                {/* Items summary */}
                <div>
                  <h3 className="font-heading font-bold text-sm mb-3">Itens do Pedido</h3>
                  <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-muted rounded-full h-6 w-6 flex items-center justify-center font-bold">{item.quantity}x</span>
                          <span className="text-sm">{item.product?.name}</span>
                        </div>
                        <span className="font-bold text-sm text-price">R$ {((item.product?.price || 0) * item.quantity).toFixed(2).replace(".", ",")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-heading text-lg font-bold">Total do Pedido</span>
                    <span className="font-heading text-2xl font-bold text-price">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ou até 3x de R$ {(subtotal / 3).toFixed(2).replace(".", ",")} sem juros
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-border flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
                <Button onClick={placeOrder} disabled={loading} className="px-8">
                  {loading ? "Processando..." : "Confirmar Pedido"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
              <div className="bg-primary/10 rounded-full p-6 inline-flex mb-6">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-2">Pedido Realizado com Sucesso!</h2>
              <p className="text-muted-foreground mb-6">Obrigado pela sua compra! Você pode acompanhar o status do pedido na sua conta.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/produtos")}>Continuar Comprando</Button>
                <Button onClick={() => navigate("/minha-conta")}>Meus Pedidos</Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
