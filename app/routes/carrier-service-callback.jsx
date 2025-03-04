import { json } from "@remix-run/node";

import {getUberToken} from '../functions/getDeliveryQuote'

import {getUberQuote} from '../functions/getDeliveryQuote'

import {getCountryName} from '../functions/getDeliveryQuote'

import {sucursalMasCercana} from '../functions/getDeliveryQuote'

import {obtenerCoordenadasDeDireccion} from '../functions/getDeliveryQuote'

import {getOrigenPickup} from '../functions/getDeliveryQuote'

import prisma from '../db.server';

export async function action({ request }) {

  try {

    // Obtener datos de la solicitud
    const data = await request.json();

    const moneda = {
      "AR": "ARS",
      "MX": "MXN",
      "US": "USD",
    }

    const idTienda = data.rate.items[0].properties.idTienda ;

    const ajustesTienda = await obtenerAjustesDeTienda(idTienda);

    const uberToken = await getUberToken(ajustesTienda);

    const destinoData = data.rate.destination ;

    const origin = await getOrigenPickup(idTienda ,destinoData);

    const uberQuote = await getUberQuote(ajustesTienda, uberToken, origin, destinoData);

    const rates = {
      rates: [
        {
          service_name: ajustesTienda.titulo,
          service_code: "UBER_DIRECT",
          total_price: uberQuote.fee,
          currency: moneda[destinoData.country],
          description: `Delivery time of ${uberQuote.duration} minutes.`
        },
      ],
    };

    return json(rates, { status: 200 });

  } catch (error) {
    console.error('Error en action:', error);
    // En caso de error, devolver una tarifa por defecto o manejar el error según necesites
    return json({
      rates: [
        {
        },
      ],
    }, { status: 200 });
  }
}

async function obtenerAjustesDeTienda(idTienda) {
  try {
    // Consultar la tienda por su ID, incluyendo los ajustes
    const store = await prisma.tienda.findUnique({
      where: {
        id: idTienda
      },
      include: {
        ajustes: true,  // Incluir los ajustes de la tienda
      }
    });

    // Verificar si la tienda existe
    if (!store) {
      console.error(`Tienda con ID ${idTienda} no encontrada.`);
      return null;
    }

    // Validación de los ajustes
    const ajustes = store?.ajustes || {};  // Si no hay ajustes, asignamos un objeto vacío
    const apiKey = ajustes ? ajustes.apiKey : null;
    const secretKey = ajustes ? ajustes.secretKey : null;
    const customer = ajustes ? ajustes.customer : null;
    const titulo = ajustes ? ajustes.titulo : null;

    // Retornar los valores de los ajustes
    return { apiKey, secretKey, customer, titulo };
  } catch (error) {
    console.error('Error al obtener la tienda:', error);
    throw error;  // Propagar el error para que pueda ser manejado por quien llame a esta función
  }
}



