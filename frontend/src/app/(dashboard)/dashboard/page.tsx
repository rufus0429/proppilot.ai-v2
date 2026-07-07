"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users, UserCheck, TrendingUp, MessageCircle, Mail,
  CalendarCheck, Home, Zap, Activity, BarChart3, Globe,
  ArrowRight, Phone, Calendar, FileText, Bell, Sparkles,
  PieChart, DollarSign, Clock, Target, Eye, ThumbsUp,
} from "lucide-react"
import Link from "next/link"
import { cn, timeAgo, getStatusColor } from "@/lib/utils"
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { Lead } from "@/types"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const statCards = [
  { label: "Today's Inquiries", key: "today_leads", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "New Leads", key: "new_leads", icon: UserCheck, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { label: "Qualified Leads", key: "qualified_leads", icon: Target, color: "text-purple-500", bg: "bg-purple-500/10" },
  { label: "Hot Leads", key: "hot_leads", icon: TrendingUp, color: "text-red-500", bg: "bg-red-500/10" },
  { label: "Pending Follow-ups", key: "pending_followups", icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "WhatsApp Generated", key: "whatsapp_sent", icon: MessageCircle, color: "text-green-500", bg: "bg-green-500/10" },
  { label: "Site Visits", key: "upcoming_site_visits", icon: CalendarCheck, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { label: "Bookings", key: "bookings", icon: Home, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Conversion Rate", key: "conversion_rate", icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10", suffix: "%" },
  { label: "Emails Sent", key: "emails_sent", icon: Mail, color: "text-purple-500", bg: "bg-purple-500/10" },
]

const PIE_COLORS = ["#3b82f6", "#ec4899", "#8b5cf6", "#22c55e", "#f59e0b", "#06b6d4"]

function getLeadSourceIcon(source: string): string {
  switch (source) {
    case "website": return "🌐"
    case "instagram": return "📸"
    case "facebook": return "📘"
    case "whatsapp": return "💬"
    case "manual": return "✍️"
    case "landing_page": return "📄"
    default: return "📌"
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case "call": return Phone
    case "email": return Mail
    case "whatsapp": return MessageCircle
    case "site_visit":
    case "visit_scheduled": return Calendar
    case "note":
    case "note_added": return FileText
    case "status_change":
    case "stage_change": return ArrowRight
    default: return Activity
  }
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.leads.dashboard(),
  })

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["recent-leads"],
    queryFn: () => api.leads.list({ size: "10" }),
  })

  const recentLeads = leadsData?.items || []
  const insights = stats?.ai_insights
  const sourceData = stats?.leads_by_source?.map((s: any) => ({
    name: s.source.charAt(0).toUpperCase() + s.source.slice(1).replace(/_/g, " "),
    value: s.count,
  })) || []

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-time property inquiry & AI workflow overview</p>
        </div>
        <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5 gap-1.5 px-3 py-1.5">
          <Zap className="w-3 h-3 text-primary" />
          AI Active
        </Badge>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const value = stats ? (stats as any)[stat.key] : 0
          const displayValue = stat.suffix ? `${value}${stat.suffix}` : value
          const Icon = stat.icon
          return (
            <motion.div key={stat.key} variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold tracking-tight">
                        {statsLoading ? (
                          <span className="text-muted-foreground">...</span>
                        ) : (
                          displayValue
                        )}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Property Inquiries */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="bg-card/50 backdrop-blur-xl border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Recent Inquiries
              </CardTitle>
              <Link href="/leads">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : recentLeads.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No inquiries yet</p>
                  <p className="text-xs mt-1">Submit a property inquiry form to get started</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    <div className="col-span-5 flex items-center gap-3">
                      <span className="w-2 shrink-0" />
                      <span>Customer</span>
                    </div>
                    <div className="col-span-2 text-center">Source</div>
                    <div className="col-span-2 text-center">Stage</div>
                    <div className="col-span-2 text-center">Score</div>
                    <div className="col-span-1 text-right">Time</div>
                  </div>
                  {recentLeads.map((lead: Lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg hover:bg-muted/30 transition-colors group"
                    >
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0 shadow-sm",
                          lead.priority === "hot" ? "bg-red-500 shadow-red-500/50" :
                          lead.priority === "warm" ? "bg-amber-500 shadow-amber-500/50" :
                          "bg-blue-500 shadow-blue-500/50"
                        )} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {lead.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {lead.location || "No location"}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-xs capitalize text-muted-foreground">
                          {lead.source?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <Badge variant="outline" className={cn("text-[10px] px-2 py-0 leading-5", getStatusColor(lead.current_stage))}>
                          {lead.current_stage?.replace(/_/g, " ") || "new"}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-center text-xs font-mono text-muted-foreground">
                        {lead.lead_score}
                      </div>
                      <div className="col-span-1 text-right text-[10px] text-muted-foreground">
                        {timeAgo(lead.created_at)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Lead Sources Pie Chart */}
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-xl border-white/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-primary" />
                  Lead Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sourceData.length > 0 ? (
                  <div>
                    <ResponsiveContainer width="100%" height={180}>
                      <RePieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {sourceData.map((_: any, idx: number) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {sourceData.map((s: any, idx: number) => (
                        <div key={s.name} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                          <span className="text-muted-foreground">{s.name}</span>
                          <span className="font-medium">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">No data</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-xl border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Activity
                </CardTitle>
                <Link href="/activity-timeline">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {stats?.recent_activities && stats.recent_activities.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recent_activities.slice(0, 6).map((a: any, idx: number) => {
                      const Icon = getActivityIcon(a.activity_type)
                      return (
                        <div key={a.id || idx} className="flex items-start gap-3">
                          <div className="p-1.5 rounded-lg bg-muted/50 mt-0.5 shrink-0">
                            <Icon className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{a.title}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              {a.lead_name && (
                                <>
                                  <span className="truncate max-w-[100px]">{a.lead_name}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span className="shrink-0">{timeAgo(a.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Insights */}
          {insights && (
            <motion.div variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur-xl border-white/5 bg-gradient-to-br from-primary/[0.03] to-transparent">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <span className="text-xs text-muted-foreground">Inquiries today</span>
                      </div>
                      <span className="text-sm font-bold">{insights.total_leads_today}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        <span className="text-xs text-muted-foreground">Hot leads pending</span>
                      </div>
                      <span className="text-sm font-bold text-red-500">{insights.hot_leads_pending}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                          <Bell className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <span className="text-xs text-muted-foreground">Follow-ups due</span>
                      </div>
                      <span className="text-sm font-bold text-amber-500">{insights.pending_followups}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                          <CalendarCheck className="w-3.5 h-3.5 text-cyan-500" />
                        </div>
                        <span className="text-xs text-muted-foreground">Upcoming visits</span>
                      </div>
                      <span className="text-sm font-bold text-cyan-500">{insights.upcoming_visits}</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                      {insights.hot_leads_pending > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span>🔥</span>
                          <span className="text-muted-foreground">{insights.hot_leads_pending} high-intent buyers need attention</span>
                        </div>
                      )}
                      {insights.pending_followups > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span>⚠️</span>
                          <span className="text-muted-foreground">{insights.pending_followups} follow-ups pending</span>
                        </div>
                      )}
                      {insights.total_leads_today > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span>📈</span>
                          <span className="text-muted-foreground">{insights.total_leads_today} new inquiries received today</span>
                        </div>
                      )}
                      {stats?.bookings && stats.bookings > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span>💰</span>
                          <span className="text-muted-foreground">Estimated pipeline value growing</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
