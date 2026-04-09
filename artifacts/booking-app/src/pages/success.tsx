import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { CheckCircle, Gift, Share2, Copy, Check, MessageCircle, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const BASE_APP_URL = typeof window !== "undefined"
  ? window.location.origin + (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "")
  : "";

function generateReferralCode(seed: string): string {
  const prefix = seed.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 5);
  const hash = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);
  const suffix = (hash % 9000 + 1000).toString();
  return `${prefix}${suffix}`;
}

export default function Success() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const bookingId = params.get("booking_id") ?? params.get("session_id") ?? "";

  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    const seed = bookingId || Date.now().toString();
    setReferralCode(generateReferralCode(seed));
  }, [bookingId]);

  const referralLink = `${BASE_APP_URL}/booking?ref=${referralCode}`;

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers where clipboard API is unavailable (non-secure context)
      try {
        const el = Object.assign(document.createElement("textarea"), {
          value: text,
          style: "position:fixed;top:-9999px;opacity:0",
          readOnly: true,
          "aria-hidden": true,
        });
        document.body.appendChild(el);
        el.focus();
        el.select();
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        el.setSelectionRange(0, text.length);
        document.body.removeChild(el);
      } catch {
        /* silent — clipboard unavailable */
      }
    }
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const whatsappMsg = encodeURIComponent(
    `Hey! Just booked an AussieClean — it's amazing 🙌 Use my code ${referralCode} and we both get $20 credit on our next clean! Book here: ${referralLink}`
  );
  const emailSubject = encodeURIComponent("Get $20 off your first AussieClean booking!");
  const emailBody = encodeURIComponent(
    `Hey!\n\nI just booked an AussieClean and thought you'd love it too.\n\nUse my code ${referralCode} on your first booking and you'll get $20 credit — and so will I 🎉\n\nBook here: ${referralLink}\n\nEnjoy!`
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border p-8 md:p-12 rounded-3xl max-w-lg w-full text-center shadow-2xl space-y-6"
      >
        {/* Confirmation icon with pulse ring */}
        <div className="relative w-24 h-24 mx-auto flex-shrink-0">
          <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" aria-hidden="true" style={{ animationDuration: "2s" }} />
          <span className="absolute inset-2 rounded-full bg-green-500/10" aria-hidden="true" />
          <div className="relative w-full h-full bg-green-500/15 rounded-full flex items-center justify-center border border-green-500/25">
            <CheckCircle className="w-12 h-12 text-green-400" aria-hidden="true" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-3">Booking Confirmed!</h1>
          <p className="text-muted-foreground text-base">
            Thank you for choosing AussieClean. Your payment is confirmed and our team will be in touch shortly.
          </p>
        </div>

        {bookingId && (
          <p className="text-xs text-muted-foreground font-mono bg-secondary/50 px-3 py-2 rounded-lg">
            Ref: {bookingId}
          </p>
        )}

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full"
        >
          View My Bookings <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      {/* Referral flywheel */}
      {referralCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-primary/20 rounded-3xl p-8 md:p-10 max-w-lg w-full shadow-lg space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 flex-shrink-0">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-foreground">Give a friend $20, get $20 yourself</h2>
              <p className="text-sm text-muted-foreground">Share your code — when they complete their first clean, you both earn credit.</p>
            </div>
          </div>

          {/* Referral code display */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Your Referral Code</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 py-4 px-6 rounded-xl bg-primary/5 border-2 border-primary/20 text-center">
                <span className="text-2xl font-extrabold tracking-widest text-primary">{referralCode}</span>
              </div>
              <button
                onClick={() => copyToClipboard(referralCode, "code")}
                aria-label={copied === "code" ? "Copied!" : "Copy referral code"}
                aria-live="polite"
                className="p-3.5 rounded-xl border border-border hover:bg-secondary transition-colors flex-shrink-0"
              >
                {copied === "code"
                  ? <Check className="w-5 h-5 text-green-400" />
                  : <Copy className="w-5 h-5 text-muted-foreground" />
                }
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a
              href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-border hover:bg-secondary transition-colors"
            >
              <Mail className="w-4 h-4" /> Email
            </a>
            <button
              onClick={() => copyToClipboard(referralLink, "link")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-border hover:bg-secondary transition-colors"
            >
              {copied === "link"
                ? <><Check className="w-4 h-4 text-green-400" /> Copied!</>
                : <><Share2 className="w-4 h-4" /> Copy Link</>
              }
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Credits apply after your friend completes their first paid booking.{" "}
            <Link href="/referral" className="text-primary hover:underline">
              Learn more about the referral program →
            </Link>
          </p>
        </motion.div>
      )}
    </div>
  );
}
