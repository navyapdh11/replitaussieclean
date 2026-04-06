import { useState } from "react";
import {
  Bell,
  Settings,
  Star,
  Navigation,
  Layers,
  MoreHorizontal,
  Phone,
  Map,
  MessageCircle,
  ClipboardList,
  CheckCircle2,
  Circle,
  Clock,
  Leaf,
  TrendingUp,
  Download,
  Calendar,
  User,
  Award,
  ScanLine,
  History,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "jobs" | "tasks" | "messages" | "history";

const UPCOMING = [
  { time: "3:00 PM", title: "Office Clean", location: "Tech-Hub District 4", team: ["JD", "MK"] },
  { time: "5:00 PM", title: "Move-out Service", location: "Willow Creek Estates", team: ["AS"] },
];

const TASKS = [
  {
    id: "hepa",
    icon: <ClipboardList className="w-5 h-5" />,
    title: "HEPA Vacuuming",
    description: "Master bedroom and living room deep-weave extraction.",
    status: "complete" as const,
    dots: 2,
  },
  {
    id: "sanitize",
    icon: <Leaf className="w-5 h-5" />,
    title: "Bio-Active Sanitization",
    description: "Applying enzyme-based cleaners to kitchen surfaces.",
    status: "active" as const,
    dots: 2,
  },
  {
    id: "glass",
    icon: <ScanLine className="w-5 h-5" />,
    title: "Glass Purification",
    description: "Vinegar-based streak-free polish for balcony doors.",
    status: "pending" as const,
    dots: 2,
  },
];

const SERVICE_HISTORY = [
  {
    date: "Oct 12, 2023",
    type: "End of Lease",
    typeBadgeClass: "bg-blue-500/10 text-blue-400",
    cleaner: "Elena Rodriguez",
    cleanerImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKM5xWMhyCU1vFPD9WSXv9Fu1eGhy3t7cHWZvD4ic1Tu2XkRgYzQqFP5AYGdvhFKKGMcVEDCHSfJ3cmGECsKMhXIwxKRQbLjKKLn4TBQYytRNQgxem2wmTVyDXYmRgJhD48pIQoZLA_godA-SVdFVqYAIpmM5OMBe-M5UE2zMaBoNaUjnzGajTrzctePIyxoOrfGHWPZoTp_t_GPDTktcX_9MOJkztlN-zL4CEstcg9ODfuKBmSMZeHAdxm4fueQlPqhc5vbUqDaI",
    amount: "$420.00",
  },
  {
    date: "Sep 28, 2023",
    type: "Deep Clean",
    typeBadgeClass: "bg-primary/10 text-primary",
    cleaner: "Marcus Chen",
    cleanerImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDXfevCo1OVBg1rgnoGA0awbNsd_55PUIhZunUEHWMsjyyA8iQ4T7Nhsar7-D2ayzFsQxbveSRUotDI6eDBUQbKkGW2zx-lhy_QhFwOI_gMHpOLYUGaYm_QMUWlOCcjJhXV8UBXLhds6JcZNtnV7C7zqDX4G1lbQE5HFz1RUMubsvX1Wrto2dEh1EBlSGRfndHCJxtoMXFA8zq2pjmUHO5sayas7KWd6ujDNt519L-vgeDeCKdw6UoWo0Mqkd183gcXC3o69FpVj8",
    amount: "$280.00",
  },
  {
    date: "Sep 14, 2023",
    type: "Standard Clean",
    typeBadgeClass: "bg-primary/10 text-primary",
    cleaner: "Sarah M.",
    cleanerImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsehUI6KhnlE79gfQfgVv_lbPvhK-uFv2ZMNYuF36fZoJuYT36-OGpLSuMzng7-QSTS1B_ywN9IVhvMuXYk7N_s0ZH6hMNRt-vr9YMZCxyZxXlKJg4O1xZGmpqHljbwZrDzpqp9r2O8AZNiVbMfIqzJNJf54ws5Jt7hFk87iAM8uSoHM6PshNYciXEYzggQJvsDq7D9cz49u6PQ6pyHgO0Mm_rTBMsGQMa5qqg-3yegzCXscyfY7sPEe9xcF-p98qQvSKmuyVr4qo",
    amount: "$195.00",
  },
];

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("jobs");
  const [historyFilter, setHistoryFilter] = useState<"residential" | "commercial">("residential");

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "jobs", label: "Jobs", icon: <Briefcase className="w-5 h-5" /> },
    { id: "tasks", label: "Tasks", icon: <ClipboardList className="w-5 h-5" /> },
    { id: "messages", label: "Messages", icon: <MessageCircle className="w-5 h-5" /> },
    { id: "history", label: "History", icon: <History className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground font-sans">

      {/* ── Fixed Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/40">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4w_7g2ftExdVORJ_wUwv2exGAGa5Rdly9K28pSLFw5xD_keHgCikVBk92zmbYqEejcoNQdQ8IVSU-QgIybmQKpHjTlXUb0Upyb884YN3Hp2LZRxU9ujEYRBX1c0rpz_Vc5nHdWFXOwJj2yHXsz5Me3qHTGILT_S-_GhCChuYzYgFIMfjgYXb2JLg3EzPdi5XZgPNhNunVYV1GjBUqxVHe1d8yy_QgX3FjVGTVH7N_0ZWay23bY0ybOj5Q2U3W57WwRCuBFvFENxY"
              alt="Sarah M. — cleaner profile"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight text-foreground">
            Aussie<span className="text-primary">Clean</span> Pro
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="View notifications"
            className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Bell className="w-4.5 h-4.5" />
          </button>
          <button
            aria-label="Open settings"
            className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* ── Main scrollable area ── */}
      {/* pt-16 matches fixed header h-16; pb-24 clears the bottom nav */}
      <main className="pt-16 pb-24 px-4 max-w-lg mx-auto">

        {/* ── Jobs tab ── */}
        {activeTab === "jobs" && (
          <>
            {/* Performance Bento */}
            <section aria-label="Today's performance summary" className="grid grid-cols-3 gap-3 mt-6 mb-6">
              {[
                { label: "Today", value: "$184" },
                {
                  label: "Rating",
                  value: (
                    <span className="flex items-center gap-1">
                      4.9 <Star className="w-3 h-3 fill-primary text-primary" />
                    </span>
                  ),
                },
                { label: "Jobs", value: "3 / 4" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1"
                >
                  <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
                    {label}
                  </span>
                  <span className="font-display font-bold text-lg text-primary">{value}</span>
                </div>
              ))}
            </section>

            {/* Current Job Card */}
            <section aria-label="Current job" className="mb-6">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/20">
                {/* Job image with status badge */}
                <div className="relative h-36 w-full overflow-hidden">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCz1uRp7CITxy4fCu_VjlSb3odxDwgTVILakAWiRLBJeGDDOK8VWjh_SJUt1ctWU_aoQdcEFBv7jKbqvmF7B3r2_Olj5b9pLPhNSy5MXG6T7zsXhzr8sOVmJS2p_g9wUOa0oeRj4Z1Xi2k1St5-FKEquNg0T1i6xtT6FL3m3WE-vSti1VPHpaADguijeUuwDLUnUw-OZ20tCtdji0lvXopD_wK2yMwEgCb0s8FhAkeDNVXCoLQ3Cuh3rhmysu9-qczeUCdVLctI7pY"
                    alt="Elena's Residence interior — current job location"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div
                    className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{
                      background: "rgba(15,23,42,0.7)",
                      WebkitBackdropFilter: "blur(12px)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                    On-site
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="font-display font-bold text-xl text-foreground mb-1">
                        Deep Home Sanitation
                      </h2>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="w-3.5 h-3.5" aria-hidden="true" />
                        Elena's Residence
                      </p>
                    </div>
                    <button
                      aria-label="Open navigation to job site"
                      className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 active:scale-90 transition-transform"
                    >
                      <Navigation className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-5" role="progressbar" aria-valuenow={65} aria-valuemin={0} aria-valuemax={100} aria-label="Task completion progress">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">Task Progress</span>
                      <span className="text-xs font-bold text-primary">65%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-primary to-cyan-400" />
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("tasks")}
                    className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground active:scale-95 transition-all shadow-md shadow-primary/20 hover:shadow-primary/30"
                  >
                    <Layers className="w-4.5 h-4.5" aria-hidden="true" />
                    Open Task Checklist
                  </button>
                </div>
              </div>
            </section>

            {/* Upcoming Schedule */}
            <section aria-label="Upcoming jobs today" className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-display font-bold text-lg text-foreground">Upcoming Today</h3>
                <button className="text-sm font-bold text-primary hover:underline">
                  View All
                </button>
              </div>

              {/* Horizontal scroll — scrollbar-hide applied via CSS utility */}
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
                {UPCOMING.map((job) => (
                  <article
                    key={job.title}
                    className="min-w-[220px] bg-card border border-border p-4 rounded-2xl snap-start flex-shrink-0"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-secondary px-2.5 py-1 rounded-full text-xs font-bold text-foreground">
                        {job.time}
                      </span>
                      <button aria-label={`More options for ${job.title}`} className="text-muted-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-display font-bold text-base mb-0.5">{job.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{job.location}</p>
                    <div className="flex -space-x-2" aria-label="Team members">
                      {job.team.map((initials) => (
                        <div
                          key={initials}
                          className="w-7 h-7 rounded-full border-2 border-card bg-secondary flex items-center justify-center text-[9px] font-bold text-foreground"
                          aria-label={`Team member ${initials}`}
                        >
                          {initials}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Tasks tab ── */}
        {activeTab === "tasks" && (
          <>
            {/* Hero */}
            <section aria-label="Current active job" className="mt-6 mb-6">
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase mb-1 block">
                Active Mission
              </span>
              <h2 className="font-display font-extrabold text-3xl text-foreground mb-1 tracking-tight">
                Elena's Residence
              </h2>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                <Map className="w-3.5 h-3.5" aria-hidden="true" />
                Highland Terrace, Sector 4
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-card border border-border px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  45 MIN REMAINING
                </span>
                <span className="bg-card border border-border px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  ECO-CERTIFIED
                </span>
              </div>
            </section>

            {/* Progress + AR button */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="bg-card border border-border p-5 rounded-2xl">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                      Overall Completion
                    </p>
                    <p className="font-display font-bold text-2xl text-primary">68%</p>
                  </div>
                  <p className="text-xs text-muted-foreground italic">Next: Bio-Active Sanitization</p>
                </div>
                <div
                  className="w-full h-3 bg-secondary rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={68}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Overall job completion"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                    style={{ width: "68%" }}
                  />
                </div>
              </div>

              <button
                className="w-full p-5 rounded-2xl bg-gradient-to-br from-primary to-cyan-400 text-primary-foreground flex items-center justify-between active:scale-[0.98] transition-transform shadow-lg shadow-primary/25"
                aria-label="Open augmented reality guide for this job"
              >
                <div>
                  <p className="font-display font-bold text-xl mb-0.5">Open AR Guide</p>
                  <p className="text-[10px] opacity-80 uppercase tracking-widest">Overlay Smart Points</p>
                </div>
                <ScanLine className="w-10 h-10 opacity-90" aria-hidden="true" />
              </button>
            </div>

            {/* Task Checklist */}
            <section aria-label="Task checklist">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-xl">Task Manifest</h3>
                <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Live
                </span>
              </div>

              <ul role="list" className="space-y-3 mb-6">
                {TASKS.map((task) => (
                  <li
                    key={task.id}
                    role="checkbox"
                    aria-checked={task.status === "complete" ? true : task.status === "active" ? "mixed" : false}
                    aria-label={`${task.title} — ${task.status === "complete" ? "Complete" : task.status === "active" ? "In progress" : "Pending"}`}
                    className={cn(
                      "p-4 rounded-2xl border relative overflow-hidden transition-all",
                      task.status === "complete"
                        ? "bg-card border-border"
                        : task.status === "active"
                        ? "bg-card border-primary/30 shadow-sm"
                        : "bg-card/50 border-border/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-xl mt-0.5",
                          task.status === "complete"
                            ? "bg-primary/20"
                            : task.status === "active"
                            ? "bg-blue-500/10"
                            : "bg-secondary"
                        )}
                      >
                        <span
                          className={cn(
                            task.status === "complete"
                              ? "text-primary"
                              : task.status === "active"
                              ? "text-blue-400"
                              : "text-muted-foreground"
                          )}
                          aria-hidden="true"
                        >
                          {task.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h4
                            className={cn(
                              "font-display font-bold text-sm",
                              task.status === "pending" && "opacity-50"
                            )}
                          >
                            {task.title}
                          </h4>
                          {task.status === "complete" && (
                            <CheckCircle2 className="w-4.5 h-4.5 text-primary flex-shrink-0" aria-hidden="true" />
                          )}
                          {task.status === "active" && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" aria-hidden="true" />
                          )}
                          {task.status === "pending" && (
                            <Circle className="w-4.5 h-4.5 text-muted-foreground/40 flex-shrink-0" aria-hidden="true" />
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-xs text-muted-foreground leading-relaxed",
                            task.status === "pending" && "opacity-50"
                          )}
                        >
                          {task.description}
                        </p>
                      </div>
                    </div>
                    {/* Active task progress stripe at bottom */}
                    {task.status === "active" && (
                      <div className="absolute bottom-0 left-0 h-0.5 w-1/2 bg-gradient-to-r from-primary to-cyan-400" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ul>

              {/* AR Scan card */}
              <div
                className="p-5 rounded-2xl border border-border mb-6"
                style={{
                  background: "rgba(15,23,42,0.7)",
                  WebkitBackdropFilter: "blur(16px)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                    AR Enhanced
                  </span>
                  <span className="text-xs text-blue-400 font-bold">Smart Recognition Active</span>
                </div>
                <h4 className="font-display font-bold text-lg text-foreground mb-2">
                  Texture Analysis Pending
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Point your camera at the sofa upholstery to determine the optimal eco-solvent mixture.
                </p>
                <button className="bg-blue-500 hover:bg-blue-400 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-colors">
                  <ScanLine className="w-3.5 h-3.5" aria-hidden="true" />
                  INITIALISE SCAN
                </button>
              </div>

              {/* XP Growth card */}
              <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
                <Award className="w-10 h-10 text-amber-400 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-display font-bold text-base text-foreground">+12 XP Earned</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                    Level 4 Eco-Specialist
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Messages tab ── */}
        {activeTab === "messages" && (
          <div className="mt-6 flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-3">
            <MessageCircle className="w-12 h-12 opacity-30" />
            <p className="font-display font-bold text-lg">No messages yet</p>
            <p className="text-sm">Your client and team messages will appear here.</p>
          </div>
        )}

        {/* ── History tab ── */}
        {activeTab === "history" && (
          <>
            {/* Header + filter */}
            <div className="mt-6 mb-6 flex flex-col gap-4">
              <div>
                <h2 className="font-display font-extrabold text-3xl text-foreground tracking-tight">
                  Service History
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  A detailed log of your cleaning journey.
                </p>
              </div>
              {/* Toggle filter — now using proper <button> inside a container, NOT nested <button> in <td> */}
              <div className="bg-card border border-border p-1 rounded-full flex items-center self-start shadow-sm" role="group" aria-label="Filter by job type">
                {(["residential", "commercial"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setHistoryFilter(f)}
                    aria-pressed={historyFilter === f}
                    className={cn(
                      "px-5 py-2 rounded-full text-xs font-bold transition-all capitalize",
                      historyFilter === f
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary bento */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* Earnings */}
              <div className="bg-gradient-to-br from-primary to-cyan-400 text-primary-foreground p-5 rounded-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">
                    Total Earnings
                  </span>
                  <p className="font-display font-extrabold text-3xl mt-1">$2,480.00</p>
                </div>
                <div className="flex items-center gap-1.5 mt-3 relative z-10">
                  <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="text-xs font-medium">+12% from last quarter</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Next scheduled */}
                <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-primary opacity-80">
                      Next Scheduled
                    </span>
                    <p className="font-bold text-base text-foreground mt-0.5">Oct 24, 2023</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                    </div>
                    <span className="text-xs text-muted-foreground">Deep Clean • 9:00 AM</span>
                  </div>
                </div>

                {/* Rewards */}
                <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground opacity-80">
                      Rewards Earned
                    </span>
                    <p className="font-bold text-base text-foreground mt-0.5">1,240 pts</p>
                  </div>
                  <div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-[65%] rounded-full" />
                    </div>
                    <p className="text-[9px] mt-1.5 text-muted-foreground uppercase tracking-wider">
                      360 pts to free clean
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service list */}
            <ul role="list" className="space-y-3" aria-label="Service history list">
              {SERVICE_HISTORY.map((entry) => (
                <li
                  key={entry.date}
                  className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-3 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={entry.cleanerImg}
                        alt={`${entry.cleaner} profile`}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{entry.cleaner}</p>
                        <p className="text-xs text-muted-foreground">{entry.date}</p>
                      </div>
                    </div>
                    <span className="font-display font-extrabold text-sm text-foreground flex-shrink-0">
                      {entry.amount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight", entry.typeBadgeClass)}>
                      {entry.type}
                    </span>
                    {/* Fixed: button inside a <li>, not inside <td> — no flex-on-td bug */}
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary text-muted-foreground transition-all text-xs font-bold group-hover:bg-primary/5">
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      Report
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      {/* ── Call FAB (above bottom nav) ── */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          aria-label="Call current client"
          className="w-13 h-13 rounded-2xl bg-background/90 border border-border text-primary flex items-center justify-center shadow-xl shadow-black/30 active:scale-90 transition-all"
          style={{
            WebkitBackdropFilter: "blur(12px)",
            backdropFilter: "blur(12px)",
            width: "3.25rem",
            height: "3.25rem",
          }}
        >
          <Phone className="w-5 h-5" />
        </button>
      </div>

      {/* ── Bottom Nav ── */}
      <nav
        aria-label="Staff dashboard navigation"
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-3 pt-2 pb-6 bg-background/90 border-t border-border rounded-t-2xl"
        style={{
          WebkitBackdropFilter: "blur(20px)",
          backdropFilter: "blur(20px)",
        }}
      >
        {navItems.map(({ id, label, icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all active:scale-90 duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {icon}
              <span className="text-[9px] font-semibold uppercase tracking-wider">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
