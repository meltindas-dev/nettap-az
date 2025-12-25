import { describe, it, expect, beforeEach } from 'vitest';
import { LeadService } from '@/services/lead.service';
import { LeadStatus, LeadSource } from '@/domain';
import { RepositoryContainer } from '@/repositories';
import { ValidationError, NotFoundError } from '@/lib/errors';

describe('LeadService', () => {
  let leadService: LeadService;

  beforeEach(() => {
    RepositoryContainer.reset();
    leadService = new LeadService();
  });

  describe('createLead', () => {
    it('should create a lead with valid data', async () => {
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();

      const cities = await cityRepo.findAll();
      const districts = await districtRepo.findByCityId(cities[0].id);
      const tariffs = await tariffRepo.findByFilter({});

      const leadData = {
        fullName: 'Test User',
        phone: '+994501234567',
        email: 'test@example.com',
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      };

      const lead = await leadService.createLead(leadData);

      expect(lead).toBeDefined();
      expect(lead.fullName).toBe(leadData.fullName);
      expect(lead.phone).toBe(leadData.phone);
      expect(lead.status).toBe(LeadStatus.NEW);
      expect(lead.tariffSnapshot).toBeDefined();
      expect(lead.tariffSnapshot.tariffId).toBe(tariffs[0].id);
    });

    it('should reject lead with invalid city/district combination', async () => {
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();

      const cities = await cityRepo.findAll();
      const allDistricts = await districtRepo.findAll();
      const tariffs = await tariffRepo.findByFilter({});

      // Find district from different city
      const city1 = cities[0];
      const districtFromDifferentCity = allDistricts.find(
        (d) => d.cityId !== city1.id
      );

      const leadData = {
        fullName: 'Test User',
        phone: '+994501234567',
        cityId: city1.id,
        districtId: districtFromDifferentCity!.id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      };

      await expect(leadService.createLead(leadData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should reject lead with non-existent tariff', async () => {
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();

      const cities = await cityRepo.findAll();
      const districts = await districtRepo.findByCityId(cities[0].id);

      const leadData = {
        fullName: 'Test User',
        phone: '+994501234567',
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: 'non-existent-tariff',
        source: LeadSource.COMPARISON,
      };

      await expect(leadService.createLead(leadData)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should create tariff snapshot with ISP details', async () => {
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();

      const cities = await cityRepo.findAll();
      const districts = await districtRepo.findByCityId(cities[0].id);
      const tariffs = await tariffRepo.findByFilter({});

      const leadData = {
        fullName: 'Test User',
        phone: '+994501234567',
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      };

      const lead = await leadService.createLead(leadData);

      expect(lead.tariffSnapshot.ispName).toBeDefined();
      expect(lead.tariffSnapshot.tariffName).toBe(tariffs[0].name);
      expect(lead.tariffSnapshot.priceMonthly).toBe(tariffs[0].priceMonthly);
    });
  });

  describe('updateLeadStatus', () => {
    it('should update lead status with valid transition', async () => {
      // Create a lead first
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();

      const cities = await cityRepo.findAll();
      const districts = await districtRepo.findByCityId(cities[0].id);
      const tariffs = await tariffRepo.findByFilter({});

      const lead = await leadService.createLead({
        fullName: 'Test User',
        phone: '+994501234567',
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      });

      // Update status: NEW -> CONTACTED
      const updatedLead = await leadService.updateLeadStatus(
        lead.id,
        { status: LeadStatus.CONTACTED }
      );

      expect(updatedLead.status).toBe(LeadStatus.CONTACTED);
    });

    it('should set convertedAt timestamp when status becomes CONVERTED', async () => {
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();

      const cities = await cityRepo.findAll();
      const districts = await districtRepo.findByCityId(cities[0].id);
      const tariffs = await tariffRepo.findByFilter({});

      const lead = await leadService.createLead({
        fullName: 'Test User',
        phone: '+994501234567',
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      });

      // Valid transition path: NEW -> ASSIGNED_TO_ISP -> IN_PROGRESS -> CONVERTED
      await leadService.updateLeadStatus(lead.id, { status: LeadStatus.ASSIGNED_TO_ISP });
      await leadService.updateLeadStatus(lead.id, { status: LeadStatus.IN_PROGRESS });
      const updatedLead = await leadService.updateLeadStatus(
        lead.id,
        { status: LeadStatus.CONVERTED }
      );

      expect(updatedLead.status).toBe(LeadStatus.CONVERTED);
      expect(updatedLead.convertedAt).toBeDefined();
      expect(updatedLead.convertedAt).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent lead', async () => {
      await expect(
        leadService.updateLeadStatus('non-existent', { status: LeadStatus.CONTACTED })
      ).rejects.toThrow(NotFoundError);
    });

    it('should reject invalid status transition', async () => {
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();

      const cities = await cityRepo.findAll();
      const districts = await districtRepo.findByCityId(cities[0].id);
      const tariffs = await tariffRepo.findByFilter({});

      const lead = await leadService.createLead({
        fullName: 'Test User',
        phone: '+994501234567',
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      });

      // Try invalid transition: NEW -> CONVERTED (should go through QUALIFIED first)
      await expect(
        leadService.updateLeadStatus(lead.id, { status: LeadStatus.CONVERTED })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('assignLeadToIsp', () => {
    it('should assign lead to ISP', async () => {
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();
      const ispRepo = RepositoryContainer.getISPRepository();

      const cities = await cityRepo.findAll();
      const districts = await districtRepo.findByCityId(cities[0].id);
      const tariffs = await tariffRepo.findByFilter({});
      const isps = await ispRepo.findAll();

      const lead = await leadService.createLead({
        fullName: 'Test User',
        phone: '+994501234567',
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      });

      const assignedLead = await leadService.assignLeadToIsp(lead.id, isps[0].id);

      expect(assignedLead.assignedIspId).toBe(isps[0].id);
      expect(assignedLead.status).toBe(LeadStatus.ASSIGNED_TO_ISP);
      expect(assignedLead.assignedAt).toBeDefined();
    });

    it('should throw error for non-existent ISP', async () => {
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();

      const cities = await cityRepo.findAll();
      const districts = await districtRepo.findByCityId(cities[0].id);
      const tariffs = await tariffRepo.findByFilter({});

      const lead = await leadService.createLead({
        fullName: 'Test User',
        phone: '+994501234567',
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      });

      await expect(
        leadService.assignLeadToIsp(lead.id, 'non-existent-isp')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getLeadsByStatus', () => {
    it('should filter leads by status', async () => {
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();

      const cities = await cityRepo.findAll();
      const districts = await districtRepo.findByCityId(cities[0].id);
      const tariffs = await tariffRepo.findByFilter({});

      // Create multiple leads
      await leadService.createLead({
        fullName: 'User 1',
        phone: '+994501234567',
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      });

      const lead2 = await leadService.createLead({
        fullName: 'User 2',
        phone: '+994501234568',
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      });

      // Update one lead to CONTACTED
      await leadService.updateLeadStatus(lead2.id, { status: LeadStatus.CONTACTED });

      // Get NEW leads
      const leadRepo = RepositoryContainer.getLeadRepository();
      const newLeads = await leadRepo.findByStatus(LeadStatus.NEW);
      expect(newLeads.length).toBe(1);
      expect(newLeads[0].status).toBe(LeadStatus.NEW);

      // Get CONTACTED leads
      const contactedLeads = await leadRepo.findByStatus(
        LeadStatus.CONTACTED
      );
      expect(contactedLeads.length).toBe(1);
      expect(contactedLeads[0].status).toBe(LeadStatus.CONTACTED);
    });
  });
});


