"use client";
import { useEffect, useRef, useState } from "react";


const heroAssets = {
  blob: "https://www.figma.com/api/mcp/asset/c1380703-6e38-420e-bdff-50bc62a92970",
  phoneBackdrop: "https://www.figma.com/api/mcp/asset/e949f99d-b465-4497-a59c-5eb9043813e6",
  phoneOne: "https://www.figma.com/api/mcp/asset/87055ea8-3701-409b-bbaa-b6f5da6c22e2",
  phoneOneMask: "https://www.figma.com/api/mcp/asset/f109ca50-90de-4d6c-b385-65b6302a835e",
  phoneOneImage: "https://www.figma.com/api/mcp/asset/23af099b-5b06-4f2a-a504-d895e3bf8f27",
  phoneTwo: "https://www.figma.com/api/mcp/asset/a81bc08b-f2ab-4f44-8a68-6af3f01861c6",
  phoneTwoMask: "https://www.figma.com/api/mcp/asset/91ed0110-4adb-47ac-8a66-80c350a4a823",
  phoneTwoImage: "https://www.figma.com/api/mcp/asset/d9ad86ec-a815-4023-95ec-6d966afbc080",
  logo: "/my_logo-removebg-preview.png",
};

const introCards = [
  {
    title: "Find the perfect collaboration",
    description:
      "Discover creators and campaigns curated to your niche, audience, and goals through an intuitive swipe experience.",
    className: "intro-card intro-card-soft",
  },
  {
    title: "Grow Together",
    description:
      "Manage conversations, campaigns, and long-term partnerships from one platform.",
    className: "intro-card intro-card-peach",
  },
];

const howItWorks = [
  {
    title: "Discover",
    description: "Browse creators or campaigns curated for you.",
    image: "https://www.figma.com/api/mcp/asset/9025cda9-889b-449c-9ab7-17ef091ab833",
    leftPhone: "https://www.figma.com/api/mcp/asset/23ef2a56-786c-4d9d-9f8c-ce133b7c289b",
    rightPhone: "https://www.figma.com/api/mcp/asset/4f89ee64-aa3f-41ac-81a6-788ae4a96b22",
    goldAccent: "https://www.figma.com/api/mcp/asset/6ac7b134-0c8c-416d-990c-160a7f84d402",
  },
  {
    title: "Swipe",
    description: "Like the profiles that fit your goals.",
    image: "https://www.figma.com/api/mcp/asset/e558f88b-44de-4b39-9350-6cee8e622994",
  },
  {
    title: "Match",
    description: "Mutual interest unlocks instant conversations.",
    image: "https://www.figma.com/api/mcp/asset/2b5e635d-4bc0-4508-b08c-e05531aeecfe",
    matchImage: "https://www.figma.com/api/mcp/asset/a35aab3d-3ea9-41bc-b883-aa04179319f2",
  },
  {
    title: "Collaborate",
    description: "Launch campaigns, create content, and grow together.",
    image: "https://www.figma.com/api/mcp/asset/6a482b5b-5693-4775-9944-9c48fa49b041",
    matchImage: "https://www.figma.com/api/mcp/asset/90c27701-6af7-48d3-9211-5b71fad965a4",
  },
];

const personasBrand = [
  {
    label: "Startups",
    image: "/5a68eea5aa00ed1cd09b8caa72778acf8f4afb40%20copy.png",
  },
  {
    label: "D2C Brands",
    image: "/87a457996d6cbaf8db6cee6bb05433f011487f92.png",
  },
  {
    label: "Marketing Teams",
    image: "/95ebc2d23fc5e794e6ff27a4804abff9528cb7bd.png",
  },
  {
    label: "Agencies",
    image: "/1c5e9d04f15ac328faa499b366d81191aa8cd93a%20copy.png",
  },
];

const personasCreator = [
  {
    label: "UGC Creators",
    image: "/a03db1359935105e519b4e6492849dda2f3abbb8.png",
  },
  {
    label: "Influencers",
    image: "/87b10d6d8067b3a0f0f5cb9ca215f00d97e8affe.png",
  },
  {
    label: "Content Creators",
    image: "/09f8b230b4370ed72dfb07573c58bf4ceb027fcc.png",
  },
  {
    label: "Freelancers",
    image: "/d755521445c1926821ac8640aee4886781b67954.png",
  },
];

type FeatureCardItem = {
  title: string;
  description: string;
  image: string;
  className: string;
  secondaryImage?: string;
  accent?: boolean;
  hideTextAndGradient?: boolean;
  icons?: string[];
};

