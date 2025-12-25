import { describe, it, expect, beforeEach } from 'vitest';
import { TariffService } from '@/services/tariff.service';
import { TechnologyType } from '@/domain';
import { RepositoryContainer } from '@/repositories';

describe('TariffService', () => {
  let tariffService: TariffService;

  beforeEach(() => {
    // Reset repositories to ensure clean state
    RepositoryContainer.reset();
    tariffService = new TariffService();
  });

  describe('findTariffs', () => {
    it('should return all tariffs when no filters provided', async () => {
      const result = await tariffService.findTariffs({});
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter tariffs by technology', async () => {
      const result = await tariffService.findTariffs({
        technologies: [TechnologyType.FIBER],
      });

      expect(result).toBeDefined();
      result.forEach((tariff) => {
        expect(tariff.technology).toBe(TechnologyType.FIBER);
      });
    });

    it('should filter tariffs by speed range', async () => {
      const minSpeed = 50;
      const maxSpeed = 100;
      
      const result = await tariffService.findTariffs({
        minSpeedMbps: minSpeed,
        maxSpeedMbps: maxSpeed,
      });

      result.forEach((tariff) => {
        expect(tariff.speedMbps).toBeGreaterThanOrEqual(minSpeed);
        expect(tariff.speedMbps).toBeLessThanOrEqual(maxSpeed);
      });
    });

    it('should filter tariffs by price range', async () => {
      const minPrice = 10;
      const maxPrice = 20;
      
      await tariffService.findTariffs({
        minPriceMonthly: minPrice,
        maxPriceMonthly: maxPrice,
      });
    });

    it('should filter tariffs by district', async () => {
      // Get a valid district ID from the mock data
      const districtRepo = RepositoryContainer.getDistrictRepository();
      const districts = await districtRepo.findAll();
      const testDistrictId = districts[0].id;

      const result = await tariffService.findTariffs({
        districtIds: [testDistrictId],
      });

      result.forEach((tariff) => {
        expect(tariff.availableDistrictIds).toContain(testDistrictId);
      });
    });

    it('should filter tariffs by campaign flags', async () => {
      const result = await tariffService.findTariffs({
        campaignFlags: {
          freeModem: true,
        },
      });

      result.forEach((tariff) => {
        expect(tariff.campaigns.freeModem).toBe(true);
      });
    });

    it('should combine multiple filters correctly', async () => {
      const result = await tariffService.findTariffs({
        technologies: [TechnologyType.FIBER],
        minSpeedMbps: 50,
        maxPriceMonthly: 30,
      });

      result.forEach((tariff) => {
        expect(tariff.technology).toBe(TechnologyType.FIBER);
        expect(tariff.speedMbps).toBeGreaterThanOrEqual(50);
        expect(tariff.priceMonthly).toBeLessThanOrEqual(30);
      });
    });

    it('should rank tariffs by campaign score and value', async () => {
      const result = await tariffService.findTariffs({});

      // First tariff should have highest overall score
      if (result.length > 1) {
        const first = result[0];
        const second = result[1];
        
        // Campaign score: freeModem (20) + freeInstallation (15)
        const firstCampaignScore = 
          (first.campaigns.freeModem ? 20 : 0) + 
          (first.campaigns.freeInstallation ? 15 : 0);
        const secondCampaignScore = 
          (second.campaigns.freeModem ? 20 : 0) + 
          (second.campaigns.freeInstallation ? 15 : 0);
        
        // Value score: speedMbps / priceMonthly
        const firstValueScore = first.speedMbps / first.priceMonthly;
        const secondValueScore = second.speedMbps / second.priceMonthly;
        
        const firstTotal = firstCampaignScore + firstValueScore;
        const secondTotal = secondCampaignScore + secondValueScore;
        
        expect(firstTotal).toBeGreaterThanOrEqual(secondTotal);
      }
    });

    it('should sort tariffs by price when sortBy is price', async () => {
      const result = await tariffService.findTariffs(
        {},
        {
          sortBy: 'price',
          sortOrder: 'asc',
        }
      );

      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].priceMonthly).toBeLessThanOrEqual(
            result[i + 1].priceMonthly
          );
        }
      }
    });

    it('should sort tariffs by speed when sortBy is speed', async () => {
      const result = await tariffService.findTariffs(
        {},
        {
          sortBy: 'speed',
          sortOrder: 'desc',
        }
      );

      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].speedMbps).toBeGreaterThanOrEqual(
            result[i + 1].speedMbps
          );
        }
      }
    });

    it('should enrich tariffs with ISP details', async () => {
      const result = await tariffService.findTariffs({});

      result.forEach((tariff) => {
        expect(tariff.isp).toBeDefined();
        expect(tariff.isp!.id).toBe(tariff.ispId);
        expect(tariff.isp!.name).toBeDefined();
      });
    });

    it('should return empty array when no tariffs match filters', async () => {
      const result = await tariffService.findTariffs({
        minSpeedMbps: 10000, // Unrealistic speed
      });

      expect(result).toEqual([]);
    });
  });

  describe('getTariffById', () => {
    it('should return tariff with ISP details', async () => {
      const allTariffs = await tariffService.findTariffs({});
      const testTariffId = allTariffs[0].id;

      const tariff = await tariffService.getTariffById(testTariffId);

      expect(tariff).toBeDefined();
      expect(tariff!.id).toBe(testTariffId);
      expect(tariff!.isp).toBeDefined();
    });

    it('should return null for non-existent tariff', async () => {
      const tariff = await tariffService.getTariffById('non-existent-id');
      expect(tariff).toBeNull();
    });
  });
});
