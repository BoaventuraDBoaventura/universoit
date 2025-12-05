import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SmartAdBanner } from "./SmartAdBanner";
import { PopupAd } from "./PopupAd";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* Header Ad Banner */}
      <div className="container py-3">
        <SmartAdBanner position="header" className="mx-auto max-w-4xl" />
      </div>
      <main className="flex-1">{children}</main>
      <Footer />
      
      {/* Popup Ad */}
      <PopupAd />
    </div>
  );
}