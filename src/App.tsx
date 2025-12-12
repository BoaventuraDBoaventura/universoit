import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { ScrollToTop } from "@/components/ScrollToTop";

// Public pages
import Home from "./pages/Home";
import Article from "./pages/Article";
import Category from "./pages/Category";
import Search from "./pages/Search";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import PasswordUpdated from "./pages/PasswordUpdated";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import Contact from "./pages/Contact";
import AllArticles from "./pages/AllArticles";
import Unsubscribe from "./pages/Unsubscribe";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Newsletter from "./pages/Newsletter";
import Sitemap from "./pages/Sitemap";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Articles from "./pages/admin/Articles";
import ArticleEditor from "./pages/admin/ArticleEditor";
import Categories from "./pages/admin/Categories";
import Tags from "./pages/admin/Tags";
import Comments from "./pages/admin/Comments";
import AdminNewsletter from "./pages/admin/Newsletter";
import Advertisements from "./pages/admin/Advertisements";
import AdStatistics from "./pages/admin/AdStatistics";
import Users from "./pages/admin/Users";
import ContentSources from "./pages/admin/ContentSources";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/artigo/:slug" element={<Article />} />
              <Route path="/categoria/:slug" element={<Category />} />
              <Route path="/busca" element={<Search />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/redefinir-password" element={<ResetPassword />} />
              <Route path="/password-atualizada" element={<PasswordUpdated />} />
              <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
              <Route path="/termos-de-uso" element={<TermsOfUse />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/todas" element={<AllArticles />} />
              <Route path="/cancelar-subscricao" element={<Unsubscribe />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/newsletter" element={<Newsletter />} />
              <Route path="/sitemap.xml" element={<Sitemap />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/artigos" element={<Articles />} />
              <Route path="/admin/artigos/:id" element={<ArticleEditor />} />
              <Route path="/admin/fontes" element={<ContentSources />} />
              <Route path="/admin/categorias" element={<Categories />} />
              <Route path="/admin/tags" element={<Tags />} />
              <Route path="/admin/comentarios" element={<Comments />} />
              <Route path="/admin/newsletter" element={<AdminNewsletter />} />
              <Route path="/admin/anuncios" element={<Advertisements />} />
              <Route path="/admin/anuncios/estatisticas" element={<AdStatistics />} />
              <Route path="/admin/utilizadores" element={<Users />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;