import { IUserRepository, User, UserRole } from '@/domain';
import { sheetsDb } from './db';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'Users';
const RANGE = `${SHEET_NAME}!A2:I`; // Skip header row

export class SheetsUserRepository implements IUserRepository {
  private async getAllRows(): Promise<any[][]> {
    return sheetsDb.readRange(RANGE);
  }

  private rowToUser(row: any[]): User {
    return {
      id: row[0],
      email: row[1],
      passwordHash: row[2],
      role: row[3] as UserRole,
      ispId: row[4] || undefined,
      isActive: row[5] === 'TRUE',
      createdAt: new Date(row[6]),
      updatedAt: new Date(row[7]),
    };
  }

  private userToRow(user: User): any[] {
    return [
      user.id,
      user.email,
      user.passwordHash,
      user.role,
      user.ispId || '',
      user.isActive ? 'TRUE' : 'FALSE',
      user.createdAt.toISOString(),
      user.updatedAt.toISOString(),
    ];
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.getAllRows();
    const row = rows.find((r) => r[0] === id);
    return row ? this.rowToUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.getAllRows();
    const row = rows.find((r) => r[1] === email);
    return row ? this.rowToUser(row) : null;
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await sheetsDb.appendRow(SHEET_NAME, this.userToRow(newUser));
    return newUser;
  }

  async update(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>
  ): Promise<User | null> {
    const rows = await this.getAllRows();
    const rowIndex = rows.findIndex((r) => r[0] === id);
    
    if (rowIndex === -1) return null;

    const existingUser = this.rowToUser(rows[rowIndex]);
    const updatedUser: User = {
      ...existingUser,
      ...updates,
      id: existingUser.id,
      createdAt: existingUser.createdAt,
      updatedAt: new Date(),
    };

    // Row index + 2 (1 for 1-based indexing, 1 for header)
    const cellRow = rowIndex + 2;
    await sheetsDb.updateRow(`${SHEET_NAME}!A${cellRow}:H${cellRow}`, this.userToRow(updatedUser));

    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.getAllRows();
    const rowIndex = rows.findIndex((r) => r[0] === id);
    
    if (rowIndex === -1) return false;

    // Google Sheets doesn't support row deletion via API easily
    // Mark as inactive instead
    await this.update(id, { isActive: false });
    return true;
  }
}
