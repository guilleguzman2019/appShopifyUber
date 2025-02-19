import { json } from "@remix-run/node";


export let action = async ({ request }) => {
  // Obtener los datos del cuerpo de la solicitud
  const { tiendaId, sucursal } = await request.json();

  // Verificar que los datos necesarios estén presentes
  if (!tiendaId || !sucursal) {
    return json({ error: 'Datos faltantes' }, { status: 400 });
  }

  try {
    // Aquí puedes manejar la lógica para guardar la nueva sucursal.
    // Usando Prisma como ejemplo, puedes hacer algo como esto:
    const nuevaSucursal = await prisma.sucursal.create({
        data: {
            tiendaId: tiendaId,
            direccion: sucursal.direccion,
            latitud: parseFloat(sucursal.latitud),
            longitud:parseFloat(sucursal.longitud),
            esPrincipal: sucursal.esPrincipal, // Recibe false del frontend
            telefono: sucursal.telefono,
            email:sucursal.email,
            codigoPostal: sucursal.codigoPostal,
            ciudad: sucursal.ciudad,
            estado: sucursal.estado,
            pais: sucursal.pais,
            createdAt: new Date(), // Fecha de creación
            updatedAt: new Date(), // Fecha de última actualización
          },
    });

    // Si todo fue bien, puedes devolver una respuesta con la nueva sucursal creada.
    return json({ success: true, sucursal: nuevaSucursal });

  } catch (error) {
    console.error('Error creando sucursal:', error);
    return json({ error: 'Error al crear la sucursal' }, { status: 500 });
  }
};
