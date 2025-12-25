import { Lead, LeadStatus, LeadSource, TariffSnapshot } from '@/domain';
import { RepositoryContainer } from '@/repositories';
import { logger, NotFoundError, ValidationError, ConflictError } from '@/lib';
import { getNotificationService } from '@/lib/notifications';
import { TariffService } from './tariff.service';

/**
 * DTO for creating a new lead
 */
export interface CreateLeadDTO {
  fullName: string;
  phone: string;
  email?: string;
  cityId: string;
  districtId: string;
  address?: string;
  tariffId: string;
  source?: LeadSource;
}

/**
 * DTO for updating lead status
 */
export interface UpdateLeadStatusDTO {
  status: LeadStatus;
  notes?: string;
  outcomeNotes?: string;
}

/**
 * Lead service - handles lead creation and management
 */
export class LeadService {
  private tariffService: TariffService;
  private notificationService = getNotificationService();

  constructor() {
    this.tariffService = new TariffService();
  }

  /**
   * Create a new lead with tariff snapshot
   */
  async createLead(data: CreateLeadDTO): Promise<Lead> {
    logger.info('Creating new lead', { phone: data.phone, tariffId: data.tariffId });

    const leadRepo = RepositoryContainer.getLeadRepository();
    const cityRepo = RepositoryContainer.getCityRepository();
    const districtRepo = RepositoryContainer.getDistrictRepository();

    // Validate city exists
    const city = await cityRepo.findById(data.cityId);
    if (!city) {
      throw new NotFoundError('City', data.cityId);
    }

    // Validate district exists and belongs to city
    const district = await districtRepo.findById(data.districtId);
    if (!district) {
      throw new NotFoundError('District', data.districtId);
    }

    if (district.cityId !== data.cityId) {
      throw new ValidationError('District does not belong to selected city', {
        cityId: data.cityId,
        districtId: data.districtId,
      });
    }

    // Get tariff with ISP information
    const enrichedTariff = await this.tariffService.getTariffById(data.tariffId);
    if (!enrichedTariff) {
      throw new NotFoundError('Tariff', data.tariffId);
    }

    // Verify tariff is available in selected district
    if (!enrichedTariff.availableDistrictIds.includes(data.districtId)) {
      throw new ValidationError('Tariff is not available in selected district', {
        tariffId: data.tariffId,
        districtId: data.districtId,
      });
    }

    // Create tariff snapshot
    const tariffSnapshot: TariffSnapshot = {
      tariffId: enrichedTariff.id,
      tariffName: enrichedTariff.name,
      ispName: enrichedTariff.isp.name,
      speedMbps: enrichedTariff.speedMbps,
      priceMonthly: enrichedTariff.priceMonthly,
      technology: enrichedTariff.technology,
      campaigns: enrichedTariff.campaigns,
    };

    // Create lead
    const lead = await leadRepo.create({
      status: LeadStatus.NEW,
      source: data.source || LeadSource.COMPARISON,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      cityId: data.cityId,
      districtId: data.districtId,
      address: data.address,
      tariffSnapshot,
    });

    logger.info('Lead created successfully', { leadId: lead.id });

    // Send notifications (async, non-blocking)
    this.notificationService.notifyLeadCreated(lead).catch(err => 
      logger.error('Failed to send lead creation notification', err)
    );

    return lead;
  }

  /**
   * Get lead by ID
   */
  async getLeadById(leadId: string): Promise<Lead> {
    logger.debug('Fetching lead by ID', { leadId });

    const leadRepo = RepositoryContainer.getLeadRepository();
    const lead = await leadRepo.findById(leadId);

    if (!lead) {
      throw new NotFoundError('Lead', leadId);
    }

    return lead;
  }

  /**
   * Get all leads with pagination
   */
  async getAllLeads(limit: number = 20, offset: number = 0): Promise<Lead[]> {
    logger.debug('Fetching all leads', { limit, offset });

    const leadRepo = RepositoryContainer.getLeadRepository();
    return leadRepo.findAll(limit, offset);
  }

