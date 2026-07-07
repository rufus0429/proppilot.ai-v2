"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, Play, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function DemoBar() {
  const router = useRouter()
  const [leadId] = useState<string | null>(null)

  const handleRunWorkflow = async () => {
    if (!leadId) {
      toast.error("Generate a lead first")
      return
    }
    toast.success("Running demo workflow...")
    router.push(`/leads/${leadId}`)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="container mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1 px-3 py-1">
            <Sparkles className="w-3 h-3" />
            Demo Mode
          </Badge>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Test the platform with sample data
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleRunWorkflow}
            disabled={!leadId}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            Run Demo Workflow
          </Button>
          {leadId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push(`/leads/${leadId}`)}
              className="gap-1"
            >
              View Lead
              <ArrowRight className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
