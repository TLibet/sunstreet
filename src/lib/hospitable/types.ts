// Hospitable API v2 actual response types
export type HospitableReservation = {
  id: string;
  code: string;
  platform: string;
  platform_id: string;
  booking_date: string;
  arrival_date: string;
  departure_date: string;
  check_in: string;
  check_out: string;
  nights: number;
  stay_type: string;
  status: string;
  guests: {
    total: number;
    adult_count: number;
    child_count: number;
    infant_count: number;
    pet_count: number;
  };
  guest?: {
    name: string;
    email: string;
    phone: string;
  };
  financials?: {
    currency: string;
    host: {
      accommodation: { amount: number; formatted: string };
      accommodation_breakdown: { amount: number; formatted: string; label: string }[];
      guest_fees: { amount: number; formatted: string; label: string }[];
      host_fees: { amount: number; formatted: string; label: string }[];
      taxes: { amount: number; formatted: string; label: string }[];
      discounts: { amount: number; formatted: string; label: string }[];
      adjustments: { amount: number; formatted: string; label: string }[];
      revenue: { amount: number; formatted: string };
    };
  };
  [key: string]: any;
};

export type HospitableProperty = {
  uuid: string;
  id: string;
  name: string;
  nickname?: string;
  address: any;
  platform?: string;
  [key: string]: any;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
    [key: string]: any;
  };
};
