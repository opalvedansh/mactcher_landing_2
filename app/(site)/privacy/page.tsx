"use client";
import { useEffect, useRef, useState } from "react";
import "./privacy.css";

const logo = "/my_logo-removebg-preview.png";
const LAST_UPDATED = "September 30, 2026";

const navItems = [
  { label: "How its Work", href: "/#how-it-works" },
  { label: "For Brands", href: "/#for-brands" },
  { label: "For Influencer", href: "/#for-creators" },
  { label: "Support", href: "/support" },
];

const summaryCards = [
  {
    title: "We don't sell your data",
    body: "Audience and engagement data from your connected accounts is used for matching, verification, and analytics — never sold to third parties or data brokers.",
  },
  {
    title: "Contact details stay private",
    body: "Your email, phone number, and DMs are not visible to anyone until both sides swipe right. No cold outreach, no scraped inboxes.",
  },
  {
    title: "You stay in control",
    body: "Export a copy of your data or delete your account at any time from Settings. Deletion removes your profile, matches, and chat history.",
  },
  {
    title: "Encrypted end to end of the wire",
    body: "All data is encrypted in transit over HTTPS/TLS and at rest. Card details never touch our servers — they go straight to our PCI-compliant processor.",
  },
];

const sections = [
  { id: "overview", label: "1. Overview" },
  { id: "information-we-collect", label: "2. Information we collect" },
  { id: "how-we-use", label: "3. How we use information" },
  { id: "how-we-share", label: "4. How we share information" },
  { id: "processors", label: "5. Service providers" },
  { id: "retention", label: "6. How long we keep data" },
  { id: "your-rights", label: "7. Your rights and choices" },
  { id: "security", label: "8. Security" },
  { id: "cookies", label: "9. Cookies and analytics" },
  { id: "children", label: "10. Age requirements" },
  { id: "international", label: "11. International transfers" },
  { id: "changes", label: "12. Changes to this policy" },
  { id: "contact", label: "13. How to reach us" },
];

const dataTable = [
  {
    category: "Account data",
    examples:
      "Name, email address, password hash, role (creator or brand), country, and — for brands — company name and business domain.",
    why: "To create and secure your account, and to show you the right side of the marketplace.",
  },
  {
    category: "Profile data",
    examples:
      "Niche, bio, location, rates, portfolio pieces, media kit, content samples, and past collaborations you choose to publish.",
    why: "This is what other users see and swipe on. You decide what goes in it.",
  },
  {
    category: "Connected social data",
    examples:
      "Follower count, engagement rate, audience demographics, and recent post performance, pulled through the platform's official OAuth integration.",
    why: "To verify that an audience is real and to rank relevant matches. We request read-only scopes and never post on your behalf.",
  },
  {
    category: "Collaboration data",
    examples:
      "Matches, chat messages, campaign briefs, deliverables, agreed rates, and approval history.",
    why: "To run the collaboration, and to resolve disputes if one side raises a claim.",
  },
  {
    category: "Payment data",
    examples:
      "Billing name, address, subscription tier, payout account reference, invoices, and transaction history.",
    why: "To bill subscriptions and route payouts. Raw card numbers are handled by our payment processor — we store only a token and the last four digits.",
  },
  {
    category: "Usage and device data",
    examples:
      "Swipes, searches, screens viewed, IP address, device model, operating system, app version, and crash logs.",
    why: "To improve matching, fix bugs, and detect fraud, bots, and duplicate accounts.",
  },
  {
    category: "Support data",
    examples:
      "Messages you send to support or trust and safety, plus any screenshots or attachments you include.",
    why: "To answer your question and keep a record of the decision.",
  },
];

const processors = [
  { role: "Cloud hosting and databases", purpose: "Running the app and storing your data" },
  { role: "Payment processing", purpose: "Subscriptions, escrow, and creator payouts" },
  { role: "Product analytics and crash reporting", purpose: "Understanding feature usage and diagnosing errors" },
  { role: "Transactional email and push notifications", purpose: "Match alerts, receipts, and security notices" },
  { role: "Identity and audience verification", purpose: "Checking follower authenticity and business legitimacy" },
  { role: "Customer support tooling", purpose: "Managing and replying to your support requests" },
];

const rights = [
  {
    title: "Access and portability",
    body: "Request a machine-readable copy of the data tied to your account.",
  },
  {
    title: "Correction",
    body: "Fix anything inaccurate, directly in Settings or by writing to us.",
  },
  {
    title: "Deletion",
    body: "Delete your account and the data attached to it, except records we must keep by law.",
  },
  {
    title: "Objection and restriction",
    body: "Ask us to stop or limit a specific use of your data, including profiling for matches.",
  },
  {
    title: "Withdraw consent",
    body: "Disconnect a social account or turn off marketing email without losing your account.",
  },
  {
    title: "Complain",
    body: "Raise a complaint with your local data protection authority at any time.",
  },
];

