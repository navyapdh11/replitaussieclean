import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity, Zap, Clock, Cpu, Database, Network, HardDrive,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  RefreshCw, Lightbulb, Gauge, Target, BarChart2, PieChart,
  LineChart, ArrowUpRight, ArrowDownRight, Brain, Sparkles,
  Timer, FileText, Users, Calendar, DollarSign, MapPin,
  Search, MousePointer, Smartphone, Globe, Server, Cloud,
  Shield, Lock, Eye, Key, Layers, Box, Grid3X3, LayoutGrid,
  Sparkles as SparklesIcon, MessageSquare, Bell, Settings,
  ChevronRight, Star, Code2, GitBranch, Terminal, Bug,
  Flame, Droplets, Wind, Thermometer, Sun, Moon,
} from "lucide-react";
import { BASE_URL, TENANT_ID } from "./shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface SystemMetrics {
  // Real-time metrics
  requestsPerMinute: number;
  avgResponseTimeMs: number;
  errorRate: number;
  uptime: number;
  
  // Resource metrics
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  
  // Business metrics
  activeBookings: number;
  activeStaff: number;
  revenueToday: number;
  revenueWeek: number;
  conversionRate: number;
  customerSatisfaction: number;
  
  // API health
  apiHealth: Record<string, { status: string; latency: number; errorRate: number }>;
  
  // Time series data (last 24 hours)
  requestHistory: { timestamp: number; value: number }[];
  errorHistory: { timestamp: number; value: number }[];
  responseTimeHistory: { timestamp: number; value: number }[];
  
  // Geographic data
  topSuburbs: { name: string; bookings: number; revenue: number }[];
  
  // Staff performance
  staffPerformance: { id: string; name: string; jobs: number; rating: number; efficiency: number }[];
  
  // SEO metrics
  seoMetrics: { keyword: string; position: number; clicks: number; impressions: number }[];
}

interface Recommendation {
  id: string;
  category: "performance" | "revenue" | "operations" | "marketing" | "security";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  effort: "low" | "medium" | "high";
  action: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(num % 1 === 0 ? 0 : 1);
}

function formatCurrencySimple(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getHealthColor(status: string): string {
  switch (status) {
    case "healthy": return "text-emerald-400 bg-emerald-500/20";
    case "degraded": return "text-yellow-400 bg-yellow-500/20";
    case "error": return "text-red-400 bg-red-500/20";
    default: return "text-slate-400 bg-slate-500/20";
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "critical": return "text-red-400 border-red-500/50 bg-red-500/10";
    case "high": return "text-orange-400 border-orange-500/50 bg-orange-500/10";
    case "medium": return "text-yellow-400 border-yellow-500/50 bg-yellow-500/10";
    case "low": return "text-blue-400 border-blue-500/50 bg-blue-500/10";
    default: return "text-slate-400 border-slate-500/50 bg-slate-500/10";
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATORS (Replace with real API calls)
// ═══════════════════════════════════════════════════════════════════════════════

function generateMockMetrics(): SystemMetrics {
  const now = Date.now();
  const hour = 3600000;
  
  return {
    requestsPerMinute: Math.floor(Math.random() * 200) + 50,
    avgResponseTimeMs: Math.floor(Math.random() * 150) + 50,
    errorRate: Math.random() * 2,
    uptime: Math.floor(Math.random() * 864000) + 864000,
    
    cpuUsage: Math.floor(Math.random() * 40) + 20,
    memoryUsage: Math.floor(Math.random() * 30) + 40,
    diskUsage: Math.floor(Math.random() * 20) + 60,
    networkLatency: Math.floor(Math.random() * 30) + 10,
    
    activeBookings: Math.floor(Math.random() * 50) + 20,
    activeStaff: Math.floor(Math.random() * 15) + 5,
    revenueToday: Math.floor(Math.random() * 500000) + 100000,
    revenueWeek: Math.floor(Math.random() * 3000000) + 500000,
    conversionRate: Math.random() * 10 + 5,
    customerSatisfaction: Math.random() * 0.5 + 4.5,
    
    apiHealth: {
      bookings: { status: "healthy", latency: Math.floor(Math.random() * 100) + 20, errorRate: Math.random() * 0.5 },
      pricing: { status: "healthy", latency: Math.floor(Math.random() * 80) + 10, errorRate: Math.random() * 0.3 },
      staff: { status: "degraded", latency: Math.floor(Math.random() * 200) + 50, errorRate: Math.random() * 2 },
      payments: { status: "healthy", latency: Math.floor(Math.random() * 120) + 30, errorRate: Math.random() * 0.2 },
      notifications: { status: "healthy", latency: Math.floor(Math.random() * 90) + 20, errorRate: Math.random() * 0.4 },
      ai: { status: "healthy", latency: Math.floor(Math.random() * 500) + 100, errorRate: Math.random() * 1 },
    },
    
    requestHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: now - (23 - i) * hour,
      value: Math.floor(Math.random() * 200) + 50,
    })),
    
    errorHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: now - (23 - i) * hour,
      value: Math.floor(Math.random() * 10),
    })),
    
    responseTimeHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: now - (23 - i) * hour,
      value: Math.floor(Math.random() * 100) + 50,
    })),
    
    topSuburbs: [
      { name: "Sydney CBD", bookings: 45, revenue: 125000 },
      { name: "North Sydney", bookings: 38, revenue: 98000 },
      { name: "Parramatta", bookings: 32, revenue: 85000 },
      { name: "Bondi Junction", bookings: 28, revenue: 76000 },
      { name: "Chatswood", bookings: 24, revenue: 68000 },
    ],
    
    staffPerformance: [
      { id: "1", name: "John Smith", jobs: 42, rating: 4.9, efficiency: 95 },
      { id: "2", name: "Sarah Johnson", jobs: 38, rating: 4.8, efficiency: 92 },
      { id: "3", name: "Mike Davis", jobs: 35, rating: 4.7, efficiency: 88 },
      { id: "4", name: "Emily Brown", jobs: 31, rating: 4.9, efficiency: 94 },
      { id: "5", name: "Chris Wilson", jobs: 28, rating: 4.6, efficiency: 85 },
    ],
    
    seoMetrics: [
      { keyword: "cleaning services sydney", position: 3, clicks: 1250, impressions: 8500 },
      { keyword: "end of lease cleaning", position: 5, clicks: 890, impressions: 6200 },
      { keyword: "commercial cleaning", position: 8, clicks: 560, impressions: 4800 },
      { keyword: "carpet cleaning sydney", position: 12, clicks: 340, impressions: 3200 },
      { keyword: "deep cleaning services", position: 15, clicks: 220, impressions: 2100 },
    ],
  };
}

