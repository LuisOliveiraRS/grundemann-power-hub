import { Helmet } from "react-helmet-async";

interface ProductSEOProps {
  name: string;
  description?: string | null;
  sku?: string | null;
  price: number;
  image?: string | null;
  brand?: string | null;
  category?: string;
  stockQuantity: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

const ProductSEO = ({ name, description, sku, price, image, brand, category, stockQuantity, metaTitle, metaDescription }: ProductSEOProps) => {
  const title = metaTitle || `${name} | Grundemann Power Hub`;
  const desc = metaDescription || description?.slice(0, 160) || `Compre ${name} na Grundemann Power Hub. Peças para motores estacionários com qualidade e garantia.`;
  const url = typeof window !== "undefined" ? window.location.href : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: desc,
    sku: sku || undefined,
    image: image || undefined,
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    category,
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: "BRL",
      availability: stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url,
    },
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="product" />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <link rel="canonical" href={url} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};

export default ProductSEO;
