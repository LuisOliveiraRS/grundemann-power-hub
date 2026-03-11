import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShoppingCart, MapPin, CreditCard, CheckCircle, Trash2, Minus, Plus, Tag, X, Ticket, QrCode, Banknote, Loader2, AlertCircle, Truck, Store } from "lucide-react";
import { calculateShipping, formatCep, STORE_PICKUP_OPTION, type ShippingOption } from "@/lib/shippingCalculator";

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
  cpf_cnpj: string;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  is_used: boolean;
  expires_at: string | null;
}

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [shipping, setShipping] = useState<ShippingInfo>({
    full_name: "", phone: "", zip_code: "", address: "", address_number: "",
    address_complement: "", neighborhood: "", city: "", state: "", notes: "", cpf_cnpj: "",
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Shipping state
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[] | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingCepInput, setShippingCepInput] = useState("");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadCart();
    loadProfile();
    loadCoupons();

    // Handle legacy payment return from Mercado Pago (old back_urls)
    const paymentStatus = searchParams.get("payment");
    const returnOrderId = searchParams.get("order_id");
    if (paymentStatus && returnOrderId) {
      if (paymentStatus === "success") {
        navigate(`/pedido-confirmado?order_id=${returnOrderId}`, { replace: true });
      } else if (paymentStatus === "pending") {
        navigate(`/pagamento-pendente?order_id=${returnOrderId}`, { replace: true });
      } else {
        navigate(`/pagamento-erro?order_id=${returnOrderId}`, { replace: true });
      }
      return;
    }
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
        state: data.state || "", notes: "", cpf_cnpj: data.cpf_cnpj || "",
      });
    }
  };

  const loadCoupons = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("discount_coupons")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_used", false)
      .order("created_at", { ascending: false });
    if (data) {
      const valid = (data as Coupon[]).filter(c => !c.expires_at || new Date(c.expires_at) > new Date());
      setAvailableCoupons(valid);
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

  const calculateDiscount = (): number => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === "percentage") {
      return subtotal * (appliedCoupon.discount_value / 100);
    }
    if (appliedCoupon.discount_type === "fixed") {
      return Math.min(appliedCoupon.discount_value, subtotal);
    }
    return 0;
  };

  const isFreeShipping = appliedCoupon?.discount_type === "freeShipping";
  const shippingCost = isFreeShipping ? 0 : (selectedShipping?.price || 0);
  const discount = calculateDiscount();
  const total = Math.max(0, subtotal - discount + shippingCost);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setApplyingCoupon(true);

    // Check in available coupons first
    const found = availableCoupons.find(c => c.code.toUpperCase() === code);
    if (found) {
      setAppliedCoupon(found);
      setCouponCode("");
      toast({ title: "Cupom aplicado! 🎉", description: `Desconto de ${found.discount_type === "percentage" ? `${found.discount_value}%` : `R$ ${Number(found.discount_value).toFixed(2).replace(".", ",")}`}` });
      setApplyingCoupon(false);
      return;
    }

    // Check email subscriber coupons
    const { data: subCoupon } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("discount_code", code)
      .eq("is_used", false)
      .single();

    if (subCoupon) {
      setAppliedCoupon({
        id: subCoupon.id,
        code: subCoupon.discount_code,
        discount_type: "percentage",
        discount_value: 10,
        is_used: false,
        expires_at: null,
      });
      setCouponCode("");
      toast({ title: "Cupom aplicado! 🎉", description: "Desconto de 10% aplicado!" });
      setApplyingCoupon(false);
      return;
    }

    toast({ title: "Cupom inválido", description: "Verifique o código e tente novamente.", variant: "destructive" });
    setApplyingCoupon(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({ title: "Cupom removido" });
  };

  const selectCoupon = (coupon: Coupon) => {
    setAppliedCoupon(coupon);
    toast({ title: "Cupom aplicado! 🎉" });
  };

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
      cpf_cnpj: shipping.cpf_cnpj || null,
    }).eq("user_id", user!.id);

    const orderNotes = [
      shipping.notes,
      appliedCoupon ? `Cupom: ${appliedCoupon.code} (desconto: R$ ${discount.toFixed(2)})` : null,
      selectedShipping ? `Frete: ${selectedShipping.service} - R$ ${isFreeShipping ? "0,00 (grátis)" : selectedShipping.price.toFixed(2)} (${selectedShipping.days} dias)` : null,
    ].filter(Boolean).join(" | ");

    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user!.id,
      total_amount: total,
      status: "pending" as any,
      shipping_address: fullAddress,
      notes: orderNotes || null,
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

    // Mark coupon as used
    if (appliedCoupon) {
      const isRewardCoupon = availableCoupons.some(c => c.id === appliedCoupon.id);
      if (isRewardCoupon) {
        await supabase.from("discount_coupons").update({ is_used: true, order_id: order.id }).eq("id", appliedCoupon.id);
      } else {
        await supabase.from("email_subscribers").update({ is_used: true }).eq("id", appliedCoupon.id);
      }
    }

    await supabase.from("cart_items").delete().eq("user_id", user!.id);

    setCreatedOrderId(order.id);
    setLoading(false);

    // Redirect to Mercado Pago
    await initiatePayment(order.id);
  };

  const initiatePayment = async (orderId: string) => {
    setPaymentLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { order_id: orderId },
      });

      if (error || !data) {
        throw new Error(error?.message || "Failed to create payment");
      }

      // Use init_point for production
      const paymentUrl = data.init_point || data.sandbox_init_point;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({
        title: "Erro ao processar pagamento",
        description: "O pedido foi criado. Tente pagar novamente na sua conta.",
        variant: "destructive",
      });
      setStep(4);
    } finally {
      setPaymentLoading(false);
    }
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
          <div className="flex items-center justify-center mb-6 md:mb-8 gap-0 overflow-x-auto scrollbar-none">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center flex-shrink-0">
                <div className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <s.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-4 md:w-8 h-0.5 ${step > s.num ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Cart Review */}
          {step === 1 && (
            <div className="space-y-4">
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
                        <div key={item.id} className="p-3 md:p-4 flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4">
                          <div className="h-14 w-14 md:h-16 md:w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            {item.product?.image_url && (
                              <img src={item.product.image_url} alt="" className="h-full w-full object-contain p-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.product?.name}</p>
                            <p className="text-price font-bold text-sm">R$ {(item.product?.price || 0).toFixed(2).replace(".", ",")}</p>
                          </div>
                          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                            <div className="flex items-center gap-1 border border-border rounded-lg">
                              <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-2 hover:bg-muted transition-colors">
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                              <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-2 hover:bg-muted transition-colors">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="font-bold text-price text-right">
                              R$ {((item.product?.price || 0) * item.quantity).toFixed(2).replace(".", ",")}
                            </p>
                            <button onClick={() => removeItem(item.id)} className="text-destructive p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Coupon Section */}
                    <div className="p-6 border-t border-border">
                      <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" /> Cupom de Desconto
                      </h3>

                      {appliedCoupon ? (
                        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                          <Ticket className="h-5 w-5 text-primary flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-heading font-bold text-sm text-primary">{appliedCoupon.code}</p>
                            <p className="text-xs text-muted-foreground">
                              {appliedCoupon.discount_type === "percentage"
                                ? `${appliedCoupon.discount_value}% de desconto`
                                : appliedCoupon.discount_type === "freeShipping"
                                  ? "Frete Grátis"
                                  : `R$ ${Number(appliedCoupon.discount_value).toFixed(2).replace(".", ",")} de desconto`}
                            </p>
                          </div>
                          <button onClick={removeCoupon} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              value={couponCode}
                              onChange={e => setCouponCode(e.target.value.toUpperCase())}
                              placeholder="Digite o código do cupom"
                              className="flex-1 uppercase"
                              onKeyDown={e => e.key === "Enter" && applyCoupon()}
                            />
                            <Button variant="outline" onClick={applyCoupon} disabled={applyingCoupon || !couponCode.trim()}>
                              {applyingCoupon ? "Validando..." : "Aplicar"}
                            </Button>
                          </div>

                          {availableCoupons.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Seus cupons disponíveis:</p>
                              <div className="flex flex-wrap gap-2">
                                {availableCoupons.map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => selectCoupon(c)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-sm group"
                                  >
                                    <Ticket className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                                    <span className="font-mono font-bold text-xs">{c.code}</span>
                                    <Badge variant="secondary" className="text-[10px] px-1.5">
                                      {c.discount_type === "percentage" ? `${c.discount_value}%` : c.discount_type === "freeShipping" ? "Frete" : `R$${c.discount_value}`}
                                    </Badge>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Shipping Calculator in Cart */}
                    <div className="p-6 border-t border-border">
                      <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" /> Calcular Frete
                      </h3>
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={shippingCepInput}
                          onChange={e => {
                            const formatted = formatCep(e.target.value);
                            setShippingCepInput(formatted);
                            const clean = formatted.replace(/\D/g, "");
                            if (clean.length === 8) {
                              calculateShipping(clean).then(options => {
                                setShippingOptions(options);
                                if (options && options.length > 0 && !selectedShipping) {
                                  setSelectedShipping(options[0]);
                                }
                              });
                            } else {
                              setShippingOptions(null);
                            }
                          }}
                          placeholder="00000-000"
                          className="flex-1 max-w-[180px]"
                          maxLength={9}
                        />
                        {shippingOptions === null && shippingCepInput.replace(/\D/g, "").length === 8 && (
                          <p className="text-xs text-destructive self-center">CEP não encontrado</p>
                        )}
                      </div>
                      {shippingOptions && (
                        <div className="space-y-2">
                          {shippingOptions.map(opt => (
                            <button
                              key={opt.service}
                              onClick={() => setSelectedShipping(opt)}
                              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                                selectedShipping?.service === opt.service
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {opt.service === "RETIRADA" ? <Store className="h-5 w-5 text-primary" /> : <Truck className="h-5 w-5 text-muted-foreground" />}
                                <div>
                                  <p className="text-sm font-semibold">{opt.label}</p>
                                  <p className="text-xs text-muted-foreground">{opt.service === "RETIRADA" ? "Retire na loja sem custo" : `${opt.days} dias úteis`}</p>
                                </div>
                              </div>
                              <p className="font-bold text-sm text-price">
                                {opt.price === 0 ? <span className="text-primary">Grátis</span> : isFreeShipping ? <><s className="text-muted-foreground font-normal">R$ {opt.price.toFixed(2).replace(".", ",")}</s> <span className="text-primary ml-1">Grátis</span></> : `R$ ${opt.price.toFixed(2).replace(".", ",")}`}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Always show store pickup even without CEP */}
                      {!shippingOptions && (
                        <button
                          onClick={() => setSelectedShipping(STORE_PICKUP_OPTION)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                            selectedShipping?.service === "RETIRADA"
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Store className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-semibold">Retirada na Loja — São Leopoldo/RS</p>
                              <p className="text-xs text-muted-foreground">Retire na loja sem custo</p>
                            </div>
                          </div>
                          <p className="font-bold text-sm text-primary">Grátis</p>
                        </button>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="p-6 border-t border-border">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} itens)</span>
                          <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                        </div>
                        {appliedCoupon && discount > 0 && (
                          <div className="flex justify-between text-sm text-primary">
                            <span>Desconto ({appliedCoupon.code})</span>
                            <span>- R$ {discount.toFixed(2).replace(".", ",")}</span>
                          </div>
                        )}
                        {selectedShipping && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Frete ({selectedShipping.service})</span>
                            <span>{isFreeShipping ? <span className="text-primary font-semibold">Grátis</span> : `R$ ${selectedShipping.price.toFixed(2).replace(".", ",")}`}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="font-heading font-bold text-lg">Total</span>
                          <span className="font-heading text-2xl font-bold text-price">R$ {total.toFixed(2).replace(".", ",")}</span>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4 justify-end">
                        <Button variant="outline" onClick={() => navigate("/produtos")}>Continuar Comprando</Button>
                        <Button onClick={() => setStep(2)} disabled={items.length === 0}>Próximo: Endereço</Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
                <div>
                  <Label>CPF/CNPJ *</Label>
                  <Input 
                    value={shipping.cpf_cnpj} 
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, "");
                      if (v.length <= 11) {
                        v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                      } else {
                        v = v.substring(0, 14).replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
                      }
                      setShipping({ ...shipping, cpf_cnpj: v });
                    }}
                    placeholder="000.000.000-00"
                    maxLength={18}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Obrigatório para pagamento via PIX e Boleto</p>
                </div>
                <div><Label>Telefone *</Label><Input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
                <div>
                  <Label>CEP *</Label>
                  <Input
                    value={shipping.zip_code}
                    onChange={(e) => {
                      const formatted = formatCep(e.target.value);
                      setShipping({ ...shipping, zip_code: formatted });
                      setShippingCepInput(formatted);
                      const clean = formatted.replace(/\D/g, "");
                      if (clean.length === 8) {
                        calculateShipping(clean).then(options => {
                          setShippingOptions(options);
                          if (options && options.length > 0 && !selectedShipping) {
                            setSelectedShipping(options[0]);
                          }
                        });
                      }
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
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

                {/* Shipping Options in Address Step */}
                {shippingOptions && shippingOptions.length > 0 && (
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Escolha o Frete *</Label>
                    <div className="space-y-2">
                      {shippingOptions.map(opt => (
                        <button
                          key={opt.service}
                          type="button"
                          onClick={() => setSelectedShipping(opt)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                            selectedShipping?.service === opt.service
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {opt.service === "RETIRADA" ? <Store className="h-5 w-5 text-primary" /> : <Truck className="h-5 w-5 text-muted-foreground" />}
                            <div>
                              <p className="text-sm font-semibold">{opt.label}</p>
                              <p className="text-xs text-muted-foreground">{opt.service === "RETIRADA" ? "Retire na loja sem custo" : `${opt.days} dias úteis`}</p>
                            </div>
                          </div>
                          <p className="font-bold text-sm text-price">
                            {opt.price === 0 ? <span className="text-primary">Grátis</span> : isFreeShipping ? <><s className="text-muted-foreground font-normal">R$ {opt.price.toFixed(2).replace(".", ",")}</s> <span className="text-primary ml-1">Grátis</span></> : `R$ ${opt.price.toFixed(2).replace(".", ",")}`}
                          </p>
                        </button>
                      ))}
                      {/* Always show store pickup */}
                      {!shippingOptions?.find(o => o.service === "RETIRADA") && (
                        <button
                          type="button"
                          onClick={() => setSelectedShipping(STORE_PICKUP_OPTION)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                            selectedShipping?.service === "RETIRADA"
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Store className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-semibold">Retirada na Loja — São Leopoldo/RS</p>
                              <p className="text-xs text-muted-foreground">Retire na loja sem custo</p>
                            </div>
                          </div>
                          <p className="font-bold text-sm text-primary">Grátis</p>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-border flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <Button onClick={() => {
                  const isPickup = selectedShipping?.service === "RETIRADA";
                  if (!shipping.full_name) {
                    toast({ title: "Preencha o nome completo", variant: "destructive" });
                    return;
                  }
                  if (!isPickup && (!shipping.address || !shipping.city || !shipping.state)) {
                    toast({ title: "Preencha os campos de endereço obrigatórios", variant: "destructive" });
                    return;
                  }
                  const cpfClean = (shipping.cpf_cnpj || "").replace(/\D/g, "");
                  if (cpfClean.length < 11) {
                    toast({ title: "CPF/CNPJ obrigatório", description: "Informe seu CPF ou CNPJ para prosseguir com o pagamento.", variant: "destructive" });
                    return;
                  }
                  if (!selectedShipping) {
                    toast({ title: "Selecione uma opção de frete ou retirada", variant: "destructive" });
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
                <h2 className="font-heading text-xl font-bold flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Resumo e Pagamento</h2>
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
                  {selectedShipping && (
                    <p className="text-sm text-primary font-semibold mt-1 flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      {selectedShipping.label} — {selectedShipping.days} dias úteis
                      {isFreeShipping ? " (Frete Grátis)" : ` (R$ ${selectedShipping.price.toFixed(2).replace(".", ",")})`}
                    </p>
                  )}
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

                {/* Payment Methods Info */}
                <div>
                  <h3 className="font-heading font-bold text-sm mb-3">Formas de Pagamento Aceitas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <QrCode className="h-8 w-8 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">PIX</p>
                        <p className="text-xs text-muted-foreground">Aprovação instantânea</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <CreditCard className="h-8 w-8 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">Cartão de Crédito</p>
                        <p className="text-xs text-muted-foreground">Até 3x sem juros</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <Banknote className="h-8 w-8 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">Boleto</p>
                        <p className="text-xs text-muted-foreground">Vencimento em 3 dias</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                    </div>
                    {appliedCoupon && discount > 0 && (
                      <div className="flex justify-between text-sm text-primary font-semibold">
                        <span className="flex items-center gap-1"><Ticket className="h-3.5 w-3.5" /> Cupom {appliedCoupon.code}</span>
                        <span>- R$ {discount.toFixed(2).replace(".", ",")}</span>
                      </div>
                    )}
                    {selectedShipping && (
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Frete ({selectedShipping.service})</span>
                        <span>{isFreeShipping ? <span className="text-primary font-semibold">Grátis</span> : `R$ ${selectedShipping.price.toFixed(2).replace(".", ",")}`}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                      <span className="font-heading text-lg font-bold">Total do Pedido</span>
                      <span className="font-heading text-2xl font-bold text-price">R$ {total.toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ou até 3x de R$ {(total / 3).toFixed(2).replace(".", ",")} sem juros
                  </p>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Ao confirmar, você será redirecionado ao Mercado Pago para concluir o pagamento com segurança.
                </p>
              </div>
              <div className="p-6 border-t border-border flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
                <Button onClick={placeOrder} disabled={loading || paymentLoading} className="px-8">
                  {loading || paymentLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                  ) : (
                    "Pagar com Mercado Pago"
                  )}
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
              <h2 className="font-heading text-2xl font-bold mb-2">Pagamento Confirmado! ✅</h2>
              <p className="text-muted-foreground mb-2">Obrigado pela sua compra! Seu pagamento foi aprovado com sucesso.</p>
              <p className="text-sm text-muted-foreground mb-6">Pedido #{createdOrderId?.slice(0, 8)}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/produtos")}>Continuar Comprando</Button>
                <Button onClick={() => navigate("/minha-conta")}>Ver Meus Pedidos</Button>
              </div>
            </div>
          )}

          {/* Step 5: Pending Payment (PIX/Boleto) */}
          {step === 5 && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
              <div className="bg-yellow-100 rounded-full p-6 inline-flex mb-6">
                <AlertCircle className="h-16 w-16 text-yellow-600" />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-2">Pagamento Pendente</h2>
              <p className="text-muted-foreground mb-2">Seu pedido foi criado! O pagamento está sendo processado.</p>
              <p className="text-sm text-muted-foreground mb-6">
                Se você pagou via PIX ou Boleto, aguarde a confirmação. Você receberá uma notificação quando o pagamento for aprovado.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/produtos")}>Continuar Comprando</Button>
                <Button onClick={() => navigate("/minha-conta")}>Acompanhar Pedido</Button>
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
