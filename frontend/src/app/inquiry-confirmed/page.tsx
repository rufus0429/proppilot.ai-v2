"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Home, Sparkles, ArrowRight, Loader2, Brain, Target, MessageSquare, ExternalLink, Zap } from "lucide-react"

const WORKFLOW_STEPS = [
  { key: "received", icon: CheckCircle2, label: "Inquiry Received", description: "Your property preferences have been captured", color: "text-green-500", bgColor: "bg-green-500/20" },
  { key: "matching", icon: Brain, label: "AI Matching Properties", description: "Scanning and scoring available properties against your criteria", color: "text-violet-500", bgColor: "bg-violet-500/20" },
  { key: "qualification", icon: Target, label: "Qualification Running", description: "Verifying budget, location, and requirements", color: "text-blue-500", bgColor: "bg-blue-500/20" },
  { key: "recommendation", icon: Sparkles, label: "Recommendation Generated", description: "Top matches ranked by AI precision score", color: "text-amber-500", bgColor: "bg-amber-500/20" },
  { key: "whatsapp", icon: MessageSquare, label: "WhatsApp Follow-up Generated", description: "AI crafted a personalized message for you", color: "text-emerald-500", bgColor: "bg-emerald-500/20" },
  { key: "opened", icon: ExternalLink, label: "WhatsApp Opened", description: "Conversation opened — just press Send", color: "text-blue-500", bgColor: "bg-blue-500/20" },
]

function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      <motion.span className="w-1.5 h-1.5 rounded-full bg-current" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
      <motion.span className="w-1.5 h-1.5 rounded-full bg-current" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
      <motion.span className="w-1.5 h-1.5 rounded-full bg-current" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
    </span>
  )
}

export default function InquiryConfirmedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <InquiryConfirmedContent />
    </Suspense>
  )
}

function InquiryConfirmedContent() {
  const searchParams = useSearchParams()
  const leadId = searchParams.get("lead_id")
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [whatsappUrl, setWhatsappUrl] = useState("")
  const [whatsappMessage, setWhatsappMessage] = useState("")
  const [activeStep, setActiveStep] = useState(0)
  const [showCompletion, setShowCompletion] = useState(false)
  const [loading, setLoading] = useState(true)
  const [whatsappOpened, setWhatsappOpened] = useState(false)

  useEffect(() => {
    try {
      const recs = searchParams.get("recommendations")
      if (recs) setRecommendations(JSON.parse(decodeURIComponent(recs)))
      const waUrl = searchParams.get("whatsapp_url")
      if (waUrl) setWhatsappUrl(waUrl)
      const waMsg = searchParams.get("whatsapp_message")
      if (waMsg) setWhatsappMessage(decodeURIComponent(waMsg))
    } catch {}
  }, [searchParams])

  useEffect(() => {
    if (activeStep >= WORKFLOW_STEPS.length) {
      const timer = setTimeout(() => {
        setLoading(false)
        setShowCompletion(true)
      }, 600)
      return () => clearTimeout(timer)
    }
    const stepDurations = [0, 1800, 2000, 2200, 1800, 1500]
    const delay = stepDurations[activeStep] || 2000
    const timer = setTimeout(() => setActiveStep((p) => p + 1), delay)
    return () => clearTimeout(timer)
  }, [activeStep])

  useEffect(() => {
    if (activeStep >= 5 && whatsappUrl && !whatsappOpened) {
      const timer = setTimeout(() => {
        window.open(whatsappUrl, "_blank")
        setWhatsappOpened(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [activeStep, whatsappUrl, whatsappOpened])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
  }

  const checkVariants = {
    hidden: { scale: 0, rotate: -90 },
    visible: { scale: 1, rotate: 0, transition: { type: "spring" as const, stiffness: 300, damping: 15 } },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/40 relative"
        >
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4 ring-1 ring-white/10">
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                  <Loader2 className="w-7 h-7 text-blue-400" />
                </motion.div>
              ) : (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                  <Zap className="w-7 h-7 text-emerald-400" />
                </motion.div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!showCompletion ? (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h1 className="text-2xl font-bold text-white mb-1">Processing Your Inquiry</h1>
                  <p className="text-sm text-gray-400">Our AI engine is working in real-time</p>
                </motion.div>
              ) : (
                <motion.div key="complete" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                    <Zap className="w-3 h-3" />
                    Live
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-1">Follow-up Ready!</h1>
                  <p className="text-sm text-gray-400">WhatsApp opened — just review and send</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="space-y-2.5 mb-8">
            {WORKFLOW_STEPS.map((step, idx) => {
              const StepIcon = step.icon
              const isActive = idx === activeStep && !showCompletion
              const isComplete = idx < activeStep || showCompletion

              return (
                <motion.div
                  key={step.key}
                  variants={itemVariants}
                  className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-500 ${
                    isComplete ? "border-white/10 bg-white/[0.04]" : isActive ? "border-white/15 bg-white/[0.06]" : "border-white/[0.04] bg-white/[0.02]"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                    isComplete ? step.bgColor : isActive ? "bg-white/10" : "bg-white/[0.04]"
                  }`}>
                    {isComplete && !isActive ? (
                      <motion.div key={`check-${idx}`} variants={checkVariants} initial="hidden" animate="visible">
                        <CheckCircle2 className={`w-5 h-5 ${step.color}`} />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div key={`spinner-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-blue-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </motion.div>
                    ) : (
                      <StepIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium transition-colors duration-500 ${
                        isComplete ? "text-white" : isActive ? "text-blue-300" : "text-gray-500"
                      }`}>
                        {step.label}
                      </span>
                      {isActive && <span className="text-blue-400"><LoadingDots /></span>}
                      {isComplete && !isActive && (
                        <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-medium text-emerald-500/70 uppercase tracking-wider">Done</motion.span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{step.description}</p>
                  </div>

                  {isActive && (
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2.2, ease: "easeInOut" }}
                      className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full origin-left"
                      style={{ width: "100%" }}
                    />
                  )}
                </motion.div>
              )
            })}
          </div>

          {whatsappOpened && !showCompletion && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-300 text-center">
                WhatsApp opened in a new tab. Review the message and press Send.
              </p>
            </motion.div>
          )}

          <AnimatePresence>
            {showCompletion && recommendations.length > 0 && (
              <motion.div key="recommendations" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }} className="mb-8 overflow-hidden">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-violet-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="font-semibold text-sm text-white">Top Matches Found</h3>
                  </div>
                  <div className="space-y-2">
                    {recommendations.map((rec: any, idx: number) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                        className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-between hover:bg-white/[0.06] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-[10px] font-bold text-blue-300">#{idx + 1}</div>
                          <div>
                            <p className="text-sm font-medium text-white">{rec.property_name || "Property"}</p>
                            <p className="text-xs text-gray-400">{rec.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">{rec.match_score}%</p>
                          <p className="text-[10px] text-gray-500">match</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showCompletion && (
            <motion.div variants={itemVariants} className="flex flex-col gap-3">
              <Link href={leadId ? `/leads/${leadId}` : "/"}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium hover:from-blue-500 hover:to-violet-500 transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30">
                <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                View Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-center text-[11px] text-gray-600">
                WhatsApp conversation opened — press Send to reach the customer
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
