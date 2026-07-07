"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, timeAgo, formatDateTime } from "@/lib/utils"
import Link from "next/link"
import {
  Activity, Play, UserPlus, Brain, Target, Home,
  MessageSquare, MessageCircle, UserCheck, CalendarCheck,
  CheckCircle2, XCircle, Clock, Zap, Sparkles, ArrowRight,
} from "lucide-react"

const activityConfig: Record<string, { icon: any; color: string; bg: string }> = {
  lead_created: { icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/20" },
  lead_intake_completed: { icon: Brain, color: "text-purple-500", bg: "bg-purple-500/20" },
  lead_qualified: { icon: Brain, color: "text-indigo-500", bg: "bg-indigo-500/20" },
  lead_scored: { icon: Target, color: "text-amber-500", bg: "bg-amber-500/20" },
  property_recommended: { icon: Home, color: "text-emerald-500", bg: "bg-emerald-500/20" },
  followup_sent: { icon: MessageCircle, color: "text-green-500", bg: "bg-green-500/20" },
  followup_replied: { icon: MessageSquare, color: "text-cyan-500", bg: "bg-cyan-500/20" },
  customer_responded: { icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/20" },
  appointment_scheduled: { icon: CalendarCheck, color: "text-cyan-500", bg: "bg-cyan-500/20" },
  appointment_completed: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/20" },
  lead_converted: { icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/20" },
  lead_lost: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/20" },
  workflow_started: { icon: Play, color: "text-primary", bg: "bg-primary/20" },
  workflow_completed: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/20" },
  workflow_failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/20" },
  note_added: { icon: MessageSquare, color: "text-slate-500", bg: "bg-slate-500/20" },
}

function getActivityConfig(type: string) {
  return activityConfig[type] || { icon: Activity, color: "text-muted-foreground", bg: "bg-muted/50" }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
}

export default function ActivityTimelinePage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.leads.dashboard(),
  })

  const activities = stats?.recent_activities || []

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Timeline</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-time AI agent execution log</p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-primary/30 bg-primary/5">
          <Activity className="w-3 h-3 text-primary" />
          {activities.length} recent
        </Badge>
      </div>

      <Card className="bg-card/50 backdrop-blur-xl border-white/5">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted/50 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted/50 rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-muted/30 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-medium">No activity yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">AI agents will appear here as they process leads</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/10 to-transparent" />
              <div className="space-y-0">
                {activities.map((a: any, idx: number) => {
                  const config = getActivityConfig(a.activity_type)
                  const Icon = config.icon
                  const isLast = idx === activities.length - 1
                  return (
                    <motion.div key={a.id || idx} variants={itemVariants}
                      className="relative pl-14 pb-6 last:pb-0">
                      <div className={cn(
                        "absolute left-3.5 w-3.5 h-3.5 rounded-full border-2 z-10",
                        "bg-background",
                        config.color.replace("text-", "border-"),
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                          config.color.replace("text-", "bg-"))} />
                      </div>
                      {!isLast && (
                        <div className="absolute left-[19px] top-[18px] bottom-0 w-px bg-gradient-to-b from-border to-transparent" />
                      )}
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
                          <Icon className={cn("w-4 h-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{a.title}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {timeAgo(a.created_at)}
                            </span>
                          </div>
                          {a.lead_name && (
                            <Link href={`/leads/${a.lead_id}`}
                              className="text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5 inline-flex items-center gap-1">
                              {a.lead_name}
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {formatDateTime(a.created_at)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              {activities.length > 0 && (
                <div className="text-center pt-4">
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-white/5">
                    <Clock className="w-3 h-3" />
                    Live — waiting for new AI agent executions
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
