"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Clock, MapPin } from "lucide-react"
import { formatDateTime, getStatusColor } from "@/lib/utils"
import type { Appointment } from "@/types"

export default function AppointmentsPage() {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => api.appointments.list(),
  })

  const items = appointments || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-1">Site visits and meetings</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Visit
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted rounded animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No appointments scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((apt: Appointment) => (
            <Card key={apt.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{apt.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(apt.scheduled_at)}
                      </span>
                      {apt.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {apt.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(apt.status)}>
                  {apt.status.replace(/_/g, " ")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
