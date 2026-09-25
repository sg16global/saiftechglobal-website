import AmbientBackground from "./components/AmbientBackground";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import NetworkRail from "./components/NetworkRail";
import SocialProof from "./components/SocialProof";
import Features from "./components/Features";
import Showcase from "./components/Showcase";
import Sovereign from "./components/Sovereign";
import Philosophy from "./components/Philosophy";
import Products from "./components/Products";
import Benefits from "./components/Benefits";
import Testimonials from "./components/Testimonials";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import About from "./components/About";
import ContactCTA from "./components/ContactCTA";
import Footer from "./components/Footer";
import { useRevealObserver } from "./hooks/useReveal";
import { useLiveStatus } from "./hooks/useLiveStatus";

export default function App() {
  const live = useLiveStatus();
  useRevealObserver();

  return (
    <div className="relative min-h-screen bg-[#020205] text-[#f0f6ff] antialiased">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <AmbientBackground />
      <Navbar liveCount={live.liveCount || 5} total={live.total} />

      <main id="main" className="relative">
        {/* Continuous long-scrolling premium flow — no boxy breaks */}
        <Hero live={live} />
        <NetworkRail live={live} />
        <SocialProof />
        <Features />
        <Showcase />
        <Sovereign />
        <Philosophy />
        <Products live={live} />
        <Benefits />
        <Testimonials />
        <Pricing />
        <FAQ />
        <About />
        <ContactCTA />
      </main>

      <Footer />

      {/* Structured data — preserved from original */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Saif Tech Global LLC",
            url: "https://saiftechglobal.com",
            logo: "https://saiftechglobal.com/assets/logo-llc.jpg",
            email: "contact@saiftechglobal.com",
            address: {
              "@type": "PostalAddress",
              streetAddress: "8206 Louisiana Blvd NE, Ste A #10595",
              addressLocality: "Albuquerque",
              addressRegion: "NM",
              postalCode: "87113",
              addressCountry: "US",
            },
            sameAs: [
              "https://sg16engine.com",
              "https://sg16children.com",
              "https://sg16finance.com",
              "https://saifglobal16.info",
              "https://ads.saiftechglobal.com",
            ],
          }),
        }}
      />
    </div>
  );
}
