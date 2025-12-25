import { Lead, ILeadRepository, LeadStatus } from '@/domain';

/**
 * In-memory implementation of Lead repository
 */
export class InMemoryLeadRepository implements ILeadRepository {
  private leads: Lead[] = [];

  async findById(id: string): Promise<Lead | null> {
    return this.leads.find((lead) => lead.id === id) || null;
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<Lead[]> {
    return this.leads
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async findByStatus(status: LeadStatus): Promise<Lead[]> {
    return this.leads.filter((lead) => lead.status === status);
  }

  async findByAssignedIsp(ispId: string): Promise<Lead[]> {
    return this.leads.filter((lead) => lead.assignedIspId === ispId);
  }

  async create(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const lead: Lead = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.leads.push(lead);
    return lead;
  }

  async update(id: string, data: Partial<Lead>): Promise<Lead | null> {
    const index = this.leads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;

    this.leads[index] = {
      ...this.leads[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.leads[index];
  }

  async updateStatus(id: string, status: LeadStatus, notes?: string): Promise<Lead | null> {
    const lead = await this.findById(id);
    if (!lead) return null;

    const updates: Partial<Lead> = {
      status,
      updatedAt: new Date(),
    };

    if (notes) {
      updates.notes = notes;
    }

    if (status === LeadStatus.CONVERTED) {
      updates.convertedAt = new Date();
    }

    return this.update(id, updates);
  }

  async assignToIsp(id: string, ispId: string): Promise<Lead | null> {
    return this.update(id, {
      assignedIspId: ispId,
      assignedAt: new Date(),
      status: LeadStatus.ASSIGNED_TO_ISP,
    });
  }
}
