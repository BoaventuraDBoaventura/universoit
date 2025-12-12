import { useEffect } from "react";

const Sitemap = () => {
  useEffect(() => {
    // Redirect to the dynamic sitemap edge function
    window.location.href = "https://qpljdthnqdatcirkudpc.supabase.co/functions/v1/sitemap";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecionando para o sitemap...</p>
    </div>
  );
};

export default Sitemap;
