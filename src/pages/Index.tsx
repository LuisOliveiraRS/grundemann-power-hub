import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BookOpen, Wrench, BadgeCheck, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import HeroSection from "@/components/HeroSection";
import BenefitsBar from "@/components/BenefitsBar";
import PartsFinder from "@/components/PartsFinder";
import TabbedProducts from "@/components/TabbedProducts";
import SocialProof from "@/components/SocialProof";
import CategoriesSection from "@/components/CategoriesSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AIAssistant from "@/components/AIAssistant";
import FirstVisitPopup from "@/components/FirstVisitPopup";
import AbandonedCartReminder from "@/components/AbandonedCartReminder";
import MobileContactBar from "@/components/MobileContactBar";
import GuaranteeSection from "@/components/GuaranteeSection";

const HeroBanner = lazy(() => import("@/components/HeroBanner"));
const HeroKraft = lazy(() => import("@/components/HeroKraft"));
const KraftProductShowcase = lazy(() => import("@/components/KraftProductShowcase"));
const MaintenancePage = lazy(() => import("@/components/MaintenancePage"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const HomeFAQ = lazy(() => import("@/components/HomeFAQ"));

const SectionLoader = () => <div className="py-8 flex justify-center"><div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" /></div>;

const TechnicalCenterTeaser = () => (
  <section className="py-14 bg-muted/30">
    <div className="container">
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl md:text-3xl font-black text-foreground">CENTRAL TÉCNICA DE MOTORES ESTACIONÁRIOS</h2>
        <p className="text-muted-foreground mt-2">Artigos, guias e ferramentas para mecânicos e proprietários de motores</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Link to="/central-tecnica" className="group bg-card rounded-xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all">
          <BookOpen className="h-10 w-10 text-primary mb-3" />
          <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">Artigos Técnicos</h3>
          <p className="text-sm text-muted-foreground mt-1">Guias de manutenção, diagnóstico e reparo de motores estacionários.</p>
        </Link>
        <Link to="/catalogo-interativo" className="group bg-card rounded-xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all">
          <Wrench className="h-10 w-10 text-primary mb-3" />
          <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">Catálogo Interativo</h3>
          <p className="text-sm text-muted-foreground mt-1">Vista explodida do motor — clique nas peças e compre diretamente.</p>
        </Link>
        <Link to="/calculadora-de-carga" className="group bg-card rounded-xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all">
          <Calculator className="h-10 w-10 text-primary mb-3" />
          <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">Calculadora de Carga</h3>
          <p className="text-sm text-muted-foreground mt-1">Dimensione a carga ideal e encontre o gerador certo para sua necessidade.</p>
        </Link>
      </div>
    </div>
  </section>
);

const Index = () => {
  const [heroMode, setHeroMode] = useState<string>("product_showcase");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "hero_mode")
      .single()
      .then(({ data }) => {
        if (data) setHeroMode(data.value);
      });
  }, []);

  return (
    <>
      {heroMode === "maintenance" ? (
        <Suspense fallback={<SectionLoader />}>
          <MaintenancePage />
        </Suspense>
      ) : (
        <div className="min-h-screen flex flex-col">
          <Helmet>
            <title>Grundemann Power Hub | Peças e Geradores de Energia</title>
            <meta name="description" content="Loja especializada em peças para motores estacionários, geradores de energia e equipamentos industriais. Entrega para todo o Brasil com garantia." />
            <meta property="og:title" content="Grundemann Power Hub | Peças e Geradores de Energia" />
            <meta property="og:description" content="Peças para motores estacionários, geradores e equipamentos industriais com garantia e entrega nacional." />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://grundemann-power-hub.lovable.app" />
            <meta name="twitter:card" content="summary_large_image" />
            <link rel="canonical" href="https://grundemann-power-hub.lovable.app" />
            <script type="application/ld+json">{JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              "name": "Grundemann Power Hub",
              "description": "Loja especializada em peças para motores estacionários e geradores de energia",
              "url": "https://grundemann-power-hub.lovable.app",
              "telephone": "+55-51-98182-5748",
              "address": { "@type": "PostalAddress", "addressLocality": "São Leopoldo", "addressRegion": "RS", "addressCountry": "BR" },
              "priceRange": "$$"
            })}</script>
          </Helmet>
          <TopBar />
          <Header />
          <CategoryNav />
          {heroMode === "kraft_style" ? (
            <>
              <Suspense fallback={<SectionLoader />}>
                <HeroKraft />
              </Suspense>
              <BenefitsBar />
              <Suspense fallback={<SectionLoader />}>
                <KraftProductShowcase />
              </Suspense>
              <PartsFinder />
              <TabbedProducts />
              <SocialProof />
              <GuaranteeSection />
              <TechnicalCenterTeaser />
            </>
          ) : (
            <>
              {heroMode === "rotating_banner" ? (
                <Suspense fallback={<SectionLoader />}>
                  <HeroBanner />
                </Suspense>
              ) : (
                <HeroSection />
              )}
              <BenefitsBar />
              <PartsFinder />
              <TabbedProducts />
              {heroMode !== "rotating_banner" && (
                <Suspense fallback={<SectionLoader />}>
                  <HeroBanner />
                </Suspense>
              )}
              <SocialProof />
              <GuaranteeSection />
              <TechnicalCenterTeaser />
            </>
          )}

          {/* Mechanic Partner CTA */}
          <section className="py-12 bg-gradient-to-r from-secondary to-secondary/80">
            <div className="container text-center">
              <div className="max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-background/10 rounded-full px-4 py-1.5 mb-4">
                  <BadgeCheck className="h-5 w-5 text-accent" />
                  <span className="text-sm font-bold text-secondary-foreground uppercase tracking-wider">Programa de Parceria</span>
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-black text-secondary-foreground mb-3">Revendedores, Oficinas e Mecânicos<br className="hidden md:block" />Cadastre-se aqui.</h2>
                <p className="text-secondary-foreground/80 mb-6 text-lg">Acesse preços exclusivos, catálogos técnicos, vistas explodidas e suporte especializado para parceiros profissionais.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/parceiros/revendedor" className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-bold px-8 py-4 rounded-xl text-lg hover:bg-accent/90 transition-colors shadow-lg hover:shadow-xl">
                    <BadgeCheck className="h-5 w-5" />
                    Sou Revendedor
                  </Link>
                  <Link to="/parceiros/oficina-mecanico" className="inline-flex items-center gap-2 bg-background text-foreground font-bold px-8 py-4 rounded-xl text-lg hover:bg-background/90 transition-colors shadow-lg hover:shadow-xl border border-border">
                    <Wrench className="h-5 w-5" />
                    Sou Oficina / Mecânico
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <CategoriesSection />
          <Suspense fallback={<SectionLoader />}>
            <TestimonialsSection />
          </Suspense>
          <Suspense fallback={<SectionLoader />}>
            <HomeFAQ />
          </Suspense>
          <WhatsAppButton />
          <AIAssistant />
          <FirstVisitPopup />
          <AbandonedCartReminder />
          <Footer />
          <MobileContactBar />
        </div>
      )}
    </>
  );
};

export default Index;
