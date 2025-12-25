import { ITariffRepository, Tariff, TechnologyType, TariffFilterCriteria, TariffSortOptions } from '@/domain';
import { sheetsDb } from './db';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'Tariffs';
const RANGE = `${SHEET_NAME}!A2:P`; // Skip header row

export class SheetsTariffRepository implements ITariffRepository {
  private async getAllRows(): Promise<any[][]> {
    return sheetsDb.readRange(RANGE);
  }

  private rowToTariff(row: any[]): Tariff {
    return {
      id: row[0],
      ispId: row[1],
      name: row[2],
      description: row[3] || undefined,
      technology: row[4] as TechnologyType,
      speedMbps: parseInt(row[5]),
      uploadSpeedMbps: row[6] ? parseInt(row[6]) : undefined,
      priceMonthly: parseFloat(row[7]),
      contractLengthMonths: parseInt(row[8]),
      dataLimitGB: row[9] ? parseInt(row[9]) : undefined,
      campaigns: {
        freeModem: row[10] === 'TRUE',
        freeInstallation: row[11] === 'TRUE',
      },
      availableDistrictIds: row[12] ? row[12].split(',') : [],
      isActive: row[13] === 'TRUE',
      createdAt: new Date(row[14]),
      updatedAt: new Date(row[15]),
    };
  }

  private tariffToRow(tariff: Tariff): any[] {
    return [
      tariff.id,
      tariff.ispId,
      tariff.name,
      tariff.description || '',
      tariff.technology,
      tariff.speedMbps.toString(),
      tariff.uploadSpeedMbps?.toString() || '',
      tariff.priceMonthly.toString(),
      tariff.contractLengthMonths.toString(),
      tariff.dataLimitGB?.toString() || '',
      tariff.campaigns.freeModem ? 'TRUE' : 'FALSE',
      tariff.campaigns.freeInstallation ? 'TRUE' : 'FALSE',
      tariff.availableDistrictIds.join(','),
      tariff.isActive ? 'TRUE' : 'FALSE',
      tariff.createdAt.toISOString(),
      tariff.updatedAt.toISOString(),
    ];
  }

  async findAll(): Promise<Tariff[]> {
    const rows = await this.getAllRows();
    return rows.filter((r) => r[13] === 'TRUE').map((row) => this.rowToTariff(row));
  }

  async findById(id: string): Promise<Tariff | null> {
    const rows = await this.getAllRows();
    const row = rows.find((r) => r[0] === id);
    return row ? this.rowToTariff(row) : null;
  }

  async findByFilter(criteria: TariffFilterCriteria, sortOptions?: TariffSortOptions): Promise<Tariff[]> {
    const rows = await this.getAllRows();
    
    let filtered = rows.filter((row) => {
      if (row[13] !== 'TRUE') return false; // isActive

      const districtIds = row[12] ? row[12].split(',') : [];
      if (criteria.districtIds && criteria.districtIds.length > 0) {
        if (!criteria.districtIds.some(d => districtIds.includes(d))) return false;
      }
      
      if (criteria.technologies && criteria.technologies.length > 0) {
        if (!criteria.technologies.includes(row[4] as TechnologyType)) return false;
      }
      
      const speed = parseInt(row[5]);
      if (criteria.minSpeedMbps && speed < criteria.minSpeedMbps) return false;
      if (criteria.maxSpeedMbps && speed > criteria.maxSpeedMbps) return false;
      
      const price = parseFloat(row[7]);
      if (criteria.minPriceMonthly && price < criteria.minPriceMonthly) return false;
      if (criteria.maxPriceMonthly && price > criteria.maxPriceMonthly) return false;
      
      const contractLength = parseInt(row[8]);
      if (criteria.maxContractLength !== undefined && contractLength > criteria.maxContractLength) return false;
      
      if (criteria.campaignFlags?.freeModem && row[10] !== 'TRUE') return false;
      if (criteria.campaignFlags?.freeInstallation && row[11] !== 'TRUE') return false;

      return true;
    });

    // Apply sorting
    if (sortOptions?.sortBy) {
      const order = sortOptions.sortOrder === 'desc' ? -1 : 1;
      filtered.sort((a, b) => {
        let aVal: number, bVal: number;
        switch (sortOptions.sortBy) {
          case 'price':
            aVal = parseFloat(a[7]);
            bVal = parseFloat(b[7]);
            break;
          case 'speed':
            aVal = parseInt(a[5]);
            bVal = parseInt(b[5]);
            break;
          case 'speed_price_ratio':
            aVal = parseInt(a[5]) / parseFloat(a[7]);
            bVal = parseInt(b[5]) / parseFloat(b[7]);
            break;
          default:
            return 0;
        }
        return (aVal - bVal) * order;
      });
    } else {
      // Default sort by price ascending
      filtered.sort((a, b) => parseFloat(a[7]) - parseFloat(b[7]));
    }

    return filtered.map((row) => this.rowToTariff(row));
  }

  async findByIspId(ispId: string): Promise<Tariff[]> {
    const rows = await this.getAllRows();
    return rows
      .filter((r) => r[1] === ispId && r[13] === 'TRUE')
      .map((row) => this.rowToTariff(row));
  }

  async create(tariff: Omit<Tariff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tariff> {
    const newTariff: Tariff = {
      ...tariff,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await sheetsDb.appendRow(SHEET_NAME, this.tariffToRow(newTariff));
    return newTariff;
  }

  async update(
    id: string,
    updates: Partial<Omit<Tariff, 'id' | 'createdAt'>>
  ): Promise<Tariff | null> {
    const rows = await this.getAllRows();
    const rowIndex = rows.findIndex((r) => r[0] === id);
    
    if (rowIndex === -1) return null;

    const existingTariff = this.rowToTariff(rows[rowIndex]);
    const updatedTariff: Tariff = {
      ...existingTariff,
      ...updates,
      id: existingTariff.id,
      createdAt: existingTariff.createdAt,
      updatedAt: new Date(),
    };

    const cellRow = rowIndex + 2;
    await sheetsDb.updateRow(`${SHEET_NAME}!A${cellRow}:P${cellRow}`, this.tariffToRow(updatedTariff));

    return updatedTariff;
  }
}
