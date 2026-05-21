import { LibraryRepository } from './library.repository';
import { BookSearchDto, ReserveRoomDto } from './library.schema';
import { getOrSet, CacheTTL } from '../../shared/cache/redis';
import { AppError } from '../../shared/errors/AppError';

const SCHEDULE = {
  weekdays: 'Lunes a viernes: 7:00am – 9:00pm',
  saturday: 'Sábados: 8:00am – 5:00pm',
  sunday: 'Domingos: Cerrado',
  note: 'Durante semana de finales el horario se extiende hasta las 10pm',
};

export class LibraryService {
  constructor(private readonly repo = new LibraryRepository()) {}

  async searchBooks(dto: BookSearchDto) {
    const skip = (dto.page - 1) * dto.limit;
    const { books, total } = await this.repo.searchBooks({
      q: dto.q,
      category: dto.category,
      available: dto.available,
      skip,
      take: dto.limit,
    });

    return {
      books,
      meta: {
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }

  async getBookById(id: string) {
    const book = await this.repo.findBookById(id);
    if (!book) throw AppError.notFound(`Book ${id} not found`);
    return book;
  }

  async getRooms() {
    const { data } = await getOrSet('library:rooms', CacheTTL.LIBRARY, () =>
      this.repo.findAllRooms(),
    );
    return data;
  }

  getSchedule() {
    return SCHEDULE;
  }

  async reserveRoom(dto: ReserveRoomDto, userId: string) {
    const room = await this.repo.findRoomById(dto.roomId);
    if (!room) throw AppError.notFound(`Room ${dto.roomId} not found`);

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime < new Date()) {
      throw AppError.badRequest('Cannot reserve a room in the past');
    }

    const conflict = await this.repo.findConflictingReservation(dto.roomId, startTime, endTime);
    if (conflict) {
      throw AppError.conflict('Room is already reserved for that time slot');
    }

    const reservation = await this.repo.createReservation(dto.roomId, userId, startTime, endTime);
    return { reservation, room: { id: room.id, name: room.name, capacity: room.capacity } };
  }
}
