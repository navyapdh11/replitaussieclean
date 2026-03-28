import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const EFFECTIVE_DATE = "1 January 2025";
const CONTACT_EMAIL = "hello@aussieclean.com.au";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background pt-20">
      <Navbar />
      <main id="main-content" className="flex-1 py-16 px-4 sm:px-6">
        <article className="max-w-3xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-foreground">Refund &amp; Cancellation Policy</h1>
            <p className="text-muted-foreground mt-2">Effective: {EFFECTIVE_DATE}</p>
          </header>

          <div className="space-y-10 text-muted-foreground">
            <section aria-labelledby="rp-overview">
              <h2 id="rp-overview" className="text-xl font-semibold text-foreground mb-3">Overview</h2>
              <p>
                AussieClean values your business and wants every service to meet your expectations.
                This policy explains your rights and our obligations under the{" "}
                <em>Australian Consumer Law</em> (ACL), which forms part of the{" "}
                <em>Competition and Consumer Act 2010</em> (Cth).
              </p>
            </section>

            <section aria-labelledby="rp-cancel">
              <h2 id="rp-cancel" className="text-xl font-semibold text-foreground mb-3">Cancellation Policy</h2>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
                  <thead className="bg-card">
                    <tr>
                      <th className="text-left p-3 font-semibold text-foreground border-b border-border">Notice Given</th>
                      <th className="text-left p-3 font-semibold text-foreground border-b border-border">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="p-3">More than 48 hours before service</td>
                      <td className="p-3 text-green-400 font-medium">Full refund</td>
                    </tr>
                    <tr className="border-b border-border/50 bg-card/30">
                      <td className="p-3">24–48 hours before service</td>
                      <td className="p-3 text-yellow-400 font-medium">50% cancellation fee</td>
                    </tr>
                    <tr>
                      <td className="p-3">Less than 24 hours before service</td>
                      <td className="p-3 text-destructive font-medium">No refund</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                To cancel, email us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>{" "}
                or call 1300 287 743. Cancellations must be submitted in writing to be valid.
              </p>
            </section>

            <section aria-labelledby="rp-reschedule">
              <h2 id="rp-reschedule" className="text-xl font-semibold text-foreground mb-3">Rescheduling</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Rescheduling with 48+ hours notice: no charge.</li>
                <li>Rescheduling with less than 48 hours notice: $30 administration fee.</li>
                <li>You may reschedule a maximum of two times per booking.</li>
                <li>Rescheduling is subject to staff availability in your area.</li>
              </ul>
            </section>

            <section aria-labelledby="rp-quality">
              <h2 id="rp-quality" className="text-xl font-semibold text-foreground mb-3">Quality Guarantee &amp; Re-cleans</h2>
              <p>
                If you are not satisfied with the quality of a completed service, contact us within
                24 hours with details and, where possible, photographs. We will arrange a
                complimentary re-clean of the affected areas at no charge. Re-clean requests
                submitted after 24 hours may not be eligible under this guarantee.
              </p>
              <p className="mt-3">
                This guarantee does not apply where the service outcome was limited by pre-existing
                conditions disclosed or apparent at the time of service, or where access was
                restricted during the clean.
              </p>
            </section>

            <section aria-labelledby="rp-damage">
              <h2 id="rp-damage" className="text-xl font-semibold text-foreground mb-3">Damage Claims</h2>
              <p>
                Damage claims must be submitted within 24 hours of service completion, with
                photographic evidence. We will investigate and respond within 5 business days.
                Where we accept liability, we will repair or compensate for the damage up to the
                value of the service provided. We hold public liability insurance for additional
                coverage.
              </p>
            </section>

            <section aria-labelledby="rp-acl">
              <h2 id="rp-acl" className="text-xl font-semibold text-foreground mb-3">Australian Consumer Law</h2>
              <p>
                Nothing in this policy limits your rights under the Australian Consumer Law.
                If a service has a major failure, you are entitled to a refund. If it has a
                minor failure, we are entitled to choose between a re-perform or a refund. For
                more information see the{" "}
                <a
                  href="https://www.accc.gov.au"
                  className="text-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ACCC website
                </a>.
              </p>
            </section>

            <section aria-labelledby="rp-contact">
              <h2 id="rp-contact" className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
              <address className="not-italic space-y-1">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>
                </p>
                <p><strong>Phone:</strong> 1300 287 743 (Mon–Fri, 8am–6pm AEST)</p>
              </address>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
