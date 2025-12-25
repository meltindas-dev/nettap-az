import { ILeadRepository, Lead, LeadStatus, LeadSource } from '@/domain';
import { sheetsDb } from './db';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'Leads';
const RANGE = `${SHEET_NAME}!A2:Q`; // Skip header row

export class SheetsLeadRepository implements ILeadRepository {
  private async getAllRows(): Promise<any[][]> {
    return sheetsDb.readRange(RANGE);
  }

  private rowToLead(row: any[]): Lead {
    return {
      id: row[0],
      status: row[1] as LeadStatus,
      source: row[2] as LeadSource,
      fullName: row[3],
      phone: row[4],
      email: row[5] || undefined,
      cityId: row[6],
      districtId: row[7],
      address: row[8] || undefined,
      tariffSnapshot: JSON.parse(row[9]),
      assignedIspId: row[10] || undefined,
      assignedAt: row[11] ? new Date(row[11]) : undefined,
      notes: row[12] || undefined,
      outcomeNotes: row[13] || undefined,
      createdAt: new Date(row[14]),
      updatedAt: new Date(row[15]),
      convertedAt: row[16] ? new Date(row[16]) : undefined,
    };
  }

  private leadToRow(lead: Lead): any[] {
    return [
      lead.id,
      lead.status,
      lead.source,
      lead.fullName,
      lead.phone,
      lead.email || '',
      lead.cityId,
      lead.districtId,
      lead.address || '',
      JSON.stringify(lead.tariffSnapshot),
      lead.assignedIspId || '',
      lead.assignedAt?.toISOString() || '',
      lead.notes || '',
      lead.outcomeNotes || '',
      lead.createdAt.toISOString(),
      lead.updatedAt.toISOString(),
      lead.convertedAt?.toISOString() || '',
    ];
  }

  async findAll(): Promise<Lead[]> {
    const rows = await this.getAllRows();
    return rows.map((row) => this.rowToLead(row));
  }

  async findById(id: string): Promise<Lead | null> {
    const rows = await this.getAllRows();
    const row = rows.find((r) => r[0] === id);
    return row ? this.rowToLead(row) : null;
  }

  async findByAssignedIsp(ispId: string): Promise<Lead[]> {
    const rows = await this.getAllRows();
    return rows.filter((r) => r[10] === ispId).map((row) => this.rowToLead(row));
  }

  async findByStatus(status: LeadStatus): Promise<Lead[]> {
    const rows = await this.getAllRows();
    return rows.filter((r) => r[1] === status).map((row) => this.rowToLead(row));
  }

  async create(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const newLead: Lead = {
      ...lead,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await sheetsDb.appendRow(SHEET_NAME, this.leadToRow(newLead));
    return newLead;
  }

  async update(
    id: string,
    updates: Partial<Omit<Lead, 'id' | 'createdAt'>>
  ): Promise<Lead | null> {
    const rows = await this.getAllRows();
    const rowIndex = rows.findIndex((r) => r[0] === id);
    
    if (rowIndex === -1) return null;

    const existingLead = this.rowToLead(rows[rowIndex]);
    const updatedLead: Lead = {
      ...existingLead,
      ...updates,
      id: existingLead.id,
      createdAt: existingLead.createdAt,
      updatedAt: new Date(),
    };

    const cellRow = rowIndex + 2;
    await sheetsDb.updateRow(`${SHEET_NAME}!A${cellRow}:Q${cellRow}`, this.leadToRow(updatedLead));

    return updatedLead;
  }

  async updateStatus(id: string, status: LeadStatus, notes?: string): Promise<Lead | null> {
    const updateData: Partial<Lead> = { status };
    
    if (notes !== undefined) {
      updateData.outcomeNotes = notes;
    }
    
    if (status === LeadStatus.CONVERTED) {
      updateData.convertedAt = new Date();
    }
    
    return this.update(id, updateData);
  }

  async assignToIsp(id: string, ispId: string): Promise<Lead | null> {
    return this.update(id, {
      assignedIspId: ispId,
      assignedAt: new Date(),
    });
  }
}
