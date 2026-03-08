import { Helmet } from "react-helmet-async";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import { MapPin, Phone, Mail, MessageCircle, Clock, Award, Users, Wrench } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Quem Somos | Grundemann Power Hub</title>
        <meta name="description" content="Conheça a Grundemann Power Hub. Há mais de 15 anos oferecendo peças para motores estacionários e geradores de energia para todo o Brasil." />
        <meta property="og:title" content="Quem Somos | Grundemann Power Hub" />
        <meta property="og:description" content="Há mais de 15 anos oferecendo soluções em geradores de energia para todo o Brasil." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://grundemann-power-hub.lovable.app/quem-somos" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "Sobre a Grundemann Power Hub",
          "description": "Há mais de 15 anos oferecendo soluções em geradores de energia",
          "url": "https://grundemann-power-hub.lovable.app/quem-somos"
        })}</script>
      </Helmet>
      <TopBar />
      <Header />
      <CategoryNav />
      <div className="flex-1">
        <div className="bg-gradient-brand py-16">
          <div className="container text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-primary-foreground mb-4">Quem Somos</h1>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
              Há mais de 15 anos oferecendo soluções em geradores de energia para todo o Brasil.
            </p>
          </div>
        </div>

        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="font-heading text-2xl font-bold mb-4">Nossa História</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A Gründemann Geradores nasceu da paixão por soluções energéticas confiáveis. Desde o início, 
                nosso compromisso é oferecer equipamentos de alta qualidade, peças originais e compatíveis, 
                além de serviços técnicos especializados para manter seus geradores funcionando com máxima eficiência.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Localizada em São Leopoldo/RS, atendemos clientes em todo o território nacional, 
                fornecendo desde pequenos geradores portáteis para uso residencial até soluções industriais 
                de grande porte para empresas e indústrias.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Nossa equipe técnica é altamente qualificada e está sempre atualizada com as mais recentes 
                tecnologias do mercado, garantindo atendimento de excelência e suporte técnico completo.
              </p>
            </div>
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-heading font-bold text-lg mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" /> Missão
                </h3>
                <p className="text-muted-foreground text-sm">
                  Fornecer soluções completas em geração de energia com qualidade, segurança e preço justo, 
                  garantindo a satisfação de nossos clientes.
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-heading font-bold text-lg mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Visão
                </h3>
                <p className="text-muted-foreground text-sm">
                  Ser referência nacional em vendas de geradores e peças, reconhecida pela excelência 
                  no atendimento e qualidade dos produtos.
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-heading font-bold text-lg mb-2 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" /> Valores
                </h3>
                <p className="text-muted-foreground text-sm">
                  Honestidade, compromisso com o cliente, qualidade, inovação e responsabilidade ambiental.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { value: "15+", label: "Anos de experiência" },
              { value: "5.000+", label: "Clientes atendidos" },
              { value: "500+", label: "Produtos disponíveis" },
              { value: "100%", label: "Satisfação garantida" },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-muted/50 rounded-xl p-6">
                <p className="font-heading text-3xl font-extrabold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <h2 className="font-heading text-2xl font-bold mb-6 text-center">Nosso Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-heading font-bold text-sm">Endereço</p>
                  <p className="text-sm text-muted-foreground">Rua Luiz Bernardo da Silva, 190 - Pinheiro, São Leopoldo/RS - CEP 93042-110</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-heading font-bold text-sm">Telefone</p>
                  <p className="text-sm text-muted-foreground">(51) 8182-5748</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-heading font-bold text-sm">Email</p>
                  <p className="text-sm text-muted-foreground">adair.grundemann@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-heading font-bold text-sm">Horário</p>
                  <p className="text-sm text-muted-foreground">Seg a Sex: 8h às 18h<br />Sáb: 8h às 12h</p>
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

export default About;
