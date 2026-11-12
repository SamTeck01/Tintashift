import Hero from "@/components/Hero";
import { ShadesGrid, HowToWear, Technology, Outfits, TryOnTones, Newsletter, Footer } from "@/components/Sections";

export default function Page() {
  return (
    <main>
      <Hero />
      <ShadesGrid />
      <TryOnTones />
      <Technology />
      <HowToWear />
      <Outfits />
      <Newsletter />
      <Footer />
    </main>
  );
}
