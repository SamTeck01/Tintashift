import Hero from "@/components/Hero";
import { Shop, HowToWear, Technology, Outfits, Newsletter, Footer } from "@/components/Sections";
import { getProducts } from "@/lib/shopify";

export const revalidate = 300;   // pick up price and stock changes from Shopify every five minutes

export default async function Page() {
  const products = await getProducts();
  return (
    <main>
      <Hero products={products} />
      <Shop products={products} />
      <Technology />
      <HowToWear />
      <Outfits />
      <Newsletter />
      <Footer />
    </main>
  );
}
