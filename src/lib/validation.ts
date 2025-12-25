import { z } from 'zod';
import { TechnologyType, LeadSource } from '@/domain/enums';

/**
 * Validation schemas using Zod
 */

// Phone validation (Azerbaijani format)
const azPhoneRegex = /^(\+994|0)(50|51|55|70|77|99)\d{7}$/;

export const phoneSchema = z.string().regex(azPhoneRegex, {
  message: 'Invalid Azerbaijani phone number. Format: +994XXXXXXXXX or 0XXXXXXXXX',
});

export const emailSchema = z.string().email().optional();

export const tariffFilterSchema = z.object({
  cityId: z.string().uuid().optional(),
  districtIds: z.array(z.string().uuid()).optional(),
  technologies: z.array(z.nativeEnum(TechnologyType)).optional(),
  minSpeedMbps: z.number().positive().optional(),
  maxSpeedMbps: z.number().positive().optional(),
  minPriceMonthly: z.number().positive().optional(),
  maxPriceMonthly: z.number().positive().optional(),
  maxContractLength: z.number().min(0).optional(),
  campaignFlags: z.object({
    freeModem: z.boolean().optional(),
    freeInstallation: z.boolean().optional(),
    limitedTime: z.boolean().optional(),
    noContract: z.boolean().optional(),
  }).optional(),
});

export const createLeadSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: phoneSchema,
  email: emailSchema,
  cityId: z.string().uuid(),
  districtId: z.string().uuid(),
  address: z.string().max(500).optional(),
  tariffId: z.string().uuid(),
  source: z.nativeEnum(LeadSource).default(LeadSource.COMPARISON),
});

export const updateLeadStatusSchema = z.object({
  status: z.string(),
  notes: z.string().max(1000).optional(),
  outcomeNotes: z.string().max(1000).optional(),
});

export const assignIspSchema = z.object({
  leadId: z.string().uuid(),
  ispId: z.string().uuid(),
});

/**
 * Validation helper
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe validation (returns error instead of throwing)
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
