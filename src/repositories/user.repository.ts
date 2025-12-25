import { User, IUserRepository, UserRole } from '@/domain';

/**
 * Mock users for testing
 * Passwords (use these for login):
 * - admin@nettap.az : admin123
 * - azertelecom@nettap.az : isp123
 * - baktelecom@nettap.az : isp123
 */
const mockUsers: User[] = [
  {
    id: 'aa0e8400-e29b-41d4-a716-446655440001',
    email: 'admin@nettap.az',
    passwordHash: '$2b$10$FbBkU39xQPK3KPac1jRYbOXRcrAfD5HetLtqkHur.xW4VAz8VeTly', // admin123
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'aa0e8400-e29b-41d4-a716-446655440002',
    email: 'azertelecom@nettap.az',
    passwordHash: '$2b$10$CJ1rDWnT7BYpIE24Hfe5iO2pI8tv7gNDQEtQS13w8/zjzxFb/4k1q', // isp123
    role: UserRole.ISP,
    ispId: '770e8400-e29b-41d4-a716-446655440001', // AzerTelecom ISP ID
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'aa0e8400-e29b-41d4-a716-446655440003',
    email: 'baktelecom@nettap.az',
    passwordHash: '$2b$10$CJ1rDWnT7BYpIE24Hfe5iO2pI8tv7gNDQEtQS13w8/zjzxFb/4k1q', // isp123
    role: UserRole.ISP,
    ispId: '770e8400-e29b-41d4-a716-446655440002', // Baktelecom ISP ID
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

/**
 * In-memory implementation of User repository
 */
export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [...mockUsers];

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) || null;
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return null;

    this.users[index] = {
      ...this.users[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.users[index];
  }
}