function generateMockRecommendations(): Recommendation[] {
  return [
    {
      id: "1",
      category: "performance",
      priority: "critical",
      title: "API Response Time Degradation",
      description: "Staff API endpoint showing elevated latency (180ms avg). Consider adding caching layer.",
      impact: "Reduced by ~40% latency",
      effort: "low",
      action: "Enable Redis caching for staff routes",
    },
    {
      id: "2",
      category: "revenue",
      priority: "high",
      title: "Conversion Rate Optimization",
      description: "Booking abandonment at step 3 (address) is 15% higher than industry average.",
      impact: "Potential +12% revenue",
      effort: "medium",
      action: "Add address autocomplete and auto-fill",
    },
    {
      id: "3",
      category: "operations",
      priority: "high",
      title: "Staff Utilization Optimization",
      description: "Current staff utilization at 72%. Optimizing schedules could increase to 85%.",
      impact: "+18% capacity",
      effort: "high",
      action: "Implement ML-based scheduling",
    },
    {
      id: "4",
      category: "marketing",
      priority: "medium",
      title: "SEO Opportunity: 'carpet cleaning'",
      description: "Keyword ranking at #12. Small content boost could push to top 10.",
      impact: "+35% organic traffic",
      effort: "low",
      action: "Add dedicated carpet cleaning page",
    },
    {
      id: "5",
      category: "security",
      priority: "medium",
      title: "Rate Limiting on Public APIs",
      description: "No rate limiting on pricing API. Consider adding tiered limits.",
      impact: "Prevent abuse",
      effort: "medium",
      action: "Implement rate limiting middleware",
    },
    {
      id: "6",
      category: "revenue",
      priority: "low",
      title: "Upsell Opportunity: Add-ons",
      description: "Only 23% of bookings include add-ons. Review add-on pricing display.",
      impact: "+8% avg booking value",
      effort: "low",
      action: "Redesign add-on selection UI",
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// 3D Card Component with depth effect
function BentoCard({
  children,
  className,
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl",
        "overflow-hidden transition-all duration-300",
        "hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10",
        "hover:-translate-y-1",
        className
      )}
      style={{
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.03) inset,
          0 -4px 20px rgba(0,0,0,0.3) inset,
          0 8px 32px rgba(0,0,0,0.2)
        `,
      }}
    >
      {/* Subtle gradient overlay */}
      <div className={cn(
        "absolute inset-0 opacity-30 pointer-events-none",
        "bg-gradient-to-br from-white/5 via-transparent to-black/10"
      )} />
      
      {/* Glow effect */}
      {glow && (
        <div className={cn(
          "absolute -inset-px rounded-3xl opacity-20 blur-xl",
          glow
        )} />
      )}
      
      <div className="relative z-10 p-5">
        {children}
      </div>
    </div>
  );
}

// Flash Card for quick metrics
function FlashCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start p-4 rounded-2xl",
        "border border-border/40 bg-gradient-to-br",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        "transition-all duration-200 text-left w-full"
      )}
    >
      <div className={cn("flex items-center gap-2 mb-2", color)}>
        <Icon className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {trend && (
          trend === "up" ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          ) : trend === "down" ? (
            <ArrowDownRight className="w-4 h-4 text-red-400" />
          ) : null
        )}
      </div>
      {subValue && (
        <span className="text-xs text-muted-foreground mt-1">{subValue}</span>
      )}
      
      {/* Hover glow */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100",
        "bg-gradient-to-r from-primary/5 to-transparent transition-opacity"
      )} />
    </button>
  );
}

// Mini Chart Placeholder (Visual only - replace with real chart library)
function MiniChart({
  data,
  color = "#22d3ee",
  height = 40,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${data.length * 12} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <path
        d={`M 0 ${height - ((data[0] - min) / range) * height}
            ${data.map((v, i) => `L ${i * 12 + 6} ${height - ((v - min) / range) * height}`).join(" ")}
            L ${(data.length - 1) * 12 + 6} ${height}
            L 0 ${height} Z`}
        fill={`url(#gradient-${color.replace("#", "")})`}
      />
      
      {/* Line */}
      <path
        d={`M 0 ${height - ((data[0] - min) / range) * height}
            ${data.map((v, i) => `L ${i * 12 + 6} ${height - ((v - min) / range) * height}`).join(" ")}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Gauge Component
function GaugeChart({
  value,
  max = 100,
  label,
  color = "#22d3ee",
}: {
  value: number;
  max?: number;
  label: string;
  color?: string;
}) {
  const percentage = (value / max) * 100;
  const rotation = (percentage / 100) * 180 - 90;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-10 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 1.26} 126`}
            className="transition-all duration-500"
          />
        </svg>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function ObservabilityTab() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with real endpoint
      await new Promise(r => setTimeout(r, 800));
      setMetrics(generateMockMetrics());
      setRecommendations(generateMockRecommendations());
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch observability data:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);
  
  // Filter recommendations by category
  const filteredRecommendations = useMemo(() => {
    if (selectedCategory === "all") return recommendations;
    return recommendations.filter(r => r.category === selectedCategory);
  }, [recommendations, selectedCategory]);
  
  // Calculate overall health score
  const healthScore = useMemo(() => {
    if (!metrics) return 0;
    const apiHealthScore = Object.values(metrics.apiHealth).reduce((acc, api) => {
      const statusScore = api.status === "healthy" ? 100 : api.status === "degraded" ? 60 : 20;
      return acc + statusScore;
    }, 0) / Object.keys(metrics.apiHealth).length;
    
    const perfScore = 100 - (metrics.errorRate * 10) - ((metrics.avgResponseTimeMs - 50) / 10);
    return Math.round((apiHealthScore * 0.6 + Math.max(0, perfScore) * 0.4));
  }, [metrics]);
  
  const getHealthGrade = (score: number): string => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  };
  
  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading observability data...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> System Observability
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time metrics, AI recommendations, and system health monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:border-primary/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3D BENTO GRID - TOP ROW */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Score Card */}
        <BentoCard glow="from-emerald-500/30 to-cyan-500/30" className="md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold",
              healthScore >= 80 ? "bg-emerald-500/20 text-emerald-400" :
              healthScore >= 60 ? "bg-yellow-500/20 text-yellow-400" :
              "bg-red-500/20 text-red-400"
            )}>
              <Activity className="w-3.5 h-3.5" />
              {healthScore >= 80 ? "Healthy" : healthScore >= 60 ? "Degraded" : "Critical"}
            </div>
            <GaugeChart value={healthScore} label={getHealthGrade(healthScore)} color={
              healthScore >= 80 ? "#34d399" : healthScore >= 60 ? "#facc15" : "#f87171"
            } />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">System Health Score</p>
            <p className="text-3xl font-extrabold text-foreground mt-1">{healthScore}</p>
          </div>
        </BentoCard>
        
        {/* API Response Time */}
        <BentoCard glow="from-cyan-500/30 to-blue-500/30">
          <FlashCard
            icon={Zap}
            label="Avg Response"
            value={metrics ? formatDuration(metrics.avgResponseTimeMs) : "0ms"}
            trend={metrics && metrics.avgResponseTimeMs > 100 ? "down" : "up"}
            color="text-cyan-400"
          />
          <div className="mt-3">
            <MiniChart
              data={metrics?.responseTimeHistory.map(h => h.value) || []}
              color="#22d3ee"
              height={32}
            />
          </div>
        </BentoCard>
        
        {/* Request Rate */}
        <BentoCard glow="from-blue-500/30 to-indigo-500/30">
          <FlashCard
            icon={Activity}
            label="Requests/min"
            value={metrics?.requestsPerMinute || 0}
            subValue="24h avg: 127"
            trend="up"
            color="text-blue-400"
          />
          <div className="mt-3">
            <MiniChart
              data={metrics?.requestHistory.map(h => h.value) || []}
              color="#3b82f6"
              height={32}
            />
          </div>
        </BentoCard>
        
        {/* Error Rate */}
        <BentoCard glow="from-orange-500/30 to-red-500/30">
          <FlashCard
            icon={AlertTriangle}
            label="Error Rate"
            value={`${metrics?.errorRate.toFixed(2) || 0}%`}
            trend={metrics && metrics.errorRate > 1 ? "down" : "neutral"}
            color="text-orange-400"
          />
          <div className="mt-3">
            <MiniChart
              data={metrics?.errorHistory.map(h => h.value) || []}
              color="#f97316"
              height={32}
            />
          </div>
        </BentoCard>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3D BENTO GRID - SECOND ROW - Resources & Business */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <FlashCard
          icon={Cpu}
          label="CPU"
          value={`${metrics?.cpuUsage || 0}%`}
          color="text-purple-400"
        />
        <FlashCard
          icon={Database}
          label="Memory"
          value={`${metrics?.memoryUsage || 0}%`}
          color="text-indigo-400"
        />
        <FlashCard
          icon={HardDrive}
          label="Disk"
          value={`${metrics?.diskUsage || 0}%`}
          color="text-slate-400"
        />
        <FlashCard
          icon={Network}
          label="Latency"
          value={`${metrics?.networkLatency || 0}ms`}
          color="text-cyan-400"
        />
        <FlashCard
          icon={Clock}
          label="Uptime"
          value={metrics ? formatUptime(metrics.uptime) : "0m"}
          color="text-emerald-400"
        />
        <FlashCard
          icon={TrendingUp}
          label="Conversion"
          value={`${metrics?.conversionRate.toFixed(1) || 0}%`}
          trend="up"
          color="text-amber-400"
        />
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3D BENTO GRID - THIRD ROW - API Health & Business Metrics */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Health Status */}
        <BentoCard className="lg:col-span-1">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-muted-foreground" />
            API Health Status
          </h3>
          <div className="space-y-3">
            {metrics && Object.entries(metrics.apiHealth).map(([name, data]) => (
              <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    data.status === "healthy" ? "bg-emerald-400" :
                    data.status === "degraded" ? "bg-yellow-400" :
                    "bg-red-400"
                  )} />
                  <span className="text-sm font-medium capitalize">{name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{data.latency}ms</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded font-semibold",
                    getHealthColor(data.status)
                  )}>
                    {data.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
        
        {/* Revenue Metrics */}
        <BentoCard glow="from-amber-500/20 to-yellow-500/20">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            Revenue Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
              <div>
                <p className="text-xs text-muted-foreground">Today's Revenue</p>
                <p className="text-xl font-bold text-emerald-400">
                  {metrics ? formatCurrencySimple(metrics.revenueToday) : "$0"}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-xl font-bold text-blue-400">
                  {metrics ? formatCurrencySimple(metrics.revenueWeek) : "$0"}
                </p>
              </div>
              <BarChart2 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">Active Bookings</p>
                <p className="text-lg font-bold text-foreground">{metrics?.activeBookings || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">Active Staff</p>
                <p className="text-lg font-bold text-foreground">{metrics?.activeStaff || 0}</p>
              </div>
            </div>
          </div>
        </BentoCard>
        
        {/* Customer Satisfaction */}
        <BentoCard>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-muted-foreground" />
            Customer Satisfaction
          </h3>
          <div className="flex items-center justify-center py-6">
            <div className="relative">
              <div className="text-5xl font-extrabold text-foreground">
                {metrics?.customerSatisfaction.toFixed(1) || "0.0"}
              </div>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i <= Math.round(metrics?.customerSatisfaction || 0)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-600"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Based on {Math.floor(Math.random() * 500) + 200} reviews
              </p>
            </div>
          </div>
        </BentoCard>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* AI RECOMMENDATIONS SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      <BentoCard glow="from-purple-500/20 to-pink-500/20" className="overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-purple-400" />
                AI Recommendations
              </h3>
              <p className="text-xs text-muted-foreground">
                Actionable insights powered by system analytics
              </p>
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
            {["all", "performance", "revenue", "operations", "marketing", "security"].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecommendations.map(rec => (
            <div
              key={rec.id}
              className={cn(
                "group relative p-4 rounded-2xl border transition-all duration-200",
                "hover:border-primary/30 hover:shadow-lg cursor-pointer",
                getPriorityColor(rec.priority)
              )}
            >
              {/* Priority Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full uppercase",
                  rec.priority === "critical" ? "text-red-400 bg-red-500/20" :
                  rec.priority === "high" ? "text-orange-400 bg-orange-500/20" :
                  rec.priority === "medium" ? "text-yellow-400 bg-yellow-500/20" :
                  "text-blue-400 bg-blue-500/20"
                )}>
                  {rec.priority}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {rec.category}
                </span>
              </div>
              
              {/* Title & Description */}
              <h4 className="font-bold text-foreground mb-1">{rec.title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
              
              {/* Impact & Effort */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">{rec.impact}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Effort: <span className="text-foreground font-medium capitalize">{rec.effort}</span>
                  </span>
                </div>
              </div>
              
              {/* Action Button */}
              <button className={cn(
                "mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg",
                "bg-muted/50 text-sm font-semibold",
                "group-hover:bg-primary/10 group-hover:text-primary",
                "transition-colors"
              )}>
                {rec.action}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        {filteredRecommendations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <SparklesIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recommendations in this category</p>
          </div>
        )}
      </BentoCard>
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* BOTTOM GRID - Staff Performance & SEO & Top Suburbs */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Performance */}
        <BentoCard>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Top Staff Performance
          </h3>
          <div className="space-y-3">
            {metrics?.staffPerformance.slice(0, 5).map((staff, idx) => (
              <div key={staff.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{staff.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{staff.jobs} jobs</span>
                    <span className="text-amber-400">★ {staff.rating}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-green-400"
                      style={{ width: `${staff.efficiency}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{staff.efficiency}%</span>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
        
        {/* Top Suburbs */}
        <BentoCard>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Top Performing Suburbs
          </h3>
          <div className="space-y-3">
            {metrics?.topSuburbs.map((suburb, idx) => (
              <div key={suburb.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{suburb.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{suburb.bookings} bookings</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">
                    {formatCurrencySimple(suburb.revenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
        
        {/* SEO Rankings */}
        <BentoCard>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            SEO Keyword Rankings
          </h3>
          <div className="space-y-3">
            {metrics?.seoMetrics.map((keyword, idx) => (
              <div key={keyword.keyword} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  keyword.position <= 5 ? "bg-emerald-500/20 text-emerald-400" :
                  keyword.position <= 10 ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-slate-500/20 text-slate-400"
                )}>
                  #{keyword.position}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{keyword.keyword}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{keyword.clicks} clicks</span>
                    <span>{keyword.impressions} impr.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* QUICK STATS - FOOTER BANNER */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      <div className="flex flex-wrap items-center justify-center gap-6 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Global Edge:</span>
          <span className="font-semibold text-foreground">99.9%</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2 text-sm">
          <Cloud className="w-4 h-4 text-purple-400" />
          <span className="text-muted-foreground">CDN Cache:</span>
          <span className="font-semibold text-foreground">94%</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-muted-foreground">WAF Status:</span>
          <span className="font-semibold text-emerald-400">Active</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2 text-sm">
          <Lock className="w-4 h-4 text-blue-400" />
          <span className="text-muted-foreground">SSL:</span>
          <span className="font-semibold text-foreground">Valid</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2 text-sm">
          <Key className="w-4 h-4 text-amber-400" />
          <span className="text-muted-foreground">API Keys:</span>
          <span className="font-semibold text-foreground">12 Active</span>
        </div>
      </div>
    </div>
  );
}