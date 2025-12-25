import { City, ICityRepository } from '@/domain';

/**
 * Mock data for cities
 */
const mockCities: City[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Bakı',
    nameAz: 'Bakı',
    nameEn: 'Baku',
    isActive: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Gəncə',
    nameAz: 'Gəncə',
    nameEn: 'Ganja',
    isActive: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Sumqayıt',
    nameAz: 'Sumqayıt',
    nameEn: 'Sumgayit',
    isActive: true,
  },
];

/**
 * In-memory implementation of City repository
 * This can be replaced with PostgreSQL or Google Sheets implementation
 */
export class InMemoryCityRepository implements ICityRepository {
  private cities: City[] = [...mockCities];

  async findById(id: string): Promise<City | null> {
    return this.cities.find((city) => city.id === id) || null;
  }

  async findAll(): Promise<City[]> {
    return [...this.cities];
  }

  async findActive(): Promise<City[]> {
    return this.cities.filter((city) => city.isActive);
  }
}
