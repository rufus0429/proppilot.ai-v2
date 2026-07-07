"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import { BarChart3, TrendingUp, Users, Home, PieChart as PieChartIcon, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const stageColors: Record<string, string> = {
  new_lead: "#3b82f6",
  qualified: "#8b5cf6",
  hot_lead: "#ef4444",
  recommendation_sent: "#6366f1",
  followup_active: "#f59e0b",
  customer_responded: "#10b981",
  site_visit_scheduled: "#06b6d4",
  negotiation: "#f97316",
  booked: "#22c55e",
  lost: "#dc2626",
}

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.leads.dashboard(),
  })

  const sourceData = stats?.leads_by_source?.map((s: any) => ({
    name: s.source.charAt(0).toUpperCase() + s.source.slice(1).replace(/_/g, " "),
    value: s.count,
    original: s.source,
  })) || []

  const stageData = stats?.leads_by_stage?.map((s: any) => ({
    name: s.stage.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    value: s.count,
    key: s.stage,
  })) || []

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">Performance metrics, sources & pipeline distribution</p>
      </div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leads by Source */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-xl border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Leads by Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}
                      label={{ position: "top", fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pipeline Stage Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-xl border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Pipeline Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stageData.map((entry: any) => (
                        <Cell key={entry.key} fill={stageColors[entry.key] || "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-xl border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/20 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Total Leads</p>
                  <p className="text-2xl font-bold">{stats?.total_leads || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
                  <p className="text-2xl font-bold text-emerald-500">{stats?.conversion_rate || 0}%</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Hot Leads</p>
                  <p className="text-2xl font-bold text-red-500">{stats?.hot_leads || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Bookings</p>
                  <p className="text-2xl font-bold text-green-500">{stats?.bookings || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Active Follow-ups</p>
                  <p className="text-2xl font-bold text-amber-500">{stats?.pending_followups || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Site Visits</p>
                  <p className="text-2xl font-bold text-cyan-500">{stats?.upcoming_site_visits || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lead Distribution & Source Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-xl border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Lead Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm">Hot Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{stats?.hot_leads || 0}</span>
                    <span className="text-xs text-muted-foreground">
                      {stats?.total_leads ? ((stats.hot_leads / stats.total_leads) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm">Warm Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{stats?.warm_leads || 0}</span>
                    <span className="text-xs text-muted-foreground">
                      {stats?.total_leads ? ((stats.warm_leads / stats.total_leads) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm">Cold Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{stats?.cold_leads || 0}</span>
                    <span className="text-xs text-muted-foreground">
                      {stats?.total_leads ? ((stats.cold_leads / stats.total_leads) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div className="flex h-2.5 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${stats?.total_leads ? (stats.hot_leads / stats.total_leads) * 100 : 0}%` }} />
                    <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${stats?.total_leads ? (stats.warm_leads / stats.total_leads) * 100 : 0}%` }} />
                    <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${stats?.total_leads ? (stats.cold_leads / stats.total_leads) * 100 : 0}%` }} />
                  </div>
                </div>

                {/* Source breakdown */}
                {sourceData.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <p className="text-xs text-muted-foreground mb-3 font-medium">Lead Source Breakdown</p>
                    {sourceData.map((s: any, idx: number) => {
                      const total = sourceData.reduce((sum: number, x: any) => sum + x.value, 0)
                      const pct = total > 0 ? ((s.value / total) * 100).toFixed(1) : "0"
                      return (
                        <div key={s.original} className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-xs text-muted-foreground flex-1">{s.name}</span>
                          <span className="text-xs font-medium">{s.value}</span>
                          <span className="text-[10px] text-muted-foreground">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
