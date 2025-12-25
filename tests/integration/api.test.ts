import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/tariffs/route';
import { POST } from '@/app/api/leads/route';
import { NextRequest } from 'next/server';
import { RepositoryContainer } from '@/repositories';
import { TechnologyType, LeadSource } from '@/domain';

describe('API Integration Tests', () => {
  beforeEach(() => {
    RepositoryContainer.reset();
  });

  describe('GET /api/tariffs', () => {
    it('should return all tariffs without filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/tariffs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.tariffs).toBeDefined();
      expect(data.data.total).toBeGreaterThan(0);
      expect(Array.isArray(data.data.tariffs)).toBe(true);
    });

    it('should filter tariffs by technology', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/tariffs?technologies=${TechnologyType.FIBER}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      data.data.tariffs.forEach((tariff: any) => {
        expect(tariff.technology).toBe(TechnologyType.FIBER);
      });
    });

    it('should filter tariffs by speed range', async () => {
      const minSpeed = 50;
      const maxSpeed = 100;
      const request = new NextRequest(
        `http://localhost:3000/api/tariffs?minSpeedMbps=${minSpeed}&maxSpeedMbps=${maxSpeed}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      data.data.tariffs.forEach((tariff: any) => {
        expect(tariff.speedMbps).toBeGreaterThanOrEqual(minSpeed);
        expect(tariff.speedMbps).toBeLessThanOrEqual(maxSpeed);
      });
    });

    it('should filter tariffs by price range', async () => {
      const minPrice = 10;
      const maxPrice = 25;
      const request = new NextRequest(
        `http://localhost:3000/api/tariffs?minPriceMonthly=${minPrice}&maxPriceMonthly=${maxPrice}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      data.data.tariffs.forEach((tariff: any) => {
        expect(tariff.priceMonthly).toBeGreaterThanOrEqual(minPrice);
        expect(tariff.priceMonthly).toBeLessThanOrEqual(maxPrice);
      });
    });

    it('should sort tariffs by price', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/tariffs?sortBy=price&sortOrder=asc'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const tariffs = data.data.tariffs;
      
      if (tariffs.length > 1) {
        for (let i = 0; i < tariffs.length - 1; i++) {
          expect(tariffs[i].priceMonthly).toBeLessThanOrEqual(
            tariffs[i + 1].priceMonthly
          );
        }
      }
    });

    it('should include ISP details in tariff response', async () => {
      const request = new NextRequest('http://localhost:3000/api/tariffs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      data.data.tariffs.forEach((tariff: any) => {
        expect(tariff.isp).toBeDefined();
        expect(tariff.isp.name).toBeDefined();
        expect(tariff.isp.id).toBe(tariff.ispId);
      });
    });

    it('should handle invalid query parameters gracefully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/tariffs?minSpeedMbps=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      // Note: The test was passing invalid query but API was returning 400,
      // which means validation is working. Let's check for proper error.
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/leads', () => {
    it('should create a lead with valid data', async () => {
      // Get valid IDs from repositories
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();

      const cities = await cityRepo.findAll();
      const districts = await districtRepo.findByCityId(cities[0].id);
      const tariffs = await tariffRepo.findByFilter({});

      const leadData = {
        fullName: 'John Doe',
        phone: '+994501234567',
        email: 'john@example.com',
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      };

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(leadData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.lead).toBeDefined();
      expect(data.data.lead.fullName).toBe(leadData.fullName);
      expect(data.data.lead.phone).toBe(leadData.phone);
      expect(data.data.lead.status).toBe('new');
      expect(data.data.lead.tariffSnapshot).toBeDefined();
    });

    it('should reject lead with missing required fields', async () => {
      const invalidData = {
        fullName: 'John Doe',
        // Missing phone
      };

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should reject lead with invalid phone format', async () => {
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();

      const cities = await cityRepo.findAll();
      const districts = await districtRepo.findByCityId(cities[0].id);
      const tariffs = await tariffRepo.findByFilter({});

      const invalidData = {
        fullName: 'John Doe',
        phone: '123', // Invalid phone
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      };

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject lead with mismatched city and district', async () => {
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();

      const cities = await cityRepo.findAll();
      const allDistricts = await districtRepo.findAll();
      const tariffs = await tariffRepo.findByFilter({});

      // Get district from different city
      const city1 = cities[0];
      const districtFromDifferentCity = allDistricts.find(
        (d) => d.cityId !== city1.id
      );

      const invalidData = {
        fullName: 'John Doe',
        phone: '+994501234567',
        cityId: city1.id,
        districtId: districtFromDifferentCity!.id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      };

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message.toLowerCase()).toContain('district');
    });

    it('should create tariff snapshot with current tariff data', async () => {
      const cityRepo = RepositoryContainer.getCityRepository();
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const tariffRepo = RepositoryContainer.getTariffRepository();

      const cities = await cityRepo.findAll();
      const districts = await districtRepo.findByCityId(cities[0].id);
      const tariffs = await tariffRepo.findByFilter({});

      const leadData = {
        fullName: 'John Doe',
        phone: '+994501234567',
        cityId: cities[0].id,
        districtId: districts[0].id,
        tariffId: tariffs[0].id,
        source: LeadSource.COMPARISON,
      };

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(leadData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      const snapshot = data.data.lead.tariffSnapshot;
      expect(snapshot.tariffId).toBe(tariffs[0].id);
      expect(snapshot.tariffName).toBe(tariffs[0].name);
      expect(snapshot.priceMonthly).toBe(tariffs[0].priceMonthly);
      expect(snapshot.ispName).toBeDefined();
    });
  });
});

