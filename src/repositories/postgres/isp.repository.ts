import { IISPRepository, ISP } from '@/domain';
import { db } from './db';

export class PostgresISPRepository implements IISPRepository {
  async findAll(): Promise<ISP[]> {
    const result = await db.query<ISP>(
      'SELECT * FROM isps ORDER BY priority_score DESC, name'
    );
    return result.rows.map(this.mapRowToISP);
  }

  async findActive(): Promise<ISP[]> {
    const result = await db.query<ISP>(
      'SELECT * FROM isps WHERE is_active = true ORDER BY priority_score DESC, name'
    );
    return result.rows.map(this.mapRowToISP);
  }

  async findById(id: string): Promise<ISP | null> {
    const result = await db.query<ISP>(
      'SELECT * FROM isps WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? this.mapRowToISP(result.rows[0]) : null;
  }

  async create(isp: Omit<ISP, 'id' | 'createdAt' | 'updatedAt'>): Promise<ISP> {
    const result = await db.query<ISP>(
      `INSERT INTO isps (name, logo, description, contact_email, contact_phone, website, priority_score, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        isp.name,
        isp.logo || null,
        isp.description || null,
        isp.contactEmail,
        isp.contactPhone,
        isp.website || null,
        isp.priorityScore || 0,
        isp.isActive ?? true,
      ]
    );
    
    return this.mapRowToISP(result.rows[0]);
  }

  async update(id: string, updates: Partial<Omit<ISP, 'id' | 'createdAt'>>): Promise<ISP | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.logo !== undefined) {
      fields.push(`logo = $${paramIndex++}`);
      values.push(updates.logo);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.contactEmail !== undefined) {
      fields.push(`contact_email = $${paramIndex++}`);
      values.push(updates.contactEmail);
    }
    if (updates.contactPhone !== undefined) {
      fields.push(`contact_phone = $${paramIndex++}`);
      values.push(updates.contactPhone);
    }
    if (updates.website !== undefined) {
      fields.push(`website = $${paramIndex++}`);
      values.push(updates.website);
    }
    if (updates.priorityScore !== undefined) {
      fields.push(`priority_score = $${paramIndex++}`);
      values.push(updates.priorityScore);
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await db.query<ISP>(
      `UPDATE isps SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapRowToISP(result.rows[0]) : null;
  }

  private mapRowToISP(row: any): ISP {
    return {
      id: row.id,
      name: row.name,
      logo: row.logo || undefined,
      description: row.description || undefined,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      website: row.website || undefined,
      priorityScore: row.priority_score,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
