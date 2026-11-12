import Hero from "@/components/Hero";
import { Shop, HowToWear, Technology, Outfits, Newsletter, Footer } from "@/components/Sections";

export default function Page() {
  return (
    <main>
      <Hero />
      <Shop />
      <Technology />
      <HowToWear />
      <Outfits />
      <Newsletter />
      <Footer />
    </main>
  );
}
