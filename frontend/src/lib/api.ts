const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = this.getStoredToken();
  }

  private getStoredToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    const cookieToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="))
      ?.split("=")[1];

    return cookieToken ? decodeURIComponent(cookieToken) : localStorage.getItem("access_token");
  }

  private persistToken(token: string | null) {
    if (typeof window === "undefined") {
      return;
    }

    if (token) {
      localStorage.setItem("access_token", token);
      document.cookie = `access_token=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else {
      localStorage.removeItem("access_token");
      document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
    }
  }

  setToken(token: string | null) {
    this.token = token;
    this.persistToken(token);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    console.log("API URL:", `${API_BASE_URL}${endpoint}`);
console.log("Body:", options.body);

console.log("URL:", `${API_BASE_URL}${endpoint}`);
console.log("BODY:", options.body);

const response = await fetch(`${API_BASE_URL}${endpoint}`, {
  ...options,
  headers,
});

console.log("STATUS:", response.status);

if (!response.ok) {
  console.log("RESPONSE:", await response.text());
}
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  auth = {
    login: (email: string, password: string) =>
      this.post("/auth/login", { email, password }),
    register: (data: { email: string; password: string; full_name?: string; phone?: string }) =>
      this.post("/auth/register", data),
  };

  inquiry = {
    submit: (data: import("@/types").PropertyInquiryForm) =>
      this.post<import("@/types").InquirySubmitResponse>("/leads/inquiry", data),
  };

  leads = {
    list: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return this.get<import("@/types").LeadListResponse>(`/leads${query}`);
    },
    all: () => this.get<import("@/types").LeadListResponse>("/leads?size=200"),
    get: (id: string) =>
      this.get<import("@/types").Lead>(`/leads/${id}`),
    create: (data: Partial<import("@/types").Lead>) =>
      this.post<import("@/types").Lead>("/leads", data),
    update: (id: string, data: Partial<import("@/types").Lead>) =>
      this.patch<import("@/types").Lead>(`/leads/${id}`, data),
    qualify: (id: string) =>
      this.post<import("@/types").LeadQualificationResult>(`/leads/${id}/qualify`),
    score: (id: string) =>
      this.post<import("@/types").LeadScoringResult>(`/leads/${id}/score`),
    recommend: (id: string) =>
      this.post<{ recommendations: import("@/types").PropertyRecommendation[] }>(`/leads/${id}/recommend`),
    journey: (id: string) =>
      this.post<{ sequence: import("@/types").JourneyStep[] }>(`/leads/${id}/journey`),
    workflow: (id: string) =>
      this.post<any>(`/leads/${id}/workflow`),
    responded: (id: string) =>
      this.post<any>(`/leads/${id}/responded`),
    activities: (id: string) =>
      this.get<import("@/types").Activity[]>(`/leads/${id}/activities`),
    dashboard: () =>
      this.get<import("@/types").DashboardStats>("/leads/dashboard"),
  };

  properties = {
    list: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return this.get<any>(`/properties${query}`);
    },
    get: (id: string) =>
      this.get<import("@/types").Property>(`/properties/${id}`),
    create: (data: Partial<import("@/types").Property>) =>
      this.post<import("@/types").Property>("/properties", data),
    update: (id: string, data: Partial<import("@/types").Property>) =>
      this.patch<import("@/types").Property>(`/properties/${id}`, data),
  };

  appointments = {
    list: () => this.get<import("@/types").Appointment[]>("/appointments"),
    create: (data: Partial<import("@/types").Appointment>) =>
      this.post<import("@/types").Appointment>("/appointments", data),
    update: (id: string, data: Partial<import("@/types").Appointment>) =>
      this.patch<import("@/types").Appointment>(`/appointments/${id}`, data),
  };
}

export const api = new ApiClient();
