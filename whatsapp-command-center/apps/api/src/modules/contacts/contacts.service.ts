import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateContactDto, UpdateContactDto } from './dto';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        organizationId,
        ...dto,
      },
    });
  }

  async findAll(organizationId: string, query?: { search?: string; tagId?: string }) {
    const where: any = { organizationId };

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.tagId) {
      where.tags = {
        some: {
          id: query.tagId,
        },
      };
    }

    return this.prisma.contact.findMany({
      where,
      include: {
        tags: true,
        _count: {
          select: {
            conversations: true,
          },
        },
      },
      orderBy: {
        lastContactedAt: 'desc',
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
      include: {
        tags: true,
        conversations: {
          include: {
            messages: {
              take: 10,
              orderBy: { timestamp: 'desc' },
            },
          },
          orderBy: { lastMessageAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(id: string, organizationId: string, dto: UpdateContactDto) {
    const contact = await this.findOne(id, organizationId);

    return this.prisma.contact.update({
      where: { id },
      data: dto,
      include: {
        tags: true,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const contact = await this.findOne(id, organizationId);

    await this.prisma.contact.delete({
      where: { id },
    });

    return { success: true, message: 'Contact deleted successfully' };
  }

  async getStats(organizationId: string) {
    const [total, active, newThisMonth, vip] = await Promise.all([
      this.prisma.contact.count({ where: { organizationId } }),
      this.prisma.contact.count({
        where: {
          organizationId,
          lastContactedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.contact.count({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.contact.count({
        where: {
          organizationId,
          tags: {
            some: {
              name: 'VIP',
            },
          },
        },
      }),
    ]);

    return { total, active, newThisMonth, vip };
  }
}
