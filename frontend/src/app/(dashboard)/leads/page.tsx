"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import {
  Search, Phone, MapPin, DollarSign, Home, Calendar,
  TrendingUp, Clock, MessageSquare, ChevronDown, ArrowUpDown,
  ExternalLink, Filter, X,
} from "lucide-react"
import Link from "next/link"
import { cn, timeAgo, getPriorityColor, getStatusColor, formatCurrency, formatDateTime } from "@/lib/utils"
import type { Lead } from "@/types"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const sources = [
  { value: "website", label: "Website", color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "instagram", label: "Instagram", color: "text-pink-500", bg: "bg-pink-500/10" },
  { value: "facebook", label: "Facebook", color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { value: "whatsapp", label: "WhatsApp", color: "text-green-500", bg: "bg-green-500/10" },
  { value: "manual", label: "Manual", color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "landing_page", label: "Landing Page", color: "text-cyan-500", bg: "bg-cyan-500/10" },
]

const stages = [
  { value: "new_lead", label: "New Lead", color: "text-blue-500" },
  { value: "qualified", label: "Qualified", color: "text-purple-500" },
  { value: "hot_lead", label: "Hot Lead", color: "text-red-500" },
  { value: "recommendation_sent", label: "Rec. Sent", color: "text-indigo-500" },
  { value: "followup_active", label: "Follow-up Active", color: "text-amber-500" },
  { value: "customer_responded", label: "Responded", color: "text-green-500" },
  { value: "site_visit_scheduled", label: "Visit Scheduled", color: "text-cyan-500" },
  { value: "negotiation", label: "Negotiation", color: "text-orange-500" },
  { value: "booked", label: "Booked", color: "text-emerald-500" },
  { value: "lost", label: "Lost", color: "text-red-700" },
]

function getLatestActivity(lead: Lead, allActivities?: any[]): string {
  return ""
}

function SourceBadge({ source }: { source: string }) {
  const s = sources.find(s => s.value === source)
  if (!s) return <span className="text-xs text-muted-foreground capitalize">{source}</span>
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", s.color, s.bg)}>
      <MessageSquare className="w-3 h-3" />
      {s.label}
    </span>
  )
}

export default function LeadsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [sourceFilter, setSourceFilter] = useState("")
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const size = 20

  const params: Record<string, string> = { page: String(page), size: String(size) }
  if (statusFilter) params.status = statusFilter
  if (priorityFilter) params.priority = priorityFilter
  if (sourceFilter) params.source = sourceFilter
  if (search) params.search = search

  const { data, isLoading } = useQuery({
    queryKey: ["leads", page, statusFilter, priorityFilter, sourceFilter, search],
    queryFn: () => api.leads.list(params),
  })

  const leads = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / size)

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("")
    setPriorityFilter("")
    setSourceFilter("")
    setPage(1)
  }

  const hasFilters = statusFilter || priorityFilter || sourceFilter || search

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Property Inquiries</h1>
          <p className="text-muted-foreground mt-1 text-sm">{total} total inquiries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
            className={cn("gap-2", showFilters && "border-primary/50")}>
            <Filter className="w-4 h-4" />
            Filters
            {hasFilters && <div className="w-2 h-2 rounded-full bg-primary" />}
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, location..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 bg-card/50 border-white/5"
            />
          </div>
          <select value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-10 rounded-lg border border-white/5 bg-card/50 px-3 py-2 text-sm text-foreground">
            <option value="">All Stages</option>
            {stages.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card/30 border border-white/5"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Source:</span>
              <div className="flex gap-1.5">
                {sources.map(s => (
                  <button key={s.value}
                    onClick={() => { setSourceFilter(sourceFilter === s.value ? "" : s.value); setPage(1) }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      sourceFilter === s.value
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-card/50 border-white/5 text-muted-foreground hover:border-white/20"
                    )}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-px h-6 bg-border/50" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Priority:</span>
              {["hot", "warm", "cold"].map(p => (
                <button key={p}
                  onClick={() => { setPriorityFilter(priorityFilter === p ? "" : p); setPage(1) }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border capitalize",
                    priorityFilter === p
                      ? p === "hot" ? "bg-red-500/20 border-red-500/40 text-red-400"
                        : p === "warm" ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                        : "bg-blue-500/20 border-blue-500/40 text-blue-400"
                      : "bg-card/50 border-white/5 text-muted-foreground hover:border-white/20"
                  )}>
                  {p}
                </button>
              ))}
            </div>
            {hasFilters && (
              <button onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Table */}
      <Card className="bg-card/50 backdrop-blur-xl border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Lead</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Source</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Budget</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Location</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Type</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Timeline</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Score</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Stage</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Created</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={10} className="px-4 py-4">
                      <div className="h-12 bg-muted/30 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="w-10 h-10 opacity-30" />
                      <p className="text-sm font-medium">No inquiries match your filters</p>
                      <p className="text-xs">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead: Lead) => (
                  <tr key={lead.id} className="group hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          lead.priority === "hot" ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" :
                          lead.priority === "warm" ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" :
                          "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                        )} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {lead.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone}</span>
                            {lead.email && (
                              <>
                                <span className="text-muted-foreground/40">|</span>
                                <span className="truncate">{lead.email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge source={lead.source} />
                    </td>
                    <td className="px-4 py-3">
                      {lead.budget_min ? (
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="font-medium">{formatCurrency(Number(lead.budget_min))}</span>
                          {lead.budget_max && (
                            <span className="text-muted-foreground"> - {formatCurrency(Number(lead.budget_max))}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not specified</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[120px]">{lead.location || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      {lead.property_type?.replace(/_/g, " ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[100px]">{lead.timeline?.replace(/_/g, " ") || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className={cn(
                          "text-sm font-mono font-bold",
                          lead.lead_score >= 70 ? "text-emerald-500" :
                          lead.lead_score >= 40 ? "text-amber-500" : "text-blue-500"
                        )}>
                          {lead.lead_score}
                        </span>
                        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 leading-4 font-semibold",
                          getPriorityColor(lead.priority))}>
                          {lead.priority?.toUpperCase()}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 leading-5 font-medium",
                        getStatusColor(lead.current_stage))}>
                        {lead.current_stage?.replace(/_/g, " ") || "new"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(lead.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/leads/${lead.id}`}>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * size + 1}-{Math.min(page * size, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1}
              onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <Button key={pageNum} variant={pageNum === page ? "default" : "outline"} size="sm"
                    className="w-8 h-8 p-0 text-xs"
                    onClick={() => setPage(pageNum)}>
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button variant="outline" size="sm" disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
