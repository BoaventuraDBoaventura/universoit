import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";

// Public pages
import Home from "./pages/Home";
import Article from "./pages/Article";
import Category from "./pages/Category";
import Search from "./pages/Search";
import Auth from "./pages/Auth";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Articles from "./pages/admin/Articles";
import ArticleEditor from "./pages/admin/ArticleEditor";
import Categories from "./pages/admin/Categories";
import Tags from "./pages/admin/Tags";
import Comments from "./pages/admin/Comments";
import Newsletter from "./pages/admin/Newsletter";
import Advertisements from "./pages/admin/Advertisements";
import AdStatistics from "./pages/admin/AdStatistics";
import Users from "./pages/admin/Users";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/artigo/:slug" element={<Article />} />
              <Route path="/categoria/:slug" element={<Category />} />
              <Route path="/busca" element={<Search />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
              <Route path="/termos-de-uso" element={<TermsOfUse />} />
              <Route path="/contacto" element={<Contact />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/artigos" element={<Articles />} />
              <Route path="/admin/artigos/:id" element={<ArticleEditor />} />
              <Route path="/admin/categorias" element={<Categories />} />
              <Route path="/admin/tags" element={<Tags />} />
              <Route path="/admin/comentarios" element={<Comments />} />
              <Route path="/admin/newsletter" element={<Newsletter />} />
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