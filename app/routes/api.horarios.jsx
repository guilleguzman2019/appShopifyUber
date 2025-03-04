import { json } from "@remix-run/node";

import prisma from '../db.server';

export const loader = async () => {
  return null;
};

export const action = async ({ request }) => {

  const body = await request.json();

  const { idTienda, horarios } = body;

  try {

    const horariosString = JSON.stringify(horarios);

    const tienda = await prisma.tienda.update({
        where: { id: idTienda },
        data: {
          horarios: horariosString
        }
      });
    
    return json({ success: true });
  } catch (error) {
    console.error("Error en ajustes:", error);
    return json({ 
      success: false, 
      error: error.message 
    }, {
      status: 400
    });
  }
};