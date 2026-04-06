import type {
  HospitableReservation,
  HospitableProperty,
  PaginatedResponse,
} from "./types";

export class HospitableClient {
  private baseUrl: string;
  private pat: string;

  constructor(pat?: string, baseUrl = "https://public.api.hospitable.com/v2") {
    this.pat = pat || process.env.HOSPITABLE_PAT || "";
    this.baseUrl = baseUrl;
  }

  private async fetchApi<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.pat}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Hospitable API error ${response.status}: ${text}`);
    }

    return response.json();
  }

  async getProperties(params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<HospitableProperty>> {
    const url = new URL(`${this.baseUrl}/properties`);
    url.searchParams.set("page", String(params?.page || 1));
    url.searchParams.set("per_page", String(params?.per_page || 50));
    return this.fetchApi(url.toString());
  }

  async getReservations(params?: {
    properties?: string[];
    start_date?: string;
    end_date?: string;
    include?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<HospitableReservation>> {
    const url = new URL(`${this.baseUrl}/reservations`);
    url.searchParams.set("page", String(params?.page || 1));
    url.searchParams.set("per_page", String(params?.per_page || 50));

    if (params?.start_date) url.searchParams.set("start_date", params.start_date);
    if (params?.end_date) url.searchParams.set("end_date", params.end_date);
    if (params?.include) url.searchParams.set("include", params.include);

    // Each property UUID as a separate properties[] param
    if (params?.properties?.length) {
      for (const propId of params.properties) {
        url.searchParams.append("properties[]", propId);
      }
    }

    return this.fetchApi(url.toString());
  }

  async getReservation(
    uuid: string,
    include?: string
  ): Promise<{ data: HospitableReservation }> {
    const url = new URL(`${this.baseUrl}/reservations/${uuid}`);
    if (include) url.searchParams.set("include", include);
    return this.fetchApi(url.toString());
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
