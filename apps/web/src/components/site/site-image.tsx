import Image, { type ImageProps } from "next/image";
import { imageSource } from "@/lib/media";

function isSvgSrc(src: ImageProps["src"]) {
  if (typeof src !== "string") {
    return false;
  }
  const path = src.split("?")[0]?.toLowerCase() ?? "";
  return path.endsWith(".svg");
}

/** SVG local: <img> nativo. O optimizer do Next aplica CSP `sandbox` e o Chrome some com a imagem. */
export function SiteImage({
  src,
  alt,
  className,
  fill,
  style,
  sizes,
  priority,
  unoptimized,
  ...props
}: ImageProps) {
  if (typeof src === "string") src = imageSource(src);
  if (typeof src === "string" && src.startsWith("/demo/") && src.toLowerCase().endsWith(".svg")) {
    src = `${src.slice(0, -4)}.png`;
  }

  if (typeof src === "string" && isSvgSrc(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- SVG DEMO / placeholders
      <img
        src={src}
        alt={alt}
        className={className}
        style={
          fill
            ? {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                ...style,
              }
            : style
        }
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      style={style}
      {...props}
    />
  );
}
