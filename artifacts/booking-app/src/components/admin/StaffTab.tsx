import { useState, useEffect } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, Star, MapPin, Wrench, X, Check } from "lucide-react";
import { BASE_URL } from "./shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  skills: string[];
  maxJobsPerDay: number;
  baseSuburb: string;
  baseState: string;
  vehicleType: string;
  rating: number;
  active: boolean;
  notes?: string;
}

const SKILLS_OPTIONS = [
  { value: "end_of_lease", label: "End of Lease" },
  { value: "carpet_clean", label: "Carpet Clean" },
  { value: "office",       label: "Office" },
  { value: "deep_clean",   label: "Deep Clean" },
  { value: "window_clean", label: "Window Clean" },
];
const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const TENANT_ID = "aussieclean-default";

export function StaffTab() {
  const { toast } = useToast();
  const [staff, setStaff]       = useState<Staff[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Staff | null>(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState<Partial<Staff>>({
    role: "cleaner", vehicleType: "car", maxJobsPerDay: 3,
    rating: 5, active: true, skills: [], baseState: "NSW",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/staff?tenantId=${TENANT_ID}`);
      if (res.ok) {
        setStaff(await res.json());
      } else {
        toast({ title: "Failed to load staff", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error loading staff", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ role: "cleaner", vehicleType: "car", maxJobsPerDay: 3, rating: 5, active: true, skills: [], baseState: "NSW" });
    setShowForm(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ ...s });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name?.trim() || !form.email?.trim() || !form.phone?.trim() || !form.baseSuburb?.trim()) {
      toast({ title: "Missing required fields", description: "Name, email, phone, and suburb are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url    = editing ? `${BASE_URL}/api/staff/${editing.id}` : `${BASE_URL}/api/staff`;
      const method = editing ? "PATCH" : "POST";
      const body   = editing ? form : { ...form, tenantId: TENANT_ID };
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowForm(false);
        load();
        toast({
          title: editing ? "Staff updated" : "Staff member added",
          description: `${form.name} has been ${editing ? "updated" : "added"} successfully.`,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({
          title: editing ? "Update failed" : "Add staff failed",
          description: (err as { error?: string }).error ?? "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Network error", description: "Could not reach the server.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, name: string, currentlyActive: boolean) => {
    try {
      const res = await fetch(`${BASE_URL}/api/staff/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        load();
        toast({ title: `${name} ${currentlyActive ? "deactivated" : "reactivated"}` });
      } else {
        toast({ title: "Toggle failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
  };

  const toggleSkill = (skill: string) => {
    const current = (form.skills ?? []) as string[];
    setForm((f) => ({
      ...f,
      skills: current.includes(skill)
        ? current.filter((s) => s !== skill)
        : [...current, skill],
    }));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Staff Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {staff.filter((s) => s.active).length} active · {staff.length} total
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-border rounded-2xl">
          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No staff members yet</p>
          <p className="text-sm mt-1">Add your first cleaner to get started with scheduling.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((s) => (
            <div key={s.id} className={cn(
              "border rounded-2xl p-5 space-y-3 transition-opacity",
              s.active ? "border-border bg-card" : "border-border/40 bg-card/50 opacity-60",
            )}>
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2",
                  s.role === "supervisor" ? "bg-purple-500/20 text-purple-400" :
                  s.role === "admin"      ? "bg-blue-500/20 text-blue-400" :
                  "bg-cyan-500/20 text-cyan-400",
                )}>
                  {s.role}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {s.baseSuburb}, {s.baseState}
                </span>
                <span className="flex items-center gap-1 ml-auto">
                  <Star className="w-3.5 h-3.5 text-yellow-400" />
                  {s.rating?.toFixed(1)}
                </span>
              </div>

              {(s.skills ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(s.skills as string[]).map((sk) => (
                    <span key={sk} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                      {sk.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => openEdit(s)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => toggleActive(s.id, s.name, s.active)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  {s.active
                    ? <ToggleRight className="w-4 h-4 text-green-400" />
                    : <ToggleLeft className="w-4 h-4" />}
                  {s.active ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{editing ? "Edit Staff Member" : "Add Staff Member"}</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Full Name *</label>
                <input
                  value={form.name ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Phone *</label>
                <input
                  value={form.phone ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="04XX XXX XXX"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Role</label>
                <select
                  value={form.role ?? "cleaner"}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="cleaner">Cleaner</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Vehicle</label>
                <select
                  value={form.vehicleType ?? "car"}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="bike">Bike</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Base Suburb *</label>
                <input
                  value={form.baseSuburb ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, baseSuburb: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Surry Hills"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">State</label>
                <select
                  value={form.baseState ?? "NSW"}
                  onChange={(e) => setForm((f) => ({ ...f, baseState: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Max Jobs / Day</label>
                <input
                  type="number" min="1" max="10"
                  value={form.maxJobsPerDay ?? 3}
                  onChange={(e) => setForm((f) => ({ ...f, maxJobsPerDay: +e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Rating (1–5)</label>
                <input
                  type="number" min="1" max="5" step="0.1"
                  value={form.rating ?? 5}
                  onChange={(e) => setForm((f) => ({ ...f, rating: +e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-2">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS_OPTIONS.map(({ value: sk, label }) => {
                    const has = ((form.skills ?? []) as string[]).includes(sk);
                    return (
                      <button
                        key={sk} type="button" onClick={() => toggleSkill(sk)}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                          has
                            ? "bg-primary/20 border-primary text-primary"
                            : "border-border text-muted-foreground hover:border-foreground/40",
                        )}
                      >
                        {has && <Check className="w-3 h-3 inline mr-1" />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Notes</label>
                <textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.name || !form.email || !form.phone || !form.baseSuburb}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {saving ? "Saving…" : editing ? "Update" : "Add Staff"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
