import { json } from "@remix-run/node";

import prisma from '../db.server';

import { unauthenticated } from "../shopify.server";

import { appendFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

export async function action({ request }) {

  const shop = 'pruebafinal566.myshopify.com';

  const { session } = await unauthenticated.admin(shop);

  try {

    // Obtener datos de la solicitud
    const data = await request.json();

    console.log(data);

    const idTienda = data.rate.items[0].properties.idTienda ;

    const ajustesTienda = await obtenerAjustesDeTienda(idTienda); //ya tiene el logs listo

    const nombreTienda = ajustesTienda.nombre;

    console.log(nombreTienda);

    const uberToken = await getUberToken(ajustesTienda, nombreTienda); // ya tiene el logs listo

    const destinoData = data.rate.destination ;

    const direccionCliente = (!destinoData.latitude) ? await validateAddressNoCoord(destinoData, idTienda) : validateAddressWithCoord(destinoData, idTienda);

    const sucursales = await getSucursales(idTienda, nombreTienda); //ya tiene el logs listo

    const origin = await getOrigenPickup(idTienda, sucursales , direccionCliente);

    const uberQuote = await getUberQuote(ajustesTienda, uberToken, origin, direccionCliente, nombreTienda);


    const rates = {
      rates: [
        {
          service_name: ajustesTienda.titulo,
          service_code: "UBER_DIRECT",
          total_price: uberQuote.fee,
          currency: uberQuote.currency_type,
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
      select: {  // Usamos 'select' para obtener campos específicos
        nombre: true,  // Incluir el nombre de la tienda
        ajustes: true  // Incluir los ajustes de la tienda
      }
    });

    // Verificar si la tienda existe
    if (!store) {
      const errorMessage = `Shop with ID ${idTienda} not found.`;
      console.error(errorMessage);
      await logErrorToFile(errorMessage, 'not shop');
      return null;
    }

    // Validación de los ajustes
    const ajustes = store?.ajustes || {};  // Si no hay ajustes, asignamos un objeto vacío
    const nombre = store?.nombre;
    const { apiKey, secretKey, customer, titulo } = ajustes;

    if (!apiKey || !secretKey || !customer || !titulo) {
      const errorMessage = `Required values are missing in the settings of the shop with name ${nombre}.`;
      console.error(errorMessage);
      await logErrorToFile(errorMessage, nombre);
      return null;
    }

    // Retornar los valores de los ajustes
    return { apiKey, secretKey, customer, titulo, nombre };
  } catch (error) {
    const errorMessage = `Error retrieving the shop: ${error.message}`;
    console.error(errorMessage);
    await logErrorToFile(errorMessage, nombre);
    throw error;  // Propagar el error para que pueda ser manejado por quien llame a esta función
  }
}

export async function getUberToken(ajustes, nombre) {

  const apiKey = ajustes ? ajustes.apiKey : null;

  const secretKey = ajustes ? ajustes.secretKey : null;

  const customer = ajustes ? ajustes.customer : null;

  // Sobrescribe las variables de entorno programáticamente
  process.env.UBER_DIRECT_CLIENT_ID = apiKey;
  process.env.UBER_DIRECT_CLIENT_SECRET = secretKey;
  process.env.UBER_DIRECT_CUSTOMER_ID = customer;

  try {

  const token = await getAccessToken();

  return token ;

  } catch (error) {
    const message = error.message;
    console.error(message);
    const jsonPart = message.substring(message.indexOf('{'));
    const errorObject = JSON.parse(jsonPart);
    await logErrorToFile(`Error retrieving the token in Uber Direct: ${errorObject.error_description} `, nombre);
    throw error;
  }

}


async function validateAddressNoCoord(location, nombre) {

  const { address1, postal_code, city, province, country } = location;

  // Verificar si todos los campos necesarios están presentes y no vacíos
  if (!address1 || !postal_code || !city || !province || !country) {
    await logErrorToFile('Address2, postal code, city, province, and country cannot be empty in checkout.', nombre);
    throw new Error('All fields (address1, postal_code, city, province, country) must be provided and not empty in checkout.');
  }

  // Componer la dirección completa con los componentes
  const address = `${address1}, ${postal_code}, ${city}, ${province}, ${country}`;

  const apiKey = 'AIzaSyDGa5xQES7MMhkvcpIA5Y85QzlVEqL1sJg'; // Reemplaza esto con tu clave de API de Google Maps
  const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      await logErrorToFile('The location does not exist or could not be found.', nombre);
      throw new Error('The location does not exist or could not be found.');
    }

    const results = data.results?.[0]; // Usa optional chaining para evitar errores si results es undefined

    if (results && results.geometry?.location) {
      const { lat, lng } = results.geometry.location;
      return {
        address: results.formatted_address,
        latitude: lat,
        longitude: lng,
      };
    }

    // Si no hay resultados, devuelve un error o un valor predeterminado
    throw new Error("No valid location data found.");
    await logErrorToFile("No valid location data found.", nombre);

  } catch (error) {
    return 'Error: ' + error.message;
  }
}

