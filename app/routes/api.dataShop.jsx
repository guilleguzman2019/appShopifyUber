import { json } from "@remix-run/node";

import prisma from '../db.server';

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

   // Eliminar apiKey y secretKey de ajustes
  if (tiendafinal && tiendafinal.ajustes) {
    const { apiKey, secretKey, ...ajustesSinKeys } = tiendafinal.ajustes;
    tiendafinal.ajustes = ajustesSinKeys;
  }

  const sucursales = await prisma.sucursal.findMany({
    where: {
      tiendaId: tiendafinal.id
    }
  });
  
  return {tienda: tiendafinal, sucursal: sucursales};


}