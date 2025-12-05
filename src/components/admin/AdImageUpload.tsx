import { useState, useRef } from "react";
import { Upload, X, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

type AdPosition = Database["public"]["Enums"]["ad_position"];

interface AdImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  position: AdPosition;
  className?: string;
}

// Dimensões recomendadas por posição (largura x altura)
const RECOMMENDED_DIMENSIONS: Record<AdPosition, { width: number; height: number; label: string }[]> = {
  header: [
    { width: 728, height: 90, label: "Leaderboard (728×90)" },
    { width: 970, height: 90, label: "Super Leaderboard (970×90)" },
  ],
  sidebar: [
    { width: 300, height: 250, label: "Medium Rectangle (300×250)" },
    { width: 300, height: 600, label: "Half Page (300×600)" },
  ],
  footer: [
    { width: 728, height: 90, label: "Leaderboard (728×90)" },
    { width: 970, height: 90, label: "Super Leaderboard (970×90)" },
  ],
  in_article: [
    { width: 300, height: 250, label: "Medium Rectangle (300×250)" },
    { width: 336, height: 280, label: "Large Rectangle (336×280)" },
  ],
  popup: [
    { width: 300, height: 250, label: "Medium Rectangle (300×250)" },
    { width: 600, height: 400, label: "Large Popup (600×400)" },
  ],
};

// Tolerância de 10% para dimensões
const DIMENSION_TOLERANCE = 0.1;

function validateDimensions(
  width: number,
  height: number,
  position: AdPosition
): { valid: boolean; message: string; exactMatch: boolean } {
  const recommendations = RECOMMENDED_DIMENSIONS[position];
  
  for (const rec of recommendations) {
    // Verificar correspondência exata
    if (width === rec.width && height === rec.height) {
      return { valid: true, message: `Dimensões perfeitas: ${rec.label}`, exactMatch: true };
    }
    
    // Verificar com tolerância
    const widthTolerance = rec.width * DIMENSION_TOLERANCE;
    const heightTolerance = rec.height * DIMENSION_TOLERANCE;
    
    if (
      Math.abs(width - rec.width) <= widthTolerance &&
      Math.abs(height - rec.height) <= heightTolerance
    ) {
      return { 
        valid: true, 
        message: `Dimensões aceitáveis (${width}×${height}). Recomendado: ${rec.label}`,
        exactMatch: false 
      };
    }
  }
  
  const recLabels = recommendations.map(r => r.label).join(" ou ");
  return { 
    valid: false, 
    message: `Dimensões (${width}×${height}) não recomendadas. Use: ${recLabels}`,
    exactMatch: false 
  };
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error("Não foi possível carregar a imagem"));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

export function AdImageUpload({ value, onChange, position, className }: AdImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dimensionStatus, setDimensionStatus] = useState<{
    valid: boolean;
    message: string;
    exactMatch: boolean;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const recommendations = RECOMMENDED_DIMENSIONS[position];

  const uploadImage = async (file: File) => {
    if (!file) return;

    // Validar tipo de ficheiro
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Tipo de ficheiro inválido",
        description: "Por favor use JPG, PNG, WebP, GIF ou AVIF.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Ficheiro muito grande",
        description: "O tamanho máximo é 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Validar dimensões
    try {
      const dimensions = await getImageDimensions(file);
      const validation = validateDimensions(dimensions.width, dimensions.height, position);
      setDimensionStatus(validation);

      if (!validation.valid) {
        toast({
          title: "Dimensões não recomendadas",
          description: validation.message,
          variant: "destructive",
        });
        // Permite continuar mesmo com dimensões erradas, mas avisa
      }
    } catch {
      toast({
        title: "Erro ao verificar imagem",
        description: "Não foi possível verificar as dimensões.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `ads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("article-images")
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast({ title: "Imagem carregada com sucesso!" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro ao carregar imagem",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadImage(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange("");
    setDimensionStatus(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dimensões recomendadas */}
      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Dimensões recomendadas para esta posição:
        </p>
        <div className="flex flex-wrap gap-2">
          {recommendations.map((rec, i) => (
            <span key={i} className="text-xs bg-background px-2 py-1 rounded border border-border">
              {rec.label}
            </span>
          ))}
        </div>
      </div>

      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Preview"
            className="w-full rounded-lg object-contain bg-muted max-h-[200px]"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Status das dimensões */}
          {dimensionStatus && (
            <div className={cn(
              "mt-2 flex items-center gap-2 rounded-lg p-2 text-sm",
              dimensionStatus.valid 
                ? dimensionStatus.exactMatch 
                  ? "bg-green-500/10 text-green-600" 
                  : "bg-yellow-500/10 text-yellow-600"
                : "bg-destructive/10 text-destructive"
            )}>
              {dimensionStatus.valid ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{dimensionStatus.message}</span>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "relative flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Arraste uma imagem ou clique para selecionar
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG, WebP, GIF ou AVIF (máx. 5MB)
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}

      {/* URL input como fallback */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setDimensionStatus(null);
            }}
            placeholder="Ou cole um URL de imagem"
            className="text-sm"
          />
        </div>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
