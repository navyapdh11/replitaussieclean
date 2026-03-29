import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Gift, Share2, Copy, Check, Users, DollarSign,
  MessageCircle, Mail, ArrowRight, Star
} from "lucide-react";

const BASE_APP_URL = typeof window !== "undefined"
  ? window.location.origin + (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "")
  : "";

function generateReferralCode(email: string): string {
  const prefix = email.split("@")[0].toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

export default function ReferralPage() {
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [step, setStep] = useState<"input" | "share">("input");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const referralLink = referralCode ? `${BASE_APP_URL}/booking?ref=${referralCode}` : "";

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) return;
    const code = generateReferralCode(email.trim());
    setReferralCode(code);
    setStep("share");
  };

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* fallback for older browsers */
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const whatsappMsg = encodeURIComponent(
    `Hey! I've been using AussieClean for my home cleans and honestly it's a game changer 🙌 Book your first clean with my code ${referralCode} and we both get $20 credit. Book here: ${referralLink}`
  );
  const emailSubject = encodeURIComponent("Get $20 off your first AussieClean booking!");
  const emailBody = encodeURIComponent(
    `Hey!\n\nI've been using AussieClean for eco-safe professional home cleaning and thought you'd love it.\n\nUse my referral code ${referralCode} when you book and you'll get $20 off your first clean — and I get $20 credit too 🎉\n\nBook here: ${referralLink}\n\nEnjoy!`
  );

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
              <Gift className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold text-foreground">Give $20, Get $20</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Share AussieClean with a friend. When they complete their first booking, you both get <strong className="text-foreground">$20 credit</strong> — automatically applied to your next clean.
            </p>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Share2,      step: "1", title: "Share your code",    desc: "Send your unique referral link to friends or family." },
              { icon: Users,       step: "2", title: "They book a clean",  desc: "Your friend uses your code and completes their first booking." },
              { icon: DollarSign,  step: "3", title: "You both get $20",   desc: "$20 credit lands in both accounts automatically." },
            ].map(({ icon: Icon, step: s, title, desc }) => (
              <div key={s} className="bg-card border border-border rounded-2xl p-5 text-center space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mx-auto">{s}</div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Generate / Share card */}
          {step === "input" ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-8 space-y-6"
            >
              <h2 className="text-xl font-bold text-foreground">Get your referral code</h2>
              <p className="text-sm text-muted-foreground">Enter your email to generate a unique code you can share with anyone.</p>
              <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 p-3.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
                >
                  Generate <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <p className="text-xs text-muted-foreground">
                Your email is used only to generate a unique code. Referral credits are applied when your friend's first payment settles.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-8 space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Your code is ready!</h2>
                  <p className="text-sm text-muted-foreground">Share it with friends to start earning credits.</p>
                </div>
              </div>

              {/* Referral code */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Your Referral Code</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-4 rounded-xl bg-primary/5 border-2 border-primary/20 text-center">
                    <span className="text-2xl font-extrabold tracking-widest text-primary">{referralCode}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralCode, "code")}
                    className="p-3.5 rounded-xl border border-border hover:bg-secondary transition-colors"
                    title="Copy code"
                  >
                    {copied === "code" ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {/* Referral link */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Your Referral Link</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 rounded-xl bg-background border border-border text-xs text-muted-foreground font-mono truncate">
                    {referralLink}
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralLink, "link")}
                    className="p-3 rounded-xl border border-border hover:bg-secondary transition-colors flex-shrink-0"
                    title="Copy link"
                  >
                    {copied === "link" ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {/* Share buttons */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">Share via</label>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/?text=${whatsappMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                  <a
                    href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border border-border hover:bg-secondary transition-colors"
                  >
                    <Mail className="w-4 h-4" /> Email
                  </a>
                  <button
                    onClick={() => copyToClipboard(referralLink, "link")}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border border-border hover:bg-secondary transition-colors"
                  >
                    {copied === "link" ? <><Check className="w-4 h-4 text-green-400" /> Copied!</> : <><Share2 className="w-4 h-4" /> Copy Link</>}
                  </button>
                </div>
              </div>

              <button
                onClick={() => { setStep("input"); setEmail(""); setReferralCode(""); }}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Generate a different code
              </button>
            </motion.div>
          )}

          {/* Terms */}
          <div className="bg-secondary/40 border border-border rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> How credits work
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Your friend must be a <strong className="text-foreground">new AussieClean customer</strong> (no prior bookings).</li>
              <li>• $20 credit is applied after their <strong className="text-foreground">first payment settles</strong> — typically within 24 hours.</li>
              <li>• Credits are applied automatically to your next booking — no manual redemption needed.</li>
              <li>• Credits expire <strong className="text-foreground">12 months</strong> from the date they are issued.</li>
              <li>• No limit on how many friends you refer — credits stack!</li>
            </ul>
          </div>

          <div className="text-center">
            <Link href="/booking" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              Ready to book your own clean? <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
