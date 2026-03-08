import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import HeroBanner from "@/components/HeroBanner";
import BenefitsBar from "@/components/BenefitsBar";
import TabbedProducts from "@/components/TabbedProducts";
import CategoriesSection from "@/components/CategoriesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AIAssistant from "@/components/AIAssistant";
const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <CategoryNav />
      <HeroBanner />
      <BenefitsBar />
      <TabbedProducts />
      <CategoriesSection />
      <TestimonialsSection />
      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default Index;
