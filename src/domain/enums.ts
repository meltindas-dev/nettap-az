/**
 * Technology types for internet connections
 */
export enum TechnologyType {
  FIBER = 'fiber',
  ADSL = 'adsl',
  VDSL = 'vdsl',
  WIRELESS = 'wireless',
  MOBILE_4_5G = '4.5g',
}

/**
 * Lead status lifecycle
 */
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  ASSIGNED_TO_ISP = 'assigned_to_isp',
  IN_PROGRESS = 'in_progress',
  CONVERTED = 'converted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

/**
 * Lead source types
 */
export enum LeadSource {
  COMPARISON = 'comparison',
  DIRECT = 'direct',
  REFERRAL = 'referral',
  CAMPAIGN = 'campaign',
}

/**
 * User roles for authorization
 */
export enum UserRole {
  ADMIN = 'admin',
  ISP = 'isp',
  USER = 'user',
}
