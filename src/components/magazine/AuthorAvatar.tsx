import React from "react";

/**
 * Yazar gorseli.
 *
 * Gorsel varsa o basilir; yoksa bas harflere duser. Site uc yerde yazar
 * gosteriyor (yazi kunyesi, yazar sayfasi, About sayfasindaki kunye) ve
 * hepsinde ayni gorunmesi icin tek bilesen.
 *
 * Gorseller /media/authors/ altinda, kendi sunucumuzda; daha once
 * fabelo.io'ya bagliydilar.
 */
export default function AuthorAvatar({
  name,
  src,
  size = 64,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const basHarfler = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, background: "var(--ink)" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <span
          className="display grid size-full place-items-center"
          style={{ color: "var(--paper)", fontSize: size * 0.36 }}
          aria-hidden="true"
        >
          {basHarfler}
        </span>
      )}
    </div>
  );
}
