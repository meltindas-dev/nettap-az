import { ICityRepository, City } from '@/domain';
import { db } from './db';

export class PostgresCityRepository implements ICityRepository {
  async findAll(): Promise<City[]> {
    const result = await db.query<City>(
      'SELECT * FROM cities ORDER BY name_az'
    );
    return result.rows.map(this.mapRowToCity);
  }

  async findActive(): Promise<City[]> {
    const result = await db.query<City>(
      'SELECT * FROM cities WHERE is_active = true ORDER BY name_az'
    );
    return result.rows.map(this.mapRowToCity);
  }

  async findById(id: string): Promise<City | null> {
    const result = await db.query<City>(
      'SELECT * FROM cities WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? this.mapRowToCity(result.rows[0]) : null;
  }

  private mapRowToCity(row: any): City {
    return {
      id: row.id,
      name: row.name,
      nameAz: row.name_az,
      nameEn: row.name_en,
      isActive: row.is_active,
    };
  }
}
