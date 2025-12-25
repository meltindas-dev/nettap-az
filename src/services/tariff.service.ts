import { Tariff, TariffFilterCriteria, TariffSortOptions, ISP } from '@/domain';
import { RepositoryContainer } from '@/repositories';
import { logger, ValidationError } from '@/lib';

/**
 * Enriched tariff with ISP information
 */
export interface EnrichedTariff extends Tariff {
  isp: ISP;
  speedPriceRatio: number;
  campaignScore: number;
}

/**
 * Tariff service - handles tariff comparison and ranking logic
 */
export class TariffService {
  /**
   * Find tariffs based on filter criteria with intelligent ranking
   * Ranking priority:
   * 1. Availability in selected district
   * 2. Speed/price ratio
   * 3. Campaign priority
   * 4. ISP priority score
   */
  async findTariffs(
    criteria: TariffFilterCriteria,
    sortOptions?: TariffSortOptions
  ): Promise<EnrichedTariff[]> {
    logger.info('Searching tariffs with criteria', { criteria, sortOptions });

    const tariffRepo = RepositoryContainer.getTariffRepository();
    const ispRepo = RepositoryContainer.getISPRepository();

    // Validate city → district dependency
    if (criteria.districtIds && criteria.districtIds.length > 0) {
      const districtRepo = RepositoryContainer.getDistrictRepository();
      
      if (criteria.cityId) {
        const districts = await districtRepo.findByCityId(criteria.cityId);
        const validDistrictIds = new Set(districts.map(d => d.id));
        
        const invalidDistricts = criteria.districtIds.filter(
          id => !validDistrictIds.has(id)
        );
        
        if (invalidDistricts.length > 0) {
          throw new ValidationError('Invalid districts for selected city', {
            invalidDistrictIds: invalidDistricts,
          });
        }
      }
    }

    // Find tariffs matching criteria
    const tariffs = await tariffRepo.findByFilter(criteria, sortOptions);

    // Enrich tariffs with ISP data and calculated metrics
    const enrichedTariffs = await Promise.all(
      tariffs.map(async (tariff) => {
        const isp = await ispRepo.findById(tariff.ispId);
        if (!isp) {
          logger.warn('Tariff has invalid ISP reference', { tariffId: tariff.id, ispId: tariff.ispId });
          throw new Error(`ISP not found for tariff ${tariff.id}`);
        }

        const speedPriceRatio = tariff.speedMbps / tariff.priceMonthly;
        const campaignScore = this.calculateCampaignScore(tariff);

        return {
          ...tariff,
          isp,
          speedPriceRatio,
          campaignScore,
        } as EnrichedTariff;
      })
    );

    // Apply intelligent ranking if no explicit sort is provided
    if (!sortOptions || !sortOptions.sortBy) {
      enrichedTariffs.sort((a, b) => {
        // Priority 1: Campaign score
        if (a.campaignScore !== b.campaignScore) {
          return b.campaignScore - a.campaignScore;
        }

        // Priority 2: Speed/price ratio
        if (a.speedPriceRatio !== b.speedPriceRatio) {
          return b.speedPriceRatio - a.speedPriceRatio;
        }

        // Priority 3: ISP priority score
        return b.isp.priorityScore - a.isp.priorityScore;
      });
    }

    logger.info('Found tariffs', { count: enrichedTariffs.length });
    return enrichedTariffs;
  }

  /**
   * Get a single tariff by ID with ISP information
   */
  async getTariffById(tariffId: string): Promise<EnrichedTariff | null> {
    logger.debug('Fetching tariff by ID', { tariffId });

    const tariffRepo = RepositoryContainer.getTariffRepository();
    const ispRepo = RepositoryContainer.getISPRepository();

    const tariff = await tariffRepo.findById(tariffId);
    if (!tariff) return null;

    const isp = await ispRepo.findById(tariff.ispId);
    if (!isp) return null;

    return {
      ...tariff,
      isp,
      speedPriceRatio: tariff.speedMbps / tariff.priceMonthly,
      campaignScore: this.calculateCampaignScore(tariff),
    };
  }

  /**
   * Calculate campaign score for ranking
   * Higher score = better campaigns
   */
  private calculateCampaignScore(tariff: Tariff): number {
    let score = 0;

    if (tariff.campaigns.freeModem) score += 10;
    if (tariff.campaigns.freeInstallation) score += 10;
    if (tariff.campaigns.noContract) score += 15;
    if (tariff.campaigns.limitedTime) score += 5;
    if (tariff.campaigns.discountPercentage) {
      score += tariff.campaigns.discountPercentage;
    }

    return score;
  }
}
