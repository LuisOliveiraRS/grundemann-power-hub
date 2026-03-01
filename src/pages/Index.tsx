import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import HeroBanner from "@/components/HeroBanner";
import BenefitsBar from "@/components/BenefitsBar";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoriesSection from "@/components/CategoriesSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <CategoryNav />
      <HeroBanner />
      <BenefitsBar />
      <FeaturedProducts />
      <CategoriesSection />
      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default Index;
