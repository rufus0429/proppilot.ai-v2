"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, Shield, Bell, Key, Database, Bot, Zap } from "lucide-react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function SettingsPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Configure your real estate AI parameters and platform settings</p>
      </div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* AI Workflow Config */}
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-xl border-white/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Autonomous AI Agents Configuration
                </CardTitle>
                <CardDescription>Adjust how the AI handles incoming inquiries and executes follow-ups.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-white/5">
                  <div>
                    <p className="text-sm font-medium">Auto-Qualify New Leads</p>
                    <p className="text-xs text-muted-foreground">Instantly run AI qualification when inquiry is received.</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-white/5">
                  <div>
                    <p className="text-sm font-medium">Personalized WhatsApp Sequence</p>
                    <p className="text-xs text-muted-foreground">Automatically pre-populate the wa.me messages with match reasons.</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-white/5">
                  <div>
                    <p className="text-sm font-medium">Gemini Fallback Logic</p>
                    <p className="text-xs text-muted-foreground">Fallback to rules if rate limits (429) or tokens are exhausted.</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Config */}
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-xl border-white/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Security & Authentication
                </CardTitle>
                <CardDescription>Manage keys, roles, and admin permissions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-white/5">
                  <div>
                    <p className="text-sm font-medium">Extended JWT Session Expiry</p>
                    <p className="text-xs text-muted-foreground">Admin token sessions remain valid for 7 days.</p>
                  </div>
                  <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">7 Days</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-white/5">
                  <div>
                    <p className="text-sm font-medium">Developer Mode</p>
                    <p className="text-xs text-muted-foreground">Logs agent pipeline details into output terminals.</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar Status Info */}
        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-xl border-white/5 bg-gradient-to-br from-primary/[0.03] to-transparent">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Database Type</span>
                  <span className="font-medium text-primary">SQLite (proppilot.db)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Frontend Framework</span>
                  <span className="font-medium">Next.js 15.1.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Backend API</span>
                  <span className="font-medium">FastAPI + Uvicorn</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Agent Orchestrator</span>
                  <span className="font-medium">LangGraph Engine</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">LLM Provider</span>
                  <span className="font-medium">Gemini 1.5 + Fallback rules</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
