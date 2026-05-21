import { PrismaClient, AlertSeverity, EventCategory, AcademicPeriodType, HealthContextType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Academic calendar 2026-1
  await prisma.academicCalendar.createMany({
    data: [
      { periodName: 'Inicio semestre 2026-1', startDate: new Date('2026-01-19'), endDate: new Date('2026-02-07'), periodType: AcademicPeriodType.registration },
      { periodName: 'Periodo normal', startDate: new Date('2026-02-10'), endDate: new Date('2026-03-27'), periodType: AcademicPeriodType.normal },
      { periodName: 'Semana de parciales', startDate: new Date('2026-03-30'), endDate: new Date('2026-04-03'), periodType: AcademicPeriodType.midterm },
      { periodName: 'Periodo normal II', startDate: new Date('2026-04-06'), endDate: new Date('2026-05-22'), periodType: AcademicPeriodType.normal },
      { periodName: 'Semana de finales', startDate: new Date('2026-05-25'), endDate: new Date('2026-05-29'), periodType: AcademicPeriodType.finals },
    ],
    skipDuplicates: true,
  });

  // Alerts
  await prisma.alert.createMany({
    data: [
      {
        title: 'Mantenimiento programado del sistema',
        body: 'El portal estudiantil estará en mantenimiento el sábado 24 de mayo de 10pm a 2am.',
        severity: AlertSeverity.info,
        expiresAt: new Date('2026-05-25T02:00:00Z'),
      },
      {
        title: 'Cierre anticipado cafetería',
        body: 'La cafetería cerrará a las 2pm el viernes 23 de mayo por evento institucional.',
        severity: AlertSeverity.warning,
        expiresAt: new Date('2026-05-23T14:00:00Z'),
      },
    ],
    skipDuplicates: true,
  });

  // Health resources
  await prisma.healthResource.createMany({
    data: [
      {
        title: 'Línea 106 — Salud Mental',
        description: 'Línea gratuita 24/7 para crisis emocionales. Atención inmediata por profesionales.',
        type: 'hotline',
        url: 'tel:106',
        contextType: HealthContextType.normal,
      },
      {
        title: 'Técnicas de respiración para el estrés de parciales',
        description: 'Guía práctica de 5 minutos con ejercicios de respiración diafragmática.',
        type: 'guide',
        contextType: HealthContextType.midterm,
      },
      {
        title: 'Manejo de la ansiedad ante finales',
        description: 'Estrategias cognitivo-conductuales para reducir la ansiedad en época de exámenes.',
        type: 'guide',
        contextType: HealthContextType.finals,
      },
      {
        title: 'Consulta psicológica gratuita ITM',
        description: 'El Departamento de Bienestar Institucional ofrece consultas psicológicas gratuitas para estudiantes activos.',
        type: 'service',
        contextType: HealthContextType.normal,
      },
    ],
    skipDuplicates: true,
  });

  // Events
  await prisma.event.createMany({
    data: [
      {
        title: 'Feria de empleo ITM 2026',
        description: 'Más de 30 empresas del sector tecnológico y manufacturero estarán presentes.',
        category: EventCategory.academic,
        startDate: new Date('2026-06-05T08:00:00Z'),
        endDate: new Date('2026-06-05T17:00:00Z'),
        location: 'Pabellón principal, Bloque 10',
        maxCapacity: 500,
      },
      {
        title: 'Torneo interfacultades de fútbol',
        description: 'Primera fecha del torneo interfacultades. Todos los estudiantes pueden participar.',
        category: EventCategory.sport,
        startDate: new Date('2026-05-28T14:00:00Z'),
        endDate: new Date('2026-05-28T18:00:00Z'),
        location: 'Cancha sintética, sede Robledo',
        maxCapacity: 200,
      },
      {
        title: 'Taller de mindfulness y manejo del estrés',
        description: 'Sesión práctica de técnicas de mindfulness orientada a estudiantes en época de finales.',
        category: EventCategory.wellness,
        startDate: new Date('2026-05-26T16:00:00Z'),
        endDate: new Date('2026-05-26T18:00:00Z'),
        location: 'Sala de bienestar, Bloque 3',
        maxCapacity: 30,
      },
    ],
    skipDuplicates: true,
  });

  // Library books
  await prisma.libraryBook.createMany({
    data: [
      { title: 'Fundamentos de Programación', author: 'Luis Joyanes Aguilar', isbn: '9788448136994', availableCopies: 3, totalCopies: 5, category: 'Programación', publishedYear: 2008 },
      { title: 'Arquitectura Limpia', author: 'Robert C. Martin', isbn: '9780134494166', availableCopies: 1, totalCopies: 2, category: 'Arquitectura de software', publishedYear: 2017 },
      { title: 'Sistemas Operativos Modernos', author: 'Andrew S. Tanenbaum', isbn: '9786073233514', availableCopies: 2, totalCopies: 4, category: 'Sistemas operativos', publishedYear: 2015 },
      { title: 'Ingeniería del Software', author: 'Ian Sommerville', isbn: '9786073206037', availableCopies: 0, totalCopies: 3, category: 'Ingeniería de software', publishedYear: 2011 },
    ],
    skipDuplicates: true,
  });

  // Library rooms
  await prisma.libraryRoom.createMany({
    data: [
      {
        name: 'Sala A - Grupo pequeño',
        capacity: 6,
        available: true,
        schedule: { weekdays: '07:00-20:00', saturday: '08:00-17:00', sunday: 'closed' },
      },
      {
        name: 'Sala B - Grupo mediano',
        capacity: 12,
        available: true,
        schedule: { weekdays: '07:00-20:00', saturday: '08:00-17:00', sunday: 'closed' },
      },
      {
        name: 'Sala C - Individual / silencio',
        capacity: 1,
        available: false,
        schedule: { weekdays: '07:00-22:00', saturday: '08:00-20:00', sunday: '09:00-17:00' },
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
