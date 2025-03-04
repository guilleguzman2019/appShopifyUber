import { json } from "@remix-run/node";

import prisma from '../db.server';

export let action = async ({ request }) => {
  const body = await request.json();
  const { tiendaId, selectedOption, inputValue, isTipEnabled } = body;

  try {
    const ajustes = await prisma.propina.upsert({
      where: {
        tiendaId,
      },
      update: {
        tipo: selectedOption,
        valor: parseFloat(inputValue),
        habilitada: isTipEnabled,
      },
      create: {
        tiendaId,
        tipo: selectedOption,
        valor: parseFloat(inputValue),
        habilitada: isTipEnabled,
      },
    });

    return json({ success: true, ajustes });
  } catch (error) {
    console.error("Error en ajustes:", error);
    return json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
};
