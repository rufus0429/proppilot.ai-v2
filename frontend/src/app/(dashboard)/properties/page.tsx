"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Building2, Search, Plus, MapPin, BedDouble, Bath, Maximize2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Property } from "@/types"

export default function PropertiesPage() {
  const [search, setSearch] = useState("")
  const { data, isLoading } = useQuery({
    queryKey: ["properties", search],
    queryFn: () => api.properties.list({ ...(search ? { search } : {}), size: "50" }),
  })

  const properties = data?.items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground mt-1">{data?.total || 0} properties listed</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search properties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No properties found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property: Property) => (
            <Card key={property.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {property.location}
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">{property.property_type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-3">{formatCurrency(Number(property.price))}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {property.bedrooms && (
                    <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {property.bedrooms} BHK</span>
                  )}
                  {property.bathrooms && (
                    <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {property.bathrooms}</span>
                  )}
                  {property.area_sqft && (
                    <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" /> {property.area_sqft} sqft</span>
                  )}
                </div>
                {property.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{property.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
