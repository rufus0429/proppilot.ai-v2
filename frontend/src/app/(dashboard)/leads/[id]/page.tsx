"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ActivityTimeline } from "@/components/leads/ActivityTimeline"
import {
  Phone, Mail, MapPin, Calendar, DollarSign, Home, Zap,
  Clock, TrendingUp, MessageSquare, AlertCircle, CheckCircle2,
  ArrowRight, Sparkles, Brain, Target, Route, PlayCircle,
  User, MessageCircle, Building2, BedDouble, Hash, RefreshCw,
  Loader2, ChevronDown, ChevronUp, Globe, FileText, ClipboardList,
  Star, Bot, BarChart3, Watch, ExternalLink,
} from "lucide-react"
import { cn, formatDateTime, timeAgo, getPriorityColor, getStatusColor, formatCurrency } from "@/lib/utils"
import { useState } from "react"
import type { JourneyStep, Activity, PropertyRecommendation } from "@/types"

const agentIcons: Record<string, any> = {
  qualify: Brain,
  score: Target,
  recommend: Home,
  journey: Route,
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

function InfoRow({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} className="font-medium hover:text-primary truncate block">{value}</a>
        ) : (
          <p className="font-medium truncate">{value}</p>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string | number | boolean | null }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{typeof value === "boolean" ? (value ? "Yes" : "No") : value ?? "—"}</span>
    </div>
  )
}

function SectionCard({ icon: Icon, title, children, className }: { icon: any; title: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className={"bg-card/50 backdrop-blur border-border/50 shadow-sm " + (className || "")}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  )
}

