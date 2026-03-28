import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const CONTACT_EMAIL = "accessibility@aussieclean.com.au";
const CURRENT_YEAR = new Date().getFullYear();

export default function AccessibilityStatement() {
  return (
    <div className="min-h-screen flex flex-col bg-background pt-20">
      <Navbar />
      <main id="main-content" className="flex-1 py-16 px-4 sm:px-6">
        <article className="max-w-3xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-foreground">Accessibility Statement</h1>
            <p className="text-muted-foreground mt-2">
              Last reviewed: {CURRENT_YEAR} · AussieClean Enterprise Services Pty Ltd
            </p>
          </header>

          <div className="space-y-10 text-muted-foreground">
            <section aria-labelledby="acc-commitment">
              <h2 id="acc-commitment" className="text-xl font-semibold text-foreground mb-3">Our Commitment</h2>
              <p>
                AussieClean is committed to ensuring our website and booking platform are accessible
                to all Australians, including people with disability, in accordance with the{" "}
                <em>Disability Discrimination Act 1992</em> (Cth) (DDA) and the W3C Web Content
                Accessibility Guidelines (WCAG) 2.1 at Level AA.
              </p>
            </section>

            <section aria-labelledby="acc-conformance">
              <h2 id="acc-conformance" className="text-xl font-semibold text-foreground mb-3">Conformance Status</h2>
              <p>
                We are working toward full WCAG 2.1 AA conformance. Our current implementation includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Keyboard-navigable multi-step booking flow with visible focus indicators</li>
                <li>Screen-reader-announced step transitions using programmatic focus management</li>
                <li>Progress bar with semantic <code>role="progressbar"</code> and ARIA value attributes</li>
                <li>All form inputs have associated labels, <code>aria-required</code>, and <code>aria-invalid</code></li>
                <li>Error messages announced via <code>aria-live="assertive"</code> and <code>role="alert"</code></li>
                <li>Skip-to-content link visible on keyboard focus</li>
                <li>Accordion pattern with <code>aria-expanded</code> and full keyboard support</li>
                <li>Toggle buttons use <code>aria-pressed</code> for state communication</li>
                <li>Decorative images marked <code>aria-hidden="true"</code></li>
                <li>Colour contrast ratios that meet WCAG 2.1 AA minimums (4.5:1 text, 3:1 UI)</li>
                <li>Content reflows correctly at 320px viewport width</li>
                <li>No content that flashes more than 3 times per second</li>
              </ul>
            </section>

            <section aria-labelledby="acc-known">
              <h2 id="acc-known" className="text-xl font-semibold text-foreground mb-3">Known Limitations</h2>
              <p>
                We are aware of the following areas under active improvement:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong>Interactive maps</strong> — the live GPS tracking map (Leaflet.js) does not
                  currently provide a fully accessible non-map alternative. A text-based status
                  update is provided as a fallback.
                </li>
                <li>
                  <strong>PDF documents</strong> — any PDF booking confirmations or receipts may not
                  be fully tagged. Contact us for an accessible alternative format.
                </li>
                <li>
                  <strong>Third-party widgets</strong> — our AI chat widget and Stripe payment
                  interface are managed by third-party providers who maintain their own accessibility policies.
                </li>
              </ul>
            </section>

            <section aria-labelledby="acc-feedback">
              <h2 id="acc-feedback" className="text-xl font-semibold text-foreground mb-3">Feedback &amp; Contact</h2>
              <p>
                If you experience any accessibility barriers on our website, or if you need
                information in an alternative format, please contact our Accessibility Officer:
              </p>
              <address className="not-italic mt-3 space-y-1">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>
                </p>
                <p><strong>Phone:</strong> 1300 287 743 (business hours AEST)</p>
              </address>
              <p className="mt-3">
                We aim to respond to accessibility feedback within 5 business days. Where an issue
                cannot be resolved immediately, we will provide an accessible alternative.
              </p>
            </section>

            <section aria-labelledby="acc-formal">
              <h2 id="acc-formal" className="text-xl font-semibold text-foreground mb-3">Formal Complaints</h2>
              <p>
                If you are not satisfied with our response, you may lodge a complaint with the
                Australian Human Rights Commission at{" "}
                <a
                  href="https://humanrights.gov.au"
                  className="text-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  humanrights.gov.au
                </a>
                .
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
