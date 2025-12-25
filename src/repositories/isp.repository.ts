import { ISP, IISPRepository } from '@/domain';

/**
 * Mock data for ISPs
 */
const mockISPs: ISP[] = [
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    name: 'AzerTelecom',
    logo: '/logos/azertelecom.png',
    description: 'Leading fiber internet provider',
    contactEmail: 'sales@azertelecom.az',
    contactPhone: '+994124901000',
    website: 'https://azertelecom.az',
    priorityScore: 95,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    name: 'Baktelecom',
    logo: '/logos/baktelecom.png',
    description: 'Reliable ADSL and VDSL services',
    contactEmail: 'info@baktelecom.az',
    contactPhone: '+994125980000',
    website: 'https://baktelecom.az',
    priorityScore: 90,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440003',
    name: 'Naxtel',
    logo: '/logos/naxtel.png',
    description: '4.5G wireless internet solutions',
    contactEmail: 'support@naxtel.az',
    contactPhone: '+994124040000',
    website: 'https://naxtel.az',
    priorityScore: 85,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

/**
 * In-memory implementation of ISP repository
 */
export class InMemoryISPRepository implements IISPRepository {
  private isps: ISP[] = [...mockISPs];

  async findById(id: string): Promise<ISP | null> {
    return this.isps.find((isp) => isp.id === id) || null;
  }

  async findAll(): Promise<ISP[]> {
    return [...this.isps];
  }

  async findActive(): Promise<ISP[]> {
    return this.isps.filter((isp) => isp.isActive);
  }

  async create(data: Omit<ISP, 'id' | 'createdAt' | 'updatedAt'>): Promise<ISP> {
    const isp: ISP = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.isps.push(isp);
    return isp;
  }

  async update(id: string, data: Partial<ISP>): Promise<ISP | null> {
    const index = this.isps.findIndex((isp) => isp.id === id);
    if (index === -1) return null;

    this.isps[index] = {
      ...this.isps[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.isps[index];
  }
}
