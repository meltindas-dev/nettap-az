/**
 * Repository factory for dependency injection
 * Switches between storage backends based on DATABASE_TYPE environment variable
 */

import {
  ICityRepository,
  IDistrictRepository,
  IISPRepository,
  ITariffRepository,
  ILeadRepository,
  IUserRepository,
} from '@/domain';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

// In-memory repositories
import { InMemoryCityRepository } from './city.repository';
import { InMemoryDistrictRepository } from './district.repository';
import { InMemoryISPRepository } from './isp.repository';
import { InMemoryTariffRepository } from './tariff.repository';
import { InMemoryLeadRepository } from './lead.repository';
import { InMemoryUserRepository } from './user.repository';

// PostgreSQL repositories
import {
  PostgresUserRepository,
  PostgresCityRepository,
  PostgresDistrictRepository,
  PostgresISPRepository,
  PostgresTariffRepository,
  PostgresLeadRepository,
} from './postgres';

// Google Sheets repositories
import {
  SheetsUserRepository,
  SheetsCityRepository,
  SheetsDistrictRepository,
  SheetsISPRepository,
  SheetsTariffRepository,
  SheetsLeadRepository,
} from './sheets';

/**
 * Repository container for dependency injection
 * Singleton pattern - initializes repositories once based on DATABASE_TYPE
 */
export class RepositoryContainer {
  private static cityRepo: ICityRepository | null = null;
  private static districtRepo: IDistrictRepository | null = null;
  private static ispRepo: IISPRepository | null = null;
  private static tariffRepo: ITariffRepository | null = null;
  private static leadRepo: ILeadRepository | null = null;
  private static userRepo: IUserRepository | null = null;
  private static initialized = false;

  private static initialize(): void {
    if (this.initialized) return;

    const dbType = config.database.type;
    logger.info(`🗃️  Initializing repositories with backend: ${dbType}`);

    switch (dbType) {
      case 'postgres':
        this.userRepo = new PostgresUserRepository();
        this.cityRepo = new PostgresCityRepository();
        this.districtRepo = new PostgresDistrictRepository();
        this.ispRepo = new PostgresISPRepository();
        this.tariffRepo = new PostgresTariffRepository();
        this.leadRepo = new PostgresLeadRepository();
        logger.info('✅ PostgreSQL repositories initialized');
        break;

      case 'sheets':
        this.userRepo = new SheetsUserRepository();
        this.cityRepo = new SheetsCityRepository();
        this.districtRepo = new SheetsDistrictRepository();
        this.ispRepo = new SheetsISPRepository();
        this.tariffRepo = new SheetsTariffRepository();
        this.leadRepo = new SheetsLeadRepository();
        logger.info('✅ Google Sheets repositories initialized');
        break;

      case 'memory':
      default:
        this.userRepo = new InMemoryUserRepository();
        this.cityRepo = new InMemoryCityRepository();
        this.districtRepo = new InMemoryDistrictRepository();
        this.ispRepo = new InMemoryISPRepository();
        this.tariffRepo = new InMemoryTariffRepository();
        this.leadRepo = new InMemoryLeadRepository();
        logger.info('✅ In-memory repositories initialized');
        break;
    }

    this.initialized = true;
  }

  static getCityRepository(): ICityRepository {
    this.initialize();
    return this.cityRepo!;
  }

  static getDistrictRepository(): IDistrictRepository {
    this.initialize();
    return this.districtRepo!;
  }

  static getISPRepository(): IISPRepository {
    this.initialize();
    return this.ispRepo!;
  }

  static getTariffRepository(): ITariffRepository {
    this.initialize();
    return this.tariffRepo!;
  }

  static getLeadRepository(): ILeadRepository {
    this.initialize();
    return this.leadRepo!;
  }

  static getUserRepository(): IUserRepository {
    this.initialize();
    return this.userRepo!;
  }

  /**
   * Reset all repositories (useful for testing)
   */
  static reset(): void {
    this.cityRepo = null;
    this.districtRepo = null;
    this.ispRepo = null;
    this.tariffRepo = null;
    this.leadRepo = null;
    this.userRepo = null;
    this.initialized = false;
  }
}
