"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import "./support.css";

const logo = "/my_logo-removebg-preview.png";

const navItems = [
  { label: "How its Work", href: "/#how-it-works" },
  { label: "For Brands", href: "/#for-brands" },
  { label: "For Influencer", href: "/#for-creators" },
  { label: "Features", href: "/#features" },
];

const channels = [
  {
    title: "Email support",
    description:
      "Best for account issues, billing questions, and anything that needs a paper trail.",
    meta: "Replies within 24 hours",
    action: "support@matcher.com",
    href: "mailto:support@matcher.com",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m3.5 7.5 7.1 5a2.5 2.5 0 0 0 2.8 0l7.1-5" />
      </>
    ),
  },
  {
    title: "In-app chat",
    description:
      "Already matched? Tap your profile, open Help, and chat with our team without leaving the app.",
    meta: "Mon–Sat, 10am–7pm IST",
    action: "Open Matchr",
    href: "#contact",
    icon: (
      <>
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5.1A8 8 0 1 1 21 12Z" />
        <path d="M9 11h6M9 14.5h3.5" />
      </>
    ),
  },
  {
    title: "Report a problem",
    description:
      "Flag fake profiles, payment disputes, harassment, or anything that breaks our community rules.",
    meta: "Reviewed within 48 hours",
    action: "trust@matcher.com",
    href: "mailto:trust@matcher.com",
    icon: (
      <>
        <path d="M12 3.5 20.5 19h-17L12 3.5Z" />
        <path d="M12 10v4M12 16.8v.2" />
      </>
    ),
  },
];

type Faq = {
  category: string;
  question: string;
  answer: string;
};

const faqs: Faq[] = [
  {
    category: "Getting started",
    question: "How do I create a Matchr account?",
    answer:
      "Download Matchr, sign up with your email or Google account, and pick whether you're joining as a creator or a brand. You'll be guided through a short onboarding that sets up your profile, niche, and collaboration preferences — it takes about five minutes.",
  },
  {
    category: "Getting started",
    question: "Is Matchr free to use?",
    answer:
      "Creating a profile, discovering profiles, swiping, and matching are free for both creators and brands. Paid plans unlock advanced filters, campaign management, and deeper analytics for teams running collaborations at scale.",
  },
  {
    category: "Getting started",
    question: "Which devices does Matchr support?",
    answer:
      "Matchr runs on iOS 15 and above and Android 9 and above. A web dashboard for brand teams is available for campaign management and reporting.",
  },
  {
    category: "Getting started",
    question: "How does matching actually work?",
    answer:
      "You swipe on profiles and campaigns curated around your niche, audience, and goals. When both sides swipe right, it's a match and a chat opens instantly. Nobody can message you before mutual interest exists.",
  },
  {
    category: "For Creators",
    question: "How do I get verified as a creator?",
    answer:
      "Open Profile → Verification and connect at least one social account. We check follower authenticity and engagement history, then add a verified badge to your profile. Verification usually completes within 48 hours.",
  },
  {
    category: "For Creators",
    question: "Why am I not seeing many campaigns?",
    answer:
      "Campaign volume depends on your niche, location, and how complete your profile is. Adding a portfolio, media kit, audience demographics, and at least three content samples typically increases the campaigns you're shown.",
  },
  {
    category: "For Creators",
    question: "How and when do I get paid for a collaboration?",
    answer:
      "Payment terms are agreed inside the chat before work starts. For campaigns with Matchr-managed payouts, funds are released to your linked account within seven business days of the brand approving your deliverables.",
  },
  {
    category: "For Creators",
    question: "Can I update my rates after matching?",
    answer:
      "Yes. Rates in your profile are indicative, and the final scope and fee are settled in chat. We recommend confirming deliverables, usage rights, and timelines in writing before you begin.",
  },
  {
    category: "For Brands",
    question: "How do I launch a campaign?",
    answer:
      "From the brand dashboard, choose Create campaign, describe the deliverables, budget range, and target audience, then publish. Your campaign enters the creator discovery feed and you'll start seeing interested creators the same day.",
  },
  {
    category: "For Brands",
    question: "Can I invite my team to a brand account?",
    answer:
      "Yes. Brand accounts support multiple seats with owner, manager, and viewer roles. Invite teammates from Settings → Team and assign them to specific campaigns.",
  },
  {
    category: "For Brands",
    question: "What creator data can I see before matching?",
    answer:
      "You can see niche, location, follower count, engagement rate, audience demographics, past collaborations, and content samples. Contact details are only shared once both sides match.",
  },
  {
    category: "Account & Billing",
    question: "How do I change my plan or cancel?",
    answer:
      "Go to Settings → Subscription to upgrade, downgrade, or cancel. Cancellations take effect at the end of the current billing period, and you keep access to paid features until then.",
  },
  {
    category: "Account & Billing",
    question: "I was charged incorrectly. What should I do?",
    answer:
      "Email support@matcher.com with the transaction date and amount. Billing issues are prioritised, and confirmed incorrect charges are refunded to the original payment method within 5–7 business days.",
  },
  {
    category: "Account & Billing",
    question: "How do I delete my account and data?",
    answer:
      "Settings → Account → Delete account. This removes your profile, matches, and chat history. Records we're legally required to retain, such as invoices, are kept for the mandated period and nothing else.",
  },
  {
    category: "Safety & Trust",
    question: "How do you keep fake profiles off Matchr?",
    answer:
      "Every brand goes through business verification and creator accounts are checked for follower authenticity. We also run automated checks on new profiles and review every report our community sends us.",
  },
  {
    category: "Safety & Trust",
    question: "Someone is behaving inappropriately. How do I report them?",
    answer:
      "Open the chat or profile, tap the three-dot menu, and choose Report or Block. Reports go to our trust team and are reviewed within 48 hours. You can also email trust@matcher.com with screenshots.",
  },
  {
    category: "Safety & Trust",
    question: "How is my personal data handled?",
    answer:
      "We only share the profile details you choose to publish, and contact information is never exposed before a match. Your data is encrypted in transit and at rest, and we never sell it to third parties.",
  },
];

