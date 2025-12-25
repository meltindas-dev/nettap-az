import { TechnologyType, LeadStatus, LeadSource, UserRole } from './enums';

/**
 * User entity for authentication
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  ispId?: string; // Only set for ISP users
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ISP (Internet Service Provider) entity
 */
export interface ISP {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  priorityScore: number; // Higher score = higher ranking in results
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * City entity
 */
export interface City {
  id: string;
  name: string;
  nameAz: string; // Azerbaijani name
  nameEn: string; // English name
  isActive: boolean;
}

/**
 * District entity (belongs to City)
 */
export interface District {
  id: string;
  cityId: string;
  name: string;
  nameAz: string;
  nameEn: string;
  isActive: boolean;
}

/**
 * Campaign feature flags
 */
export interface CampaignFlags {
  freeModem: boolean;
  freeInstallation: boolean;
  discountPercentage?: number; // e.g., 20 for 20% discount
  giftIncluded?: string; // e.g., "Free router upgrade"
  limitedTime?: boolean;
  noContract?: boolean; // No contract required
}

/**
 * Tariff entity (belongs to ISP)
 */
export interface Tariff {
  id: string;
  ispId: string;
  name: string;
  description?: string;
  technology: TechnologyType;
  speedMbps: number; // Download speed in Mbps
  uploadSpeedMbps?: number; // Upload speed in Mbps
  priceMonthly: number; // Monthly price in AZN
  contractLengthMonths: number; // 0 = no contract, 12 = 12 months, etc.
  dataLimitGB?: number; // null = unlimited
  campaigns: CampaignFlags;
  availableDistrictIds: string[]; // Districts where this tariff is available
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tariff snapshot for lead (preserves selected tariff at time of lead creation)
 */
export interface TariffSnapshot {
  tariffId: string;
  tariffName: string;
  ispName: string;
  speedMbps: number;
  priceMonthly: number;
  technology: TechnologyType;
  campaigns: CampaignFlags;
}

/**
 * Lead entity
 */
export interface Lead {
  id: string;
  status: LeadStatus;
  source: LeadSource;
  
  // User information
  fullName: string;
  phone: string;
  email?: string;
  
  // Location
  cityId: string;
  districtId: string;
  address?: string;
  
  // Selected tariff snapshot
  tariffSnapshot: TariffSnapshot;
  
  // Assignment
  assignedIspId?: string;
  assignedAt?: Date;
  
  // Tracking
  notes?: string;
  outcomeNotes?: string; // ISP can update this
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  convertedAt?: Date;
}

/**
 * Filter criteria for tariff search
 */
export interface TariffFilterCriteria {
  cityId?: string;
  districtIds?: string[];
  technologies?: TechnologyType[];
  minSpeedMbps?: number;
  maxSpeedMbps?: number;
  minPriceMonthly?: number;
  maxPriceMonthly?: number;
  maxContractLength?: number; // null = any, 0 = no contract, 12 = max 12 months
  campaignFlags?: Partial<CampaignFlags>;
}

/**
 * Sorting options for tariff results
 */
export interface TariffSortOptions {
  sortBy?: 'price' | 'speed' | 'speed_price_ratio' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

/**
 * JWT Token payload
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  ispId?: string;
}

/**
 * Auth tokens response
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}
