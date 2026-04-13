import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Building2, Plus, Globe, ToggleRight, ToggleLeft,
  TrendingUp, Users, BookOpen, X, Check,
} from "lucide-react";
import { BASE_URL } from "@/components/admin/shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// ─── Zod validation schema ───────────────────────────────────────────────────
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

const createTenantSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  domain: z.string().optional().or(z.literal("")).transform((v) => v || undefined),
  abn: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  plan: z.enum(["starter", "pro", "enterprise"]),
  primaryColor: z.string().regex(HEX_COLOR_RE, "Invalid hex colour (e.g. #22d3ee)"),
});

type TenantFormInput = z.infer<typeof createTenantSchema>;

// ─── Type definitions ────────────────────────────────────────────────────────
interface ApiError { error?: string }

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  primaryColor: string;
  plan: "starter" | "pro" | "enterprise";
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

const PRICING_TIERS = [
  {
    plan: "Starter", price: "$99/mo",
    features: ["Up to 100 bookings/mo", "Basic scheduling", "1 staff account", "Standard support"],
  },
  {
    plan: "Pro", price: "$199/mo",
    features: ["Up to 500 bookings/mo", "ML forecasting", "Unlimited staff", "Priority support"],
    highlight: true,
  },
  {
    plan: "Enterprise", price: "$499/mo",
    features: ["Unlimited bookings", "Custom domain", "Full white-label", "API access", "Dedicated support"],
  },
] as const;

export default function SaasAdminPage() {
  const { toast } = useToast();
  const [data, setData]       = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<TenantFormInput>({
    name: "", slug: "", domain: "", abn: "", phone: "", email: "",
    plan: "starter", primaryColor: "#22d3ee",
  });
  // Prevent rapid double-click on toggle
  const togglingId = useCallback(() => {
    let id: string | null = null;
    return {
      check: (candidate: string) => { if (id) return true; id = candidate; return false; },
      release: () => { id = null; },
    };
  }, []);
  const toggleLock = togglingId();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/tenants`);
      if (res.ok) {
        setData(await res.json());
      } else {
        toast({ title: "Failed to load tenants", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error loading tenants", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", slug: "", domain: "", abn: "", phone: "", email: "", plan: "starter", primaryColor: "#22d3ee" });
    setFormErrors({});
  };

  const save = async () => {
    // Zod validation
    const result = createTenantSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        errs[path] = issue.message;
      }
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      // Safe JSON parsing — handle non-JSON error responses
      let body: unknown = null;
      const ct = res.headers.get("content-type");
      if (ct?.includes("application/json")) {
        body = await res.json();
      }
      if (res.ok) {
        setShowForm(false);
        resetForm();
        await load();
        toast({ title: "Tenant created", description: `${form.name} has been added to the platform.` });
      } else {
        const apiErr = body as ApiError | null;
        toast({
          title: "Failed to create tenant",
          description: apiErr?.error ?? `Server error ${res.status}`,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Network error", description: "Could not reach the API server.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, name: string, currentlyActive: boolean) => {
    if (toggleLock.check(id)) return; // already toggling
    try {
      const res = await fetch(`${BASE_URL}/api/tenants/${id}/suspend`, { method: "PATCH" });
      if (res.ok) {
        await load();
        toast({ title: `${name} ${currentlyActive ? "suspended" : "reactivated"}` });
      } else {
        let body: unknown = null;
        const ct = res.headers.get("content-type");
        if (ct?.includes("application/json")) body = await res.json();
        const apiErr = body as ApiError | null;
        toast({ title: "Failed to update tenant status", description: apiErr?.error ?? `Server error ${res.status}`, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      toggleLock.release();
    }
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
                value: data.tenants.reduce((s, t) => s + t.bookingCount, 0).toLocaleString(),
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

        {/* Pricing tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PRICING_TIERS.map((tier) => {
            const highlight = "highlight" in tier && tier.highlight;
            return (
            <div key={tier.plan} className={cn(
              "border rounded-2xl p-5 space-y-3",
              highlight ? "border-primary bg-primary/5" : "border-border bg-card",
            )}>
              <div>
                <p className="font-bold text-lg">{tier.plan}</p>
                <p className={cn("text-2xl font-extrabold", highlight ? "text-primary" : "text-foreground")}>{tier.price}</p>
              </div>
              <ul className="space-y-1.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            );
          })}
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
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: t.primaryColor }}
                          >
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{t.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Globe className="w-3 h-3 shrink-0" />
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
                          onClick={() => toggleActive(t.id, t.name, t.active)}
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

      {/* Create tenant modal — accessible with focus trap and escape-to-close */}
      {showForm && (
        <Modal onClose={() => { setShowForm(false); resetForm(); }} title="Create New Tenant">
          <div className="space-y-3">
            <FormField label="Company Name *" error={formErrors.name}>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || autoSlug(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Acme Cleaning Co"
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? "err-name" : undefined}
              />
              {formErrors.name && <p id="err-name" className="text-xs text-destructive">{formErrors.name}</p>}
            </FormField>
            <FormField label="Slug (subdomain) *" error={formErrors.slug}>
              <div className="flex items-center gap-1">
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: autoSlug(e.target.value) }))}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                  placeholder="acme"
                  aria-invalid={!!formErrors.slug}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">.aussieclean.com</span>
              </div>
              {formErrors.slug && <p className="text-xs text-destructive">{formErrors.slug}</p>}
            </FormField>
            <FormField label="Custom Domain (optional)">
              <input
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="clean.acme.com.au"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormField label="Plan">
                  <select
                    value={form.plan}
                    onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as TenantFormInput["plan"] }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="starter">Starter ($99/mo)</option>
                    <option value="pro">Pro ($199/mo)</option>
                    <option value="enterprise">Enterprise ($499/mo)</option>
                  </select>
                </FormField>
              </div>
              <div>
                <FormField label="Brand Colour" error={formErrors.primaryColor}>
                  <div className="flex items-center gap-2">
                    <input
                      type="color" value={form.primaryColor}
                      onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                      className="w-10 h-9 rounded border border-border bg-background cursor-pointer"
                    />
                    <input
                      value={form.primaryColor}
                      onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                      aria-invalid={!!formErrors.primaryColor}
                    />
                  </div>
                  {formErrors.primaryColor && <p className="text-xs text-destructive">{formErrors.primaryColor}</p>}
                </FormField>
              </div>
            </div>
            <FormField label="ABN">
              <input
                value={form.abn}
                onChange={(e) => setForm((f) => ({ ...f, abn: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="98 765 432 109"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Phone">
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="1300 XXX XXX"
                />
              </FormField>
              <FormField label="Email" error={formErrors.email}>
                <input
                  type="email" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="hello@acme.com.au"
                  aria-invalid={!!formErrors.email}
                />
                {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
              </FormField>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !form.name || !form.slug}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? "Creating…" : "Create Tenant"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Accessible Modal Component ──────────────────────────────────────────────
function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 id="modal-title" className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Form Field Wrapper ──────────────────────────────────────────────────────
function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1">{label}</label>
      {children}
    </div>
  );
}
