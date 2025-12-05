import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, User, LogOut } from "lucide-react";
import universoItLogo from "@/assets/universo-it-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/hooks/useArticles";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user, isAdmin, isEditor, signOut } = useAuth();
  const { data: categories } = useCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <img 
            src={universoItLogo} 
            alt="Universo IT" 
            className="h-7 w-auto sm:h-9 md:h-10"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {categories?.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              to={`/categoria/${category.slug}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-9 lg:w-64"
              />
            </div>
          </form>

          {user ? (
            <div className="flex items-center gap-2">
              {(isAdmin || isEditor) && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin">Painel</Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-border md:hidden">
          <div className="container py-4">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              {categories?.map((category) => (
                <Link
                  key={category.id}
                  to={`/categoria/${category.slug}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}