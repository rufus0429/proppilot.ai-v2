"use client"

import React, { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  UserPlus, Brain, Target, Home, MessageSquare, Clock,
  ChevronDown, ChevronUp, CheckCircle2, Loader2, XCircle,
  Activity, Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AgentStatus = "pending" | "running" | "completed" | "failed"

interface Agent {
  id: string
  name: string
  icon: any
  color: string
  bgColor: string
  borderColor: string
  glowColor: string
  status: AgentStatus
  description: string
  details: string
}

const defaultAgents: Agent[] = [
  {
    id: "intake",
    name: "Lead Intake",
    icon: UserPlus,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    glowColor: "rgba(59,130,246,0.3)",
    status: "completed",
    description: "Captures and validates incoming leads from all channels",
    details: "Extracts contact info, property preferences, and budget details from website forms, WhatsApp, and phone calls using NLP.",
  },
  {
    id: "qualification",
    name: "Qualification",
    icon: Brain,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    glowColor: "rgba(168,85,247,0.3)",
    status: "completed",
    description: "AI-driven qualification using NLP and intent analysis",
    details: "Analyzes lead responses to determine buying intent, timeline, budget fit, and readiness using sentiment analysis.",
  },
  {
    id: "scoring",
    name: "Scoring",
    icon: Target,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    glowColor: "rgba(245,158,11,0.3)",
    status: "completed",
    description: "Predictive lead scoring with ML models",
    details: "Assigns a score (0-100) based on demographic fit, engagement level, budget alignment, and historical conversion patterns.",
  },
  {
    id: "recommendation",
    name: "Recommendation",
    icon: Home,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    glowColor: "rgba(99,102,241,0.3)",
    status: "completed",
    description: "Property matching and recommendation engine",
    details: "Matches lead preferences against the property catalog using vector similarity and constraint-based filtering.",
  },
  {
    id: "followup",
    name: "Follow-up",
    icon: MessageSquare,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    glowColor: "rgba(34,197,94,0.3)",
    status: "completed",
    description: "Automated multi-channel follow-up sequences",
    details: "Triggers personalized email, SMS, and WhatsApp sequences with smart timing based on lead behavior.",
  },
  {
    id: "waiting",
    name: "Waiting",
    icon: Clock,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    glowColor: "rgba(6,182,212,0.3)",
    status: "completed",
    description: "Grace period before next action or escalation",
    details: "Monitors lead activity during a configurable cooldown period before escalating to human agents.",
  },
]

const statusOptions: { value: AgentStatus; label: string }[] = [
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
]

const statusIcon: Record<AgentStatus, any> = {
  pending: Loader2,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
}

function AnimatedArrow({ index, active }: { index: number; active: boolean }) {
  return (
    <div className="flex justify-center py-1">
      <div className="relative w-0.5 h-10 md:h-14">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 via-white/30 to-white/5" />
        {active && (
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-6 rounded-full bg-gradient-to-b from-primary to-primary/50 shadow-lg shadow-primary/50"
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 40, opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 1.2,
              delay: index * 0.8,
              ease: "easeInOut",
              repeat: 0,
            }}
          />
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: AgentStatus }) {
  const Icon = statusIcon[status]
  const colors: Record<AgentStatus, string> = {
    pending: "text-muted-foreground",
    running: "text-blue-400",
    completed: "text-green-400",
    failed: "text-red-400",
  }
  const labels: Record<AgentStatus, string> = {
    pending: "Pending",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", colors[status])}>
      <Icon className={cn("w-3 h-3", status === "running" && "animate-spin")} />
      {labels[status]}
    </span>
  )
}

export default function WorkflowPage() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents)
  const [isSimulating, setIsSimulating] = useState(false)
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)

  const simulateWorkflow = useCallback(async () => {
    if (isSimulating) return
    setIsSimulating(true)

    setAgents((prev) => prev.map((a) => ({ ...a, status: "pending" as const })))

    for (let i = 0; i < agents.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      setAgents((prev) => prev.map((a, idx) => (idx === i ? { ...a, status: "running" as const } : a)))
      await new Promise((resolve) => setTimeout(resolve, 800))
      setAgents((prev) => prev.map((a, idx) => (idx === i ? { ...a, status: "completed" as const } : a)))
    }

    setIsSimulating(false)
  }, [agents.length, isSimulating])

  const handleStatusChange = (agentId: string, newStatus: AgentStatus) => {
    setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, status: newStatus } : a)))
  }

  const stats = {
    totalLeads: "128",
    avgScore: "85%",
    completionRate: "94%",
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow</h1>
          <p className="text-muted-foreground mt-1">Autonomous AI Agent Pipeline</p>
        </div>
        <Button
          onClick={simulateWorkflow}
          disabled={isSimulating}
          className="gap-2"
        >
          {isSimulating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isSimulating ? "Simulating..." : "Simulate"}
        </Button>
      </div>

      <Card className="relative overflow-hidden border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <CardContent className="p-6 md:p-10">
          <div className="flex flex-col items-center">
            {agents.map((agent, index) => (
              <React.Fragment key={agent.id}>
                <motion.div
                  className="w-full max-w-md"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
                >
                  <div
                    className={cn(
                      "relative p-5 rounded-2xl border backdrop-blur-md transition-all duration-500",
                      "bg-white/[0.03] hover:bg-white/[0.06]",
                      agent.borderColor,
                      agent.status === "running" && "ring-2 ring-primary/50 shadow-lg shadow-primary/20",
                      agent.status === "completed" && "opacity-100",
                      agent.status === "pending" && "opacity-50",
                      agent.status === "failed" && "border-red-500/50 bg-red-500/5",
                    )}
                    style={{
                      boxShadow: agent.status === "running" ? `0 0 30px ${agent.glowColor}` : undefined,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-all duration-500",
                          agent.bgColor,
                          agent.status === "running" && "scale-110",
                        )}
                      >
                        <agent.icon className={cn("w-6 h-6", agent.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-sm">{agent.name}</h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-5",
                              agent.status === "completed" && "border-green-500/30 text-green-400",
                              agent.status === "running" && "border-blue-500/30 text-blue-400",
                              agent.status === "failed" && "border-red-500/30 text-red-400",
                              agent.status === "pending" && "border-white/10 text-muted-foreground",
                            )}
                          >
                            <StatusBadge status={agent.status} />
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                      </div>
                      <select
                        value={agent.status}
                        onChange={(e) => handleStatusChange(agent.id, e.target.value as AgentStatus)}
                        className={cn(
                          "text-xs bg-transparent border rounded-md px-2 py-1 outline-none cursor-pointer appearance-none",
                          "border-white/10 text-muted-foreground hover:text-foreground transition-colors",
                        )}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-background">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
                {index < agents.length - 1 && (
                  <AnimatedArrow index={index} active={isSimulating} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-primary" />
              Workflow Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Leads", value: stats.totalLeads, color: "text-blue-400" },
                { label: "Avg Score", value: stats.avgScore, color: "text-amber-400" },
                { label: "Completion", value: stats.completionRate, color: "text-green-400" },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-xs text-muted-foreground">
                The AI pipeline processed <span className="text-foreground font-medium">{stats.totalLeads}</span> leads with a{" "}
                <span className="text-green-400 font-medium">{stats.completionRate}</span> completion rate and an average score of{" "}
                <span className="text-amber-400 font-medium">{stats.avgScore}</span>.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              Agent Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agents.map((agent) => (
              <div key={agent.id} className="rounded-xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg shrink-0", agent.bgColor)}>
                    <agent.icon className={cn("w-4 h-4", agent.color)} />
                  </div>
                  <span className="text-sm font-medium flex-1">{agent.name}</span>
                  <StatusBadge status={agent.status} />
                  {expandedAgent === agent.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedAgent === agent.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-0">
                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                          <p className="text-xs text-muted-foreground leading-relaxed">{agent.details}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