const whyMatchr: FeatureCardItem[] = [
  {
    title: "Smart Matching",
    description:
      "Discover creators and campaigns tailored to your niche, audience, goals, and preferences through a swipe-first experience.",
    image: "/2d90c4c3670560f96d89a082de1e482eb669840d%20copy.png",
    className: "feature-card feature-card-large",
  },
  {
    title: "Mutual Interest",
    description:
      "Conversations only begin when both sides express interest, creating more relevant and intentional collaborations.",
    image: "/73dadc3ac68ec6edc1e5e9e45da88b374d016b0d.png",
    secondaryImage:
      "/d6c6a0938c99f3838727c8fabe7ffb111c1455b1.png",
    className: "feature-card feature-card-wide",
  },
  {
    title: "Verified Profiles",
    description: "Browse trusted creators and verified brands",
    image: "/36ae065af77d2d2f139a213d965bab9a5e0508c3.png",
    className: "feature-card feature-card-small",
    accent: true,
  },
  {
    title: "Audience Insights",
    description: "View follower demographics, engagement rates, reach, etc",
    image: "/ec47291d6a6b9ec2a895b25092b9df47a936469d.png",
    className: "feature-card feature-card-small",
  },
  {
    title: "Creator Portfolio",
    description:
      "Explore previous collaborations, content samples, media kits etc",
    image: "/220317729ca819cb07815fd8a49a86314143bd40.png",
    className: "feature-card feature-card-small",
  },
  {
    title: "Real-Time Chat",
    description: "",
    image: "/WhatsApp Image 2026-08-06 at 21.52.07.jpeg",
    hideTextAndGradient: true,
    className: "feature-card feature-card-side",
  },
  {
    title: "Performance Analytics",
    description:
      "Track campaign performance, engagement, reach, creator insights, and collaboration history with detailed analytics.",
    image: "/d46343e02e8fb895df83fa6f7e5eadf561b56b82.png",
    className: "feature-card feature-card-side",
  },
];

const navItems = [
  { label: "How its Work", href: "#how-it-works" },
  { label: "For Brands", href: "#for-brands" },
  { label: "For Influencer", href: "#for-creators" },
  { label: "Features", href: "#features" },
];

function PersonaCard({ label, image }: { label: string; image: string }) {
  return (
    <div className="persona-card">
      <img alt={label} className="persona-card__image" src={image} />
      <span>{label}</span>
    </div>
  );
}

function PhoneMockup({
  shell,
  mask,
  image,
  className,
}: {
  shell: string;
  mask: string;
  image: string;
  className: string;
}) {
  return (
    <div className={`hero-phone ${className}`}>
      <img alt="" className="hero-phone__shell" src={shell} />
      <div
        className="hero-phone__screen"
        style={{
          maskImage: `url(${mask})`,
          WebkitMaskImage: `url(${mask})`,
          backgroundImage: `url(${image})`,
        }}
      />
    </div>
  );
}

