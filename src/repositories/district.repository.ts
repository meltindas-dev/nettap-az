import { District, IDistrictRepository } from '@/domain';

/**
 * Mock data for districts
 */
const mockDistricts: District[] = [
  // Baku districts
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    cityId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Nəsimi',
    nameAz: 'Nəsimi',
    nameEn: 'Nasimi',
    isActive: true,
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    cityId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Yasamal',
    nameAz: 'Yasamal',
    nameEn: 'Yasamal',
    isActive: true,
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    cityId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Nərimanov',
    nameAz: 'Nərimanov',
    nameEn: 'Narimanov',
    isActive: true,
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440004',
    cityId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Sabunçu',
    nameAz: 'Sabunçu',
    nameEn: 'Sabunchu',
    isActive: true,
  },
  // Ganja districts
  {
    id: '660e8400-e29b-41d4-a716-446655440005',
    cityId: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Kəpəz',
    nameAz: 'Kəpəz',
    nameEn: 'Kapaz',
    isActive: true,
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440006',
    cityId: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Nizami',
    nameAz: 'Nizami',
    nameEn: 'Nizami',
    isActive: true,
  },
];

/**
 * In-memory implementation of District repository
 */
export class InMemoryDistrictRepository implements IDistrictRepository {
  private districts: District[] = [...mockDistricts];

  async findById(id: string): Promise<District | null> {
    return this.districts.find((district) => district.id === id) || null;
  }

  async findByCityId(cityId: string): Promise<District[]> {
    return this.districts.filter((district) => district.cityId === cityId && district.isActive);
  }

  async findAll(): Promise<District[]> {
    return [...this.districts];
  }
}
