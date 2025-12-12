import { useEffect, useState } from "react";

const Sitemap = () => {
  const [xmlContent, setXmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const response = await fetch("https://qpljdthnqdatcirkudpc.supabase.co/functions/v1/sitemap");
        if (!response.ok) {
          throw new Error("Falha ao carregar sitemap");
        }
        let xml = await response.text();
        
        // Replace the Supabase function URL with the actual domain URL in the XML
        xml = xml.replace(/https:\/\/qpljdthnqdatcirkudpc\.supabase\.co\/functions\/v1\/sitemap/g, "https://universoit.tech/sitemap.xml");
        
        setXmlContent(xml);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  useEffect(() => {
    if (xmlContent) {
      // Set document to display as XML
      document.body.style.margin = "0";
      document.body.style.padding = "0";
    }
  }, [xmlContent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground">A carregar sitemap...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive">Erro: {error}</p>
      </div>
    );
  }

  return (
    <pre 
      style={{ 
        margin: 0, 
        padding: "20px", 
        whiteSpace: "pre-wrap", 
        wordWrap: "break-word",
        fontFamily: "monospace",
        fontSize: "12px",
        lineHeight: "1.4",
        backgroundColor: "#fff",
        color: "#000"
      }}
    >
      {xmlContent}
    </pre>
  );
};

export default Sitemap;
