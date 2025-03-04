import { json } from "@remix-run/node";

import prisma from '../db.server';

export const action = async ({ request }) => {
  
  const body = await request.json();
  const { tiendaId, user, pass } = body;

  try {

    const ajustes = await prisma.ajustesEmail.upsert({
      where: {
        tiendaId
      },
      update: {
        user,
        pass,
        updatedAt: new Date()
      },
      create: {
        tiendaId,
        user,
        pass,
      }
    });

    return json({ success: true, ajustes });
    
  } catch (error) {
    
  }

}