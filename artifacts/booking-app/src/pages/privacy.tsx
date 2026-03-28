import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const CURRENT_YEAR = new Date().getFullYear();
const EFFECTIVE_DATE = "1 January 2025";
const CONTACT_EMAIL = "privacy@aussieclean.com.au";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background pt-20">
      <Navbar />
      <main id="main-content" className="flex-1 py-16 px-4 sm:px-6">
        <article className="max-w-3xl mx-auto prose prose-invert prose-sm sm:prose-base">
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground mt-2">
              Effective: {EFFECTIVE_DATE} · Last updated: {CURRENT_YEAR}
            </p>
          </header>

          <section aria-labelledby="pp-intro">
            <h2 id="pp-intro" className="text-xl font-semibold text-foreground mt-8 mb-3">1. About This Policy</h2>
            <p className="text-muted-foreground">
              AussieClean Enterprise Services Pty Ltd (<strong>"AussieClean", "we", "us", "our"</strong>) is
              committed to protecting your privacy in accordance with the <em>Privacy Act 1988</em> (Cth) and
              the Australian Privacy Principles (APPs). This policy explains how we collect, use, store, and
              disclose your personal information.
            </p>
          </section>

          <section aria-labelledby="pp-collect">
            <h2 id="pp-collect" className="text-xl font-semibold text-foreground mt-8 mb-3">2. What We Collect</h2>
            <p className="text-muted-foreground">We may collect the following personal information:</p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-1 mt-2">
              <li>Name, email address, and phone number</li>
              <li>Service address and property details</li>
              <li>Booking history and service preferences</li>
              <li>Payment information (processed securely via Stripe — we do not store card details)</li>
              <li>Device and browser information collected automatically via analytics tools</li>
              <li>Communications you send us via contact forms, email, or phone</li>
            </ul>
          </section>

          <section aria-labelledby="pp-why">
            <h2 id="pp-why" className="text-xl font-semibold text-foreground mt-8 mb-3">3. Why We Collect It</h2>
            <p className="text-muted-foreground">We use your information to:</p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-1 mt-2">
              <li>Process and manage your bookings and payments</li>
              <li>Communicate service updates, reminders, and confirmations</li>
              <li>Assign appropriately skilled staff to your job</li>
              <li>Respond to enquiries and complaints</li>
              <li>Improve our services and website</li>
              <li>Comply with our legal obligations</li>
            </ul>
          </section>

          <section aria-labelledby="pp-disclose">
            <h2 id="pp-disclose" className="text-xl font-semibold text-foreground mt-8 mb-3">4. Disclosure of Information</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We may share it with:
            </p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-1 mt-2">
              <li>Contracted cleaning staff assigned to your job</li>
              <li>Payment processors (Stripe Inc.) under their own privacy policy</li>
              <li>Email service providers (Resend) for transactional communications</li>
              <li>Analytics platforms (PostHog) — data is anonymised where possible</li>
              <li>Government bodies when required by law</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We do not disclose your information to overseas recipients except where our service
              providers (e.g. Stripe, PostHog) process data under equivalent privacy protections.
            </p>
          </section>

          <section aria-labelledby="pp-security">
            <h2 id="pp-security" className="text-xl font-semibold text-foreground mt-8 mb-3">5. Storage and Security</h2>
            <p className="text-muted-foreground">
              Your data is stored on secured servers in Australia or with cloud providers maintaining
              SOC 2 Type II compliance. We use TLS encryption for data in transit and restrict
              access to personal data to authorised staff only. Unnecessary data is deleted or
              de-identified once the purpose for collection has been fulfilled.
            </p>
          </section>

          <section aria-labelledby="pp-rights">
            <h2 id="pp-rights" className="text-xl font-semibold text-foreground mt-8 mb-3">6. Your Rights</h2>
            <p className="text-muted-foreground">Under the APPs you have the right to:</p>
            <ul className="text-muted-foreground list-disc pl-6 space-y-1 mt-2">
              <li>Request access to the personal information we hold about you</li>
              <li>Request correction of inaccurate or outdated information</li>
              <li>Opt out of marketing communications at any time</li>
              <li>Lodge a complaint with the Office of the Australian Information Commissioner (OAIC)</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              To exercise these rights, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section aria-labelledby="pp-cookies">
            <h2 id="pp-cookies" className="text-xl font-semibold text-foreground mt-8 mb-3">7. Cookies &amp; Analytics</h2>
            <p className="text-muted-foreground">
              Our website uses cookies and similar tracking technologies for analytics and
              functionality. You may disable cookies in your browser settings; however, some
              features of the booking system may not function correctly without them.
            </p>
          </section>

          <section aria-labelledby="pp-contact">
            <h2 id="pp-contact" className="text-xl font-semibold text-foreground mt-8 mb-3">8. Contact &amp; Complaints</h2>
            <p className="text-muted-foreground">
              Privacy enquiries or complaints should be directed to our Privacy Officer at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>.
              If you are not satisfied with our response you may contact the OAIC at{" "}
              <a href="https://www.oaic.gov.au" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                oaic.gov.au
              </a>.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
