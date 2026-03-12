import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Package, ShoppingCart, Users, Tag, Truck, Star, MessageSquare,
  Gift, BookOpen, Globe, Wrench, Mail, Megaphone, BarChart3,
  Calculator, Search, Bell, Heart, FileText, Upload, Video,
  Shield, CreditCard, Bot, Eye, Layers, Settings, CheckCircle2,
  ChevronDown, ChevronUp, Zap, Smartphone, Share2, FileDown,
  DollarSign
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";

interface FeatureCategory {
  title: string;
  icon: React.ReactNode;
  color: string;
  features: Feature[];
}

interface Feature {
  name: string;
  description: string;
  status: "active" | "configured" | "available";
  details?: string[];
}

interface SiteStats {
  products: number;
  categories: number;
  subcategories: number;
  orders: number;
  clients: number;
  articles: number;
  testimonials: number;
  mechanics: number;
  sellers: number;
  explodedViews: number;
  rewards: number;
  subscribers: number;
  quotes: number;
  campaigns: number;
  catalogs: number;
  videos: number;
}

const SiteFeatureReport = () => {
  const [stats, setStats] = useState<SiteStats>({
    products: 0, categories: 0, subcategories: 0, orders: 0, clients: 0,
    articles: 0, testimonials: 0, mechanics: 0, sellers: 0, explodedViews: 0,
    rewards: 0, subscribers: 0, quotes: 0, campaigns: 0, catalogs: 0, videos: 0,
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const queries = [
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("subcategories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("technical_articles").select("id", { count: "exact", head: true }),
        supabase.from("testimonials").select("id", { count: "exact", head: true }),
        supabase.from("mechanics").select("id", { count: "exact", head: true }),
        supabase.from("sellers").select("id", { count: "exact", head: true }),
        supabase.from("exploded_views").select("id", { count: "exact", head: true }),
        supabase.from("rewards").select("id", { count: "exact", head: true }),
        supabase.from("email_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("quotes").select("id", { count: "exact", head: true }),
        supabase.from("marketing_campaigns").select("id", { count: "exact", head: true }),
        supabase.from("technical_catalogs").select("id", { count: "exact", head: true }),
        supabase.from("mechanic_videos").select("id", { count: "exact", head: true }),
      ];
      const results = await Promise.all(queries);
      setStats({
        products: results[0].count || 0,
        categories: results[1].count || 0,
        subcategories: results[2].count || 0,
        orders: results[3].count || 0,
        clients: results[4].count || 0,
        articles: results[5].count || 0,
        testimonials: results[6].count || 0,
        mechanics: results[7].count || 0,
        sellers: results[8].count || 0,
        explodedViews: results[9].count || 0,
        rewards: results[10].count || 0,
        subscribers: results[11].count || 0,
        quotes: results[12].count || 0,
        campaigns: results[13].count || 0,
        catalogs: results[14].count || 0,
        videos: results[15].count || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const toggle = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  const featureCategories: FeatureCategory[] = [
    {
      title: "🛒 E-Commerce & Catálogo de Produtos",
      icon: <Package className="h-5 w-5" />,
      color: "from-primary/10 to-primary/5 border-primary/20",
      features: [
        {
          name: "Catálogo de Produtos Completo",
          description: "Sistema completo de cadastro, edição e gestão de produtos com múltiplas imagens, vídeo, especificações técnicas e SEO.",
          status: "active",
          details: [
            `${stats.products} produtos cadastrados no sistema`,
            "Campos: nome, SKU, preço, preço original (riscado), estoque, marca, HP, modelo do motor",
            "Múltiplas imagens por produto (imagem principal + galeria adicional)",
            "Vídeo do produto (URL YouTube/Vimeo)",
            "Especificações técnicas em formato JSON dinâmico",
            "Dimensões e peso para cálculo de frete (largura, altura, comprimento, peso)",
            "Motores compatíveis (array de compatibilidade)",
            "Documentos técnicos anexados ao produto",
            "Frete grátis por produto (flag individual)",
            "Produto destaque e lançamento (flags de destaque na vitrine)",
            "Ativar/desativar produto sem excluir"
          ]
        },
        {
          name: "Categorias com Árvore de Subcategorias",
          description: "Sistema hierárquico ilimitado de categorias e subcategorias com suporte a múltiplos níveis.",
          status: "active",
          details: [
            `${stats.categories} categorias e ${stats.subcategories} subcategorias cadastradas`,
            "Subcategorias aninhadas recursivamente (sub-sub-categorias)",
            "Tabela de junção product_categories para associação múltipla",
            "Um produto pode pertencer a várias categorias simultaneamente",
            "Imagem e descrição por categoria/subcategoria",
            "Slug único para URLs amigáveis (SEO)",
            "Visibilidade controlada (mostrar/ocultar categorias)"
          ]
        },
        {
          name: "Carrinho de Compras Persistente",
          description: "Carrinho salvo no banco de dados vinculado ao usuário logado, com drawer lateral.",
          status: "active",
          details: [
            "Carrinho persistente por sessão de usuário (tabela cart_items)",
            "Drawer lateral com lista de itens, quantidades e subtotal",
            "Atualização de quantidade em tempo real",
            "Remoção individual de itens",
            "Link direto para checkout"
          ]
        },
        {
          name: "Checkout com MercadoPago",
          description: "Fluxo completo de checkout com integração de pagamento via MercadoPago.",
          status: "active",
          details: [
            "Página de checkout com resumo do pedido",
            "Integração com API MercadoPago (create-payment edge function)",
            "Webhook para atualização automática de status (mercadopago-webhook)",
            "Sincronização de status de pagamento (sync-payment-status)",
            "Páginas dedicadas: confirmação, erro e pagamento pendente",
            "Rastreamento de pagamento (mp_payment_id, mp_preference_id)"
          ]
        },
        {
          name: "Gestão de Pedidos",
          description: "Painel completo de pedidos com status, histórico, impressão e rastreamento.",
          status: "active",
          details: [
            `${stats.orders} pedidos registrados`,
            "Status do pedido: pendente → confirmado → processando → enviado → entregue → cancelado",
            "Histórico de alterações de status (order_status_history)",
            "Badges de pagamento integrados (💳 Pago, ⏳ Aguardando, ❌ Recusado)",
            "Código de rastreamento dos Correios",
            "Impressão de folha de pedido (OrderPrintSheet)",
            "Notas internas por pedido",
            "Exclusão de pedidos cancelados"
          ]
        },
        {
          name: "Busca Inteligente de Produtos",
          description: "Campo de busca global com autocomplete e filtros avançados.",
          status: "active",
          details: [
            "Componente SmartSearch com busca em tempo real",
            "Busca por nome, SKU, marca, modelo do motor",
            "Página de todos os produtos com filtros por categoria",
            "Ordenação por preço, nome, data"
          ]
        },
        {
          name: "Gestão de Estoque",
          description: "Painel dedicado para controle de estoque com alertas de baixo estoque.",
          status: "active",
          details: [
            "Dashboard de estoque com visão geral",
            "Alerta automático para produtos com estoque ≤ 5 unidades",
            "Atualização em massa de quantidades",
            "Indicadores visuais de estoque (verde/amarelo/vermelho)"
          ]
        },
        {
          name: "Importação de Produtos em Massa",
          description: "Importação via CSV e Excel com mapeamento de colunas e logs de erros.",
          status: "active",
          details: [
            "Upload de arquivos CSV e XLSX",
            "Mapeamento automático de colunas",
            "Log de importação com produtos criados/falhados",
            "Detalhes de erros por linha"
          ]
        },
        {
          name: "Pesquisa de Preços (Concorrência)",
          description: "Ferramenta de pesquisa de preços de concorrentes com análise por IA.",
          status: "active",
          details: [
            "Pesquisa automática de preços no mercado",
            "Comparação com preço atual do produto",
            "Diferença percentual de preços",
            "Sugestão de preço otimizado",
            "Análise por IA do posicionamento"
          ]
        }
      ]
    },
    {
      title: "👥 Clientes, Autenticação & Perfis",
      icon: <Users className="h-5 w-5" />,
      color: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
      features: [
        {
          name: "Autenticação Completa",
          description: "Sistema de login e cadastro com verificação de email.",
          status: "active",
          details: [
            "Cadastro com email e senha",
            "Verificação de email obrigatória",
            "Login seguro via Supabase Auth",
            "Proteção de rotas (ProtectedRoute)",
            "Contexto de autenticação global (AuthContext)"
          ]
        },
        {
          name: "Perfil do Cliente",
          description: "Dados completos do cliente com endereço, CPF/CNPJ e empresa.",
          status: "active",
          details: [
            `${stats.clients} perfis cadastrados`,
            "Campos: nome, email, telefone, CPF/CNPJ, empresa",
            "Endereço completo (rua, número, complemento, bairro, cidade, estado, CEP)",
            "Notas administrativas por cliente",
            "Código de indicação único por cliente"
          ]
        },
        {
          name: "Roles e Permissões",
          description: "Sistema de papéis (admin, user, seller) com RLS no banco de dados.",
          status: "active",
          details: [
            "3 roles: admin, user, seller",
            "Tabela separada user_roles (segurança)",
            "Função has_role() com SECURITY DEFINER",
            "Função is_admin() para verificação rápida",
            "RLS em todas as tabelas do sistema",
            "Gestão de roles pelo painel admin"
          ]
        },
        {
          name: "Dashboard do Cliente",
          description: "Painel pessoal com pedidos, favoritos, pontos e cupons.",
          status: "active",
          details: [
            "Histórico completo de pedidos",
            "Lista de produtos favoritos",
            "Saldo de pontos de fidelidade",
            "Cupons disponíveis",
            "Edição de perfil e endereço"
          ]
        },
        {
          name: "Gestão de Clientes (Admin)",
          description: "Listagem completa com busca, histórico detalhado e contato via WhatsApp.",
          status: "active",
          details: [
            "Listagem com busca por nome/email/telefone",
            "Expansão de linha com histórico completo do cliente",
            "Botão de contato via WhatsApp por cliente",
            "Edição de dados pelo admin",
            "Notas administrativas"
          ]
        }
      ]
    },
    {
      title: "🔧 Área do Mecânico & Parcerias",
      icon: <Wrench className="h-5 w-5" />,
      color: "from-orange-500/10 to-orange-500/5 border-orange-500/20",
      features: [
        {
          name: "Programa de Parceria para Mecânicos",
          description: "Cadastro e aprovação de oficinas e mecânicos parceiros com preços exclusivos.",
          status: "active",
          details: [
            `${stats.mechanics} mecânicos cadastrados`,
            "Formulário de cadastro: empresa, CNPJ, inscrição estadual, especialidade",
            "Aprovação manual pelo admin",
            "Taxa de desconto exclusiva configurável (padrão 5%)",
            "Proteção de campos admin (trigger protect_mechanic_admin_fields)"
          ]
        },
        {
          name: "Catálogos Técnicos para Mecânicos",
          description: "Upload e gestão de catálogos PDF exclusivos para mecânicos aprovados.",
          status: "active",
          details: [
            `${stats.catalogs} catálogos cadastrados`,
            "Upload de arquivos PDF (bucket: technical-catalogs)",
            "Acesso restrito a mecânicos aprovados (RLS)",
            "Categorização por tipo",
            "Download direto pelo painel"
          ]
        },
        {
          name: "Vídeos Técnicos para Mecânicos",
          description: "Gestão de vídeos educacionais exclusivos para mecânicos parceiros.",
          status: "active",
          details: [
            `${stats.videos} vídeos cadastrados`,
            "URL do vídeo (YouTube/Vimeo)",
            "Categorização por assunto",
            "Acesso exclusivo para mecânicos aprovados"
          ]
        },
        {
          name: "Orçamentos com Resposta via WhatsApp",
          description: "Sistema de solicitação de orçamentos com resposta direta via WhatsApp.",
          status: "active",
          details: [
            `${stats.quotes} orçamentos registrados`,
            "Formulário: nome, email, telefone, empresa, mensagem",
            "Itens do orçamento com produtos, quantidades e preços",
            "Status: pendente → respondido → aprovado → recusado",
            "Botão 'Responder via WhatsApp' com mensagem pré-preenchida",
            "Notas administrativas por orçamento",
            "Estimativa de valor total"
          ]
        }
      ]
    },
    {
      title: "📚 Central Técnica & Conteúdo",
      icon: <BookOpen className="h-5 w-5" />,
      color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
      features: [
        {
          name: "Central Técnica (Blog)",
          description: "Blog de artigos técnicos com busca full-text e categorização.",
          status: "active",
          details: [
            `${stats.articles} artigos publicados`,
            "Busca full-text via PostgreSQL tsvector",
            "Função search_articles() com ranking de relevância",
            "Categorias: Manutenção, Diagnóstico, Dicas",
            "Tags por artigo para filtragem",
            "Tempo de leitura estimado",
            "Imagem de destaque",
            "Slug único para URL amigável",
            "Trigger automático para atualizar search_vector"
          ]
        },
        {
          name: "Catálogo Interativo (Vista Explodida)",
          description: "Visualização explodida de motores com peças clicáveis para compra direta.",
          status: "active",
          details: [
            `${stats.explodedViews} vistas explodidas cadastradas`,
            "Separação por tipo de motor: Gasolina e Diesel",
            "Seções: cabeçote, pistão, bloco, volante, carburador/injeção, etc.",
            "Clique na peça → busca automática de produtos relacionados",
            "Imagens de alta qualidade com zoom (ZoomableImage)",
            "Gestão completa pelo admin (ExplodedViewManagement)",
            "Ordem de exibição configurável"
          ]
        },
        {
          name: "Calculadora de Carga para Geradores",
          description: "Ferramenta interativa para dimensionamento de geradores baseada na carga elétrica.",
          status: "active",
          details: [
            "Seleção de equipamentos elétricos com potência pré-definida",
            "Cálculo automático da potência total necessária",
            "Margem de segurança de 30% aplicada automaticamente",
            "Recomendação de modelos de geradores compatíveis do catálogo",
            "Integrada à Central Técnica e à página inicial"
          ]
        }
      ]
    },
    {
      title: "💰 Vendedores & Comissões",
      icon: <DollarSign className="h-5 w-5" />,
      color: "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20",
      features: [
        {
          name: "Gestão de Vendedores",
          description: "Cadastro e gestão de vendedores com taxa de comissão individual.",
          status: "active",
          details: [
            `${stats.sellers} vendedores cadastrados`,
            "Taxa de comissão configurável por vendedor (padrão 10%)",
            "Ativar/desativar vendedor",
            "Total de vendas e comissões acumuladas",
            "Vinculação de pedido ao vendedor"
          ]
        },
        {
          name: "Sistema de Comissões",
          description: "Cálculo automático de comissões por venda com rastreamento de status.",
          status: "active",
          details: [
            "Tabela sale_commissions com cálculo automático",
            "Valor da comissão = total do pedido × taxa do vendedor",
            "Status da comissão: pendente → pago",
            "Relatório de comissões com exportação CSV"
          ]
        },
        {
          name: "Dashboard do Vendedor",
          description: "Painel dedicado para vendedores acompanharem suas vendas e comissões.",
          status: "active",
          details: [
            "Visão geral de vendas e comissões",
            "Histórico de pedidos vinculados",
            "Filtros por período"
          ]
        }
      ]
    },
    {
      title: "🎁 Fidelidade, Recompensas & Indicações",
      icon: <Gift className="h-5 w-5" />,
      color: "from-pink-500/10 to-pink-500/5 border-pink-500/20",
      features: [
        {
          name: "Programa de Fidelidade (Pontos)",
          description: "Sistema de pontos creditados automaticamente na entrega do pedido.",
          status: "active",
          details: [
            "1 ponto por R$1 gasto (creditado na entrega)",
            "Trigger automático credit_loyalty_points_on_delivery",
            "Função get_user_points() para saldo em tempo real",
            "Tipos: earn (ganhar) e redeem (resgatar)",
            "Notificação automática ao creditar pontos",
            "Histórico completo de movimentações"
          ]
        },
        {
          name: "Catálogo de Recompensas",
          description: "Recompensas resgatáveis com pontos: descontos fixos, percentuais e frete grátis.",
          status: "active",
          details: [
            `${stats.rewards} recompensas configuradas`,
            "Tipos: desconto fixo (R$), desconto percentual (%), frete grátis",
            "Pontos necessários configuráveis por recompensa",
            "Geração automática de cupom ao aprovar resgate (trigger generate_coupon_on_approval)",
            "Cupom com validade de 30 dias",
            "Código único formato GRD-XXXXXXXX"
          ]
        },
        {
          name: "Programa de Indicações",
          description: "Indicação de amigos com bonificação em pontos para ambos.",
          status: "active",
          details: [
            "Código de indicação único por cliente (gerado automaticamente)",
            "Referenciador ganha 100 pontos",
            "Indicado ganha 50 pontos de boas-vindas",
            "Proteção contra auto-indicação e duplicatas",
            "Notificação automática para ambos",
            "Função process_referral() com validação completa"
          ]
        }
      ]
    },
    {
      title: "📢 Marketing & Comunicação",
      icon: <Megaphone className="h-5 w-5" />,
      color: "from-violet-500/10 to-violet-500/5 border-violet-500/20",
      features: [
        {
          name: "Central de Marketing",
          description: "Gestão de campanhas, criativos e posts para redes sociais.",
          status: "active",
          details: [
            `${stats.campaigns} campanhas criadas`,
            "Campanhas com data de início/fim e status",
            "Criativos: headline, body, hashtags, CTA, imagem",
            "Formatos: post Instagram, story, banner, etc.",
            "Posts agendados com data/hora de publicação",
            "Geração de texto de marketing por IA (edge function)"
          ]
        },
        {
          name: "Gestão de Assinantes de Email",
          description: "Lista de emails capturados com cupom de desconto automático.",
          status: "active",
          details: [
            `${stats.subscribers} assinantes cadastrados`,
            "Popup de primeira visita com oferta de desconto",
            "Código de desconto único gerado na inscrição",
            "Exportação de lista de emails"
          ]
        },
        {
          name: "Depoimentos e Avaliações",
          description: "Sistema de depoimentos moderados e avaliações de produtos.",
          status: "active",
          details: [
            `${stats.testimonials} depoimentos registrados`,
            "Aprovação manual pelo admin",
            "Avaliações de produtos com nota (1-5 estrelas)",
            "Compra verificada (is_verified_purchase)",
            "Exibição na homepage (seção TestimonialsSection)"
          ]
        },
        {
          name: "Banner Rotativo (Hero Banner)",
          description: "Banners promocionais na homepage com rotação automática.",
          status: "active",
          details: [
            "Modo alternável: vitrine de produtos OU banner rotativo",
            "Configuração via site_settings (hero_mode)",
            "3 banners com imagens de alta qualidade",
            "Transição suave entre banners"
          ]
        }
      ]
    },
    {
      title: "🚚 Frete & Logística",
      icon: <Truck className="h-5 w-5" />,
      color: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
      features: [
        {
          name: "Cálculo de Frete por Região",
          description: "Tabela de fretes PAC e SEDEX configurável por região do Brasil.",
          status: "active",
          details: [
            "Regiões: Sul, Sudeste, Centro-Oeste, Nordeste, Norte",
            "Preços PAC e SEDEX por região",
            "Prazo de entrega estimado (dias úteis)",
            "Frete grátis por produto (flag individual)",
            "Ativar/desativar região",
            "Gestão completa pelo admin (ShippingManagement)"
          ]
        }
      ]
    },
    {
      title: "🤖 Inteligência Artificial",
      icon: <Bot className="h-5 w-5" />,
      color: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20",
      features: [
        {
          name: "Assistente IA (Mecânico Virtual)",
          description: "Chatbot inteligente para diagnóstico de problemas e sugestão de peças.",
          status: "active",
          details: [
            "Edge function ai-mechanic com modelo de IA",
            "Diagnóstico de problemas em motores estacionários",
            "Sugestão automática de produtos relacionados",
            "Log de conversas para análise (ai_conversation_logs)",
            "Widget flutuante em todas as páginas"
          ]
        },
        {
          name: "Identificador de Peças por Foto",
          description: "Upload de foto da peça para identificação automática via IA.",
          status: "active",
          details: [
            "Edge function identify-part",
            "Upload de imagem da peça danificada/desconhecida",
            "IA identifica o tipo de peça e sugere produtos",
            "Integrado ao catálogo de produtos"
          ]
        },
        {
          name: "Geração de Imagens por IA",
          description: "Geração de imagens de produtos e backgrounds criativos.",
          status: "active",
          details: [
            "Edge functions: generate-product-image, generate-creative-image, generate-ai-background",
            "Remoção de fundo de imagens (extract-product-image)",
            "Backgrounds profissionais para fotos de produtos",
            "Integrado ao marketing center"
          ]
        },
        {
          name: "SEO Automático por IA",
          description: "Geração em lote de meta títulos e meta descrições para todos os produtos.",
          status: "active",
          details: [
            "SEOBatchGenerator para geração em massa",
            "Meta título otimizado (<60 caracteres)",
            "Meta descrição otimizada (<160 caracteres)",
            "Breadcrumbs semânticos (SEOBreadcrumb)",
            "Schema.org JSON-LD na homepage (Store)",
            "Canonical URLs em todas as páginas"
          ]
        }
      ]
    },
    {
      title: "📊 Relatórios & Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "from-teal-500/10 to-teal-500/5 border-teal-500/20",
      features: [
        {
          name: "Dashboard Administrativo",
          description: "Painel com KPIs, gráficos e visão geral do negócio.",
          status: "active",
          details: [
            "KPIs: produtos, pedidos, receita total, ticket médio, clientes, tarefas pendentes",
            "Indicadores de estoque: sem imagem, fora de estoque, preço médio",
            "Produtos por categoria (grid dinâmico)",
            "Pedidos por status com volume e receita",
            "Alertas de estoque baixo (≤ 5 unidades)",
            "Pedidos recentes com badges de pagamento",
            "Produtos em destaque",
            "Depoimentos recentes"
          ]
        },
        {
          name: "Relatórios Avançados com Exportação",
          description: "6 módulos de relatórios com filtros e exportação CSV.",
          status: "active",
          details: [
            "Relatório de Pedidos (filtro por data e status)",
            "Relatório de Clientes",
            "Relatório de Produtos",
            "Relatório de Mecânicos",
            "Relatório de Vendedores",
            "Relatório de Comissões",
            "Exportação CSV em todos os módulos",
            "Gráficos Recharts"
          ]
        },
        {
          name: "Analytics em Tempo Real",
          description: "Painel de análise de dados com métricas em tempo real.",
          status: "active",
          details: [
            "Supabase Realtime para atualizações de pedidos",
            "Notificações em tempo real (bell icon)",
            "Contadores atualizados automaticamente"
          ]
        }
      ]
    },
    {
      title: "📱 UX, Design & Integrações",
      icon: <Smartphone className="h-5 w-5" />,
      color: "from-rose-500/10 to-rose-500/5 border-rose-500/20",
      features: [
        {
          name: "Design Responsivo",
          description: "Layout adaptável para desktop, tablet e mobile.",
          status: "active",
          details: [
            "Breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)",
            "Menu mobile com drawer (MobileMenu)",
            "Barra de contato mobile fixa (MobileContactBar)",
            "CategoryNav sticky em todas as páginas",
            "Grid responsivo em listagens"
          ]
        },
        {
          name: "WhatsApp Integrado",
          description: "Botão flutuante do WhatsApp e integração em múltiplos pontos.",
          status: "active",
          details: [
            "Botão flutuante em todas as páginas",
            "Contato via WhatsApp nos orçamentos",
            "Contato via WhatsApp na gestão de clientes",
            "Link com mensagem pré-preenchida",
            "Número: +55 51 98182-5748"
          ]
        },
        {
          name: "Popup de Primeira Visita",
          description: "Popup de boas-vindas com captura de email e cupom de desconto.",
          status: "active",
          details: [
            "Exibido apenas na primeira visita",
            "Captura de email com consentimento",
            "Geração de cupom de desconto automático",
            "Não reaparece após fechamento"
          ]
        },
        {
          name: "Lembrete de Carrinho Abandonado",
          description: "Notificação para recuperar carrinhos abandonados.",
          status: "active",
          details: [
            "Componente AbandonedCartReminder",
            "Detecta itens no carrinho sem checkout",
            "Exibe lembrete após tempo de inatividade"
          ]
        },
        {
          name: "Favoritos",
          description: "Sistema de favoritos para salvar produtos preferidos.",
          status: "active",
          details: [
            "Botão de coração em cada produto (FavoriteButton)",
            "Persistido no banco (tabela favorites)",
            "Listagem de favoritos no painel do cliente"
          ]
        },
        {
          name: "Zoom de Imagem",
          description: "Componente de zoom para imagens de produtos e vistas explodidas.",
          status: "active",
          details: [
            "ZoomableImage com hover para ampliar",
            "Usado nas páginas de produto e catálogo interativo"
          ]
        },
        {
          name: "Notificações In-App",
          description: "Sistema de notificações com sino no header.",
          status: "active",
          details: [
            "Sino com badge de não lidas (NotificationBell)",
            "Tipos: info, points, reward, order",
            "Marcar como lida",
            "Link para ação relacionada"
          ]
        },
        {
          name: "Configurações de Aparência",
          description: "Personalização visual do site pelo admin.",
          status: "active",
          details: [
            "Modo do hero: vitrine ou banner rotativo",
            "Configurações salvas em site_settings",
            "Painel AppearanceSettings no admin"
          ]
        },
        {
          name: "Exportação Mercado Livre",
          description: "Ferramenta para exportar produtos no formato do Mercado Livre.",
          status: "active",
          details: [
            "Página dedicada MLExport",
            "Formatação compatível com importação ML",
            "Sincronização via edge function sync-mercadolivre"
          ]
        }
      ]
    },
    {
      title: "🔒 Segurança & Infraestrutura",
      icon: <Shield className="h-5 w-5" />,
      color: "from-gray-500/10 to-gray-500/5 border-gray-500/20",
      features: [
        {
          name: "Row Level Security (RLS)",
          description: "Políticas de segurança em nível de linha em todas as tabelas.",
          status: "active",
          details: [
            "RLS habilitado em TODAS as tabelas do sistema",
            "Funções SECURITY DEFINER para evitar recursão",
            "Separação de roles em tabela dedicada (user_roles)",
            "Proteção de campos admin via triggers",
            "Políticas RESTRICTIVE (não permissivas)"
          ]
        },
        {
          name: "Edge Functions (Backend)",
          description: "14 funções serverless para lógica de negócio.",
          status: "active",
          details: [
            "ai-mechanic — Assistente IA mecânico",
            "create-payment — Criar pagamento MercadoPago",
            "extract-product-image — Extrair/remover fundo de imagens",
            "generate-ai-background — Gerar backgrounds por IA",
            "generate-creative-image — Gerar imagens criativas",
            "generate-marketing-text — Gerar textos de marketing",
            "generate-product-image — Gerar imagens de produto",
            "generate-sitemap — Gerar sitemap XML",
            "identify-part — Identificar peças por foto",
            "mercadopago-webhook — Webhook de pagamento",
            "parse-catalog — Processar catálogo PDF",
            "research-prices — Pesquisar preços de concorrentes",
            "sync-mercadolivre — Sincronizar com Mercado Livre",
            "sync-payment-status — Sincronizar status de pagamento"
          ]
        },
        {
          name: "Storage (Armazenamento)",
          description: "Buckets de armazenamento para arquivos do sistema.",
          status: "active",
          details: [
            "product-images (público) — Imagens de produtos",
            "technical-catalogs (privado) — Catálogos técnicos para mecânicos"
          ]
        }
      ]
    }
  ];

  const totalFeatures = featureCategories.reduce((sum, cat) => sum + cat.features.length, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl md:text-3xl font-black text-foreground flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          Relatório Completo do Site
        </h1>
        <p className="text-muted-foreground mt-1">
          Documentação de todas as funcionalidades implementadas — {totalFeatures} recursos em {featureCategories.length} categorias
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: "Produtos", value: stats.products, icon: <Package className="h-4 w-4" /> },
          { label: "Pedidos", value: stats.orders, icon: <ShoppingCart className="h-4 w-4" /> },
          { label: "Clientes", value: stats.clients, icon: <Users className="h-4 w-4" /> },
          { label: "Categorias", value: stats.categories + stats.subcategories, icon: <Tag className="h-4 w-4" /> },
          { label: "Artigos", value: stats.articles, icon: <BookOpen className="h-4 w-4" /> },
          { label: "Mecânicos", value: stats.mechanics, icon: <Wrench className="h-4 w-4" /> },
          { label: "Vendedores", value: stats.sellers, icon: <DollarSign className="h-4 w-4" /> },
          { label: "Orçamentos", value: stats.quotes, icon: <FileText className="h-4 w-4" /> },
          { label: "Assinantes", value: stats.subscribers, icon: <Mail className="h-4 w-4" /> },
          { label: "Depoimentos", value: stats.testimonials, icon: <Star className="h-4 w-4" /> },
          { label: "Recompensas", value: stats.rewards, icon: <Gift className="h-4 w-4" /> },
          { label: "Funcionalidades", value: totalFeatures, icon: <Zap className="h-4 w-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              {s.icon}
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className="text-xl font-black text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Feature Categories */}
      <div className="space-y-4">
        {featureCategories.map((category, catIdx) => (
          <div key={catIdx} className={`rounded-xl border bg-gradient-to-r ${category.color} overflow-hidden`}>
            <button
              onClick={() => toggle(`cat-${catIdx}`)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-heading font-black text-foreground">{category.title}</span>
                <Badge variant="secondary" className="text-xs">{category.features.length} recursos</Badge>
              </div>
              {expanded[`cat-${catIdx}`] ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </button>

            {expanded[`cat-${catIdx}`] && (
              <div className="px-5 pb-5 space-y-3">
                {category.features.map((feature, fIdx) => (
                  <div key={fIdx} className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden">
                    <button
                      onClick={() => toggle(`feat-${catIdx}-${fIdx}`)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          <h3 className="font-heading font-bold text-foreground text-sm">{feature.name}</h3>
                          <Badge className="bg-green-500/15 text-green-700 text-[10px] border-0">Ativo</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">{feature.description}</p>
                      </div>
                      {feature.details && (
                        expanded[`feat-${catIdx}-${fIdx}`]
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {expanded[`feat-${catIdx}-${fIdx}`] && feature.details && (
                      <div className="px-4 pb-4 ml-6">
                        <ul className="space-y-1.5">
                          {feature.details.map((detail, dIdx) => (
                            <li key={dIdx} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pages Summary */}
      <div className="mt-8 bg-card rounded-xl border border-border p-6">
        <h2 className="font-heading text-lg font-black text-foreground mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Páginas do Site ({20} páginas)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { path: "/", name: "Página Inicial (Homepage)" },
            { path: "/produtos", name: "Todos os Produtos" },
            { path: "/produto/:id", name: "Detalhe do Produto" },
            { path: "/categoria/:slug", name: "Página de Categoria" },
            { path: "/checkout", name: "Checkout / Pagamento" },
            { path: "/pedido-confirmado", name: "Pedido Confirmado" },
            { path: "/pagamento-pendente", name: "Pagamento Pendente" },
            { path: "/erro-pagamento", name: "Erro no Pagamento" },
            { path: "/auth", name: "Login / Cadastro" },
            { path: "/minha-conta", name: "Dashboard do Cliente" },
            { path: "/admin", name: "Dashboard Administrativo" },
            { path: "/vendedor", name: "Dashboard do Vendedor" },
            { path: "/mecanico", name: "Área do Mecânico" },
            { path: "/central-tecnica", name: "Central Técnica (Artigos)" },
            { path: "/catalogo-interativo", name: "Catálogo Interativo (Vista Explodida)" },
            { path: "/calculadora-de-carga", name: "Calculadora de Carga" },
            { path: "/solicitar-orcamento", name: "Solicitar Orçamento" },
            { path: "/sobre", name: "Sobre a Empresa" },
            { path: "/contato", name: "Contato" },
            { path: "/politica-de-privacidade", name: "Política de Privacidade" },
            { path: "/termos-de-uso", name: "Termos de Uso" },
            { path: "/trocas-e-devolucoes", name: "Trocas e Devoluções" },
            { path: "/exportar-ml", name: "Exportar Mercado Livre" },
          ].map(page => (
            <div key={page.path} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-md bg-muted/30">
              <code className="text-[10px] text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">{page.path}</code>
              <span className="text-muted-foreground text-xs">{page.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="mt-4 bg-card rounded-xl border border-border p-6">
        <h2 className="font-heading text-lg font-black text-foreground mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Stack Tecnológico
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "React 18", desc: "Framework Frontend" },
            { name: "TypeScript", desc: "Tipagem Estática" },
            { name: "Vite", desc: "Build Tool" },
            { name: "Tailwind CSS", desc: "Framework CSS" },
            { name: "Shadcn/UI", desc: "Componentes UI" },
            { name: "Supabase", desc: "Backend (BaaS)" },
            { name: "Framer Motion", desc: "Animações" },
            { name: "Recharts", desc: "Gráficos" },
            { name: "React Router", desc: "Navegação SPA" },
            { name: "React Query", desc: "Cache de Dados" },
            { name: "React Hook Form", desc: "Formulários" },
            { name: "Zod", desc: "Validação de Schema" },
            { name: "MercadoPago", desc: "Pagamentos" },
            { name: "Lucide Icons", desc: "Ícones" },
            { name: "Helmet Async", desc: "SEO / Meta Tags" },
            { name: "Edge Functions", desc: "Serverless Backend" },
          ].map(t => (
            <div key={t.name} className="bg-muted/30 rounded-lg p-3">
              <p className="font-bold text-sm text-foreground">{t.name}</p>
              <p className="text-[10px] text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        <p>Relatório gerado automaticamente — Gründemann Power Hub © {new Date().getFullYear()}</p>
        <p className="mt-1">CNPJ: 48.530.708/0001-80 | São Leopoldo – RS</p>
      </div>
    </div>
  );
};

export default SiteFeatureReport;
