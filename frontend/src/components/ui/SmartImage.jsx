import { imageUrl } from "@/lib/api";

// Shows an uploaded image (local or Cloudinary), or an emoji placeholder when there is none
export default function SmartImage({ src, alt, className = "", fallback = "🥬" }) {
  const url = imageUrl(src);

  if (!url) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-leaf-50 text-4xl ${className}`}
      >
        {fallback}
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading="lazy" className={className} />;
}