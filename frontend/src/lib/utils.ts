import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  if (amount >= 100) {
    const lakhs = amount;
    if (lakhs >= 100) {
      return `₹${(lakhs / 100).toFixed(1)} Cr`;
    }
    return `₹${lakhs} L`;
  }
  return `₹${(amount * 100000).toLocaleString("en-IN")}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "hot":
      return "text-red-500 bg-red-500/10";
    case "warm":
      return "text-amber-500 bg-amber-500/10";
    case "cold":
      return "text-blue-500 bg-blue-500/10";
    default:
      return "text-muted-foreground bg-muted";
  }
}

export function getStatusColor(stage: string): string {
  switch (stage) {
    case "new_lead":
      return "text-blue-500 bg-blue-500/10";
    case "qualified":
      return "text-purple-500 bg-purple-500/10";
    case "hot_lead":
      return "text-red-500 bg-red-500/10";
    case "recommendation_sent":
      return "text-indigo-500 bg-indigo-500/10";
    case "followup_active":
      return "text-amber-500 bg-amber-500/10";
    case "customer_responded":
      return "text-green-500 bg-green-500/10";
    case "site_visit_scheduled":
      return "text-cyan-500 bg-cyan-500/10";
    case "negotiation":
      return "text-orange-500 bg-orange-500/10";
    case "booked":
      return "text-emerald-500 bg-emerald-500/10";
    case "lost":
      return "text-red-500 bg-red-500/10";
    default:
      return "text-muted-foreground bg-muted";
  }
}
