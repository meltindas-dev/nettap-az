import { IDistrictRepository, District } from '@/domain';
import { db } from './db';

export class PostgresDistrictRepository implements IDistrictRepository {
  async findAll(): Promise<District[]> {
    const result = await db.query<District>(
      'SELECT * FROM districts ORDER BY name_az'
    );
    return result.rows.map(this.mapRowToDistrict);
  }

  async findById(id: string): Promise<District | null> {
    const result = await db.query<District>(
      'SELECT * FROM districts WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? this.mapRowToDistrict(result.rows[0]) : null;
  }

  async findByCityId(cityId: string): Promise<District[]> {
    const result = await db.query<District>(
      'SELECT * FROM districts WHERE city_id = $1 AND is_active = true ORDER BY name_az',
      [cityId]
    );
    return result.rows.map(this.mapRowToDistrict);
  }

  private mapRowToDistrict(row: any): District {
    return {
      id: row.id,
      cityId: row.city_id,
      name: row.name,
      nameAz: row.name_az,
      nameEn: row.name_en,
      isActive: row.is_active,
    };
  }
}
