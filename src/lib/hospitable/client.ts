import type {
  HospitableReservation,
  HospitableProperty,
  PaginatedResponse,
} from "./types";

export class HospitableClient {
  private baseUrl: string;
  private pat: string;

  constructor(pat?: string, baseUrl = "https://api.hospitable.com/v2") {
    this.pat = pat || process.env.HOSPITABLE_PAT || "";
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.pat}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Hospitable API error ${response.status}: ${text}`
      );
    }

    return response.json();
  }

  async getProperties(params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<HospitableProperty>> {
    return this.request("/properties", {
      page: String(params?.page || 1),
      per_page: String(params?.per_page || 50),
    });
  }

  async getReservations(params?: {
    properties?: string[];
    start_date?: string;
    end_date?: string;
    include?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<HospitableReservation>> {
    const queryParams: Record<string, string> = {
      page: String(params?.page || 1),
      per_page: String(params?.per_page || 50),
    };

    if (params?.start_date) queryParams.start_date = params.start_date;
    if (params?.end_date) queryParams.end_date = params.end_date;
    if (params?.include) queryParams.include = params.include;
    if (params?.properties?.length) {
      queryParams["properties[]"] = params.properties.join(",");
    }

    return this.request("/reservations", queryParams);
  }

  async getReservation(
    uuid: string,
    include?: string
  ): Promise<{ data: HospitableReservation }> {
    const params: Record<string, string> = {};
    if (include) params.include = include;
    return this.request(`/reservations/${uuid}`, params);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getProperties({ per_page: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

export const hospitable = new HospitableClient();