export default function LeadDetailPage() {
  const params = useParams()
  const leadId = params.id as string
  const [showJourney, setShowJourney] = useState(false)
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([])

  const { data: lead, isLoading, refetch } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => api.leads.get(leadId),
  })

  const { data: activities } = useQuery({
    queryKey: ["lead-activities", leadId],
    queryFn: () => api.leads.activities(leadId),
  })

  const { data: recommendData } = useQuery({
    queryKey: ["lead-recommend", leadId],
    queryFn: () => api.leads.recommend(leadId),
  })

  const qualifyMutation = useMutation({
    mutationFn: () => api.leads.qualify(leadId),
    onSuccess: () => { toast.success("Lead qualified"); refetch() },
    onError: (e: any) => toast.error(e.message),
  })

  const scoreMutation = useMutation({
    mutationFn: () => api.leads.score(leadId),
    onSuccess: () => { toast.success("Lead scored"); refetch() },
    onError: (e: any) => toast.error(e.message),
  })

  const recommendMutation = useMutation({
    mutationFn: () => api.leads.recommend(leadId),
    onSuccess: () => { toast.success("Recommendations generated"); refetch() },
    onError: (e: any) => toast.error(e.message),
  })

  const journeyMutation = useMutation({
    mutationFn: () => api.leads.journey(leadId),
    onSuccess: (data) => {
      setJourneySteps(data.sequence || [])
      setShowJourney(true)
      toast.success("Journey generated")
    },
    onError: (e: any) => toast.error(e.message),
  })

  const workflowMutation = useMutation({
    mutationFn: () => api.leads.workflow(leadId),
    onSuccess: () => { toast.success("Full workflow executed"); refetch() },
    onError: (e: any) => toast.error(e.message),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-card/50 backdrop-blur rounded-xl" />)}
          </div>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-card/50 backdrop-blur rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-lg font-medium">Lead not found</p>
        <p className="text-sm">The lead you are looking for does not exist or has been removed.</p>
      </div>
    )
  }

  const scorePercent = Math.min(Math.max(Number(lead.lead_score) || 0, 0), 100)
  const messages = (lead as any).messages || []
  const recommendations: PropertyRecommendation[] = recommendData?.recommendations || []

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-3 h-3 rounded-full mt-2.5 shrink-0 ${
              lead.priority === "hot" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
              lead.priority === "warm" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
              "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            }`} />
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{lead.name}</h1>
                <Badge variant="outline" className={getPriorityColor(lead.priority) + " text-xs font-semibold"}>
                  {lead.priority?.toUpperCase()}
                </Badge>
                <Badge variant="outline" className={getStatusColor(lead.current_stage) + " text-xs font-semibold"}>
                  {lead.current_stage?.replace(/_/g, " ") || "New Lead"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {lead.source?.replace(/_/g, " ")}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Created {formatDateTime(lead.created_at)}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(lead.created_at)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Agent Actions */}
          <SectionCard icon={Brain} title="AI Agent Actions">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline"
                className="h-auto py-4 justify-start gap-3 bg-background/50 hover:bg-background/80 border-border/50"
                onClick={() => qualifyMutation.mutate()}
                disabled={qualifyMutation.isPending}>
                {qualifyMutation.isPending ? <Loader2 className="w-5 h-5 text-purple-500 animate-spin" /> : <Brain className="w-5 h-5 text-purple-500" />}
                <div className="text-left">
                  <p className="text-sm font-medium">Qualify Lead</p>
                  <p className="text-xs text-muted-foreground">Extract details from inquiry</p>
                </div>
              </Button>
              <Button variant="outline"
                className="h-auto py-4 justify-start gap-3 bg-background/50 hover:bg-background/80 border-border/50"
                onClick={() => scoreMutation.mutate()}
                disabled={scoreMutation.isPending}>
                {scoreMutation.isPending ? <Loader2 className="w-5 h-5 text-amber-500 animate-spin" /> : <Target className="w-5 h-5 text-amber-500" />}
                <div className="text-left">
                  <p className="text-sm font-medium">Score Lead</p>
                  <p className="text-xs text-muted-foreground">Calculate priority score</p>
                </div>
              </Button>
              <Button variant="outline"
                className="h-auto py-4 justify-start gap-3 bg-background/50 hover:bg-background/80 border-border/50"
                onClick={() => journeyMutation.mutate()}
                disabled={journeyMutation.isPending}>
                {journeyMutation.isPending ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : <Route className="w-5 h-5 text-blue-500" />}
                <div className="text-left">
                  <p className="text-sm font-medium">Build Journey</p>
                  <p className="text-xs text-muted-foreground">Create follow-up sequence</p>
                </div>
              </Button>
              <Button variant="outline"
                className="h-auto py-4 justify-start gap-3 bg-background/50 hover:bg-background/80 border-border/50"
                onClick={() => recommendMutation.mutate()}
                disabled={recommendMutation.isPending}>
                {recommendMutation.isPending ? <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /> : <Home className="w-5 h-5 text-indigo-500" />}
                <div className="text-left">
                  <p className="text-sm font-medium">Recommend Properties</p>
                  <p className="text-xs text-muted-foreground">Find matching properties</p>
                </div>
              </Button>
            </div>
            <Button variant="default" className="w-full mt-3 h-11 gap-2"
              onClick={() => workflowMutation.mutate()}
              disabled={workflowMutation.isPending}>
              {workflowMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              <span className="font-medium">Run Full Workflow</span>
            </Button>
          </SectionCard>

          {/* AI Journey Builder */}
          {showJourney && journeySteps.length > 0 && (
            <SectionCard icon={Route} title="AI Journey Builder">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 to-transparent" />
                <div className="space-y-6">
                  {journeySteps.map((step, idx) => (
                    <div key={idx} className="relative pl-10">
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                        step.channel === "whatsapp" ? "bg-green-500 border-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" :
                        step.channel === "email" ? "bg-blue-500 border-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]" :
                        step.channel === "sms" ? "bg-purple-500 border-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.4)]" :
                        step.channel === "call" ? "bg-amber-500 border-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" :
                        "bg-muted-foreground border-muted-foreground"
                      }`} />
                      <div className="p-3 rounded-lg bg-muted/30 backdrop-blur border border-border/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs font-semibold">
                            {step.channel.replace("_", " ").toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {step.delay_days > 0 ? `+${step.delay_days}d ` : ""}
                            {step.delay_hours > 0 ? `${step.delay_hours}h ` : ""}
                            {step.delay_days === 0 && step.delay_hours === 0 ? "Immediate" : ""}
                          </span>
                        </div>
                        <p className="text-sm">{step.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {/* AI Follow-Up Section */}
          <SectionCard icon={MessageCircle} title="AI Follow-up">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">WhatsApp Status</p>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    lead.whatsapp_status === "sent" ? "text-green-500 bg-green-500/10" :
                    lead.whatsapp_status === "pending" ? "text-amber-500 bg-amber-500/10" :
                    "text-muted-foreground bg-muted"
                  )}>
                    {lead.whatsapp_status || "pending"}
                  </Badge>
                  {lead.phone && (
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${lead.name}! 👋\n\nThank you for your interest. Our team is curating the best options for you. We'll share personalized recommendations shortly.\n\nFeel free to reply here or call us anytime. 🏡`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2"
                    >
                      <Button size="sm" variant="outline" className="w-full gap-2 text-xs h-8 border-green-500/30 text-green-500 hover:bg-green-500/10">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Send on WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Email Status</p>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    lead.email_status === "sent" ? "text-green-500 bg-green-500/10" :
                    lead.email_status === "pending" ? "text-amber-500 bg-amber-500/10" :
                    "text-muted-foreground bg-muted"
                  )}>
                    {lead.email_status || "pending"}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Retry Count</p>
                  <p className="text-sm font-medium">{lead.followup_retry_count || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Last Follow-up</p>
                  <p className="text-sm font-medium">{lead.last_followup_at ? timeAgo(lead.last_followup_at) : "—"}</p>
                </div>
              </div>
              {lead.whatsapp_sent_at && (
                <div className="text-xs text-muted-foreground">
                  WhatsApp sent {timeAgo(lead.whatsapp_sent_at)}
                </div>
              )}
              {lead.email_sent_at && (
                <div className="text-xs text-muted-foreground">
                  Email sent {timeAgo(lead.email_sent_at)}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Activity Timeline */}
          <SectionCard icon={Clock} title="Activity Timeline">
            <ActivityTimeline activities={activities || []} />
          </SectionCard>

          {/* Recommended Properties */}
          {recommendations.length > 0 && (
            <SectionCard icon={Home} title="Recommended Properties">
              <div className="grid gap-3">
                {recommendations.map((rec, idx) => (
                  <div key={idx}
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 backdrop-blur border border-border/30 hover:bg-muted/50 transition-colors">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-white/5">
                      <Building2 className="w-6 h-6 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium truncate">{rec.property_name || `Property #${rec.property_id?.slice(0, 8)}`}</p>
                          {rec.location && <p className="text-xs text-muted-foreground mt-0.5">{rec.location}</p>}
                          {rec.price && <p className="text-xs font-medium mt-1">{formatCurrency(rec.price)}</p>}
                        </div>
                        <Badge className={cn(
                          "shrink-0",
                          rec.match_score >= 80 ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" :
                          rec.match_score >= 60 ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
                          "text-blue-500 bg-blue-500/10 border-blue-500/20"
                        )}>
                          {rec.match_score}% match
                        </Badge>
                      </div>
                      {rec.reason && (
                        <p className="text-xs text-muted-foreground/70 mt-1.5 italic leading-relaxed">{rec.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Messages Sent */}
          {messages.length > 0 && (
            <SectionCard icon={MessageCircle} title="Messages Sent">
              <div className="space-y-3">
                {messages.map((msg: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/30 backdrop-blur border border-border/30">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs capitalize">{msg.channel || "unknown"}</Badge>
                      <span className="text-xs text-muted-foreground">{msg.sent_at ? timeAgo(msg.sent_at) : ""}</span>
                    </div>
                    <p className="text-sm">{msg.content || msg.message || ""}</p>
                    {msg.status && <p className="text-xs text-muted-foreground mt-1 capitalize">Status: {msg.status}</p>}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer Information */}
          <SectionCard icon={User} title="Customer Information">
            <div className="space-y-4">
              <InfoRow icon={Phone} label="Phone" value={lead.phone} href={`tel:${lead.phone}`} />
              {lead.email && <InfoRow icon={Mail} label="Email" value={lead.email} href={`mailto:${lead.email}`} />}
              {lead.location && <InfoRow icon={MapPin} label="Location" value={lead.location} />}
              <InfoRow icon={Globe} label="Lead Source" value={lead.source?.replace(/_/g, " ")} />
              <InfoRow icon={Calendar} label="Created" value={formatDateTime(lead.created_at)} />
            </div>
          </SectionCard>

          {/* Property Requirements */}
          <SectionCard icon={ClipboardList} title="Property Requirements">
            <div className="space-y-1">
              {lead.property_type && <DetailRow label="Property Type" value={lead.property_type.replace(/_/g, " ")} />}
              {lead.bedrooms && <DetailRow label="Bedrooms" value={lead.bedrooms} />}
              {lead.preferred_area && <DetailRow label="Preferred Area" value={lead.preferred_area} />}
              {lead.timeline && <DetailRow label="Buying Timeline" value={lead.timeline.replace(/_/g, " ")} />}
              <DetailRow label="Financing Required" value={lead.financing_required} />
              {(lead.budget_min || lead.budget_max) ? (
                <DetailRow label="Budget Range" value={`${lead.budget_min ? formatCurrency(Number(lead.budget_min)) : "Not specified"} — ${lead.budget_max ? formatCurrency(Number(lead.budget_max)) : "Not specified"}`} />
              ) : (
                <DetailRow label="Budget Range" value="Not specified" />
              )}
            </div>
          </SectionCard>

          {/* AI Score */}
          <SectionCard icon={Zap} title="Lead Score">
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                {scorePercent}
              </div>
              <div className="mt-2">
                <Badge variant="outline" className={getPriorityColor(lead.priority) + " text-xs font-semibold px-3 py-1"}>
                  {lead.priority?.toUpperCase()} Priority
                </Badge>
              </div>
              <div className="mt-4 w-full bg-muted/60 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    scorePercent >= 70 ? "bg-green-500" :
                    scorePercent >= 40 ? "bg-amber-500" : "bg-blue-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${scorePercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              {(lead as any).score_explanation && (
                <p className="text-xs text-muted-foreground mt-3 italic">{(lead as any).score_explanation}</p>
              )}
            </div>
          </SectionCard>

          {/* AI Qualification Summary */}
          <SectionCard icon={Brain} title="AI Qualification Summary">
            <div className="space-y-1">
              <DetailRow label="Name" value={lead.name} />
              <DetailRow label="Phone" value={lead.phone} />
              {lead.email && <DetailRow label="Email" value={lead.email} />}
              <DetailRow label="Property Type" value={lead.property_type?.replace(/_/g, " ") || "—"} />
              <DetailRow label="Budget" value={lead.budget_min ? `${formatCurrency(Number(lead.budget_min))} — ${lead.budget_max ? formatCurrency(Number(lead.budget_max)) : "—"}` : "—"} />
              <DetailRow label="Location" value={lead.location || "—"} />
              <DetailRow label="Timeline" value={lead.timeline?.replace(/_/g, " ") || "—"} />
              <DetailRow label="Financing" value={lead.financing_required} />
              <DetailRow label="Lead Source" value={lead.source?.replace(/_/g, " ")} />
            </div>
          </SectionCard>

          {/* Lead Details */}
          <SectionCard icon={Hash} title="Lead Details">
            <div className="space-y-1">
              <DetailRow label="Workflow Status" value={lead.workflow_status || "pending"} />
              <DetailRow label="Current Stage" value={lead.current_stage?.replace(/_/g, " ") || "New Lead"} />
              <DetailRow label="Is Duplicate" value={lead.is_duplicate} />
              <DetailRow label="Last Contacted" value={lead.last_contacted_at ? timeAgo(lead.last_contacted_at) : "Never"} />
              <DetailRow label="Customer Responded" value={lead.customer_responded_at ? timeAgo(lead.customer_responded_at) : "No"} />
              <DetailRow label="Follow-up Retries" value={lead.followup_retry_count || 0} />
            </div>
            {lead.intent && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground mb-1">Original Inquiry</p>
                <p className="text-sm text-muted-foreground italic leading-relaxed">{lead.intent}</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </motion.div>
  )
}
