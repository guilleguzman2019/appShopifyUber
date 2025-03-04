import { json } from '@remix-run/node';

import prisma from '../db.server';

export const action = async ({ request }) => {
  const body = await request.json();  // Recibimos los datos en formato JSON
  const { tiendaId, peso, largo, alto, ancho, tiempoPreparacion } = body;

  try {
    const ajustesProducto = await prisma.ajustesProducto.upsert({
      where: { tiendaId },  // Aquí buscamos por el ID de la tienda
      update: {
        peso,
        largo,
        alto,
        ancho,
        tiempoPreparacion,
        updatedAt: new Date(),
      },
      create: {
        tiendaId,
        peso,
        largo,
        alto,
        ancho,
        tiempoPreparacion,
      },
    });

    return json({ success: true, ajustesProducto });
  } catch (error) {
    console.error('Error al guardar los ajustes:', error);
    return json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
};
