import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BookOpen, Wrench, BadgeCheck, Calculator, Stethoscope, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import HeroSection from "@/components/HeroSection";
import BenefitsBar from "@/components/BenefitsBar";
import PartsFinder from "@/components/PartsFinder";
import ModelSearch from "@/components/ModelSearch";
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
const HeroRPW = lazy(() => import("@/components/HeroRPW"));
const KraftProductShowcase = lazy(() => import("@/components/KraftProductShowcase"));
const MaintenancePage = lazy(() => import("@/components/MaintenancePage"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const HomeFAQ = lazy(() => import("@/components/HomeFAQ"));
const FeaturedProducts = lazy(() => import("@/components/FeaturedProducts"));

const SectionLoader = () => <div className="py-8 flex justify-center"><div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" /></div>;

const TechnicalCenterTeaser = () => (
  <section className="py-8 md:py-14 bg-muted/30">
    <div className="container px-4">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="font-heading text-xl md:text-2xl lg:text-3xl font-black text-foreground">CENTRAL TÉCNICA DE MOTORES ESTACIONÁRIOS</h2>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">Artigos, guias e ferramentas para mecânicos e proprietários de motores</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 max-w-6xl mx-auto">
        <Link to="/diagnostico" className="group bg-card rounded-xl border-2 border-destructive/20 p-4 md:p-6 hover:border-primary/30 hover:shadow-lg transition-all">
          <Stethoscope className="h-8 w-8 md:h-10 md:w-10 text-destructive mb-2 md:mb-3" />
          <h3 className="font-heading font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors">Diagnóstico do Gerador</h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden sm:block">Selecione o problema e encontre as peças para o reparo automaticamente.</p>
        </Link>
        <Link to="/central-tecnica" className="group bg-card rounded-xl border border-border p-4 md:p-6 hover:border-primary/30 hover:shadow-lg transition-all">
          <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-primary mb-2 md:mb-3" />
          <h3 className="font-heading font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors">Artigos Técnicos</h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden sm:block">Guias de manutenção, diagnóstico e reparo de motores estacionários.</p>
        </Link>
        <Link to="/catalogo-interativo" className="group bg-card rounded-xl border border-border p-4 md:p-6 hover:border-primary/30 hover:shadow-lg transition-all">
          <Wrench className="h-8 w-8 md:h-10 md:w-10 text-primary mb-2 md:mb-3" />
          <h3 className="font-heading font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors">Catálogo Interativo</h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden sm:block">Vista explodida do motor — clique nas peças e compre diretamente.</p>
        </Link>
        <Link to="/calculadora-de-carga" className="group bg-card rounded-xl border border-border p-4 md:p-6 hover:border-primary/30 hover:shadow-lg transition-all">
          <Calculator className="h-8 w-8 md:h-10 md:w-10 text-primary mb-2 md:mb-3" />
          <h3 className="font-heading font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors">Calculadora de Carga</h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden sm:block">Dimensione a carga ideal e encontre o gerador certo para sua necessidade.</p>
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
            <title>Grundemann Geradores | Peças e Geradores de Energia</title>
            <meta name="description" content="Loja especializada em peças para motores estacionários, geradores de energia e equipamentos industriais. Entrega para todo o Brasil com garantia." />
            <meta property="og:title" content="Grundemann Geradores | Peças e Geradores de Energia" />
            <meta property="og:description" content="Peças para motores estacionários, geradores e equipamentos industriais com garantia e entrega nacional." />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://grundemann.com.br" />
            <meta name="twitter:card" content="summary_large_image" />
            <link rel="canonical" href="https://grundemann.com.br" />
            <script type="application/ld+json">{JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              "name": "Grundemann Geradores",
              "description": "Loja especializada em peças para motores estacionários e geradores de energia",
              "url": "https://grundemann.com.br",
              "telephone": "+55-51-98182-5748",
              "address": { "@type": "PostalAddress", "addressLocality": "São Leopoldo", "addressRegion": "RS", "addressCountry": "BR" },
              "priceRange": "$$"
            })}</script>
          </Helmet>
          <TopBar />
          <Header />
          <CategoryNav />
          {heroMode === "rpw_style" ? (
            <>
              <Suspense fallback={<SectionLoader />}>
                <HeroRPW />
              </Suspense>
              <BenefitsBar />
              <Suspense fallback={<SectionLoader />}>
                <FeaturedProducts />
              </Suspense>
              <PartsFinder />
              <ModelSearch />
              <TabbedProducts />
              <SocialProof />
              <GuaranteeSection />
              <TechnicalCenterTeaser />
            </>
          ) : heroMode === "kraft_style" ? (
            <>
              <Suspense fallback={<SectionLoader />}>
                <HeroKraft />
              </Suspense>
              <BenefitsBar />
              <Suspense fallback={<SectionLoader />}>
                <KraftProductShowcase />
              </Suspense>
              <PartsFinder />
              <ModelSearch />
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
              <ModelSearch />
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
          <section className="py-8 md:py-12 bg-gradient-to-r from-secondary to-secondary/80">
            <div className="container text-center px-4">
              <div className="max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-background/10 rounded-full px-3 py-1 md:px-4 md:py-1.5 mb-3 md:mb-4">
                  <BadgeCheck className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                  <span className="text-xs md:text-sm font-bold text-secondary-foreground uppercase tracking-wider">Programa de Parceria</span>
                </div>
                <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-secondary-foreground mb-2 md:mb-3">Fornecedores, Oficinas, Mecânicos e Locadoras<br className="hidden md:block" /> Cadastre-se aqui.</h2>
                <p className="text-secondary-foreground/80 mb-4 md:mb-6 text-sm md:text-lg">Acesse preços exclusivos, catálogos técnicos e suporte especializado para parceiros.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
                  <Link to="/parceiros/fornecedor" className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg hover:bg-accent/90 transition-colors shadow-lg">
                    <BadgeCheck className="h-5 w-5" />
                    Sou Fornecedor
                  </Link>
                  <Link to="/parceiros/oficina-mecanico" className="inline-flex items-center justify-center gap-2 bg-background text-foreground font-bold px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg hover:bg-background/90 transition-colors shadow-lg border border-border">
                    <Wrench className="h-5 w-5" />
                    Sou Oficina / Mecânico
                  </Link>
                  <Link to="/parceiros/locadora" className="inline-flex items-center justify-center gap-2 bg-background text-foreground font-bold px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg hover:bg-background/90 transition-colors shadow-lg border border-border">
                    <Building className="h-5 w-5" />
                    Sou Locadora
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
