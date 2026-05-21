import { HealthResource, AcademicCalendar } from '@prisma/client';
import { prisma } from '../../config/database';

export class HealthRepository {
  async findResourcesByContext(contextType: string): Promise<HealthResource[]> {
    return prisma.healthResource.findMany({
      where: {
        active: true,
        OR: [{ contextType: contextType as never }, { contextType: 'normal' }],
      },
      orderBy: { contextType: 'asc' },
    });
  }

  async findAllActiveResources(): Promise<HealthResource[]> {
    return prisma.healthResource.findMany({
      where: { active: true },
      orderBy: { type: 'asc' },
    });
  }

  async findCurrentAcademicPeriod(): Promise<AcademicCalendar | null> {
    const today = new Date();
    return prisma.academicCalendar.findFirst({
      where: {
        startDate: { lte: today },
        endDate: { gte: today },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findEmergencyResources(): Promise<HealthResource[]> {
    return prisma.healthResource.findMany({
      where: { active: true, type: 'hotline' },
    });
  }
}
