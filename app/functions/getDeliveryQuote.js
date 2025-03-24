import { getAccessToken } from 'uber-direct/auth';
import { createDeliveriesClient } from 'uber-direct/deliveries';

import { appendFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';


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

export async function createDelivery(ajustes, token, nombre, deliveryRequest) {

  const apiKey = ajustes ? ajustes.apiKey : null;
  const secretKey = ajustes ? ajustes.secretKey : null;
  const customer = ajustes ? ajustes.customer : null;

  // Sobrescribe las variables de entorno programáticamente
  process.env.UBER_DIRECT_CLIENT_ID = apiKey;
  process.env.UBER_DIRECT_CLIENT_SECRET = secretKey;
  process.env.UBER_DIRECT_CUSTOMER_ID = customer;

  try {
    const deliveriesClient = createDeliveriesClient(token);
    const delivery = await deliveriesClient.createDelivery(deliveryRequest);
    return delivery;
  } catch (error) {
    // Verificamos si el error tiene metadata

    if (error.metadata) {
      // Iteramos sobre las claves de metadata y extraemos el valor
      let errorMessage = 'Error desconocido';

      // Iteramos sobre cada clave en metadata y tomamos su valor
      for (let key in error.metadata) {
        if (error.metadata.hasOwnProperty(key)) {
          errorMessage = error.metadata[key];
          break; // Si quieres tomar solo el primer mensaje encontrado
        }
      }

      // Mostrar el mensaje de error específico
      console.error(`Error in the Uber delivery : ${errorMessage}`);
      const message = error.message;

      await logErrorToFile(`Error in the Uber delivery : ${message} - ${errorMessage}`, nombre);

      console.error(message);
      throw error; // Volver a lanzar el error después de loguearlo
    } else {
      // Si el error no tiene metadata, manejarlo como un error genérico
      console.error('Error in the Uber delivery :', error.message);
      throw error;
    }
  }
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

export async function getOrigenPickup(id, sucursales, destino) {

  const destinoLatLog = {latitude: destino.latitude , longitude: destino.longitude} ;

  return await sucursalMasCercana(id, sucursales, destinoLatLog);
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