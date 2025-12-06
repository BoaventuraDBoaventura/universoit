import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  className?: string;
  containerClassName?: string;
}

export function LazyImage({
  src,
  alt,
  placeholderSrc,
  className,
  containerClassName,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
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
  }, []);

  const placeholder = placeholderSrc || "/placeholder.svg";

  return (
    <div className={cn("relative overflow-hidden bg-muted", containerClassName)}>
      {/* Skeleton shimmer effect */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isLoaded || hasError ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="h-full w-full animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
      </div>
      
      <img
        ref={imgRef}
        src={hasError ? placeholder : (isInView ? src : placeholder)}
        alt={alt}
        loading="lazy"
        decoding="async"
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
