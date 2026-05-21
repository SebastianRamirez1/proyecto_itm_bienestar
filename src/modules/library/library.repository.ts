import { LibraryBook, LibraryRoom, LibraryRoomReservation } from '@prisma/client';
import { prisma } from '../../config/database';

export class LibraryRepository {
  async searchBooks(opts: {
    q?: string;
    category?: string;
    available?: boolean;
    skip: number;
    take: number;
  }): Promise<{ books: LibraryBook[]; total: number }> {
    const where = {
      ...(opts.q && {
        OR: [
          { title: { contains: opts.q, mode: 'insensitive' as const } },
          { author: { contains: opts.q, mode: 'insensitive' as const } },
          { isbn: { contains: opts.q } },
        ],
      }),
      ...(opts.category && { category: { contains: opts.category, mode: 'insensitive' as const } }),
      ...(opts.available === true && { availableCopies: { gt: 0 } }),
    };

    const [books, total] = await Promise.all([
      prisma.libraryBook.findMany({ where, skip: opts.skip, take: opts.take, orderBy: { title: 'asc' } }),
      prisma.libraryBook.count({ where }),
    ]);

    return { books, total };
  }

  async findBookById(id: string): Promise<LibraryBook | null> {
    return prisma.libraryBook.findUnique({ where: { id } });
  }

  async findAllRooms(): Promise<LibraryRoom[]> {
    return prisma.libraryRoom.findMany({ orderBy: { name: 'asc' } });
  }

  async findRoomById(id: string): Promise<LibraryRoom | null> {
    return prisma.libraryRoom.findUnique({ where: { id } });
  }

  async findConflictingReservation(
    roomId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<LibraryRoomReservation | null> {
    return prisma.libraryRoomReservation.findFirst({
      where: {
        roomId,
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });
  }

  async createReservation(
    roomId: string,
    userId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<LibraryRoomReservation> {
    return prisma.libraryRoomReservation.create({
      data: { roomId, userId, startTime, endTime },
    });
  }
}
