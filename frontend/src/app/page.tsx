"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import PropertyInquiryForm from "@/components/PropertyInquiryForm"
import { Home, Building2, Shield, Zap, ArrowRight, Menu, X, MessageSquare, Bot, CheckCircle2, Sparkles } from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const },
  },
}

const features = [
  {
    icon: Zap,
    title: "AI-Powered Matching",
    desc: "Our AI analyzes your preferences and finds the best properties instantly.",
  },
  {
    icon: MessageSquare,
    title: "Automated Follow-ups",
    desc: "Intelligent WhatsApp and email sequences keep you informed without lifting a finger.",
  },
  {
    icon: Shield,
    title: "Zero Spam",
    desc: "No unwanted calls. Our AI handles everything until you're ready to take the next step.",
  },
]

const steps = [
  { num: "01", label: "Tell Us Your Preferences", icon: MessageSquare },
  { num: "02", label: "AI Matches Properties", icon: Bot },
  { num: "03", label: "Get Recommendations", icon: CheckCircle2 },
]

export default function LandingPage() {
  const [showForm, setShowForm] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  if (showForm) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--background))_0%,_hsl(var(--background))_50%,_hsl(142.1_76.2%_36.3%_/_0.03)_100%)]">
        <header className="border-b border-white/5">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                <Home className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">PropPilot AI</span>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setShowForm(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
            >
              ← Back
            </motion.button>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PropertyInquiryForm />
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--background))_0%,_hsl(var(--background))_50%,_hsl(142.1_76.2%_36.3%_/_0.03)_100%)] overflow-hidden">
      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-50 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Home className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">PropPilot AI</span>
          </motion.div>

          <nav className="hidden md:flex items-center gap-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Agent Login
              </Link>
            </motion.div>
          </nav>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden relative z-50"
          >
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-white/5 px-4 py-4 md:hidden bg-background/95 backdrop-blur-xl"
          >
            <Link
              href="/login"
              className="block text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
              onClick={() => setMobileMenu(false)}
            >
              Agent Login
            </Link>
          </motion.div>
        )}
      </header>

      <main className="relative">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.3)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Property Matching
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
            >
              Find Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">
                Dream
              </span>{" "}
              Property with AI
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Tell us what you&apos;re looking for, and our AI will instantly match you with the
              perfect properties. No browsing, no hassle. Our intelligent agents handle everything
              — from matching to follow-ups.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={() => setShowForm(true)}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:translate-y-[-2px]"
              >
                Find Your Dream Property
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-foreground font-semibold text-lg hover:bg-white/10 transition-all hover:translate-y-[-2px]"
              >
                <Bot className="w-5 h-5" />
                Talk to AI
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="group p-8 rounded-2xl bg-card/50 backdrop-blur-xl border border-white/5 hover:border-primary/20 transition-all duration-500 hover:shadow-[0_0_30px_-8px_hsl(var(--primary)/0.15)] hover:translate-y-[-4px]"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Process Section */}
        <section className="max-w-4xl mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
            >
              How It Works
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-muted-foreground max-w-md mx-auto"
            >
              Three simple steps to find your perfect property match.
            </motion.p>
          </motion.div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[calc(16.666%+1.5rem)] right-[calc(16.666%+1.5rem)] h-[2px] bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40" />

            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={scaleIn}
                custom={i}
                className="flex flex-col items-center text-center relative px-4"
              >
                <div className="relative z-10 w-24 h-24 rounded-2xl bg-card/50 backdrop-blur-xl border border-white/5 flex items-center justify-center mb-6 shadow-lg group hover:border-primary/20 hover:shadow-[0_0_30px_-8px_hsl(var(--primary)/0.15)] transition-all duration-500">
                  <s.icon className="w-8 h-8 text-primary" />
                </div>
                <span className="text-xs font-mono text-primary/60 mb-2 tracking-widest">
                  {s.num}
                </span>
                <h3 className="text-sm font-semibold max-w-[14ch]">{s.label}</h3>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/5 mt-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between text-sm text-muted-foreground">
          <span>&copy; 2026 PropPilot AI. All rights reserved.</span>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="hover:text-foreground transition-colors"
            >
              Agent Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
