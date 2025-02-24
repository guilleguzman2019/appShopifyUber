import { getAccessToken } from 'uber-direct/auth';
import { createDeliveriesClient } from 'uber-direct/deliveries';


export async function getUberToken(ajustes) {

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
    console.error('Error en getUberToken:', error);
    throw error;
  }

}

export async function getUberQuote(ajustes ,token, origin, destino) {

  const apiKey = ajustes ? ajustes.apiKey : null;

  const secretKey = ajustes ? ajustes.secretKey : null;

  const customer = ajustes ? ajustes.customer : null;

  // Sobrescribe las variables de entorno programáticamente
  process.env.UBER_DIRECT_CLIENT_ID = apiKey;
  process.env.UBER_DIRECT_CLIENT_SECRET = secretKey;
  process.env.UBER_DIRECT_CUSTOMER_ID = customer;

  const latOrigin = origin.latitud ;
  const logOrigin = origin.longitud;

  const direccionPickup = await getAddressGoogle(latOrigin, logOrigin);


  const direccionDropoff = destino.latitude && destino.longitude 
      ? getAddressGoogle(destino.latitude, destino.longitude) 
      : await getAddressGoogle2(destino , getCountryName(destino.country));


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
    console.error('Error en getUberQuote:', error);
    return error ;
    throw error;
  }
}

export async function getAddressGoogle(lat, lng){


  if (!lat || !lng) {
    return json({ error: "Latitud y Longitud son requeridas." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyDGa5xQES7MMhkvcpIA5Y85QzlVEqL1sJg`
    );

    const data = await response.json();

    if (data.status === "OK") {
      const address = data.results[0].formatted_address;
      return address;
    } else {
      return json({ error: "No se pudo encontrar la dirección." }, { status: 400 });
    }
  } catch (error) {
    return json({ error: "Error al comunicarse con la API de Google." }, { status: 500 });
  }


}

//get formate address

export async function getAddressGoogle2(destination, pais){

  var direccionfinal = `${destination.address1}, ${destination.city}, ${destination.postal_code}, ${pais}`;

  if (!direccionfinal) {
    throw new Error("La dirección parcial es requerida.");
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(direccionfinal)}&key=AIzaSyDGa5xQES7MMhkvcpIA5Y85QzlVEqL1sJg`
    );

    const data = await response.json();

    if (data.status === "OK") {
      const address = data.results[0].formatted_address;
      return address;  // Devuelve la dirección completa encontrada
    } else {
      throw new Error("No se pudo encontrar la dirección.");
    }
  } catch (error) {
    throw new Error("Error al comunicarse con la API de Google.");
  }
}

export function getCountryName(code) {

  const paisesLatinoamericanos = [
    { codigo: 'MX', nombre: 'México' },
    { codigo: 'AR', nombre: 'Argentina' },
    { codigo: 'BR', nombre: 'Brasil' },
    { codigo: 'CL', nombre: 'Chile' },
    { codigo: 'CO', nombre: 'Colombia' },
    { codigo: 'PE', nombre: 'Perú' },
    { codigo: 'VE', nombre: 'Venezuela' },
    { codigo: 'UY', nombre: 'Uruguay' },
    { codigo: 'PY', nombre: 'Paraguay' },
    { codigo: 'BO', nombre: 'Bolivia' },
    { codigo: 'EC', nombre: 'Ecuador' },
    { codigo: 'SV', nombre: 'El Salvador' },
    { codigo: 'CR', nombre: 'Costa Rica' },
    { codigo: 'HN', nombre: 'Honduras' },
    { codigo: 'GT', nombre: 'Guatemala' },
    { codigo: 'NI', nombre: 'Nicaragua' },
    { codigo: 'DO', nombre: 'República Dominicana' },
    { codigo: 'CU', nombre: 'Cuba' },
    { codigo: 'JM', nombre: 'Jamaica' },
    { codigo: 'HT', nombre: 'Haití' },
    { codigo: 'BS', nombre: 'Bahamas' },
    { codigo: 'BB', nombre: 'Barbados' },
    { codigo: 'BZ', nombre: 'Belice' },
    { codigo: 'GD', nombre: 'Granada' },
    { codigo: 'LC', nombre: 'Santa Lucía' },
    { codigo: 'KN', nombre: 'San Cristóbal y Nieves' },
    { codigo: 'VC', nombre: 'San Vicente y las Granadinas' }
  ];

  const pais = paisesLatinoamericanos.find(p => p.codigo === code);
  return pais ? pais.nombre : 'País no encontrado';

}

export async function obtenerCoordenadasDeDireccion(direccion) {

  const apiKey = 'AIzaSyDGa5xQES7MMhkvcpIA5Y85QzlVEqL1sJg';  // Usa tu clave API de Google Maps
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(direccion)}&key=${apiKey}`;

  try {
    const response = await fetch(url);  // Esperamos a que fetch se resuelva
    const data = await response.json();  // Esperamos a que la respuesta sea convertida en JSON

    if (data.status === 'OK') {
      const latitud = data.results[0].geometry.location.lat;
      const longitud = data.results[0].geometry.location.lng;

      // Retornar las coordenadas como un objeto
      return { latitude:latitud, longitude:longitud };
    } else {
      console.error('No se pudo obtener las coordenadas:', data.status);
      return null;  // Retorna null si no se pudo obtener las coordenadas
    }
  } catch (error) {
    console.error('Error al realizar la solicitud:', error);
    return null;  // Retorna null en caso de error
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
export async function sucursalMasCercana(idTienda, destino) {


  // sucursales de la tienda
    let sucursales = await prisma.sucursal.findMany({
      where: {
        tiendaId: idTienda,
      }
    });

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


export async function getOrigenPickup(id, destino) {
  
  const destinoLatLog = destino.latitude && destino.longitude 
      ? { latitude: destino.latitude, longitude: destino.longitude }
      : await obtenerCoordenadasDeDireccion(`${destino.address1}, ${destino.city}, ${destino.postal_code}, ${getCountryName(destino.country)}`);

  return await sucursalMasCercana(id, destinoLatLog);
}