export default function PrivacyPage() {
  const navRef = useRef<HTMLElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(sections[0].id);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const headings = sections
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="page-shell policy-page">
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

      <section className="section policy-hero" id="top">
        <div className="policy-hero__glow" aria-hidden="true" />
        <div className="policy-hero__inner">
          <div className="pill pill--outline">Legal</div>
          <h1>
            Privacy <span>Policy</span>
          </h1>
          <p className="policy-hero__lede">
            This policy explains what Matchr collects from creators and brands,
            why we collect it, who we share it with, and the control you have
            over all of it. It is written to be read, not to be skimmed past.
          </p>
          <dl className="policy-hero__meta">
            <div>
              <dt>Last updated</dt>
              <dd>{LAST_UPDATED}</dd>
            </div>
            <div>
              <dt>Applies to</dt>
              <dd>The Matchr app, website, and brand dashboard</dd>
            </div>
            <div>
              <dt>Reading time</dt>
              <dd>About 9 minutes</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section policy-summary">
        <h2 className="policy-summary__title">The short version</h2>
        <p className="policy-summary__note">
          This summary is here for convenience. The numbered sections below are
          the policy that actually governs your account.
        </p>
        <div className="policy-summary__grid">
          {summaryCards.map((card) => (
            <article className="policy-summary__card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section policy-main">
        <aside className="policy-toc" aria-label="Table of contents">
          <h2>On this page</h2>
          <nav>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={
                  activeSection === section.id ? "policy-toc__link--active" : ""
                }
              >
                {section.label}
              </a>
            ))}
          </nav>
          <a className="policy-toc__help" href="#contact">
            Questions about your data? →
          </a>
        </aside>

        <div className="policy-body">
          <article className="policy-section" id="overview">
            <h2>1. Overview</h2>
            <p>
              Matchr is a two-sided platform where brands and creators discover
              each other, match on mutual interest, and run collaborations. This
              policy covers{" "}
              <span className="policy-placeholder">[registered entity name]</span>
              , the company that operates Matchr, acting as the data controller
              for the information described here.
            </p>
            <p>
              It applies whenever you use the Matchr mobile app, this website, or
              the brand dashboard. It sits alongside our{" "}
              <a href="/rules.md">Platform Rules</a>, which describe what is and
              is not allowed on Matchr. Where this policy and the rules overlap
              on a data question, this policy governs.
            </p>
            <p>
              If you disagree with something here, the honest answer is that you
              should not create an account — most of what we collect is what the
              product needs in order to work at all.
            </p>
          </article>

          <article className="policy-section" id="information-we-collect">
            <h2>2. Information we collect</h2>
            <p>
              We collect three kinds of information: what you give us, what we
              pull from accounts you connect, and what we observe as you use the
              product.
            </p>
            <div className="policy-table" role="table">
              <div className="policy-table__head" role="row">
                <span role="columnheader">Category</span>
                <span role="columnheader">What it includes</span>
                <span role="columnheader">Why we need it</span>
              </div>
              {dataTable.map((row) => (
                <div className="policy-table__row" role="row" key={row.category}>
                  <span role="cell" data-label="Category">
                    <strong>{row.category}</strong>
                  </span>
                  <span role="cell" data-label="What it includes">
                    {row.examples}
                  </span>
                  <span role="cell" data-label="Why we need it">
                    {row.why}
                  </span>
                </div>
              ))}
            </div>
            <h3>What we deliberately do not collect</h3>
            <ul>
              <li>
                Raw payment card numbers. These go directly to our PCI-compliant
                payment processor and never reach our servers.
              </li>
              <li>
                Your social account password. Connections are made through
                official OAuth, so you can revoke our access from the platform
                itself at any time.
              </li>
              <li>
                Your contacts, photo library, or precise GPS location. We ask for
                city-level location only, and only to improve matching.
              </li>
              <li>
                Special category data — health, religion, political views,
                biometrics. Please do not put it in your profile.
              </li>
            </ul>
          </article>

          <article className="policy-section" id="how-we-use">
            <h2>3. How we use information</h2>
            <p>We use what we collect for these purposes and no others:</p>
            <ul>
              <li>
                <strong>Running the marketplace</strong> — building your
                profile, generating your discovery feed, recording swipes,
                opening chats on a mutual match, and managing campaigns.
              </li>
              <li>
                <strong>Verification and trust</strong> — confirming that
                audiences are real and businesses are legitimate, detecting
                bought followers, bots, duplicate accounts, and fraud.
              </li>
              <li>
                <strong>Payments</strong> — billing subscriptions, calculating
                the service fee, holding funds in escrow where applicable, and
                paying creators out.
              </li>
              <li>
                <strong>Support and disputes</strong> — answering your messages
                and, where a dispute is raised, reviewing the relevant chat and
                campaign records.
              </li>
              <li>
                <strong>Product improvement</strong> — aggregated analytics on
                how features are used, and crash diagnostics.
              </li>
              <li>
                <strong>Communications</strong> — match alerts, campaign
                updates, receipts, security notices, and, if you opt in,
                occasional product news.
              </li>
              <li>
                <strong>Legal obligations</strong> — tax records, responding to
                lawful requests, and enforcing our rules.
              </li>
            </ul>
            <h3>Legal bases (for users in the UK, EU, and similar regimes)</h3>
            <p>
              We rely on <strong>performance of a contract</strong> for anything
              required to run your account and collaborations;{" "}
              <strong>legitimate interests</strong> for fraud prevention,
              security, and product analytics;{" "}
              <strong>consent</strong> for marketing email, optional analytics
              cookies, and connecting a social account; and{" "}
              <strong>legal obligation</strong> for financial and tax records.
              You can withdraw consent without affecting the rest of your
              account.
            </p>
            <h3>Automated matching</h3>
            <p>
              Your discovery feed is ranked automatically using your niche,
              audience data, stated goals, and past swipes. This ranking decides
              what you are shown — it never decides a payment, a suspension, or
              anything with a legal effect on you, and a human reviews every
              enforcement decision.
            </p>
          </article>

          <article className="policy-section" id="how-we-share">
            <h2>4. How we share information</h2>
            <p>
              We do not sell your personal information, and we do not share it
              for cross-context behavioural advertising. We share it in four
              situations:
            </p>
            <ul>
              <li>
                <strong>With users you match with.</strong> Before a match, the
                other side sees only your published profile. After a mutual
                match, the chat opens and you choose what else to share.
              </li>
              <li>
                <strong>With service providers.</strong> Vendors that process
                data on our instructions, under contract, listed in section 5.
              </li>
              <li>
                <strong>For legal reasons.</strong> Where we are required by law,
                or where disclosure is necessary to investigate fraud or protect
                someone&apos;s safety.
              </li>
              <li>
                <strong>In a corporate transaction.</strong> If Matchr is
                acquired or merged, data may transfer to the acquirer under this
                policy. We will tell you before it takes effect.
              </li>
            </ul>
            <p>
              Brand teams share one account with role-based seats, so
              collaboration records are visible to teammates with access to that
              campaign. Keep that in mind when writing in a campaign chat.
            </p>
          </article>

          <article className="policy-section" id="processors">
            <h2>5. Service providers</h2>
            <p>
              We use third parties for the functions below. Each is bound by a
              data processing agreement, may only use the data to provide its
              service to us, and is reviewed before we onboard it. The current
              named list is available on request at{" "}
              <a href="mailto:privacy@matcher.com">privacy@matcher.com</a>.
            </p>
            <div className="policy-table policy-table--two" role="table">
              <div className="policy-table__head" role="row">
                <span role="columnheader">Function</span>
                <span role="columnheader">What they do for us</span>
              </div>
              {processors.map((processor) => (
                <div className="policy-table__row" role="row" key={processor.role}>
                  <span role="cell" data-label="Function">
                    <strong>{processor.role}</strong>
                  </span>
                  <span role="cell" data-label="What they do for us">
                    {processor.purpose}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="policy-section" id="retention">
            <h2>6. How long we keep data</h2>
            <ul>
              <li>
                <strong>Active accounts</strong> — for as long as your account
                exists.
              </li>
              <li>
                <strong>After you delete your account</strong> — your profile
                and matches are removed from the product immediately, and purged
                from backups within 30 days.
              </li>
              <li>
                <strong>Chat and campaign records</strong> — kept for 12 months
                after a collaboration ends, so either side can raise a dispute.
              </li>
              <li>
                <strong>Financial records</strong> — invoices and payout records
                are kept for{" "}
                <span className="policy-placeholder">
                  [retention period required by your jurisdiction]
                </span>
                , because tax law requires it.
              </li>
              <li>
                <strong>Trust and safety records</strong> — reports and
                enforcement decisions are kept for 24 months so that repeat
                behaviour can be recognised.
              </li>
              <li>
                <strong>Analytics</strong> — retained in aggregated,
                non-identifying form, which we may keep indefinitely.
              </li>
            </ul>
          </article>

          <article className="policy-section" id="your-rights">
            <h2>7. Your rights and choices</h2>
            <p>
              Wherever you live, you can exercise the rights below. Depending on
              your jurisdiction — for example under the GDPR, the CCPA/CPRA, or
              India&apos;s DPDP Act — some of them may also be legally
              enforceable.
            </p>
            <div className="policy-rights">
              {rights.map((right) => (
                <div className="policy-rights__item" key={right.title}>
                  <h3>{right.title}</h3>
                  <p>{right.body}</p>
                </div>
              ))}
            </div>
            <p>
              Most of this is self-serve in <strong>Settings → Account</strong>.
              For anything else, email{" "}
              <a href="mailto:privacy@matcher.com">privacy@matcher.com</a>. We
              respond within 30 days, we will not charge you for a reasonable
              request, and we will never degrade your account because you made
              one. We may ask you to confirm your identity first so that we do
              not hand your data to someone else.
            </p>
          </article>

          <article className="policy-section" id="security">
            <h2>8. Security</h2>
            <p>
              Data is encrypted in transit with HTTPS/TLS and encrypted at rest.
              Access to production data is restricted to staff who need it,
              protected by multi-factor authentication, and logged. We run
              automated checks on new profiles, and we review every report our
              community sends us.
            </p>
            <p>
              No system is perfect. If we discover a breach affecting your
              personal data, we will notify you and the relevant regulator
              within the timeframes the law requires, and tell you what we know
              rather than waiting until we know everything. If you have found a
              vulnerability, please report it to{" "}
              <a href="mailto:security@matcher.com">security@matcher.com</a>
              {" "}before disclosing it publicly.
            </p>
          </article>

          <article className="policy-section" id="cookies">
            <h2>9. Cookies and analytics</h2>
            <p>
              On our website we use strictly necessary cookies to keep you signed
              in and to protect against abuse. These cannot be turned off
              without breaking the site.
            </p>
            <p>
              We also use analytics cookies and mobile SDKs to understand which
              features are used and where people get stuck. Where the law
              requires consent, we ask before setting them, and you can change
              your answer at any time from the cookie banner or in{" "}
              <strong>Settings → Privacy</strong>. We honour{" "}
              <strong>Global Privacy Control</strong> signals sent by your
              browser.
            </p>
            <p>
              We do not run third-party advertising trackers on Matchr, and we do
              not build advertising profiles of you.
            </p>
          </article>

          <article className="policy-section" id="children">
            <h2>10. Age requirements</h2>
            <p>
              Matchr is for adults. You must be 18 or older to hold an account.
              Creators under 18 may only participate through a verified parent or
              legal guardian account, and the guardian is the account holder.
            </p>
            <p>
              We do not knowingly collect data from children. If we learn that an
              account belongs to someone underage, we remove it and delete the
              associated data. If you believe a child has an account, tell us at{" "}
              <a href="mailto:privacy@matcher.com">privacy@matcher.com</a>.
            </p>
          </article>

          <article className="policy-section" id="international">
            <h2>11. International transfers</h2>
            <p>
              Matchr operates across regions, so your data may be processed in a
              country other than your own — including by the service providers
              in section 5. Our primary hosting region is{" "}
              <span className="policy-placeholder">[primary hosting region]</span>
              .
            </p>
            <p>
              When we move personal data out of the UK, EU, or another region
              with transfer restrictions, we rely on an approved safeguard — the
              European Commission&apos;s Standard Contractual Clauses, the UK
              International Data Transfer Addendum, or an adequacy decision —
              and we assess the destination country before we do.
            </p>
          </article>

          <article className="policy-section" id="changes">
            <h2>12. Changes to this policy</h2>
            <p>
              We update this policy when the product changes or the law does. The
              date at the top always reflects the current version.
            </p>
            <p>
              For minor clarifications we update the page. For changes that
              materially affect your rights or how we use your data, we notify
              you in the app or by email at least 30 days before they take
              effect, so you have time to object or close your account.
            </p>
          </article>

          <article className="policy-section" id="contact">
            <h2>13. How to reach us</h2>
            <p>
              A person reads these inboxes. Pick whichever fits and we will route
              it internally if it lands in the wrong place.
            </p>
            <div className="policy-contact">
              <a className="policy-contact__card" href="mailto:privacy@matcher.com">
                <span>Privacy and data requests</span>
                <strong>privacy@matcher.com</strong>
              </a>
              <a className="policy-contact__card" href="mailto:support@matcher.com">
                <span>General support</span>
                <strong>support@matcher.com</strong>
              </a>
              <a className="policy-contact__card" href="mailto:security@matcher.com">
                <span>Security disclosures</span>
                <strong>security@matcher.com</strong>
              </a>
            </div>
            <p>
              Postal address:{" "}
              <span className="policy-placeholder">
                [registered office address]
              </span>
              . Our data protection contact is{" "}
              <span className="policy-placeholder">
                [DPO or privacy contact name]
              </span>
              . If you are in the EU or UK and are not satisfied with our
              response, you may complain to your local supervisory authority.
            </p>
            <p className="policy-section__footnote">
              Prefer a conversation? The{" "}
              <a href="/support">support page</a> has live chat hours and a
              contact form, and typical first replies land within 24 hours.
            </p>
          </article>
        </div>
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
