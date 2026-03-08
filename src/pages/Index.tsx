import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Wrench } from "lucide-react";
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

const HeroBanner = lazy(() => import("@/components/HeroBanner"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));

const SectionLoader = () => <div className="py-8 flex justify-center"><div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" /></div>;

const TechnicalCenterTeaser = () => (
  <section className="py-14 bg-muted/30">
    <div className="container">
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl md:text-3xl font-black text-foreground">CENTRAL TÉCNICA</h2>
        <p className="text-muted-foreground mt-2">Artigos, guias e ferramentas para mecânicos e proprietários de motores</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
      </div>
    </div>
  </section>
);

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <CategoryNav />
      <HeroSection />
      <BenefitsBar />
      <PartsFinder />
      <TabbedProducts />
      <Suspense fallback={<SectionLoader />}>
        <HeroBanner />
      </Suspense>
      <SocialProof />
      <TechnicalCenterTeaser />
      <CategoriesSection />
      <Suspense fallback={<SectionLoader />}>
        <TestimonialsSection />
      </Suspense>
      <WhatsAppButton />
      <AIAssistant />
      <Footer />
    </div>
  );
};

export default Index;
