import { json } from "@remix-run/node";

import prisma from '../db.server';

export let action = async ({ request }) => {
  const body = await request.json();
  const { sucursalId } = body; // Recibimos `sucursalId`

  try {
    // Eliminar la sucursal por su ID
    await prisma.sucursal.delete({
      where: {
        id: sucursalId
      }
    });

    return json({ success: true, sucursalId });
  } catch (error) {
    console.error("Error al eliminar la sucursal:", error);
    return json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
};
