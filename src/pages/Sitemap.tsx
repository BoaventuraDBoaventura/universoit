import { useEffect, useState } from "react";

const Sitemap = () => {
  const [xmlContent, setXmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const response = await fetch(
          "https://qpljdthnqdatcirkudpc.supabase.co/functions/v1/sitemap"
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch sitemap");
        }
        
        let xml = await response.text();
        // Replace Supabase function URL with the actual site URL in the XML
        xml = xml.replace(
          /https:\/\/qpljdthnqdatcirkudpc\.supabase\.co\/functions\/v1\/sitemap/g,
          "https://universoit.tech/sitemap.xml"
        );
        
        setXmlContent(xml);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading sitemap...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <pre
      style={{
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        fontFamily: "monospace",
        padding: "20px",
        backgroundColor: "#f5f5f5",
        margin: 0,
      }}
    >
      {xmlContent}
    </pre>
  );
};

export default Sitemap;
