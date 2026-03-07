export type UserRole = "TENANT" | "FIELD_OFFICER" | "FARMER";

export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type CsvJobStatus = "PROCESSING" | "COMPLETED" | "FAILED";

export interface Tenant {
  id: string;
  name: string;
  email: string;
}

export interface User {
  id: string;
  email: string | null;
  mobile: string | null;
  role: UserRole;
  tenant_id: string | null;
  is_active: boolean;
  Tenant?: Tenant;
}

export interface FarmerAddress {
  id?: string;
  farmer_id?: string;
  village?: string;
  taluka?: string;
  district?: string;
}

export interface FarmerProfileDetails {
  id?: string;
  farmer_id?: string;
  fpc?: string;
  shg?: string;
  ration_card?: boolean;
}

export interface FarmerBank {
  id?: string;
  farmer_id?: string;
  bank_name?: string | null;
  ifsc_code?: string | null;
  account_number?: string | null;
  verified?: boolean;
}

export interface FarmerLand {
  id?: string;
  farmer_id?: string;
  land_size?: number | string;
  crop_type?: string;
  irrigation_type?: string;
}

export interface FarmerDoc {
  id?: string;
  farmer_id?: string;
  aadhaar_number?: string | null;
  pan_number?: string | null;
  shg_byelaws_url?: string | null;
  extract_7_12_url?: string | null;
  consent_letter_url?: string | null;
  aadhaar_url?: string | null;
  pan_url?: string | null;
  bank_doc_url?: string | null;
  ration_card_url?: string | null;
  survey_form_url?: string | null;
  other_doc_url?: string | null;
}

export interface Farmer {
  id: string;
  farmer_code: string;
  user_id: string | null;
  tenant_id: string;
  name: string;
  mobile: string | null;
  is_activated: boolean;
  created_by_agent_id: string | null;
  profile_pic_url?: string | null;
  created_at: string;
  updated_at: string;
  FarmerAddress?: FarmerAddress | null;
  FarmerBank?: FarmerBank | null;
  /** API returns singular (Sequelize alias); support both for compatibility */
  FarmerProfileDetail?: FarmerProfileDetails | null;
  FarmerProfileDetails?: FarmerProfileDetails | null;
  FarmerDoc?: FarmerDoc | null;
  FarmerLands?: FarmerLand[];
  FarmerAgentMaps?: Array<{ Agent?: { id: string; email: string | null; mobile: string | null } }>;
  User?: User | null;
}

export interface FarmerCreatePayload {
  farmer_code: string;
  name: string;
  mobile?: string | null;
  is_activated?: boolean;
  profile_pic_url?: string | null;
  address?: FarmerAddress | null;
  bankDetails?: FarmerBank | null;
  profileDetails?: FarmerProfileDetails | null;
  docs?: FarmerDoc | null;
  lands?: FarmerLand[];
}

export interface CsvUploadJob {
  id: string;
  tenant_id: string;
  file_name: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  status: CsvJobStatus;
  created_at: string;
}

export interface AnalyticsSummary {
  total_farmers: number;
  unique_fpcs: number;
  unique_shgs: number;
}

export interface AnalyticsByKey {
  district?: string;
  agent_id?: string;
  fpc?: string;
  village?: string;
  taluka?: string;
  month?: string;
  count: number;
}

export interface AnalyticsRationCardStats {
  with_ration_card: number;
  without_ration_card: number;
}

export interface PaginationState {
  page: number;
  limit: number;
}

export interface FarmerFilters {
  district?: string;
  state?: string;
  fpc?: string;
}

/** List page: filter by presence of data (multi-select). Only true values are sent to API. */
export interface FarmerListFilters {
  has_ration_card?: boolean;
  has_profile_pic?: boolean;
  has_bank_details?: boolean;
  has_document?: boolean;
  has_fhc?: boolean;
  has_shg?: boolean;
  fpc?: string | null;
  shg?: string | null;
}

/** List page: sort column and direction. */
export interface FarmerListSort {
  sortBy?: "farmer_code" | "name" | "village" | "district" | "fpc" | "shg";
  sortOrder?: "asc" | "desc";
}
