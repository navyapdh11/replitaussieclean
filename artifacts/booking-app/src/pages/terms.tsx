import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const EFFECTIVE_DATE = "1 January 2025";
const CURRENT_YEAR = new Date().getFullYear();
const CONTACT_EMAIL = "hello@aussieclean.com.au";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen flex flex-col bg-background pt-20">
      <Navbar />
      <main id="main-content" className="flex-1 py-16 px-4 sm:px-6">
        <article className="max-w-3xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-foreground">Terms &amp; Conditions</h1>
            <p className="text-muted-foreground mt-2">
              Effective: {EFFECTIVE_DATE} · © {CURRENT_YEAR} AussieClean Enterprise Services Pty Ltd
            </p>
          </header>

          <div className="space-y-10 text-muted-foreground">
            <section aria-labelledby="tc-agreement">
              <h2 id="tc-agreement" className="text-xl font-semibold text-foreground mb-3">1. Agreement</h2>
              <p>
                By booking or using the services of AussieClean Enterprise Services Pty Ltd ("AussieClean"),
                you agree to these Terms and Conditions. These terms apply to all bookings made online,
                by phone, or through any other channel.
              </p>
            </section>

            <section aria-labelledby="tc-services">
              <h2 id="tc-services" className="text-xl font-semibold text-foreground mb-3">2. Services</h2>
              <p>
                AussieClean provides residential and commercial cleaning services across Australia.
                Service inclusions are described on the relevant service page and in your booking
                confirmation. Services excluded from the standard scope (e.g. carpet steam cleaning,
                pest control, biohazard remediation) must be booked as separate add-ons or quote requests.
              </p>
            </section>

            <section aria-labelledby="tc-bookings">
              <h2 id="tc-bookings" className="text-xl font-semibold text-foreground mb-3">3. Bookings &amp; Confirmation</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All bookings are subject to staff availability and service area coverage.</li>
                <li>A booking is confirmed only after you receive a written confirmation email.</li>
                <li>We reserve the right to decline bookings at our discretion.</li>
                <li>Quotes are valid for 15 minutes from the time of generation due to dynamic pricing.</li>
              </ul>
            </section>

            <section aria-labelledby="tc-payment">
              <h2 id="tc-payment" className="text-xl font-semibold text-foreground mb-3">4. Pricing &amp; Payment</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All prices are quoted in Australian Dollars (AUD) and include GST unless stated otherwise.</li>
                <li>Payment is due at the time of booking unless otherwise agreed in writing (e.g. commercial contracts).</li>
                <li>Payments are processed securely via Stripe. We do not store card details.</li>
                <li>Commercial contract customers may be invoiced with 14-day payment terms.</li>
              </ul>
            </section>

            <section aria-labelledby="tc-cancellation">
              <h2 id="tc-cancellation" className="text-xl font-semibold text-foreground mb-3">5. Cancellation &amp; Rescheduling</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cancellations made more than 48 hours before the scheduled service: full refund.</li>
                <li>Cancellations made 24–48 hours before service: 50% cancellation fee applies.</li>
                <li>Cancellations made less than 24 hours before service: no refund.</li>
                <li>
                  You may reschedule at no charge if at least 48 hours notice is provided.
                  Rescheduling with less notice may incur a $30 admin fee.
                </li>
              </ul>
            </section>

            <section aria-labelledby="tc-access">
              <h2 id="tc-access" className="text-xl font-semibold text-foreground mb-3">6. Access &amp; Your Obligations</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must ensure our staff can access the property at the agreed time.</li>
                <li>Power and water must be available at the property.</li>
                <li>Pets must be secured during the service.</li>
                <li>If access is denied on arrival, a call-out fee of $75 applies.</li>
                <li>You are responsible for disclosing any known hazards relevant to the service.</li>
              </ul>
            </section>

            <section aria-labelledby="tc-liability">
              <h2 id="tc-liability" className="text-xl font-semibold text-foreground mb-3">7. Liability</h2>
              <p>
                AussieClean holds public liability insurance. We will rectify any damage caused by
                our staff at no additional cost, provided the claim is made within 24 hours of service
                completion with photographic evidence. Our liability is limited to the cost of the
                service provided. We are not liable for pre-existing damage, wear and tear, or damage
                arising from your failure to disclose relevant conditions.
              </p>
            </section>

            <section aria-labelledby="tc-guarantee">
              <h2 id="tc-guarantee" className="text-xl font-semibold text-foreground mb-3">8. Satisfaction Guarantee</h2>
              <p>
                If you are not satisfied with the quality of the service, contact us within 24 hours
                and we will arrange a complimentary re-clean of the affected areas. This guarantee
                does not apply where the outcome was limited by property conditions disclosed or
                apparent at the time of service.
              </p>
            </section>

            <section aria-labelledby="tc-disputes">
              <h2 id="tc-disputes" className="text-xl font-semibold text-foreground mb-3">9. Disputes &amp; Governing Law</h2>
              <p>
                These terms are governed by the laws of New South Wales, Australia. Disputes should
                first be raised with our customer service team at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>.
                If unresolved, disputes may be escalated to the NSW Civil and Administrative Tribunal (NCAT).
              </p>
            </section>

            <section aria-labelledby="tc-changes">
              <h2 id="tc-changes" className="text-xl font-semibold text-foreground mb-3">10. Changes to These Terms</h2>
              <p>
                We may update these terms at any time. Continued use of our services after changes
                are published constitutes acceptance of the revised terms. Major changes will be
                communicated by email to registered customers.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
