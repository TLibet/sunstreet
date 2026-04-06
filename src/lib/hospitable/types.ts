export type HospitableReservation = {
  uuid: string;
  booking_code: string;
  platform: string;
  listing_uuid: string;
  listing_name: string;
  property_uuid: string;
  property_name: string;
  check_in: string;
  check_out: string;
  check_in_hour: string;
  check_out_hour: string;
  booking_date: string;
  status: string;
  instant_booking: boolean;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_location: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  financials?: HospitableFinancials;
};

export type HospitableFinancials = {
  currency: string;
  accommodation_total: number;
  cleaning_fee: number;
  host_service_fee: number;
  guest_service_fee: number;
  pass_through_taxes: number;
  remitted_taxes: number;
  pet_fee: number;
  extra_guest_fee: number;
  security_deposit: number;
  resolution_adjustment: number;
  payout: number;
  nightly_rates?: { date: string; rate: number }[];
};

export type HospitableProperty = {
  uuid: string;
  name: string;
  address: string;
  platform: string;
  listing_uuid: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};
