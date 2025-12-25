import { City, District } from '@/domain';
import { RepositoryContainer } from '@/repositories';
import { NotFoundError, logger } from '@/lib';

/**
 * Filter service - handles filter data retrieval
 */
export class FilterService {
  /**
   * Get all available filters (cities, districts, technologies)
   */
  async getAvailableFilters(): Promise<{
    cities: City[];
    districts: District[];
    technologies: string[];
    speedRanges: { min: number; max: number }[];
    priceRanges: { min: number; max: number }[];
  }> {
    logger.debug('Fetching available filters');

    const cityRepo = RepositoryContainer.getCityRepository();
    const districtRepo = RepositoryContainer.getDistrictRepository();

    const [cities, districts] = await Promise.all([
      cityRepo.findActive(),
      districtRepo.findAll(),
    ]);

    // Predefined filter options
    const technologies = ['fiber', 'adsl', 'vdsl', 'wireless', '4.5g'];
    
    const speedRanges = [
      { min: 0, max: 25 },
      { min: 25, max: 50 },
      { min: 50, max: 100 },
      { min: 100, max: 500 },
    ];

    const priceRanges = [
      { min: 0, max: 15 },
      { min: 15, max: 25 },
      { min: 25, max: 40 },
      { min: 40, max: 100 },
    ];

    return {
      cities,
      districts: districts.filter(d => d.isActive),
      technologies,
      speedRanges,
      priceRanges,
    };
  }

  /**
   * Get districts for a specific city
   */
  async getDistrictsByCity(cityId: string): Promise<District[]> {
    logger.debug('Fetching districts for city', { cityId });

    const cityRepo = RepositoryContainer.getCityRepository();
    const districtRepo = RepositoryContainer.getDistrictRepository();

    const city = await cityRepo.findById(cityId);
    if (!city) {
      throw new NotFoundError('City', cityId);
    }

    return districtRepo.findByCityId(cityId);
  }
}
