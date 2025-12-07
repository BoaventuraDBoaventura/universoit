import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
}

export function LazyImage({
  src,
  alt,
  placeholderSrc,
  className,
  containerClassName,
  priority = false,
  width,
  height,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(priority);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const placeholder = placeholderSrc || "/placeholder.svg";

  return (
    <div className={cn("relative overflow-hidden bg-muted", containerClassName)}>
      {/* Skeleton shimmer effect */}
      {!priority && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            isLoaded || hasError ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
        </div>
      )}
      
      <img
        ref={imgRef}
        src={hasError ? placeholder : (isInView ? src : placeholder)}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : undefined}
        width={width}
        height={height}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={cn(
          "transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...props}
      />
    </div>
  );
}
