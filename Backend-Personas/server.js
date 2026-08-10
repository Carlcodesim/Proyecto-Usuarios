import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

await fastify.register(cors, { origin: "*" });

// Ruta raíz de prueba
fastify.get("/", async (request, reply) => {
  return { status: "OK", mensaje: "API de Personas corriendo en Render 🚀" };
});

// GET: Obtener todas las personas
fastify.get("/api/personas", async (request, reply) => {
  const personas = await prisma.persona.findMany({
    orderBy: { creadoEn: "desc" },
  });
  return personas;
});

// POST: Crear una persona
fastify.post("/api/personas", async (request, reply) => {
  const { nombre, edad } = request.body;
  
  if (!nombre || edad === undefined || edad === null) {
    return reply.status(400).send({ error: "Nombre y edad son obligatorios" });
  }

  const nuevaPersona = await prisma.persona.create({
    data: { nombre, edad: Number(edad) },
  });
  return reply.status(201).send(nuevaPersona);
});

// PUT: Actualizar persona por ID
fastify.put("/api/personas/:id", async (request, reply) => {
  const { id } = request.params;
  const { nombre, edad } = request.body;

  try {
    const actualizada = await prisma.persona.update({
      where: { id },
      data: { nombre, edad: Number(edad) },
    });
    return actualizada;
  } catch (error) {
    return reply.status(404).send({ error: "Persona no encontrada" });
  }
});

// DELETE: Eliminar persona por ID
fastify.delete("/api/personas/:id", async (request, reply) => {
  const { id } = request.params;
  try {
    await prisma.persona.delete({ where: { id } });
    return reply.status(204).send();
  } catch (error) {
    return reply.status(404).send({ error: "Persona no encontrada" });
  }
});

// Iniciar servidor
const start = async () => {
  try {
    await fastify.listen({ port: 5180, host: "0.0.0.0" });
    console.log("Servidor corriendo en http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();