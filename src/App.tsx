import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import BackToTop from "@/components/BackToTop";
import Index from "./pages/Index";

// Lazy-loaded pages for performance
const Auth = lazy(() => import("./pages/Auth"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const AllProducts = lazy(() => import("./pages/AllProducts"));
const Checkout = lazy(() => import("./pages/Checkout"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Returns = lazy(() => import("./pages/Returns"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProductImport = lazy(() => import("./pages/ProductImport"));
const MLExport = lazy(() => import("./pages/MLExport"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const QuoteRequest = lazy(() => import("./pages/QuoteRequest"));
const MechanicArea = lazy(() => import("./pages/MechanicArea"));
const TechnicalCenter = lazy(() => import("./pages/TechnicalCenter"));
const ExplodedCatalog = lazy(() => import("./pages/ExplodedCatalog"));
const GeneratorCalculator = lazy(() => import("./pages/GeneratorCalculator"));
const ExplodedViews = lazy(() => import("./pages/ExplodedViews"));
const GeneratorDiagnostic = lazy(() => import("./pages/GeneratorDiagnostic"));
const OrderConfirmed = lazy(() => import("./pages/OrderConfirmed"));
const PaymentPending = lazy(() => import("./pages/PaymentPending"));
const PaymentError = lazy(() => import("./pages/PaymentError"));
const FornecedorDashboard = lazy(() => import("./pages/FornecedorDashboard"));
const OficinaDashboard = lazy(() => import("./pages/OficinaDashboard"));
const LocadoraDashboard = lazy(() => import("./pages/LocadoraDashboard"));
const PartnerLogin = lazy(() => import("./pages/PartnerLogin"));
const DiagnosticSEO = lazy(() => import("./pages/DiagnosticSEO"));
const ModelSEO = lazy(() => import("./pages/ModelSEO"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Carregando..." />
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md">
                Pular para o conteúdo principal
              </a>
              <div id="main-content">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/produtos" element={<AllProducts />} />
                    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                    <Route path="/produto/:idOrSlug" element={<ProductDetail />} />
                    <Route path="/categoria/*" element={<CategoryPage />} />
                    <Route path="/quem-somos" element={<About />} />
                    <Route path="/contato" element={<Contact />} />
                    <Route path="/privacidade" element={<PrivacyPolicy />} />
                    <Route path="/termos" element={<Terms />} />
                    <Route path="/trocas-e-devolucoes" element={<Returns />} />
                    <Route path="/minha-conta" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/importar" element={<ProtectedRoute adminOnly><ProductImport /></ProtectedRoute>} />
                    <Route path="/admin/exportar-ml" element={<ProtectedRoute adminOnly><MLExport /></ProtectedRoute>} />
                    <Route path="/vendedor" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
                    <Route path="/fornecedor" element={<ProtectedRoute><FornecedorDashboard /></ProtectedRoute>} />
                    <Route path="/oficina" element={<ProtectedRoute><OficinaDashboard /></ProtectedRoute>} />
                    <Route path="/locadora" element={<ProtectedRoute><LocadoraDashboard /></ProtectedRoute>} />
                    <Route path="/orcamento" element={<QuoteRequest />} />
                    <Route path="/mecanico" element={<MechanicArea />} />
                    <Route path="/parceiros" element={<PartnerLogin />} />
                    <Route path="/parceiros/:type" element={<PartnerLogin />} />
                    <Route path="/central-tecnica" element={<TechnicalCenter />} />
                    <Route path="/catalogo-interativo" element={<ExplodedCatalog />} />
                    <Route path="/calculadora-de-carga" element={<GeneratorCalculator />} />
                    <Route path="/vistas-explodidas" element={<ExplodedViews />} />
                    <Route path="/diagnostico" element={<GeneratorDiagnostic />} />
                    <Route path="/diagnostico/:slug" element={<GeneratorDiagnostic />} />
                    <Route path="/problema/:slug" element={<DiagnosticSEO />} />
                    <Route path="/pecas/:slug" element={<ModelSEO />} />
                    <Route path="/pedido-confirmado" element={<ProtectedRoute><OrderConfirmed /></ProtectedRoute>} />
                    <Route path="/pagamento-pendente" element={<ProtectedRoute><PaymentPending /></ProtectedRoute>} />
                    <Route path="/pagamento-erro" element={<ProtectedRoute><PaymentError /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <BackToTop />
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
