"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Play, UserPlus, Brain, Target, Home, MessageSquare,
  MessageCircle, UserCheck, Circle, ExternalLink,
} from "lucide-react"
import { timeAgo } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Activity } from "@/types"

const activityConfig: Record<string, { icon: React.ElementType; color: string; glow: string }> = {
  workflow_started: { icon: Play, color: "text-cyan-500", glow: "shadow-cyan-500/20" },
  lead_intake_completed: { icon: UserPlus, color: "text-blue-500", glow: "shadow-blue-500/20" },
  lead_qualified: { icon: Brain, color: "text-purple-500", glow: "shadow-purple-500/20" },
  lead_scored: { icon: Target, color: "text-amber-500", glow: "shadow-amber-500/20" },
  property_recommended: { icon: Home, color: "text-indigo-500", glow: "shadow-indigo-500/20" },
  followup_sent: { icon: MessageSquare, color: "text-green-500", glow: "shadow-green-500/20" },
  customer_responded: { icon: MessageCircle, color: "text-emerald-500", glow: "shadow-emerald-500/20" },
  lead_created: { icon: UserCheck, color: "text-blue-500", glow: "shadow-blue-500/20" },
}

function getConfig(type: string) {
  const key = type.toLowerCase()
  return activityConfig[key] || { icon: Circle, color: "text-muted-foreground", glow: "shadow-muted-foreground/20" }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
}

interface ActivityTimelineProps {
  activities: Activity[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Circle className="w-8 h-8 mb-3 opacity-30" />
        <p className="text-sm">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-border via-border/50 to-transparent" />
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => {
            const { icon: Icon, color, glow } = getConfig(activity.activity_type)
            const isWhatsappFollowup = activity.activity_type === 'followup_sent' &&
              activity.metadata?.channel === 'whatsapp' &&
              activity.metadata?.whatsapp_url
            return (
              <motion.div
                key={activity.id}
                variants={itemVariants}
                layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative pl-12 group"
              >
                <div className="absolute left-0 top-0 flex items-center justify-center">
                  <div
                    className={`w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 flex items-center justify-center shadow-lg ${glow} transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}
                  >
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>

                <div className="rounded-xl bg-card/40 backdrop-blur-xl border border-border/50 p-4 transition-all duration-300 hover:bg-card/60 hover:border-border shadow-sm hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground/90 truncate">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground/60 whitespace-nowrap pt-0.5 font-mono">
                      {timeAgo(activity.created_at)}
                    </span>
                  </div>
                  {isWhatsappFollowup && (
                    <div className="mt-3 flex justify-end">
                      <a
                        href={activity.metadata!.whatsapp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline" className="gap-2 text-xs h-8 border-green-500/30 text-green-500 hover:bg-green-500/10">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Send on WhatsApp
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
