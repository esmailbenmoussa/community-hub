/**
 * Shared Mock Users
 * Central user pool used across all mock data (discussions, comments, leaderboard)
 */

import { User } from '@/types';

/**
 * Mock users for development and testing
 */
export const MOCK_USERS: User[] = [
  {
    id: 'user-marcus',
    displayName: 'Marcus Rivera',
    imageUrl: 'https://i.pravatar.cc/150?u=marcus',
    uniqueName: 'marcus.rivera@example.com',
  },
  {
    id: 'user-1',
    displayName: 'Alice Johnson',
    imageUrl: 'https://i.pravatar.cc/150?u=alice',
    uniqueName: 'alice.johnson@example.com',
  },
  {
    id: 'user-2',
    displayName: 'Bob Smith',
    imageUrl: 'https://i.pravatar.cc/150?u=bob',
    uniqueName: 'bob.smith@example.com',
  },
  {
    id: 'user-3',
    displayName: 'Carol Davis',
    imageUrl: 'https://i.pravatar.cc/150?u=carol',
    uniqueName: 'carol.davis@example.com',
  },
  {
    id: 'user-4',
    displayName: 'Dan Wilson',
    imageUrl: 'https://i.pravatar.cc/150?u=dan',
    uniqueName: 'dan.wilson@example.com',
  },
  {
    id: 'user-5',
    displayName: 'Eva Martinez',
    imageUrl: 'https://i.pravatar.cc/150?u=eva',
    uniqueName: 'eva.martinez@example.com',
  },
  {
    id: 'user-6',
    displayName: 'Frank Chen',
    imageUrl: 'https://i.pravatar.cc/150?u=frank',
    uniqueName: 'frank.chen@example.com',
  },
  {
    id: 'user-7',
    displayName: 'Grace Kim',
    imageUrl: 'https://i.pravatar.cc/150?u=grace',
    uniqueName: 'grace.kim@example.com',
  },
  {
    id: 'user-8',
    displayName: 'Henry Brown',
    imageUrl: 'https://i.pravatar.cc/150?u=henry',
    uniqueName: 'henry.brown@example.com',
  },
  {
    id: 'user-9',
    displayName: 'Ivy Thompson',
    imageUrl: 'https://i.pravatar.cc/150?u=ivy',
    uniqueName: 'ivy.thompson@example.com',
  },
  {
    id: 'user-10',
    displayName: 'Jack Anderson',
    imageUrl: 'https://i.pravatar.cc/150?u=jack',
    uniqueName: 'jack.anderson@example.com',
  },
  {
    id: 'user-11',
    displayName: 'Karen White',
    imageUrl: 'https://i.pravatar.cc/150?u=karen',
    uniqueName: 'karen.white@example.com',
  },
  {
    id: 'user-12',
    displayName: 'Leo Garcia',
    imageUrl: 'https://i.pravatar.cc/150?u=leo',
    uniqueName: 'leo.garcia@example.com',
  },
];

/**
 * Helper to get a user by index (wraps around if out of bounds)
 */
export function getMockUser(index: number): User {
  return MOCK_USERS[index % MOCK_USERS.length];
}

/**
 * Helper to get a random mock user
 */
export function getRandomMockUser(): User {
  return MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
}

/**
 * Get user by ID
 */
export function getMockUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}

/**
 * Specific user shortcuts for common use
 */
export const MARCUS = MOCK_USERS[0];
export const ALICE = MOCK_USERS[1];
export const BOB = MOCK_USERS[2];
export const CAROL = MOCK_USERS[3];
export const DAN = MOCK_USERS[4];
export const EVA = MOCK_USERS[5];
export const FRANK = MOCK_USERS[6];
export const GRACE = MOCK_USERS[7];
export const HENRY = MOCK_USERS[8];
export const IVY = MOCK_USERS[9];
export const JACK = MOCK_USERS[10];
export const KAREN = MOCK_USERS[11];
export const LEO = MOCK_USERS[12];
