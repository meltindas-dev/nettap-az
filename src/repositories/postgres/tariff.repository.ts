import { ITariffRepository, Tariff, TechnologyType } from '@/domain';
import { db } from './db';

export class PostgresTariffRepository implements ITariffRepository {
  async findAll(): Promise<Tariff[]> {
    const result = await db.query<any>(
      `SELECT t.*, 
              array_agg(td.district_id) FILTER (WHERE td.district_id IS NOT NULL) as district_ids
       FROM tariffs t
       LEFT JOIN tariff_districts td ON t.id = td.tariff_id
       WHERE t.is_active = true
       GROUP BY t.id
       ORDER BY t.price_monthly`
    );
    
    return result.rows.map(this.mapRowToTariff);
  }

  async findById(id: string): Promise<Tariff | null> {
    const result = await db.query<any>(
      `SELECT t.*, 
              array_agg(td.district_id) FILTER (WHERE td.district_id IS NOT NULL) as district_ids
       FROM tariffs t
       LEFT JOIN tariff_districts td ON t.id = td.tariff_id
       WHERE t.id = $1
       GROUP BY t.id`,
      [id]
    );
    
    return result.rows.length > 0 ? this.mapRowToTariff(result.rows[0]) : null;
  }

  async findByFilter(criteria: import('@/domain').TariffFilterCriteria, sortOptions?: import('@/domain').TariffSortOptions): Promise<Tariff[]> {
    const conditions: string[] = ['t.is_active = true'];
    const params: any[] = [];
    let paramIndex = 1;

    // District filter (join required)
    if (criteria.districtIds && criteria.districtIds.length > 0) {
      conditions.push(`td.district_id = ANY($${paramIndex++})`);
      params.push(criteria.districtIds);
    }

    if (criteria.technologies && criteria.technologies.length > 0) {
      conditions.push(`t.technology = ANY($${paramIndex++})`);
      params.push(criteria.technologies);
    }

    if (criteria.minSpeedMbps !== undefined) {
      conditions.push(`t.speed_mbps >= $${paramIndex++}`);
      params.push(criteria.minSpeedMbps);
    }

    if (criteria.maxSpeedMbps !== undefined) {
      conditions.push(`t.speed_mbps <= $${paramIndex++}`);
      params.push(criteria.maxSpeedMbps);
    }

    if (criteria.minPriceMonthly !== undefined) {
      conditions.push(`t.price_monthly >= $${paramIndex++}`);
      params.push(criteria.minPriceMonthly);
    }

    if (criteria.maxPriceMonthly !== undefined) {
      conditions.push(`t.price_monthly <= $${paramIndex++}`);
      params.push(criteria.maxPriceMonthly);
    }

    if (criteria.maxContractLength !== undefined) {
      conditions.push(`t.contract_length_months <= $${paramIndex++}`);
      params.push(criteria.maxContractLength);
    }

    if (criteria.campaignFlags?.freeModem) {
      conditions.push(`t.campaigns->>'freeModem' = 'true'`);
    }

    if (criteria.campaignFlags?.freeInstallation) {
      conditions.push(`t.campaigns->>'freeInstallation' = 'true'`);
    }

    // Determine sort order
    let orderClause = 't.price_monthly ASC'; // default
    if (sortOptions?.sortBy) {
      const order = sortOptions.sortOrder === 'desc' ? 'DESC' : 'ASC';
      switch (sortOptions.sortBy) {
        case 'price':
          orderClause = `t.price_monthly ${order}`;
          break;
        case 'speed':
          orderClause = `t.speed_mbps ${order}`;
          break;
        case 'speed_price_ratio':
          orderClause = `(t.speed_mbps::float / t.price_monthly) ${order}`;
          break;
        case 'priority':
          orderClause = `i.priority_score ${order}, t.price_monthly ASC`;
          break;
      }
    }

    const query = `
      SELECT t.*, 
             array_agg(DISTINCT td2.district_id) FILTER (WHERE td2.district_id IS NOT NULL) as district_ids
      FROM tariffs t
      LEFT JOIN tariff_districts td ON t.id = td.tariff_id
      LEFT JOIN tariff_districts td2 ON t.id = td2.tariff_id
      LEFT JOIN isps i ON t.isp_id = i.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY t.id, i.priority_score
      ORDER BY ${orderClause}
    `;

    const result = await db.query<any>(query, params);
    return result.rows.map(this.mapRowToTariff);
  }

  async findByIspId(ispId: string): Promise<Tariff[]> {
    const result = await db.query<any>(
      `SELECT t.*, 
              array_agg(td.district_id) FILTER (WHERE td.district_id IS NOT NULL) as district_ids
       FROM tariffs t
       LEFT JOIN tariff_districts td ON t.id = td.tariff_id
       WHERE t.isp_id = $1 AND t.is_active = true
       GROUP BY t.id
       ORDER BY t.price_monthly`,
      [ispId]
    );
    
    return result.rows.map(this.mapRowToTariff);
  }

