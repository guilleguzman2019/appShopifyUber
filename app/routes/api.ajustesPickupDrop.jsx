import { json } from "@remix-run/node";

export let action = async ({ request }) => {
  const body = await request.json();
  const {
    tiendaId,
    pickup,  // Recibimos los pasos de Pickup
    drop,     // Recibimos los pasos de Drop
  } = body;

  try {
    // Realizamos el upsert de los ajustes de Pickup y Drop
    const ajustes = await prisma.ajustesPickupDrop.upsert({
      where: {
        tiendaId, // Buscamos por tiendaId
      },
      update: {
        // Actualizamos los pasos de Pickup
        firmaPickup: pickup.firma ?? false,
        nombreFirmaPickup: pickup.nombreFirma ?? false,
        relacionFirmaPickup: pickup.relacionFirma ?? false,
        fotoPickup: pickup.foto ?? false,
        // Actualizamos los pasos de Drop
        firmaDrop: drop.firma ?? false,
        nombreFirmaDrop: drop.nombreFirma ?? false,
        relacionFirmaDrop: drop.relacionFirma ?? false,
        fotoDrop: drop.foto ?? false,
        edadMinimaDrop: drop.edadMinima ?? null, // Solo actualizamos edadMinimaDrop para el Drop
        pincodeDrop: drop.pincode ?? false,
      },
      create: {
        tiendaId,
        // Creamos los ajustes de Pickup
        firmaPickup: pickup.firma ?? false,
        nombreFirmaPickup: pickup.nombreFirma ?? false,
        relacionFirmaPickup: pickup.relacionFirma ?? false,
        fotoPickup: pickup.foto ?? false,
        // Creamos los ajustes de Drop
        firmaDrop: drop.firma ?? false,
        nombreFirmaDrop: drop.nombreFirma ?? false,
        relacionFirmaDrop: drop.relacionFirma ?? false,
        fotoDrop: drop.foto ?? false,
        edadMinimaDrop: drop.edadMinima ?? null, // Solo creamos edadMinimaDrop para el Drop
        pincodeDrop: drop.pincode ?? false,
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
