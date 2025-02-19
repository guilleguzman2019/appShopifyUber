import { json } from "@remix-run/node";

export let action = async ({ request }) => {
  const body = await request.json();
  const { tiendaId, sucursalId } = body; // Recibimos el `sucursalId` y `tiendaId`

  try {
    // Desmarcar la sucursal actual que es principal para esta tienda
    await prisma.sucursal.updateMany({
      where: {
        tiendaId: tiendaId,
        esPrincipal: true
      },
      data: {
        esPrincipal: false
      }
    });

    // Marcar la nueva sucursal como principal
    const sucursalActualizada = await prisma.sucursal.update({
      where: {
        id: sucursalId
      },
      data: {
        esPrincipal: true
      }
    });

    return json({ success: true, sucursalActualizada });
  } catch (error) {
    console.error("Error al actualizar la sucursal principal:", error);
    return json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
};
