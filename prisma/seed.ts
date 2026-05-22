/**
 * prisma/seed.ts
 *
 * Pobla la base de datos con datos reales del ITM obtenidos del sitio oficial.
 * Fuentes:
 *   - https://www.itm.edu.co/bienestar/salud/
 *   - https://www.itm.edu.co/bienestar/desarrollo-humano/
 *   - https://www.itm.edu.co/agenda-itm/
 *   - https://www.itm.edu.co/aspirante-pregrado/calendario-academico/
 *
 * Uso:
 *   npm run db:seed
 */

import {
  PrismaClient,
  EventCategory,
  HealthContextType,
  AcademicPeriodType,
  UserRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function d(dateStr: string) {
  return new Date(dateStr);
}

async function main() {
  console.log('🌱 Iniciando seed con datos reales del ITM...\n');

  // ── 1. Admin ITM ──────────────────────────────────────────────────────────
  console.log('👤 Creando usuario administrador...');
  const passwordHash = await bcrypt.hash('ITMAdmin2025!', 10);
  await prisma.user.upsert({
    where: { email: 'bienestaritm@correo.itm.edu.co' },
    update: {},
    create: {
      email: 'bienestaritm@correo.itm.edu.co',
      passwordHash,
      role: UserRole.admin,
    },
  });
  console.log('   ✓ admin: bienestaritm@correo.itm.edu.co\n');

  // ── 2. Recursos de Salud Mental ───────────────────────────────────────────
  // Datos reales de Bienestar Universitario ITM
  // Fuente: itm.edu.co/bienestar/salud + itm.edu.co/bienestar/desarrollo-humano
  console.log('🧠 Creando recursos de salud mental...');
  await prisma.healthResource.deleteMany();

  const healthResources = [
    // ── Siempre disponibles ──
    {
      title: 'Asesoría Psicológica Individual',
      description:
        'Espacio seguro y confidencial para recibir apoyo emocional ante retos académicos y personales. Atención con psicólogos del ITM sin costo. Robledo: Bloque E piso 2 (ext. 5307) | Fraternidad: Bloque L oficina 105 (ext. 5522) | La Floresta: piso 1 oficina 108. Contacto: acercarse@itm.edu.co',
      type: 'servicio',
      url: 'https://www.itm.edu.co/bienestar/desarrollo-humano/',
      contextType: HealthContextType.normal,
    },
    {
      title: 'Consulta Médica y Enfermería Prioritaria',
      description:
        'Estaciones de enfermería para primeros auxilios y valoración médica básica en todos los campus. Robledo: Bloque E piso 2 | Fraternidad: Bloque M sótano 1 | Floresta: piso 1 | Castilla: piso 1. Horario: 6:00 AM – 10:00 PM. Tel: 604 4405100 opción 9.',
      type: 'servicio',
      url: 'https://www.itm.edu.co/bienestar/salud/',
      contextType: HealthContextType.normal,
    },
    {
      title: 'Asesoría en Estilos de Vida Saludable',
      description:
        'Orientación personalizada para identificar hábitos actuales, reconocer factores de riesgo y construir rutinas sostenibles para tu bienestar físico y mental. Disponible para toda la comunidad ITM. Contacto: doctorsalud@itm.edu.co',
      type: 'servicio',
      url: 'https://www.itm.edu.co/bienestar/salud/',
      contextType: HealthContextType.normal,
    },
    {
      title: 'Asesoría Nutricional Personalizada',
      description:
        'Evaluación de hábitos alimenticios con recomendaciones para una nutrición balanceada y sostenible, orientada a la prevención de enfermedades y la mejora del rendimiento académico. Contacto: doctorsalud@itm.edu.co',
      type: 'servicio',
      url: 'https://www.itm.edu.co/bienestar/salud/',
      contextType: HealthContextType.normal,
    },
    {
      title: 'Salud Sexual y Reproductiva',
      description:
        'Orientación sobre anticoncepción, planificación familiar, prevención de ITS, consentimiento y salud en las relaciones. Confidencialidad garantizada. Contacto: doctorsex@itm.edu.co',
      type: 'servicio',
      url: 'https://www.itm.edu.co/bienestar/salud/',
      contextType: HealthContextType.normal,
    },
    {
      title: 'Zona de Orientación Universitaria (ZOU)',
      description:
        'Asesoría psicológica especializada para situaciones de consumo de sustancias psicoactivas. Estrategias de mitigación de riesgos, reducción de daños y fortalecimiento de habilidades para la vida. Confidencial. Contacto: zou@itm.edu.co',
      type: 'servicio',
      url: 'https://www.itm.edu.co/bienestar/desarrollo-humano/',
      contextType: HealthContextType.normal,
    },
    {
      title: 'Ruta ACERCARSE — Red de Apoyo Estudiantil',
      description:
        'Sistema de detección temprana de factores de riesgo psicosocial. Cualquier miembro de la comunidad puede identificar y reportar cambios de comportamiento preocupantes en compañeros para conectarlos con ayuda profesional. Contacto: acercarse@itm.edu.co',
      type: 'programa',
      url: 'https://www.itm.edu.co/bienestar/desarrollo-humano/',
      contextType: HealthContextType.normal,
    },
    {
      title: 'Laboratorio de Innovación de Bienestar (LAB-IDH)',
      description:
        'Salas de juego y espacios creativos para el aprendizaje emocional y la resolución colaborativa de problemas. La Floresta: piso 1 | Fraternidad: Bloque N aula 400 | Robledo: Bloque D aula 210. Contacto: lab@itm.edu.co',
      type: 'espacio',
      url: 'https://www.itm.edu.co/bienestar/desarrollo-humano/',
      contextType: HealthContextType.normal,
    },
    {
      title: 'Seguro Estudiantil de Accidentes POSITIVA',
      description:
        'Cobertura de accidentes 24/7 dentro y fuera del campus para todos los estudiantes matriculados en el ITM. Póliza #3100031653. Línea gratuita: 01800 111 1170 o #533 desde celular. No cubre accidentes de tránsito (activa tu SOAT).',
      type: 'beneficio',
      url: 'https://www.itm.edu.co/bienestar/salud/',
      contextType: HealthContextType.normal,
    },
    // ── Inicio de semestre ──
    {
      title: 'Inducción a Servicios de Bienestar',
      description:
        'Programa de bienvenida para estudiantes nuevos que presenta todos los servicios del Departamento de Bienestar: salud, apoyo psicológico, deportes, cultura y beneficios socioeconómicos. Presencial en cada campus al inicio del semestre.',
      type: 'programa',
      url: 'https://www.itm.edu.co/bienestar/',
      contextType: HealthContextType.start_of_semester,
    },
    {
      title: 'Convenio Mente Plena — Psiquiatría y Telepsicología',
      description:
        'Acceso a consultas psiquiátricas, telepsicología, talleres psicoeducativos y zonas de protección de salud mental a través del convenio institucional Mente Plena. Ingreso por derivación desde Desarrollo Humano o Enfermería.',
      type: 'servicio',
      url: 'https://www.itm.edu.co/bienestar/desarrollo-humano/',
      contextType: HealthContextType.start_of_semester,
    },
    // ── Parciales ──
    {
      title: 'Taller: Técnicas de Estudio y Manejo del Tiempo',
      description:
        'Aprende a optimizar tu preparación para parciales: mapas mentales, técnica Pomodoro, gestión del estrés académico y estrategias de memorización. Talleres coordinados por el área de Desarrollo Humano cada semestre.',
      type: 'taller',
      url: 'https://www.itm.edu.co/bienestar/desarrollo-humano/',
      contextType: HealthContextType.midterm,
    },
    {
      title: 'Apoyo Psicológico Prioritario en Parciales',
      description:
        'Atención sin cita previa para manejo de ansiedad, estrés y bloqueo mental durante evaluaciones. Disponible en Desarrollo Humano de todos los campus en época de parciales. Contacto: acercarse@itm.edu.co',
      type: 'servicio',
      url: 'https://www.itm.edu.co/bienestar/desarrollo-humano/',
      contextType: HealthContextType.midterm,
    },
    {
      title: 'Mindfulness para el Rendimiento Académico',
      description:
        'Sesiones guiadas de atención plena para reducir el estrés, mejorar la concentración y regular las emociones en período de evaluaciones. Disponible en el LAB-IDH o de forma virtual. Contacto: lab@itm.edu.co',
      type: 'taller',
      url: 'https://www.itm.edu.co/bienestar/desarrollo-humano/',
      contextType: HealthContextType.midterm,
    },
    // ── Finales ──
    {
      title: 'Atención en Crisis Emocional',
      description:
        'Si experimentas una crisis emocional intensa durante finales, acude directamente a Enfermería (6 AM–10 PM) o al área de Desarrollo Humano en cualquier campus. Línea interna: 604 4405100 ext. 5307 (Robledo) / ext. 5522 (Fraternidad).',
      type: 'servicio',
      url: 'https://www.itm.edu.co/bienestar/salud/',
      contextType: HealthContextType.finals,
    },
    {
      title: 'Taller Anti-Procrastinación para Finales',
      description:
        'Sesión intensiva de planificación para la semana de exámenes: cronograma de repaso, técnica SQ3R para lectura rápida y estrategias para superar el perfeccionismo y el miedo al fracaso.',
      type: 'taller',
      url: 'https://www.itm.edu.co/bienestar/desarrollo-humano/',
      contextType: HealthContextType.finals,
    },
    // ── Matrículas ──
    {
      title: 'Apoyos Socioeconómicos y Becas',
      description:
        'Información sobre auxilios de alimentación, transporte, becas por mérito académico y convenios de financiación disponibles durante el período de matrículas. Visita el área Socioeconómica del Bienestar. Contacto: bienestaritm@correo.itm.edu.co',
      type: 'beneficio',
      url: 'https://www.itm.edu.co/bienestar/socioeconomica/',
      contextType: HealthContextType.registration,
    },
    {
      title: 'Orientación Vocacional y Permanencia Estudiantil',
      description:
        'Apoyo para estudiantes que consideran cambiar de programa o tienen dudas sobre su continuidad académica. El sistema SIGA ofrece acompañamiento personalizado en cada campus. Portal: itm.edu.co/permanencia',
      type: 'servicio',
      url: 'https://www.itm.edu.co/permanencia/',
      contextType: HealthContextType.registration,
    },
  ];

  for (const r of healthResources) {
    await prisma.healthResource.create({ data: r });
  }
  console.log(`   ✓ ${healthResources.length} recursos creados\n`);

  // ── 3. Salas de la Biblioteca ─────────────────────────────────────────────
  // Infraestructura real de la Biblioteca ITM
  // Fuente: itm.edu.co/biblioteca
  console.log('🏛️  Creando salas de la biblioteca...');
  await prisma.libraryRoomReservation.deleteMany();
  await prisma.libraryRoom.deleteMany();

  const rooms = [
    {
      name: 'Sala de Lectura — Robledo',
      capacity: 80,
      available: true,
      schedule: {
        weekdays: { open: '07:00', close: '21:00' },
        saturday: { open: '08:00', close: '17:00' },
        sunday: null,
        campus: 'Robledo',
        floor: 'Piso 3',
      },
    },
    {
      name: 'Sala de Estudio Grupal A — Robledo',
      capacity: 12,
      available: true,
      schedule: {
        weekdays: { open: '07:00', close: '21:00' },
        saturday: { open: '08:00', close: '17:00' },
        sunday: null,
        campus: 'Robledo',
        floor: 'Piso 4',
        notes: 'Requiere reserva previa',
      },
    },
    {
      name: 'Sala de Estudio Grupal B — Robledo',
      capacity: 12,
      available: true,
      schedule: {
        weekdays: { open: '07:00', close: '21:00' },
        saturday: { open: '08:00', close: '17:00' },
        sunday: null,
        campus: 'Robledo',
        floor: 'Piso 4',
        notes: 'Requiere reserva previa',
      },
    },
    {
      name: 'Sala de Recursos Electrónicos — Robledo',
      capacity: 30,
      available: true,
      schedule: {
        weekdays: { open: '07:00', close: '21:00' },
        saturday: { open: '08:00', close: '15:00' },
        sunday: null,
        campus: 'Robledo',
        floor: 'Piso 3',
        notes: 'Computadores con acceso a bases de datos académicas internacionales',
      },
    },
    {
      name: 'Cubículos de Estudio Individual — Robledo',
      capacity: 1,
      available: true,
      schedule: {
        weekdays: { open: '07:00', close: '21:00' },
        saturday: { open: '08:00', close: '17:00' },
        sunday: null,
        campus: 'Robledo',
        floor: 'Piso 5',
        notes: '8 cubículos disponibles. Máximo 2 horas por persona por día.',
      },
    },
    {
      name: 'Expo Biblioteca — Robledo',
      capacity: 50,
      available: true,
      schedule: {
        weekdays: { open: '10:00', close: '20:00' },
        saturday: { open: '10:00', close: '14:00' },
        sunday: null,
        campus: 'Robledo',
        floor: 'Planta baja',
        notes: 'Espacio de exposiciones culturales, presentaciones de libros y eventos de la biblioteca',
      },
    },
    {
      name: 'Sala de Lectura — Fraternidad',
      capacity: 60,
      available: true,
      schedule: {
        weekdays: { open: '07:00', close: '21:00' },
        saturday: { open: '08:00', close: '17:00' },
        sunday: null,
        campus: 'Fraternidad',
        floor: 'Piso 2',
      },
    },
    {
      name: 'Sala de Estudio Grupal — Fraternidad',
      capacity: 10,
      available: true,
      schedule: {
        weekdays: { open: '07:00', close: '21:00' },
        saturday: { open: '08:00', close: '17:00' },
        sunday: null,
        campus: 'Fraternidad',
        floor: 'Piso 2',
        notes: 'Requiere reserva previa',
      },
    },
  ];

  for (const room of rooms) {
    await prisma.libraryRoom.create({ data: room });
  }
  console.log(`   ✓ ${rooms.length} salas creadas\n`);

  // ── 4. Catálogo de Libros ─────────────────────────────────────────────────
  // Fondo bibliográfico del ITM: ingeniería, sistemas, administración,
  // humanidades y ciencias básicas
  console.log('📚 Creando catálogo de libros...');
  await prisma.libraryBook.deleteMany();

  const books = [
    // Ingeniería de Software y Programación
    { title: 'Fundamentos de Ingeniería de Software', author: 'Ian Sommerville', isbn: '978-9702612063', availableCopies: 4, totalCopies: 6, category: 'Ingeniería de Software', publishedYear: 2011 },
    { title: 'Algoritmos: Teoría y Práctica', author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest', isbn: '978-0262033848', availableCopies: 3, totalCopies: 5, category: 'Ciencias de la Computación', publishedYear: 2009 },
    { title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', isbn: '978-0132350884', availableCopies: 2, totalCopies: 4, category: 'Ingeniería de Software', publishedYear: 2008 },
    { title: 'Arquitectura Limpia', author: 'Robert C. Martin', isbn: '978-0134494166', availableCopies: 1, totalCopies: 3, category: 'Ingeniería de Software', publishedYear: 2017 },
    { title: 'Fundamentos de Programación en C++', author: 'Luis Joyanes Aguilar', isbn: '978-8448136994', availableCopies: 3, totalCopies: 5, category: 'Programación', publishedYear: 2008 },
    { title: 'Diseño de Compiladores: Principios, Técnicas y Herramientas', author: 'Alfred V. Aho, Monica S. Lam, Ravi Sethi', isbn: '978-9702611233', availableCopies: 2, totalCopies: 3, category: 'Ciencias de la Computación', publishedYear: 2007 },
    // Redes, Sistemas Operativos y Bases de Datos
    { title: 'Redes de Computadoras', author: 'Andrew S. Tanenbaum', isbn: '978-9702608396', availableCopies: 3, totalCopies: 5, category: 'Redes y Telecomunicaciones', publishedYear: 2012 },
    { title: 'Sistemas Operativos Modernos', author: 'Andrew S. Tanenbaum', isbn: '978-6073219440', availableCopies: 2, totalCopies: 4, category: 'Ciencias de la Computación', publishedYear: 2015 },
    { title: 'Fundamentos de Bases de Datos', author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan', isbn: '978-8448190330', availableCopies: 3, totalCopies: 5, category: 'Bases de Datos', publishedYear: 2014 },
    // Electrónica e Ingeniería
    { title: 'Electrónica: Teoría de Circuitos y Dispositivos', author: 'Robert L. Boylestad, Louis Nashelsky', isbn: '978-9702610458', availableCopies: 4, totalCopies: 6, category: 'Electrónica', publishedYear: 2009 },
    { title: 'Automatización Industrial', author: 'Luis Miguel Gutiérrez Roa', isbn: '978-9588399393', availableCopies: 3, totalCopies: 4, category: 'Automatización', publishedYear: 2010 },
    // Matemáticas y Ciencias Básicas
    { title: 'Cálculo: Trascendentes Tempranas', author: 'James Stewart', isbn: '978-6075191393', availableCopies: 5, totalCopies: 8, category: 'Matemáticas', publishedYear: 2018 },
    { title: 'Álgebra Lineal y sus Aplicaciones', author: 'David C. Lay', isbn: '978-9702607472', availableCopies: 4, totalCopies: 6, category: 'Matemáticas', publishedYear: 2007 },
    { title: 'Probabilidad y Estadística para Ciencias e Ingeniería', author: 'Jay L. Devore', isbn: '978-6075224800', availableCopies: 3, totalCopies: 5, category: 'Estadística', publishedYear: 2016 },
    { title: 'Física Universitaria Vol. 1 y 2', author: 'Hugh D. Young, Roger A. Freedman', isbn: '978-6073214865', availableCopies: 4, totalCopies: 7, category: 'Física', publishedYear: 2013 },
    // Administración y Gestión
    { title: 'Fundamentos de Administración', author: 'Harold Koontz, Heinz Weihrich', isbn: '978-6071509147', availableCopies: 3, totalCopies: 5, category: 'Administración', publishedYear: 2013 },
    { title: 'El Método Lean Startup', author: 'Eric Ries', isbn: '978-8423413652', availableCopies: 3, totalCopies: 4, category: 'Emprendimiento', publishedYear: 2012 },
    { title: 'Gestión de Proyectos con Metodologías Ágiles', author: 'Mauricio Lefcovich', isbn: null, availableCopies: 2, totalCopies: 3, category: 'Gestión de Proyectos', publishedYear: 2019 },
    // Literatura Colombiana
    { title: 'Cien Años de Soledad', author: 'Gabriel García Márquez', isbn: '978-9584263285', availableCopies: 5, totalCopies: 7, category: 'Literatura Colombiana', publishedYear: 1967 },
    { title: 'El Coronel No Tiene Quien le Escriba', author: 'Gabriel García Márquez', isbn: '978-9584265784', availableCopies: 4, totalCopies: 6, category: 'Literatura Colombiana', publishedYear: 1961 },
    { title: 'La Vorágine', author: 'José Eustasio Rivera', isbn: '978-9583004605', availableCopies: 3, totalCopies: 4, category: 'Literatura Colombiana', publishedYear: 1924 },
    { title: 'Historia de Colombia: País Fragmentado, Sociedad Dividida', author: 'Marco Palacios, Frank Safford', isbn: '978-9580413127', availableCopies: 2, totalCopies: 3, category: 'Historia', publishedYear: 2002 },
  ];

  for (const book of books) {
    await prisma.libraryBook.create({ data: book });
  }
  console.log(`   ✓ ${books.length} libros creados\n`);

  // ── 5. Calendario Académico 2025-2026 ─────────────────────────────────────
  // Basado en el calendario oficial ITM
  // Fuente: itm.edu.co/aspirante-pregrado/calendario-academico/
  console.log('📅 Creando calendario académico...');
  await prisma.academicCalendar.deleteMany();

  const calendar = [
    // ── 2025-2 ──
    { periodName: 'Período Académico 2025-2', startDate: d('2025-07-21'), endDate: d('2025-11-29'), periodType: AcademicPeriodType.normal },
    { periodName: 'Matrículas 2025-2 — Estudiantes Antiguos', startDate: d('2025-05-19'), endDate: d('2025-06-13'), periodType: AcademicPeriodType.registration },
    { periodName: 'Matrículas 2025-2 — Estudiantes Nuevos', startDate: d('2025-07-07'), endDate: d('2025-07-18'), periodType: AcademicPeriodType.registration },
    { periodName: 'Primer Corte Evaluativo 2025-2', startDate: d('2025-09-08'), endDate: d('2025-09-12'), periodType: AcademicPeriodType.midterm },
    { periodName: 'Semana de Receso 2025-2', startDate: d('2025-10-06'), endDate: d('2025-10-10'), periodType: AcademicPeriodType.break },
    { periodName: 'Segundo Corte Evaluativo 2025-2', startDate: d('2025-10-20'), endDate: d('2025-10-24'), periodType: AcademicPeriodType.midterm },
    { periodName: 'Exámenes Finales 2025-2', startDate: d('2025-12-01'), endDate: d('2025-12-13'), periodType: AcademicPeriodType.finals },
    // ── 2026-1 ──
    { periodName: 'Matrículas 2026-1 — Estudiantes Antiguos', startDate: d('2025-11-17'), endDate: d('2025-12-12'), periodType: AcademicPeriodType.registration },
    { periodName: 'Matrículas 2026-1 — Estudiantes Nuevos', startDate: d('2026-01-19'), endDate: d('2026-01-30'), periodType: AcademicPeriodType.registration },
    { periodName: 'Período Académico 2026-1', startDate: d('2026-02-02'), endDate: d('2026-06-06'), periodType: AcademicPeriodType.normal },
    { periodName: 'Primer Corte Evaluativo 2026-1', startDate: d('2026-03-23'), endDate: d('2026-03-27'), periodType: AcademicPeriodType.midterm },
    { periodName: 'Semana Santa 2026 — Receso', startDate: d('2026-03-30'), endDate: d('2026-04-03'), periodType: AcademicPeriodType.break },
    { periodName: 'Segundo Corte Evaluativo 2026-1', startDate: d('2026-05-04'), endDate: d('2026-05-08'), periodType: AcademicPeriodType.midterm },
    { periodName: 'Exámenes Finales 2026-1', startDate: d('2026-06-08'), endDate: d('2026-06-20'), periodType: AcademicPeriodType.finals },
    // ── 2026-2 ──
    { periodName: 'Matrículas 2026-2 — Estudiantes Antiguos', startDate: d('2026-05-18'), endDate: d('2026-06-12'), periodType: AcademicPeriodType.registration },
    { periodName: 'Matrículas 2026-2 — Estudiantes Nuevos', startDate: d('2026-07-06'), endDate: d('2026-07-17'), periodType: AcademicPeriodType.registration },
    { periodName: 'Período Académico 2026-2', startDate: d('2026-07-20'), endDate: d('2026-11-28'), periodType: AcademicPeriodType.normal },
    { periodName: 'Primer Corte Evaluativo 2026-2', startDate: d('2026-09-07'), endDate: d('2026-09-11'), periodType: AcademicPeriodType.midterm },
    { periodName: 'Semana de Receso 2026-2', startDate: d('2026-10-05'), endDate: d('2026-10-09'), periodType: AcademicPeriodType.break },
    { periodName: 'Segundo Corte Evaluativo 2026-2', startDate: d('2026-10-19'), endDate: d('2026-10-23'), periodType: AcademicPeriodType.midterm },
    { periodName: 'Exámenes Finales 2026-2', startDate: d('2026-11-30'), endDate: d('2026-12-12'), periodType: AcademicPeriodType.finals },
  ];

  for (const entry of calendar) {
    await prisma.academicCalendar.create({ data: entry });
  }
  console.log(`   ✓ ${calendar.length} períodos académicos creados\n`);

  // ── 6. Eventos reales de la Agenda ITM ───────────────────────────────────
  // Fuente: https://www.itm.edu.co/agenda-itm/ (Agenda Cultural y Académica)
  // Programados en 2026-2 para aparecer como próximos eventos
  console.log('🎭 Creando eventos reales de la Agenda ITM...');
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();

  const events = [
    // ── Cultura y Literatura ──
    {
      title: 'Club de Lectura — Biblioteca ITM',
      description: 'Encuentro literario semanal en el Piso 5 de la Biblioteca Robledo. Espacio de análisis y discusión de obras de literatura contemporánea y colombiana. Abierto a toda la comunidad ITM. Todos los miércoles a las 3:00 p.m.',
      category: EventCategory.cultural,
      startDate: d('2026-08-05T15:00:00'),
      endDate: d('2026-08-05T17:00:00'),
      location: 'Piso 5, Biblioteca Robledo',
      maxCapacity: 30,
      active: true,
    },
    {
      title: 'Taller de Cuentería ITM',
      description: 'Taller de narrativa oral abierto a la comunidad ITM. Aprende técnicas de storytelling, improvisación y comunicación asertiva a través del arte de contar historias. Todos los martes a las 3:00 p.m.',
      category: EventCategory.workshop,
      startDate: d('2026-08-04T15:00:00'),
      endDate: d('2026-08-04T17:00:00'),
      location: 'Piso 5, Biblioteca Robledo',
      maxCapacity: 25,
      active: true,
    },
    {
      title: 'Series Club ITM — Cine Colombiano',
      description: 'Ciclo de análisis audiovisual sobre series y películas colombianas. Proyección y debate sobre la producción cinematográfica nacional contemporánea. Todos los miércoles al mediodía en la Expo Biblioteca.',
      category: EventCategory.cultural,
      startDate: d('2026-08-05T12:00:00'),
      endDate: d('2026-08-05T14:00:00'),
      location: 'Expo Biblioteca, Campus Robledo',
      maxCapacity: 50,
      active: true,
    },
    {
      title: 'Liga de Freestyle ITM — Batallas Líricas',
      description: 'Competencia de improvisación lírica y rap. Abierto a participantes de todos los programas. El mejor MC de cada fecha avanza a la gran final del semestre. Inscripciones en el área de Cultura de Bienestar.',
      category: EventCategory.cultural,
      startDate: d('2026-08-27T17:30:00'),
      endDate: d('2026-08-27T20:00:00'),
      location: 'Campus Robledo',
      maxCapacity: 200,
      active: true,
    },
    {
      title: 'Festival de la Canción ITM',
      description: 'Festival musical estudiantil donde compiten solistas y grupos de la comunidad ITM. Géneros: pop, rock, vallenato, rap e indie colombiano. Inscripciones abiertas para participantes en el área de Cultura.',
      category: EventCategory.cultural,
      startDate: d('2026-09-11T14:00:00'),
      endDate: d('2026-09-11T20:00:00'),
      location: 'Campus Fraternidad',
      maxCapacity: 400,
      active: true,
    },
    {
      title: 'Así Danzamos en la U — Muestra Folclórica',
      description: 'Presentación de los grupos de danza del ITM: Raíces (folclore colombiano), Habibis (danzas árabes), Bambazú (ritmos afrocolombianos) y Taller de Tango. Una celebración de la diversidad cultural universitaria.',
      category: EventCategory.cultural,
      startDate: d('2026-09-24T12:00:00'),
      endDate: d('2026-09-24T15:00:00'),
      location: 'Campus Robledo',
      maxCapacity: 300,
      active: true,
    },
    {
      title: 'Orquesta ITM — Ensamble Vallenato',
      description: 'Presentación musical del Ensamble Vallenato de la Orquesta ITM. El grupo interpreta piezas del folclor vallenato colombiano con arreglos contemporáneos. Entrada libre para toda la comunidad.',
      category: EventCategory.cultural,
      startDate: d('2026-10-09T17:00:00'),
      endDate: d('2026-10-09T19:00:00'),
      location: 'Fundación Fraternidad, Campus Fraternidad',
      maxCapacity: 150,
      active: true,
    },
    {
      title: 'Exposición de Artes Plásticas — Muestra Semestral 2026-2',
      description: 'Muestra de resultados de los talleres de artes plásticas del semestre. Pintura, escultura, fotografía y arte digital. Exposición abierta durante toda la semana en ambos campus.',
      category: EventCategory.cultural,
      startDate: d('2026-10-27T10:00:00'),
      endDate: d('2026-10-30T18:00:00'),
      location: 'Campus Robledo y Fraternidad',
      maxCapacity: null,
      active: true,
    },
    // ── Ciencia y Astronomía ──
    {
      title: 'Semillero de Astronomía ITM',
      description: 'Sesiones del Semillero de Astronomía en el Observatorio del Campus Fraternidad. Se estudian constelaciones, sistemas planetarios y astrofísica aplicada. Abierto a estudiantes de todos los programas.',
      category: EventCategory.academic,
      startDate: d('2026-08-13T16:00:00'),
      endDate: d('2026-08-13T18:00:00'),
      location: 'Observatorio Astronómico, Campus Fraternidad',
      maxCapacity: 40,
      active: true,
    },
    {
      title: 'Observaciones Nocturnas — Observatorio ITM',
      description: 'Sesiones de observación astronómica con telescopios del Observatorio ITM. Se observan planetas, nebulosas y cúmulos estelares. Inscripción previa obligatoria. Inicia a las 6:00 p.m.',
      category: EventCategory.academic,
      startDate: d('2026-08-19T18:00:00'),
      endDate: d('2026-08-19T21:00:00'),
      location: 'Observatorio Astronómico, Campus Fraternidad',
      maxCapacity: 25,
      active: true,
    },
    {
      title: 'Cátedra Luis Alberto Álvarez — Cine y Ciudad',
      description: 'Conferencia anual en honor al crítico de cine Luis Alberto Álvarez. Temática: "El cine de Medellín / Medellín en el cine". Historia, directores y obras que han retratado la ciudad. Evento abierto al público en general.',
      category: EventCategory.academic,
      startDate: d('2026-10-23T15:00:00'),
      endDate: d('2026-10-23T18:00:00'),
      location: 'Teatro Metropolitano de Medellín',
      maxCapacity: 500,
      active: true,
    },
    // ── Bienestar ──
    {
      title: 'Jornada de Salud Mental ITM',
      description: 'Jornada de sensibilización y actividades de bienestar emocional: talleres de mindfulness, stands informativos sobre servicios psicológicos, actividades del LAB-IDH y presentación de la Ruta ACERCARSE.',
      category: EventCategory.wellness,
      startDate: d('2026-09-10T08:00:00'),
      endDate: d('2026-09-10T17:00:00'),
      location: 'Campus Robledo y Fraternidad',
      maxCapacity: null,
      active: true,
    },
    // ── Talleres ──
    {
      title: 'Taller de Introducción a la Caricatura',
      description: 'Taller práctico para principiantes en caricatura e ilustración. No se requiere experiencia previa en dibujo. Material incluido. Organizado por el área de Cultura del Departamento de Bienestar ITM.',
      category: EventCategory.workshop,
      startDate: d('2026-08-07T10:00:00'),
      endDate: d('2026-08-07T13:00:00'),
      location: 'Coworking Bienestar, Campus Fraternidad',
      maxCapacity: 20,
      active: true,
    },
    {
      title: 'Taller de Mediación Artística — Lectura de Imágenes',
      description: 'Aprende a interpretar obras de arte visual. Técnicas de mediación cultural, análisis iconográfico y construcción de sentido en la imagen contemporánea. Impartido por artistas invitados.',
      category: EventCategory.workshop,
      startDate: d('2026-08-24T14:00:00'),
      endDate: d('2026-08-24T17:30:00'),
      location: 'Campus Robledo',
      maxCapacity: 30,
      active: true,
    },
    // ── Deportes ──
    {
      title: 'Torneos ASCUN Deportes — Nodo Antioquia 2026-2',
      description: 'Participación del ITM en los torneos deportivos interuniversitarios de la Asociación Colombiana de Universidades. Disciplinas: fútbol, baloncesto, voleibol, natación y atletismo. Convocatoria abierta.',
      category: EventCategory.sport,
      startDate: d('2026-08-24T08:00:00'),
      endDate: d('2026-10-16T18:00:00'),
      location: 'Instalaciones deportivas Campus Robledo y sedes regionales',
      maxCapacity: null,
      active: true,
    },
    {
      title: 'Así Suena la U — Concierto Campus Prado',
      description: 'Concierto al aire libre de los grupos musicales del ITM en el Campus Prado. Orquesta, coro, grupos de rock y solistas estudiantiles. Entrada libre. Alimentación disponible en el lugar.',
      category: EventCategory.cultural,
      startDate: d('2026-10-23T15:00:00'),
      endDate: d('2026-10-23T20:00:00'),
      location: 'Campus Prado, Medellín',
      maxCapacity: 600,
      active: true,
    },
  ];

  for (const event of events) {
    await prisma.event.create({ data: event });
  }
  console.log(`   ✓ ${events.length} eventos creados\n`);

  // ── 7. Alertas institucionales ────────────────────────────────────────────
  console.log('🔔 Creando alertas institucionales...');
  await prisma.alert.deleteMany();

  const alerts = [
    {
      title: 'Bienvenida al Semestre 2026-2',
      body: 'El ITM da la bienvenida a toda la comunidad al Período Académico 2026-2 (julio 20 – noviembre 28). Los servicios de Bienestar Universitario están disponibles en todos los campus desde el primer día. ¡Mucho éxito!',
      severity: 'info' as const,
      active: true,
    },
    {
      title: 'Servicios de Bienestar Disponibles',
      body: 'Recuerda que tienes acceso gratuito a: asesoría psicológica, consulta médica, apoyo nutricional, actividades culturales y deportivas. Escríbenos a bienestaritm@correo.itm.edu.co o visita el Bloque E piso 2 en Robledo.',
      severity: 'info' as const,
      active: true,
    },
    {
      title: 'Matrículas 2026-2 Abiertas para Estudiantes Antiguos',
      body: 'El proceso de matrícula para el semestre 2026-2 se encuentra abierto para estudiantes antiguos hasta el 12 de junio de 2026. Realiza tu matrícula en siaacad.itm.edu.co. Para solicitar apoyos socioeconómicos, visita el área de Bienestar antes del cierre.',
      severity: 'warning' as const,
      active: true,
      expiresAt: new Date('2026-06-12T23:59:59'),
    },
  ];

  for (const alert of alerts) {
    await prisma.alert.create({ data: alert });
  }
  console.log(`   ✓ ${alerts.length} alertas creadas\n`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅  Seed completado exitosamente con datos reales ITM');
  console.log('');
  console.log('  Admin:              bienestaritm@correo.itm.edu.co');
  console.log('  Contraseña:         ITMAdmin2025!');
  console.log('');
  console.log(`  Recursos salud:     ${healthResources.length}`);
  console.log(`  Salas biblioteca:   ${rooms.length}`);
  console.log(`  Libros catálogo:    ${books.length}`);
  console.log(`  Cal. académico:     ${calendar.length} períodos (2025-2 / 2026-1 / 2026-2)`);
  console.log(`  Eventos ITM:        ${events.length}`);
  console.log(`  Alertas:            ${alerts.length}`);
  console.log('═══════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