async function validateAddressWithCoord(location, nombre) {

  const { latitude, longitude } = location;

  if (!latitude || !longitude) {
    await logErrorToFile('Latitude and longitude cannot be empty.', nombre);
    throw new Error('Latitude and longitude cannot be empty.');
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyDGa5xQES7MMhkvcpIA5Y85QzlVEqL1sJg`
    );

    const data = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      await logErrorToFile('The location does not exist or could not be found.', nombre);
      throw new Error('The location does not exist or could not be found.');
    }

    const results = data.results?.[0]; // Usa optional chaining para evitar errores si results es undefined

    if (results && results.geometry?.location) {
      const { lat, lng } = results.geometry.location;
      return {
        address: results.formatted_address,
        latitude: lat,
        longitude: lng,
      };
    }

    // Si no hay resultados, devuelve un error o un valor predeterminado
    await logErrorToFile("No valid location data found.", nombre);
    throw new Error("No valid location data found.");

  } catch (error) {
    await logErrorToFile(`Error: ${error.message}`, nombre); // Registra el error en caso de excepción
    return 'Error: ' + error.message;
  }
}

async function getSucursales(idTienda, nombre) {

  // Verificar si se pasó un idTienda válido
  if (!idTienda) {
    throw new Error('A valid shop ID (idTienda) is required.');
  }

  // Buscar sucursales de la tienda con el id proporcionado
  let sucursales = await prisma.sucursal.findMany({
    where: {
      tiendaId: idTienda, // Asegúrate de que el campo 'tiendaId' está correctamente configurado en el modelo Prisma
    },
  });

  if (!sucursales || sucursales.length === 0) {
    await logErrorToFile('Shops cannot be empty.', nombre);
    throw new Error('No branches found for the provided shop.');
  }

  return sucursales; // Devuelve las sucursales encontradas
}

export async function getOrigenPickup(id, sucursales, destino) {

  const destinoLatLog = {latitude: destino.latitude , longitude: destino.longitude} ;

  return await sucursalMasCercana(id, sucursales, destinoLatLog);
}

// Función para encontrar la sucursal más cercana
export async function sucursalMasCercana(idTienda, sucursales, destino) {


  let sucursalCercana = null;
  let distanciaMinima = Infinity;

// Iteramos sobre todas las sucursales
  sucursales.forEach(sucursal => {
    const { latitud, longitud } = sucursal;
    const distancia = calcularDistancia(destino.latitude, destino.longitude, latitud, longitud);

    // Comprobamos si esta sucursal está más cerca que la anterior
    if (distancia < distanciaMinima) {
      distanciaMinima = distancia;
      sucursalCercana = sucursal;
    }
  });

  return sucursalCercana;
}

export function calcularDistancia(lat1, lon1, lat2, lon2) {
  const radioTierra = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180); // Diferencia de latitudes en radianes
  const dLon = (lon2 - lon1) * (Math.PI / 180); // Diferencia de longitudes en radianes
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = radioTierra * c; // Distancia en km
  return distancia;
}

export async function getUberQuote(ajustes ,token, origin, destino, nombre) {

  const apiKey = ajustes ? ajustes.apiKey : null;

  const secretKey = ajustes ? ajustes.secretKey : null;

  const customer = ajustes ? ajustes.customer : null;

  // Sobrescribe las variables de entorno programáticamente
  process.env.UBER_DIRECT_CLIENT_ID = apiKey;
  process.env.UBER_DIRECT_CLIENT_SECRET = secretKey;
  process.env.UBER_DIRECT_CUSTOMER_ID = customer;


  const direccionPickup = origin.direccion;

  const direccionDropoff = destino.address ;


  try {

    const deliveriesClient = createDeliveriesClient(token);
        
    const estimateRequest = {
      pickup_address: direccionPickup,
      dropoff_address: direccionDropoff,
    };

    //return estimateRequest;

    const estimate = await deliveriesClient.createQuote(estimateRequest);

    return estimate ;
    
  } catch (error) {
    console.error('Error in the Uber estimate :', error);
    const message = error.message;
    await logErrorToFile(`Error in the Uber estimate : ${message} `, nombre);
    console.error(message);
    throw error;
  }

}


async function logErrorToFile(errorMessage, nombre) {

  const logFilePath = `logs/logs-${nombre}.txt`;
  const timestamp = new Date(new Date().getTime() - (6 * 60 * 60 * 1000)).toISOString();
  const logMessage = `[${timestamp}] [name shop: ${nombre}] ${errorMessage}\n`;

  console.log('Writing error to log:', logMessage);

  try {
    // Asegurar que el directorio existe
    await mkdir(dirname(logFilePath), { recursive: true });
    
    // Escribir en el archivo
    await appendFile(logFilePath, logMessage);
    console.log('Error successfully written to log file.');
  } catch (err) {
    console.error('Error writing to log file:', err);
  }
}