  /**
   * Get leads assigned to specific ISP
   */
  async getLeadsByIsp(ispId: string): Promise<Lead[]> {
    logger.debug('Fetching leads for ISP', { ispId });

    const ispRepo = RepositoryContainer.getISPRepository();
    const isp = await ispRepo.findById(ispId);

    if (!isp) {
      throw new NotFoundError('ISP', ispId);
    }

    const leadRepo = RepositoryContainer.getLeadRepository();
    return leadRepo.findByAssignedIsp(ispId);
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(leadId: string, data: UpdateLeadStatusDTO): Promise<Lead> {
    logger.info('Updating lead status', { leadId, status: data.status });

    const leadRepo = RepositoryContainer.getLeadRepository();
    const lead = await leadRepo.findById(leadId);

    if (!lead) {
      throw new NotFoundError('Lead', leadId);
    }

    // Validate status transition
    this.validateStatusTransition(lead.status, data.status);

    const updated = await leadRepo.updateStatus(leadId, data.status, data.notes);
    if (!updated) {
      throw new Error('Failed to update lead status');
    }

    // Send status update notification (async, non-blocking)
    this.notificationService.notifyStatusUpdated(updated, lead.status, data.status).catch(err =>
      logger.error('Failed to send status update notification', err)
    );

    // Update outcome notes if provided
    if (data.outcomeNotes) {
      const withNotes = await leadRepo.update(leadId, { outcomeNotes: data.outcomeNotes });
      return withNotes!;
    }

    return updated;
  }

  /**
   * Assign lead to ISP
   */
  async assignLeadToIsp(leadId: string, ispId: string): Promise<Lead> {
    logger.info('Assigning lead to ISP', { leadId, ispId });

    const leadRepo = RepositoryContainer.getLeadRepository();
    const ispRepo = RepositoryContainer.getISPRepository();

    // Validate lead exists
    const lead = await leadRepo.findById(leadId);
    if (!lead) {
      throw new NotFoundError('Lead', leadId);
    }

    // Validate ISP exists
    const isp = await ispRepo.findById(ispId);
    if (!isp) {
      throw new NotFoundError('ISP', ispId);
    }

    // Check if lead is already assigned
    if (lead.assignedIspId && lead.assignedIspId !== ispId) {
      throw new ConflictError('Lead is already assigned to another ISP', {
        currentIspId: lead.assignedIspId,
        newIspId: ispId,
      });
    }

    const updated = await leadRepo.assignToIsp(leadId, ispId);
    if (!updated) {
      throw new Error('Failed to assign lead to ISP');
    }

    // Send ISP assignment notification (async, non-blocking)
    this.notificationService.notifyLeadAssigned(updated, isp.name).catch(err =>
      logger.error('Failed to send ISP assignment notification', err)
    );

    return updated;
  }

  /**
   * Validate lead status transitions
   */
  private validateStatusTransition(currentStatus: LeadStatus, newStatus: LeadStatus): void {
    // Define valid transitions
    const validTransitions: Record<LeadStatus, LeadStatus[]> = {
      [LeadStatus.NEW]: [
        LeadStatus.CONTACTED,
        LeadStatus.ASSIGNED_TO_ISP,
        LeadStatus.REJECTED,
        LeadStatus.CANCELLED,
      ],
      [LeadStatus.CONTACTED]: [
        LeadStatus.QUALIFIED,
        LeadStatus.ASSIGNED_TO_ISP,
        LeadStatus.REJECTED,
        LeadStatus.CANCELLED,
      ],
      [LeadStatus.QUALIFIED]: [
        LeadStatus.ASSIGNED_TO_ISP,
        LeadStatus.REJECTED,
        LeadStatus.CANCELLED,
      ],
      [LeadStatus.ASSIGNED_TO_ISP]: [
        LeadStatus.IN_PROGRESS,
        LeadStatus.REJECTED,
        LeadStatus.CANCELLED,
      ],
      [LeadStatus.IN_PROGRESS]: [
        LeadStatus.CONVERTED,
        LeadStatus.REJECTED,
        LeadStatus.CANCELLED,
      ],
      [LeadStatus.CONVERTED]: [], // Terminal state
      [LeadStatus.REJECTED]: [], // Terminal state
      [LeadStatus.CANCELLED]: [], // Terminal state
    };

    const allowed = validTransitions[currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError('Invalid status transition', {
        currentStatus,
        newStatus,
        allowedTransitions: allowed,
      });
    }
  }
}
