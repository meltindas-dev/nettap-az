import { ILeadRepository, Lead, LeadStatus, LeadSource } from '@/domain';
import { db } from './db';

export class PostgresLeadRepository implements ILeadRepository {
  async findAll(): Promise<Lead[]> {
    const result = await db.query<any>(
      'SELECT * FROM leads ORDER BY created_at DESC'
    );
    return result.rows.map(this.mapRowToLead);
  }

  async findById(id: string): Promise<Lead | null> {
    const result = await db.query<any>(
      'SELECT * FROM leads WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? this.mapRowToLead(result.rows[0]) : null;
  }

  async findByAssignedIsp(ispId: string): Promise<Lead[]> {
    const result = await db.query<any>(
      'SELECT * FROM leads WHERE assigned_isp_id = $1 ORDER BY created_at DESC',
      [ispId]
    );
    return result.rows.map(this.mapRowToLead);
  }

  async findByStatus(status: LeadStatus): Promise<Lead[]> {
    const result = await db.query<any>(
      'SELECT * FROM leads WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );
    return result.rows.map(this.mapRowToLead);
  }

  async create(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const result = await db.query<any>(
      `INSERT INTO leads (
        status, source, full_name, phone, email, city_id, district_id, address,
        tariff_snapshot, assigned_isp_id, assigned_at, notes, outcome_notes, converted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        lead.status,
        lead.source,
        lead.fullName,
        lead.phone,
        lead.email || null,
        lead.cityId,
        lead.districtId,
        lead.address || null,
        JSON.stringify(lead.tariffSnapshot),
        lead.assignedIspId || null,
        lead.assignedAt || null,
        lead.notes || null,
        lead.outcomeNotes || null,
        lead.convertedAt || null,
      ]
    );

    return this.mapRowToLead(result.rows[0]);
  }

  async update(
    id: string,
    updates: Partial<Omit<Lead, 'id' | 'createdAt'>>
  ): Promise<Lead | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.fullName !== undefined) {
      fields.push(`full_name = $${paramIndex++}`);
      values.push(updates.fullName);
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }
    if (updates.address !== undefined) {
      fields.push(`address = $${paramIndex++}`);
      values.push(updates.address);
    }
    if (updates.assignedIspId !== undefined) {
      fields.push(`assigned_isp_id = $${paramIndex++}`);
      values.push(updates.assignedIspId);
    }
    if (updates.assignedAt !== undefined) {
      fields.push(`assigned_at = $${paramIndex++}`);
      values.push(updates.assignedAt);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }
    if (updates.outcomeNotes !== undefined) {
      fields.push(`outcome_notes = $${paramIndex++}`);
      values.push(updates.outcomeNotes);
    }
    if (updates.convertedAt !== undefined) {
      fields.push(`converted_at = $${paramIndex++}`);
      values.push(updates.convertedAt);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await db.query<any>(
      `UPDATE leads SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapRowToLead(result.rows[0]) : null;
  }

  async updateStatus(id: string, status: LeadStatus, notes?: string): Promise<Lead | null> {
    const fields = ['status = $2'];
    const values: any[] = [id, status];
    let paramIndex = 3;

    if (notes !== undefined) {
      fields.push(`outcome_notes = $${paramIndex++}`);
      values.push(notes);
    }

    if (status === LeadStatus.CONVERTED) {
      fields.push(`converted_at = $${paramIndex++}`);
      values.push(new Date());
    }

    const result = await db.query<any>(
      `UPDATE leads SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapRowToLead(result.rows[0]) : null;
  }

  async assignToIsp(id: string, ispId: string): Promise<Lead | null> {
    const result = await db.query<any>(
      `UPDATE leads SET assigned_isp_id = $2, assigned_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ispId]
    );

    return result.rows.length > 0 ? this.mapRowToLead(result.rows[0]) : null;
  }

  private mapRowToLead(row: any): Lead {
    return {
      id: row.id,
      status: row.status as LeadStatus,
      source: row.source as LeadSource,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email || undefined,
      cityId: row.city_id,
      districtId: row.district_id,
      address: row.address || undefined,
      tariffSnapshot: row.tariff_snapshot,
      assignedIspId: row.assigned_isp_id || undefined,
      assignedAt: row.assigned_at ? new Date(row.assigned_at) : undefined,
      notes: row.notes || undefined,
      outcomeNotes: row.outcome_notes || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      convertedAt: row.converted_at ? new Date(row.converted_at) : undefined,
    };
  }
}