export default function HomePage() {
  const navRef = useRef<HTMLElement>(null);
  const [activePersona, setActivePersona] = useState<"influencer" | "brand">("influencer");

  const personaCopy = {
    influencer: {
      headline: (<>Where Brands and <span>Creators</span> Create Impact</>),
      sub: "Discover campaigns that match your niche, swipe on brands you love, and start collaborating — all in one place.",
      scrollTo: "#for-creators",
    },
    brand: {
      headline: (<>Where <span>Brands</span> Meet the Right Creators</>),
      sub: "Find authentic creators aligned with your audience, launch campaigns, and measure results — from one platform.",
      scrollTo: "#for-brands",
    },
  };

  const copy = personaCopy[activePersona];

  const handleToggle = (persona: "influencer" | "brand") => {
    setActivePersona(persona);
    const target = document.querySelector(personaCopy[persona].scrollTo);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="page-shell">
      {/* Fixed nav pill — always pinned top-right */}
      <nav className="floating-nav" ref={navRef}>
        {navItems.map((item) => (
          <a href={item.href} key={item.label}>
            {item.label}
          </a>
        ))}
        <a className="button button--dark button--nav" href="#cta">
          Get the App
        </a>
      </nav>

      <section className="hero" id="top">


        {/* Logo in the hero — scrolls away naturally */}
        <header className="hero__header">
          <div className="logo-mark">
            <img alt="Matchr" src={heroAssets.logo} />
            <span>Matchr</span>
          </div>
        </header>

          <div className="hero__content">
            <div className="hero__copy">
              <div className="pill pill--outline">Swipe . Match . Collaborate</div>
              <h1 key={activePersona} className="hero__headline--animated">
                {copy.headline}
              </h1>
              <p key={activePersona + "sub"} className="hero__sub--animated">
                {copy.sub}
              </p>
              <div className="hero__toggle">
                <button
                  className={`toggle-pill${activePersona === "influencer" ? " toggle-pill--active" : ""}`}
                  type="button"
                  onClick={() => handleToggle("influencer")}
                >
                  Influencer
                </button>
                <button
                  className={`toggle-pill${activePersona === "brand" ? " toggle-pill--active" : ""}`}
                  type="button"
                  onClick={() => handleToggle("brand")}
                >
                  Brand
                </button>
              </div>
            </div>

            <div className="hero__phones" style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
              <img
                alt="Hero App Layout"
                src="/Gemini_Generated_Image_56h0uw56h0uw56h0.png"
                style={{ width: '120%', height: 'auto', objectFit: 'contain', zIndex: 1, mixBlendMode: 'darken', transform: 'translate(10%, -10%)' }}
              />
            </div>
          </div>
        </section>

      <section className="trust-strip" aria-label="Trusted partners">
        <div className="trust-strip__mark" />
        <div className="trust-strip__mark" />
      </section>

      <section className="section intro-section">
        <div className="intro-section__top">
          <div>
            <h2>What is Matchr?</h2>
            <p className="section-subtitle">
              The easiest way to discover meaningful collaborations.
            </p>
          </div>
          <p className="intro-section__lede">
            Instead of endless emails and cold outreach, Matchr connects brands
            and creators through mutual interest. Swipe, match, chat, and
            collaborate all in one platform.
          </p>
        </div>

        <div className="intro-section__cards">
          <article className={introCards[0].className}>
            <h3>{introCards[0].title}</h3>
            <p>{introCards[0].description}</p>
          </article>
          <div className="intro-image-card">
            <div className="intro-image-card__base" />
            <img
              alt="Creator portrait"
              className="intro-image-card__image"
              src="/creator-portrait.png"
            />
          </div>
          <article className={introCards[1].className}>
            <h3>{introCards[1].title}</h3>
            <p>{introCards[1].description}</p>
          </article>
        </div>
      </section>

      <section className="section how-section" id="how-it-works">
        <div className="how-grid">
          <div className="how-section__heading">
            <h2>How it works?</h2>
            <p>
              Discover creators, find campaigns, and build authentic partnerships
              through a smarter, faster, and more engaging collaboration
              experience.
            </p>
          </div>

          <article className="how-card how-card--discover" style={{ overflow: 'visible' }}>
            <img alt="" src="/discover-placeholder-fixed.png" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.05)' }} />
          </article>

          <article className="how-card how-card--swipe">
            <img alt="" src="/swipe-placeholder-fixed.png" />
          </article>

          <article className="how-card how-card--match">
            <img alt="" src="/match-placeholder-fixed.png" />
          </article>

          <article className="how-card how-card--collaborate">
            <img alt="" src="/collaborate-placeholder-fixed.png" />
          </article>
        </div>
      </section>

      <section className="section showcase-section">
        <div className="showcase-section__heading">
          <h2>Built for brands. Loved by creators.</h2>
          <p>
            A two-sided platform where every swipe brings the right partnership
            one step closer.
          </p>
        </div>
        <div className="showcase-section__image-container">
          <img
            src="/Screenshot_2026-07-23_at_1.35.35_AM-removebg-preview.webp"
            alt="Platform showcase left"
            className="showcase-section__image"
          />
          <img
            src="/Screenshot 2026-08-06 at 8.12.02 PM.png"
            alt="Platform showcase right"
            className="showcase-section__image"
          />
        </div>
      </section>

      <section className="section audience-section" id="for-brands">
        <h2 className="audience-section__title">Who Is Matchr For?</h2>
        <div className="audience-row">
          <div className="audience-row__copy">
            <h3>I&apos;m a Brand</h3>
            <p>
              Find creators who genuinely align with your audience, launch
              campaigns, manage collaborations, and measure results from one
              place.
            </p>
            <div>
              <strong>Best for</strong>
              <div className="persona-grid">
                {personasBrand.map((persona) => (
                  <PersonaCard key={persona.label} {...persona} />
                ))}
              </div>
            </div>
          </div>
          <img
            alt="Brand campaign visual"
            className="audience-row__hero"
            src="/32b2baf8ab2ab5327717409f439623caf96a3e43.png"
          />
        </div>

        <div className="audience-row audience-row--reverse" id="for-creators">
          <img
            alt="Creator setup visual"
            className="audience-row__hero"
            src="/30f3b3daa8b058046d6afddb8fa34ea663c501e8.png"
          />
          <div className="audience-row__copy audience-row__copy--right">
            <h3>I&apos;m a Creator</h3>
            <p>
              Discover exciting campaigns, showcase your portfolio, connect
              with verified brands, and grow your creator business
            </p>
            <div>
              <strong>Best for</strong>
              <div className="persona-grid">
                {personasCreator.map((persona) => (
                  <PersonaCard key={persona.label} {...persona} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section features-section" id="features">
        <div className="section-heading section-heading--center section-heading--narrow">
          <h2>Why Matchr?</h2>
          <p>
            Everything creators and brands need to collaborate successfully.
          </p>
        </div>

        <div className="feature-grid">
          <article className={`${whyMatchr[0].className} feature-card--boom`}>
            <img alt="" src={whyMatchr[0].image} />
            <div className="feature-card__overlay" />
            <div className="feature-card__content">
              <h3>{whyMatchr[0].title}</h3>
              <p>{whyMatchr[0].description}</p>
            </div>
          </article>

          <article className={whyMatchr[1].className}>
            <div className="feature-card__split">
              <img alt="" src={whyMatchr[1].secondaryImage} />
              <img alt="" src={whyMatchr[1].image} />
            </div>
            <div className="feature-card__overlay" />
            <div className="feature-card__content">
              <h3>{whyMatchr[1].title}</h3>
              <p>{whyMatchr[1].description}</p>
            </div>
          </article>

          <div className="feature-grid__stack">
            {whyMatchr.slice(5).map((feature) => (
              <article className={feature.className} key={feature.title}>
                <img alt="" src={feature.image} />
                {feature.icons && (
                  <div className="feature-card__icons">
                    {feature.icons.map((icon, i) => (
                      <img key={i} src={icon} alt="" className="feature-card__icon" />
                    ))}
                  </div>
                )}
                {!feature.hideTextAndGradient && <div className="feature-card__overlay" />}
                {!feature.hideTextAndGradient && (
                  <div className="feature-card__content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="feature-grid__tiles">
            {whyMatchr.slice(2, 5).map((feature, index) => (
              <article
                className={`${feature.className} ${index === 0 ? "feature-card--accent" : ""}`}
                key={feature.title}
              >
                <img alt="" src={feature.image} />
                {!feature.hideTextAndGradient && <div className="feature-card__overlay" />}
                {!feature.hideTextAndGradient && (
                  <div className="feature-card__content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section cta-section" id="cta">
        <div className="cta-section__copy">
          <h2>Ready to Find Your Perfect Match?</h2>
          <p>
            Whether you&apos;re a brand searching for authentic creators or a
            creator looking for your next big collaboration, Matchr helps
            meaningful partnerships start with a single swipe.
          </p>
          <a className="button button--primary" href="mailto:support@matcher.com">
            Get the App
          </a>
        </div>
        <img
          alt="Woman using Matchr"
          className="cta-section__image"
          src="/871d2c7f53d688d8ba4f6749551cfc7c91cf842b.png"
        />
      </section>

      <footer className="footer-modern">
        <div className="footer-modern__top">
          <div className="footer-modern__brand">
            <div className="logo-mark">
              <img alt="Matchr" src={heroAssets.logo} />
              <span style={{ color: '#fff' }}>Matchr</span>
            </div>
            <p className="footer-modern__tagline">
              Where brands and creators create impact.
            </p>
          </div>
          
          <div className="footer-modern__links">
            <div className="footer-col">
              <h3>Product</h3>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#cta">Pricing</a>
            </div>
            <div className="footer-col">
              <h3>Company</h3>
              <a href="mailto:support@matcher.com">About</a>
              <a href="mailto:support@matcher.com">Contact</a>
              <a href="/rules.md">Privacy Policy</a>
              <a href="/rules.md">Terms of Service</a>
            </div>
            <div className="footer-col">
              <h3>Social</h3>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://x.com" target="_blank" rel="noreferrer">Twitter</a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
            </div>
          </div>
        </div>
        
        <div className="footer-modern__bottom">
          <p>&copy; {new Date().getFullYear()} Matchr. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
