"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { api } from "@/lib/api"
import { Building2, MapPin, IndianRupee, BedDouble, Clock, Banknote, User, Phone, Mail, MessageSquare, ChevronLeft, ChevronRight, Send, Home } from "lucide-react"

const propertyTypes = [
  { value: "apartment", label: "Apartment", icon: Building2 },
  { value: "villa", label: "Villa", icon: Home },
  { value: "plot", label: "Plot", icon: MapPin },
  { value: "commercial", label: "Commercial", icon: Building2 },
]

const budgets = [
  { label: "Under ₹30 Lakhs", min: 0, max: 30 },
  { label: "₹30 - ₹50 Lakhs", min: 30, max: 50 },
  { label: "₹50 Lakhs - ₹1 Crore", min: 50, max: 100 },
  { label: "₹1 - ₹2 Crores", min: 100, max: 200 },
  { label: "₹2 - ₹5 Crores", min: 200, max: 500 },
  { label: "₹5+ Crores", min: 500, max: undefined },
  { label: "Not Sure", min: undefined, max: undefined },
]

const bedroomOptions = [
  { value: 1, label: "1 BHK" },
  { value: 2, label: "2 BHK" },
  { value: 3, label: "3 BHK" },
  { value: 4, label: "4+ BHK" },
]

const timelineOptions = [
  { value: "immediately", label: "Immediately", icon: Clock },
  { value: "within_1_month", label: "Within 1 Month", icon: Clock },
  { value: "within_3_months", label: "Within 3 Months", icon: Clock },
  { value: "within_6_months", label: "Within 6 Months", icon: Clock },
  { value: "just_exploring", label: "Just Exploring", icon: Clock },
]

type FormData = {
  property_type: string
  city: string
  area: string
  budget_min?: number
  budget_max?: number
  bedrooms?: number
  timeline: string
  financing_required: boolean
  name: string
  phone: string
  email: string
  notes: string
}

const initialForm: FormData = {
  property_type: "",
  city: "",
  area: "",
  bedrooms: undefined,
  timeline: "",
  financing_required: false,
  name: "",
  phone: "",
  email: "",
  notes: "",
}

const STORAGE_KEY = "proppilot_inquiry_form"
const STEP_KEY = "proppilot_inquiry_step"

function loadSavedForm(): FormData {
  if (typeof window === "undefined") return initialForm
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...initialForm, ...JSON.parse(saved) }
  } catch {}
  return initialForm
}

function loadSavedStep(): number {
  if (typeof window === "undefined") return 0
  try {
    const saved = localStorage.getItem(STEP_KEY)
    if (saved !== null) return parseInt(saved, 10)
  } catch {}
  return 0
}

export default function PropertyInquiryForm() {
  const router = useRouter()
  const [step, setStep] = useState(loadSavedStep)
  const [form, setForm] = useState<FormData>(loadSavedForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)) } catch {}
    }
  }, [form, loaded])

  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem(STEP_KEY, String(step)) } catch {}
    }
  }, [step, loaded])

  const update = (field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const steps = [
    {
      title: "Property Type",
      description: "What type of property are you looking for?",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {propertyTypes.map((pt) => {
            const Icon = pt.icon
            return (
              <button
                key={pt.value}
                type="button"
                onClick={() => update("property_type", pt.value)}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  form.property_type === pt.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{pt.label}</p>
              </button>
            )
          })}
        </div>
      ),
    },
    {
      title: "Location",
      description: "Where are you looking to buy?",
      content: (
        <div className="space-y-4">
          <div>
            <Label>Preferred City</Label>
            <Input
              placeholder="e.g. Mumbai, Bangalore, Hyderabad"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </div>
          <div>
            <Label>Preferred Area (Optional)</Label>
            <Input
              placeholder="e.g. Whitefield, Banjara Hills, Andheri"
              value={form.area}
              onChange={(e) => update("area", e.target.value)}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Budget Range",
      description: "What's your budget?",
      content: (
        <div className="grid grid-cols-2 gap-2">
          {budgets.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => {
                update("budget_min", b.min)
                update("budget_max", b.max)
              }}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                form.budget_min === b.min && form.budget_max === b.max
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="text-sm font-medium">{b.label}</p>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Bedrooms",
      description: "How many bedrooms do you need?",
      content: (
        <div className="grid grid-cols-4 gap-3">
          {bedroomOptions.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => update("bedrooms", b.value)}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                form.bedrooms === b.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="text-sm font-medium">{b.label}</p>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Timeline",
      description: "When are you planning to buy?",
      content: (
        <div className="grid grid-cols-1 gap-2">
          {timelineOptions.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => update("timeline", t.value)}
                className={`p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all ${
                  form.timeline === t.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Icon className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium">{t.label}</p>
              </button>
            )
          })}
        </div>
      ),
    },
    {
      title: "Home Loan",
      description: "Do you need a home loan?",
      content: (
        <RadioGroup
          value={form.financing_required ? "yes" : "no"}
          onValueChange={(v) => update("financing_required", v === "yes")}
          className="grid grid-cols-2 gap-4"
        >
          <Label className="p-4 rounded-lg border-2 border-border hover:border-primary/50 cursor-pointer text-center [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/10">
            <RadioGroupItem value="yes" className="sr-only" />
            <Banknote className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Yes, I need a loan</p>
          </Label>
          <Label className="p-4 rounded-lg border-2 border-border hover:border-primary/50 cursor-pointer text-center [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/10">
            <RadioGroupItem value="no" className="sr-only" />
            <Building2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">No, self-funded</p>
          </Label>
        </RadioGroup>
      ),
    },
    {
      title: "Your Details",
      description: "How can we reach you?",
      content: (
        <div className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Email (Optional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Additional Notes (Optional)</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea
                className="w-full min-h-[80px] rounded-lg border border-input bg-background pl-9 p-3 text-sm"
                placeholder="Any specific requirements..."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>
          </div>
        </div>
      ),
    },
  ]

  const canProceed = () => {
    switch (step) {
      case 0: return !!form.property_type
      case 1: return !!form.city.trim()
      case 2: return true
      case 3: return true
      case 4: return !!form.timeline
      case 5: return true
      case 6: return !!form.name.trim() && form.phone.trim().length >= 10
      default: return true
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError("")
    try {
      const submissionPayload = {
        ...form,
        source: "website",
      }
      const data = await api.inquiry.submit(submissionPayload)
      try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(STEP_KEY) } catch {}
      const params = new URLSearchParams({
        lead_id: data.lead_id || "",
        recommendations: encodeURIComponent(JSON.stringify(data.recommendations || [])),
      })
      if (data.whatsapp_url) params.set("whatsapp_url", data.whatsapp_url)
      if (data.whatsapp_message) params.set("whatsapp_message", encodeURIComponent(data.whatsapp_message))
      router.push(`/inquiry-confirmed?${params.toString()}`)
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-xl mx-auto border-primary/20">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Home className="w-6 h-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Find Your Dream Property</CardTitle>
        <CardDescription>Tell us what you're looking for and our AI will find the best matches</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="min-h-[280px]">
          <div className="mb-4">
            <p className="text-lg font-semibold">{steps[step].title}</p>
            <p className="text-sm text-muted-foreground">{steps[step].description}</p>
          </div>
          {steps[step].content}
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-3">{error}</p>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !canProceed()}>
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  Find Properties <Send className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
