"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { cn, formatCurrency, timeAgo } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { Lead } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Clock, IndianRupee, Inbox } from "lucide-react"

const stages = [
  { key: "new_lead", label: "New Lead", bar: "bg-blue-500", glow: "shadow-blue-500/15", dot: "bg-blue-500" },
  { key: "qualified", label: "Qualified", bar: "bg-purple-500", glow: "shadow-purple-500/15", dot: "bg-purple-500" },
  { key: "hot_lead", label: "Hot Lead", bar: "bg-red-500", glow: "shadow-red-500/15", dot: "bg-red-500" },
  { key: "recommendation_sent", label: "Recommendation Sent", bar: "bg-indigo-500", glow: "shadow-indigo-500/15", dot: "bg-indigo-500" },
  { key: "followup_active", label: "Follow-up Active", bar: "bg-amber-500", glow: "shadow-amber-500/15", dot: "bg-amber-500" },
  { key: "customer_responded", label: "Customer Responded", bar: "bg-emerald-500", glow: "shadow-emerald-500/15", dot: "bg-emerald-500" },
  { key: "site_visit_scheduled", label: "Site Visit Scheduled", bar: "bg-cyan-500", glow: "shadow-cyan-500/15", dot: "bg-cyan-500" },
  { key: "negotiation", label: "Negotiation", bar: "bg-orange-500", glow: "shadow-orange-500/15", dot: "bg-orange-500" },
  { key: "booked", label: "Booked", bar: "bg-emerald-500", glow: "shadow-emerald-500/15", dot: "bg-emerald-500" },
  { key: "lost", label: "Lost", bar: "bg-red-700", glow: "shadow-red-700/15", dot: "bg-red-700" },
] as const

const priorityDot: Record<string, string> = {
  hot: "bg-red-500 shadow-red-500/40",
  warm: "bg-amber-500 shadow-amber-500/40",
  cold: "bg-blue-500 shadow-blue-500/40",
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
}

export default function PipelinePage() {
  const { data: allLeads, isLoading } = useQuery({
    queryKey: ["leads", "all"],
    queryFn: () => api.leads.list({ size: "200" }),
  })

  const leads = allLeads?.items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground mt-1">Kanban view of your lead pipeline</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1 rounded-full">
          {leads.length} total
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:overflow-x-auto xl:flex-nowrap gap-4 pb-2">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l: Lead) => l.current_stage === stage.key)
          return <Column key={stage.key} stage={stage} leads={stageLeads} />
        })}
      </div>
    </div>
  )
}

function Column({ stage, leads }: { stage: (typeof stages)[number]; leads: Lead[] }) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl",
        "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl",
        "border border-white/30 dark:border-white/10",
        "shadow-lg",
        stage.glow,
        "xl:min-w-[280px] xl:w-[300px] xl:flex-shrink-0",
      )}
    >
      <div className={cn("h-1.5 rounded-t-2xl", stage.bar)} />

      <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", stage.dot)} />
          <h3 className="text-sm font-semibold text-foreground">{stage.label}</h3>
        </div>
        <Badge
          variant="secondary"
          className="text-[11px] h-5 px-1.5 min-w-[20px] flex items-center justify-center rounded-full"
        >
          {leads.length}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[280px] max-h-[calc(100vh-300px)]">
        <AnimatePresence mode="popLayout">
          {leads.length > 0 ? (
            <motion.div
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </motion.div>
          ) : (
            <EmptyColumn />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <motion.div variants={cardVariants} layout>
      <Link
        href={`/leads/${lead.id}`}
        className={cn(
          "block p-3.5 rounded-xl",
          "bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm",
          "border border-white/40 dark:border-gray-700/20",
          "shadow-sm hover:shadow-md",
          "hover:bg-white/80 dark:hover:bg-gray-800/60",
          "transition-all duration-200 group",
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm",
              priorityDot[lead.priority] || "bg-gray-400",
            )}
          />
          <p className="text-sm font-medium truncate flex-1 group-hover:text-primary transition-colors">
            {lead.name}
          </p>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-5 px-1.5 font-semibold rounded-full",
              lead.priority === "hot"
                ? "text-red-500 bg-red-500/10 border-red-500/20"
                : lead.priority === "warm"
                  ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
                  : lead.priority === "cold"
                    ? "text-blue-500 bg-blue-500/10 border-blue-500/20"
                    : "text-muted-foreground bg-muted/50",
            )}
          >
            {lead.lead_score}
          </Badge>
        </div>

        {lead.budget_min != null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <IndianRupee className="w-3 h-3 flex-shrink-0" />
            <span>{formatCurrency(Number(lead.budget_min))}</span>
          </div>
        )}

        {lead.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{lead.location}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>{timeAgo(lead.created_at)}</span>
        </div>
      </Link>
    </motion.div>
  )
}

function EmptyColumn() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center mb-2 ring-1 ring-white/20 dark:ring-white/5">
        <Inbox className="w-5 h-5 text-muted-foreground/40" />
      </div>
      <p className="text-xs text-muted-foreground/50">No leads</p>
    </div>
  )
}
