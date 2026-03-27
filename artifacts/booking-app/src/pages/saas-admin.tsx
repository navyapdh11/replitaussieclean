import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Building2, Plus, Globe, ToggleRight, ToggleLeft, TrendingUp, Users, BookOpen, X, Check } from "lucide-react";
import { BASE_URL } from "@/components/admin/shared";
import { cn } from "@/lib/utils";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  primaryColor: string;
  plan: string;
  active: boolean;
  bookingCount: number;
  staffCount: number;
  monthlyPrice: number;
  createdAt: string;
}

interface TenantStats {
  tenants: Tenant[];
  totalMrr: number;
  totalActive: number;
}

const PLAN_COLOR: Record<string, string> = {
  starter:    "bg-slate-700 text-slate-300",
  pro:        "bg-cyan-500/20 text-cyan-400",
  enterprise: "bg-purple-500/20 text-purple-400",
};

export default function SaasAdminPage() {
  const [data, setData] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", slug: "", domain: "", abn: "", phone: "", email: "",
    plan: "starter" as "starter" | "pro" | "enterprise",
    primaryColor: "#22d3ee",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/tenants`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, domain: form.domain || undefined }),
      });
      if (res.ok) { setShowForm(false); setForm({ name: "", slug: "", domain: "", abn: "", phone: "", email: "", plan: "starter", primaryColor: "#22d3ee" }); load(); }
      else {
        const err = await res.json();
        alert(err.error ?? "Failed to create tenant");
      }
    } finally { setSaving(false); }
  };

  const toggleActive = async (id: string) => {
    await fetch(`${BASE_URL}/api/tenants/${id}/suspend`, { method: "PATCH" });
    load();
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-foreground">SaaS Platform Admin</h1>
            </div>
            <p className="text-muted-foreground">Manage all tenant companies and subscriptions.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> New Tenant
          </button>
        </div>

        {/* Metrics */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                label: "Active Tenants",
                value: data.totalActive,
                sub: `${data.tenants.length} total`,
                icon: Building2,
                gradient: "from-cyan-500/10 to-blue-500/10 border-cyan-500/30",
                color: "text-cyan-400",
              },
              {
                label: "Total Bookings",
                value: data.tenants.reduce((s, t) => s + t.bookingCount, 0),
                sub: "across all tenants",
                icon: BookOpen,
                gradient: "from-emerald-500/10 to-green-500/10 border-emerald-500/30",
                color: "text-emerald-400",
              },
              {
                label: "Monthly Recurring Revenue",
                value: `$${data.totalMrr.toLocaleString()}`,
                sub: "AUD / month",
                icon: TrendingUp,
                gradient: "from-purple-500/10 to-pink-500/10 border-purple-500/30",
                color: "text-purple-400",
              },
            ].map(({ label, value, sub, icon: Icon, gradient, color }) => (
              <div key={label} className={cn("bg-gradient-to-br border rounded-2xl p-6", gradient)}>
                <div className={cn("flex items-center gap-2 mb-1", color)}>
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                </div>
                <p className={cn("text-3xl font-extrabold", color)}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pricing tiers callout */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { plan: "Starter", price: "$99/mo", features: ["Up to 100 bookings/mo", "Basic scheduling", "1 staff account", "Standard support"] },
            { plan: "Pro",     price: "$199/mo", features: ["Up to 500 bookings/mo", "ML forecasting", "Unlimited staff", "Priority support"], highlight: true },
            { plan: "Enterprise", price: "$499/mo", features: ["Unlimited bookings", "Custom domain", "Full white-label", "API access", "Dedicated support"] },
          ].map(({ plan, price, features, highlight }) => (
            <div key={plan} className={cn(
              "border rounded-2xl p-5 space-y-3",
              highlight ? "border-primary bg-primary/5" : "border-border bg-card",
            )}>
              <div>
                <p className="font-bold text-lg">{plan}</p>
                <p className={cn("text-2xl font-extrabold", highlight ? "text-primary" : "text-foreground")}>{price}</p>
              </div>
              <ul className="space-y-1.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tenants table */}
        <div>
          <h2 className="text-lg font-bold mb-4">Tenants</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />)}
            </div>
          ) : !data || data.tenants.length === 0 ? (
            <div className="text-center py-16 border border-border rounded-2xl text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No tenants yet</p>
              <p className="text-sm mt-1">Create your first tenant to start the white-label platform.</p>
            </div>
          ) : (
            <div className="border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">Company</th>
                    <th className="text-left px-5 py-3 font-semibold">Plan</th>
                    <th className="text-right px-5 py-3 font-semibold">Bookings</th>
                    <th className="text-right px-5 py-3 font-semibold">Staff</th>
                    <th className="text-right px-5 py-3 font-semibold">MRR</th>
                    <th className="text-right px-5 py-3 font-semibold">Status</th>
                    <th className="text-right px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.tenants.map((t) => (
                    <tr key={t.id} className={cn("hover:bg-muted/10 transition-colors", !t.active && "opacity-60")}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: t.primaryColor }}>
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{t.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {t.domain ?? `${t.slug}.aussieclean.com`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", PLAN_COLOR[t.plan] ?? PLAN_COLOR.starter)}>
                          {t.plan}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono">{t.bookingCount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-right font-mono">{t.staffCount}</td>
                      <td className="px-5 py-4 text-right font-semibold text-emerald-400">${t.monthlyPrice}/mo</td>
                      <td className="px-5 py-4 text-right">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-semibold",
                          t.active ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-700 text-slate-400",
                        )}>
                          {t.active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => toggleActive(t.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title={t.active ? "Suspend tenant" : "Reactivate tenant"}
                        >
                          {t.active
                            ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                            : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Create tenant modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Create New Tenant</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Company Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || autoSlug(e.target.value) }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Acme Cleaning Co" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Slug (subdomain) *</label>
                <div className="flex items-center gap-1">
                  <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: autoSlug(e.target.value) }))}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" placeholder="acme" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">.aussieclean.com</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Custom Domain (optional)</label>
                <input value={form.domain} onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="clean.acme.com.au" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Plan</label>
                  <select value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as any }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="starter">Starter ($99/mo)</option>
                    <option value="pro">Pro ($199/mo)</option>
                    <option value="enterprise">Enterprise ($499/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Brand Colour</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.primaryColor} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                      className="w-10 h-9 rounded border border-border bg-background cursor-pointer" />
                    <input value={form.primaryColor} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">ABN</label>
                <input value={form.abn} onChange={(e) => setForm((f) => ({ ...f, abn: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="98 765 432 109" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="1300 XXX XXX" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="hello@acme.com.au" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving || !form.name || !form.slug}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
                {saving ? "Creating…" : "Create Tenant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
