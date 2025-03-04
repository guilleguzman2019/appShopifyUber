import { json } from "@remix-run/node";

import prisma from '../db.server';

export const action = async ({ request }) => {
  try {
    const body = await request.json();

    const { tiendaId, preparationTime, productoId, length , heigth, deepth, weight } = body;
    
    // Update only the specific product
    const updatedProduct = await prisma.producto.update({
      where: { 
        id: productoId,
      },
      data: { 
        preparationTime,
        length:parseFloat(length),
        height:parseFloat(heigth),
        depth:parseFloat(deepth),
        weight:parseFloat(weight)
      },
    });
    
    return json({
      success: true,
      message: "Tiempo de preparación actualizado correctamente",
      updatedProduct,
    });
  } catch (error) {
    console.error("Error al actualizar:", error);
    return json(
      { 
        success: false, 
        error: "Error al actualizar el tiempo de preparación" 
      }, 
      { status: 500 }
    );
  }
};
