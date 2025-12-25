import { Tariff, ITariffRepository, TariffFilterCriteria, TariffSortOptions, TechnologyType } from '@/domain';

/**
 * Mock data for tariffs
 */
const mockTariffs: Tariff[] = [
  {
    id: '880e8400-e29b-41d4-a716-446655440001',
    ispId: '770e8400-e29b-41d4-a716-446655440001', // AzerTelecom
    name: 'Fiber Premium 100',
    description: '100 Mbps fiber internet with unlimited data',
    technology: TechnologyType.FIBER,
    speedMbps: 100,
    uploadSpeedMbps: 50,
    priceMonthly: 25.00,
    contractLengthMonths: 12,
    dataLimitGB: undefined,
    campaigns: {
      freeModem: true,
      freeInstallation: true,
      discountPercentage: 20,
      limitedTime: true,
      noContract: false,
    },
    availableDistrictIds: [
      '660e8400-e29b-41d4-a716-446655440001', // Nasimi
      '660e8400-e29b-41d4-a716-446655440002', // Yasamal
      '660e8400-e29b-41d4-a716-446655440003', // Narimanov
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440002',
    ispId: '770e8400-e29b-41d4-a716-446655440001', // AzerTelecom
    name: 'Fiber Basic 50',
    description: '50 Mbps fiber internet',
    technology: TechnologyType.FIBER,
    speedMbps: 50,
    uploadSpeedMbps: 25,
    priceMonthly: 15.00,
    contractLengthMonths: 6,
    dataLimitGB: undefined,
    campaigns: {
      freeModem: false,
      freeInstallation: true,
      noContract: false,
      limitedTime: false,
    },
    availableDistrictIds: [
      '660e8400-e29b-41d4-a716-446655440001',
      '660e8400-e29b-41d4-a716-446655440002',
      '660e8400-e29b-41d4-a716-446655440003',
      '660e8400-e29b-41d4-a716-446655440004', // Sabunchu
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440003',
    ispId: '770e8400-e29b-41d4-a716-446655440002', // Baktelecom
    name: 'VDSL 30',
    description: '30 Mbps VDSL connection',
    technology: TechnologyType.VDSL,
    speedMbps: 30,
    uploadSpeedMbps: 10,
    priceMonthly: 12.00,
    contractLengthMonths: 12,
    dataLimitGB: undefined,
    campaigns: {
      freeModem: true,
      freeInstallation: false,
      noContract: false,
      limitedTime: false,
    },
    availableDistrictIds: [
      '660e8400-e29b-41d4-a716-446655440001',
      '660e8400-e29b-41d4-a716-446655440004',
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440004',
    ispId: '770e8400-e29b-41d4-a716-446655440003', // Naxtel
    name: '4.5G Unlimited',
    description: 'High-speed 4.5G internet',
    technology: TechnologyType.MOBILE_4_5G,
    speedMbps: 40,
    uploadSpeedMbps: 15,
    priceMonthly: 20.00,
    contractLengthMonths: 0,
    dataLimitGB: undefined,
    campaigns: {
      freeModem: true,
      freeInstallation: true,
      noContract: true,
      limitedTime: false,
    },
    availableDistrictIds: [
      '660e8400-e29b-41d4-a716-446655440001',
      '660e8400-e29b-41d4-a716-446655440002',
      '660e8400-e29b-41d4-a716-446655440003',
      '660e8400-e29b-41d4-a716-446655440004',
      '660e8400-e29b-41d4-a716-446655440005', // Ganja - Kapaz
      '660e8400-e29b-41d4-a716-446655440006', // Ganja - Nizami
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

/**
 * In-memory implementation of Tariff repository
 */
export class InMemoryTariffRepository implements ITariffRepository {
  private tariffs: Tariff[] = [...mockTariffs];

  async findById(id: string): Promise<Tariff | null> {
    return this.tariffs.find((tariff) => tariff.id === id) || null;
  }

  async findByFilter(
    criteria: TariffFilterCriteria,
    sortOptions?: TariffSortOptions
  ): Promise<Tariff[]> {
    let filtered = this.tariffs.filter((tariff) => {
      if (!tariff.isActive) return false;

      // Filter by district availability
      if (criteria.districtIds && criteria.districtIds.length > 0) {
        const hasDistrict = criteria.districtIds.some((districtId) =>
          tariff.availableDistrictIds.includes(districtId)
        );
        if (!hasDistrict) return false;
      }

      // Filter by technology
      if (criteria.technologies && criteria.technologies.length > 0) {
        if (!criteria.technologies.includes(tariff.technology)) return false;
      }

      // Filter by speed range
      if (criteria.minSpeedMbps && tariff.speedMbps < criteria.minSpeedMbps) return false;
      if (criteria.maxSpeedMbps && tariff.speedMbps > criteria.maxSpeedMbps) return false;

      // Filter by price range
      if (criteria.minPriceMonthly && tariff.priceMonthly < criteria.minPriceMonthly) return false;
      if (criteria.maxPriceMonthly && tariff.priceMonthly > criteria.maxPriceMonthly) return false;

      // Filter by contract length
      if (criteria.maxContractLength !== undefined && tariff.contractLengthMonths > criteria.maxContractLength) {
        return false;
      }

      // Filter by campaign flags
      if (criteria.campaignFlags) {
        if (criteria.campaignFlags.freeModem && !tariff.campaigns.freeModem) return false;
        if (criteria.campaignFlags.freeInstallation && !tariff.campaigns.freeInstallation) return false;
        if (criteria.campaignFlags.noContract && !tariff.campaigns.noContract) return false;
        if (criteria.campaignFlags.limitedTime && !tariff.campaigns.limitedTime) return false;
      }

      return true;
    });

    // Apply sorting
    if (sortOptions) {
      const { sortBy = 'priority', sortOrder = 'desc' } = sortOptions;
      
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'price':
            comparison = a.priceMonthly - b.priceMonthly;
            break;
          case 'speed':
            comparison = a.speedMbps - b.speedMbps;
            break;
          case 'speed_price_ratio':
            const ratioA = a.speedMbps / a.priceMonthly;
            const ratioB = b.speedMbps / b.priceMonthly;
            comparison = ratioA - ratioB;
            break;
          case 'priority':
          default:
            // Priority sorting would require ISP data - simplified here
            comparison = 0;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }

  async findByIspId(ispId: string): Promise<Tariff[]> {
    return this.tariffs.filter((tariff) => tariff.ispId === ispId && tariff.isActive);
  }

  async create(data: Omit<Tariff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tariff> {
    const tariff: Tariff = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tariffs.push(tariff);
    return tariff;
  }

  async update(id: string, data: Partial<Tariff>): Promise<Tariff | null> {
    const index = this.tariffs.findIndex((tariff) => tariff.id === id);
    if (index === -1) return null;

    this.tariffs[index] = {
      ...this.tariffs[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.tariffs[index];
  }
}