  async create(tariff: Omit<Tariff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tariff> {
    return db.transaction(async (client) => {
      // Insert tariff
      const result = await client.query<any>(
        `INSERT INTO tariffs (
          isp_id, name, description, technology, speed_mbps, upload_speed_mbps,
          price_monthly, contract_length_months, data_limit_gb, campaigns, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          tariff.ispId,
          tariff.name,
          tariff.description || null,
          tariff.technology,
          tariff.speedMbps,
          tariff.uploadSpeedMbps || null,
          tariff.priceMonthly,
          tariff.contractLengthMonths || 0,
          tariff.dataLimitGB || null,
          JSON.stringify(tariff.campaigns),
          tariff.isActive ?? true,
        ]
      );

      const newTariff = result.rows[0];

      // Insert district associations
      if (tariff.availableDistrictIds && tariff.availableDistrictIds.length > 0) {
        const districtValues = tariff.availableDistrictIds
          .map((_, i) => `($1, $${i + 2})`)
          .join(', ');
        
        await client.query(
          `INSERT INTO tariff_districts (tariff_id, district_id) VALUES ${districtValues}`,
          [newTariff.id, ...tariff.availableDistrictIds]
        );
      }

      // Fetch complete tariff with districts
      const completeResult = await client.query<any>(
        `SELECT t.*, 
                array_agg(td.district_id) FILTER (WHERE td.district_id IS NOT NULL) as district_ids
         FROM tariffs t
         LEFT JOIN tariff_districts td ON t.id = td.tariff_id
         WHERE t.id = $1
         GROUP BY t.id`,
        [newTariff.id]
      );

      return this.mapRowToTariff(completeResult.rows[0]);
    });
  }

  async update(
    id: string,
    updates: Partial<Omit<Tariff, 'id' | 'createdAt'>>
  ): Promise<Tariff | null> {
    return db.transaction(async (client) => {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }
      if (updates.technology !== undefined) {
        fields.push(`technology = $${paramIndex++}`);
        values.push(updates.technology);
      }
      if (updates.speedMbps !== undefined) {
        fields.push(`speed_mbps = $${paramIndex++}`);
        values.push(updates.speedMbps);
      }
      if (updates.uploadSpeedMbps !== undefined) {
        fields.push(`upload_speed_mbps = $${paramIndex++}`);
        values.push(updates.uploadSpeedMbps);
      }
      if (updates.priceMonthly !== undefined) {
        fields.push(`price_monthly = $${paramIndex++}`);
        values.push(updates.priceMonthly);
      }
      if (updates.contractLengthMonths !== undefined) {
        fields.push(`contract_length_months = $${paramIndex++}`);
        values.push(updates.contractLengthMonths);
      }
      if (updates.dataLimitGB !== undefined) {
        fields.push(`data_limit_gb = $${paramIndex++}`);
        values.push(updates.dataLimitGB);
      }
      if (updates.isActive !== undefined) {
        fields.push(`is_active = $${paramIndex++}`);
        values.push(updates.isActive);
      }

      // Update campaigns if needed
      if (updates.campaigns !== undefined) {
        fields.push(`campaigns = $${paramIndex++}`);
        values.push(JSON.stringify(updates.campaigns));
      }

      if (fields.length > 0) {
        values.push(id);
        await client.query(
          `UPDATE tariffs SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }

      // Update district associations if provided
      if (updates.availableDistrictIds !== undefined) {
        // Delete existing associations
        await client.query('DELETE FROM tariff_districts WHERE tariff_id = $1', [id]);

        // Insert new associations
        if (updates.availableDistrictIds.length > 0) {
          const districtValues = updates.availableDistrictIds
            .map((_, i) => `($1, $${i + 2})`)
            .join(', ');
          
          await client.query(
            `INSERT INTO tariff_districts (tariff_id, district_id) VALUES ${districtValues}`,
            [id, ...updates.availableDistrictIds]
          );
        }
      }

      // Fetch updated tariff
      const result = await client.query<any>(
        `SELECT t.*, 
                array_agg(td.district_id) FILTER (WHERE td.district_id IS NOT NULL) as district_ids
         FROM tariffs t
         LEFT JOIN tariff_districts td ON t.id = td.tariff_id
         WHERE t.id = $1
         GROUP BY t.id`,
        [id]
      );

      return result.rows.length > 0 ? this.mapRowToTariff(result.rows[0]) : null;
    });
  }

  private mapRowToTariff(row: any): Tariff {
    return {
      id: row.id,
      ispId: row.isp_id,
      name: row.name,
      description: row.description || undefined,
      technology: row.technology as TechnologyType,
      speedMbps: row.speed_mbps,
      uploadSpeedMbps: row.upload_speed_mbps || undefined,
      priceMonthly: parseFloat(row.price_monthly),
      contractLengthMonths: row.contract_length_months,
      dataLimitGB: row.data_limit_gb || undefined,
      campaigns: row.campaigns || { freeModem: false, freeInstallation: false },
      availableDistrictIds: row.district_ids || [],
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