const categories = [
  "All",
  "Getting started",
  "For Creators",
  "For Brands",
  "Account & Billing",
  "Safety & Trust",
];

const topics = [
  "Account & login",
  "Billing & plans",
  "Campaigns & matches",
  "Report a user",
  "Partnerships",
  "Something else",
];

export default function SupportPage() {
  const navRef = useRef<HTMLElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<string | null>(faqs[0].question);

  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: topics[0],
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visibleFaqs = useMemo(() => {
    const term = query.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === "All" || faq.category === activeCategory;
      const matchesQuery =
        !term ||
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErrorMessage(
          data?.message ??
            "Please check the form — we need a name, a valid email, and a few lines about the issue.",
        );
        setStatus("error");
        return;
      }

      setStatus("sent");
      setForm({ name: "", email: "", topic: topics[0], message: "" });
    } catch {
      setErrorMessage(
        "We couldn't reach the server. Email support@matcher.com and we'll pick it up there.",
      );
      setStatus("error");
    }
  };

  return (
    <main className="page-shell support-page">
      <div className="nav-wrapper">
        <nav className="floating-nav" ref={navRef}>
          <a href="/" className="nav-logo">
            <img alt="Matchr" src={logo} />
            <span>Matchr</span>
          </a>
          {navItems.map((item) => (
            <a href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
          <a className="button button--dark button--nav" href="#contact">
            Contact us
          </a>
          <button
            className="hamburger-btn"
            aria-label="Open menu"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </nav>
      </div>

      {isMobileMenuOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`mobile-sidebar ${isMobileMenuOpen ? "mobile-sidebar--open" : ""}`}
      >
        <div className="mobile-sidebar__header">
          <div className="logo-mark">
            <img alt="Matchr" src={logo} />
            <span>Matchr</span>
          </div>
          <button
            className="mobile-sidebar__close"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <nav className="mobile-sidebar__nav">
          {navItems.map((item) => (
            <a
              href={item.href}
              key={item.label}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            className="mobile-sidebar__nav-cta"
            href="#contact"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact us
          </a>
        </nav>
      </div>

      <section className="section support-hero" id="top">
        <div className="support-hero__glow" aria-hidden="true" />
        <div className="support-hero__inner">
          <div className="pill pill--outline">Support Center</div>
          <h1>
            How can we <span>help?</span>
          </h1>
          <p>
            Answers for creators and brands, response times you can plan
            around, and a real human at the end of every message.
          </p>

          <form
            className="support-search"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <svg
              className="support-search__icon"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for payouts, verification, billing…"
              aria-label="Search help articles"
            />
            {query && (
              <button
                type="button"
                className="support-search__clear"
                onClick={() => setQuery("")}
              >
                Clear
              </button>
            )}
          </form>

          <div className="support-hero__suggestions">
            <span>Popular:</span>
            {["verification", "payouts", "billing", "report"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQuery(term);
                  setActiveCategory("All");
                  document
                    .querySelector("#faq")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section support-channels" id="contact-options">
        <div className="section-heading section-heading--center section-heading--narrow">
          <h2>Talk to the team</h2>
          <p>Pick the channel that fits your question. We answer all three.</p>
        </div>

        <div className="channel-grid">
          {channels.map((channel) => (
            <a className="channel-card" href={channel.href} key={channel.title}>
              <span className="channel-card__icon" aria-hidden="true">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {channel.icon}
                </svg>
              </span>
              <h3>{channel.title}</h3>
              <p>{channel.description}</p>
              <span className="channel-card__meta">{channel.meta}</span>
              <span className="channel-card__action">
                {channel.action}
                <span aria-hidden="true">→</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="section support-faq" id="faq">
        <div className="section-heading section-heading--center section-heading--narrow">
          <h2>Frequently asked questions</h2>
          <p>Most issues are solved right here in under a minute.</p>
        </div>

        <div className="faq-filters" role="tablist" aria-label="FAQ categories">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              className={`faq-filter${activeCategory === category ? " faq-filter--active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="faq-list">
          {visibleFaqs.map((faq) => {
            const isOpen = openFaq === faq.question;
            return (
              <article
                className={`faq-item${isOpen ? " faq-item--open" : ""}`}
                key={faq.question}
              >
                <button
                  type="button"
                  className="faq-item__trigger"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaq(isOpen ? null : faq.question)}
                >
                  <span className="faq-item__tag">{faq.category}</span>
                  <span className="faq-item__question">{faq.question}</span>
                  <span className="faq-item__toggle" aria-hidden="true">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                <div className="faq-item__panel">
                  <p>{faq.answer}</p>
                </div>
              </article>
            );
          })}

          {visibleFaqs.length === 0 && (
            <div className="faq-empty">
              <h3>No answers matched “{query}”.</h3>
              <p>
                Try a different word, or send us the question directly — we
                reply within 24 hours.
              </p>
              <a className="button button--primary" href="#contact">
                Ask the team
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="section support-contact" id="contact">
        <div className="support-contact__copy">
          <h2>Still stuck? Write to us.</h2>
          <p>
            Tell us what happened and what you expected instead. Include your
            account email and a screenshot if you have one — it usually saves a
            full round of back and forth.
          </p>
          <ul className="support-contact__list">
            <li>
              <strong>24 hours</strong>
              <span>Average first reply on support requests</span>
            </li>
            <li>
              <strong>48 hours</strong>
              <span>Trust &amp; safety reports reviewed</span>
            </li>
            <li>
              <strong>Mon–Sat</strong>
              <span>10am–7pm IST live chat inside the app</span>
            </li>
          </ul>
        </div>

        <form className="support-form" onSubmit={handleSubmit}>
          <div className="support-form__row">
            <label className="support-field">
              <span>Your name</span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Ananya Sharma"
              />
            </label>
            <label className="support-field">
              <span>Account email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="you@email.com"
              />
            </label>
          </div>

          <label className="support-field">
            <span>Topic</span>
            <select
              value={form.topic}
              onChange={(event) =>
                setForm({ ...form, topic: event.target.value })
              }
            >
              {topics.map((topic) => (
                <option key={topic}>{topic}</option>
              ))}
            </select>
          </label>

          <label className="support-field">
            <span>How can we help?</span>
            <textarea
              required
              minLength={10}
              rows={6}
              value={form.message}
              onChange={(event) =>
                setForm({ ...form, message: event.target.value })
              }
              placeholder="Describe the issue, what you tried, and what you expected to happen."
            />
          </label>

          <button
            className="button button--primary support-form__submit"
            type="submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending…" : "Send message"}
          </button>

          {status === "sent" && (
            <p className="support-form__note support-form__note--ok">
              Thanks — your message is in. We&apos;ll reply to your account
              email within 24 hours.
            </p>
          )}
          {status === "error" && (
            <p className="support-form__note support-form__note--error">
              {errorMessage}
            </p>
          )}
        </form>
      </section>

      <footer className="footer-modern" aria-labelledby="footer-title">
        <div className="footer-modern__top">
          <div className="footer-modern__brand">
            <div className="logo-mark">
              <img alt="Matchr" src={logo} />
              <span id="footer-title" style={{ color: "#fff" }}>
                Matchr
              </span>
            </div>
            <p className="footer-modern__tagline">
              Where brands and creators create impact.
            </p>
          </div>

          <nav className="footer-modern__links" aria-label="Footer navigation">
            <div className="footer-col footer-col--product">
              <h3>Product</h3>
              <a href="/#features">Features</a>
              <a href="/#how-it-works">How It Works</a>
              <a href="/#cta">Pricing</a>
            </div>
            <div className="footer-col footer-col--company">
              <h3>Company</h3>
              <a href="/support">Support</a>
              <a href="mailto:support@matcher.com">Contact</a>
              <a href="/privacy">Privacy Policy</a>
              <a href="/rules.md">Terms of Service</a>
            </div>
            <div className="footer-col footer-col--social">
              <h3>Social</h3>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer">
                Twitter
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </div>
          </nav>
        </div>

        <div className="footer-modern__bottom">
          <p>&copy; {new Date().getFullYear()} Matchr. All rights reserved.</p>
          <a className="footer-modern__back-to-top" href="#top">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </footer>

      <div className="mobile-cta-bar">
        <a className="mobile-cta-bar__btn" href="#contact">
          Contact us
        </a>
      </div>
    </main>
  );
}
