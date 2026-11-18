import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Store pages (home, shop, product, cart...) get the Navbar and Footer
export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}