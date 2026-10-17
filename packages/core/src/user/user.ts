import { prisma } from '@shumai/db'

import { hashPassword } from 'better-auth/crypto'

export class UserService {
  constructor(private readonly prismaClient: typeof prisma = prisma) {}

  async getUserById(id: string) {
    return this.prismaClient.user.findUnique({
      where: { id },
    })
  }

  async createUser(data: { name: string; email: string; password: string }) {
    const existing = await this.prismaClient.user.findUnique({
      where: { email: data.email },
    })
    if (existing) throw new Error('User already exists')
    const hashed = await hashPassword(data.password)
    return this.prismaClient.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        type: 'human',
      },
    })
  }

  async createGuestUser(data: { name: string; email: string; guestEmail: string }) {
    return this.prismaClient.user.create({
      data: {
        name: data.name,
        email: data.email,
        guestEmail: data.guestEmail,
        type: 'human',
      },
    })
  }
}

export const userService = new UserService()
