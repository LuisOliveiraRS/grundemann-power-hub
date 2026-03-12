import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AIAssistant from "@/components/AIAssistant";

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  showWhatsApp?: boolean;
  showAI?: boolean;
}

const Layout = ({ children, showFooter = true, showWhatsApp = true, showAI = true }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <CategoryNav />
      <div className="flex-1">{children}</div>
      {showWhatsApp && <WhatsAppButton />}
      {showAI && <AIAssistant />}
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
