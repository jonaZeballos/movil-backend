const { randomUUID } = require('crypto');
const prisma = require('../src/utils/prismaClient');

async function findOrCreate(model, field, value, data = {}) {
  const existing = await prisma[model].findFirst({
    where: { [field]: value },
  });

  if (existing) return existing;

  return prisma[model].create({
    data: {
      id: randomUUID(),
      [field]: value,
      ...data,
    },
  });
}

async function main() {
  const roles = ['admin', 'tecnico', 'ventas', 'cliente'];
  const estados = ['Recibido', 'En diagnostico', 'Cotizado', 'En reparacion', 'Listo', 'Entregado', 'Sin solucion'];
  const prioridades = ['Baja', 'Normal', 'Alta', 'Urgente'];

  await Promise.all(roles.map((rol) => findOrCreate('rol', 'rol', rol)));
  await Promise.all(estados.map((nombre) => findOrCreate('estadoOrdenServicio', 'nombre', nombre)));
  await Promise.all(prioridades.map((prioridad) => findOrCreate('prioridad', 'prioridad', prioridad)));

  console.log('Seed completado: roles, estados y prioridades listos.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
