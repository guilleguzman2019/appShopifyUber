import { json } from "@remix-run/node";

export const action = async ({ request }) => {

    const body = await request.json();

    const { idTienda, horarios } = body;

    const tienda = await prisma.tienda.update({
        where: { id: idTienda },
        data: {
          horarios: horariosString
        }
      });
}