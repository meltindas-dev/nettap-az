import { Lead, Tariff, TariffFilterCriteria, TariffSortOptions, City, District, ISP, User } from './models';
import { LeadStatus } from './enums';

/**
 * Repository interface for User data access
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
}

/**
 * Repository interface for ISP data access
 */
export interface IISPRepository {
  findById(id: string): Promise<ISP | null>;
  findAll(): Promise<ISP[]>;
  findActive(): Promise<ISP[]>;
  create(isp: Omit<ISP, 'id' | 'createdAt' | 'updatedAt'>): Promise<ISP>;
  update(id: string, data: Partial<ISP>): Promise<ISP | null>;
}

/**
 * Repository interface for City data access
 */
export interface ICityRepository {
  findById(id: string): Promise<City | null>;
  findAll(): Promise<City[]>;
  findActive(): Promise<City[]>;
}

/**
 * Repository interface for District data access
 */
export interface IDistrictRepository {
  findById(id: string): Promise<District | null>;
  findByCityId(cityId: string): Promise<District[]>;
  findAll(): Promise<District[]>;
}

/**
 * Repository interface for Tariff data access
 */
export interface ITariffRepository {
  findById(id: string): Promise<Tariff | null>;
  findByFilter(criteria: TariffFilterCriteria, sortOptions?: TariffSortOptions): Promise<Tariff[]>;
  findByIspId(ispId: string): Promise<Tariff[]>;
  create(tariff: Omit<Tariff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tariff>;
  update(id: string, data: Partial<Tariff>): Promise<Tariff | null>;
}

/**
 * Repository interface for Lead data access
 */
export interface ILeadRepository {
  findById(id: string): Promise<Lead | null>;
  findAll(limit?: number, offset?: number): Promise<Lead[]>;
  findByStatus(status: LeadStatus): Promise<Lead[]>;
  findByAssignedIsp(ispId: string): Promise<Lead[]>;
  create(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead>;
  update(id: string, data: Partial<Lead>): Promise<Lead | null>;
  updateStatus(id: string, status: LeadStatus, notes?: string): Promise<Lead | null>;
  assignToIsp(id: string, ispId: string): Promise<Lead | null>;
}
