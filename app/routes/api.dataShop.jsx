import { json } from "@remix-run/node";

export const loader = async () => {
  //const users = await prisma.user.findMany();
  return {hola: 'hola mundo'};
};

export const action = async ({ request }) => {

  const body = await request.json();

  const { tienda } = body;

 
  const tiendafinal = await prisma.tienda.findUnique({
    where: {
      nombre: tienda,
    },
    include: {
      propina:true,
      productos:true,
      ajustes:true
    }
  });

  const sucursales = await prisma.sucursal.findMany({
    where: {
      tiendaId: tiendafinal.id,
      esPrincipal: true
    }
  });
  
  return {tienda: tiendafinal, sucursal: sucursales};


}