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

export async function getUberQuote(ajustes,token, origin, destination, pais) {

  const apiKey = ajustes ? ajustes.apiKey : null;

  const secretKey = ajustes ? ajustes.secretKey : null;

  const customer = ajustes ? ajustes.customer : null;

  // Sobrescribe las variables de entorno programáticamente
  process.env.UBER_DIRECT_CLIENT_ID = apiKey;
  process.env.UBER_DIRECT_CLIENT_SECRET = secretKey;
  process.env.UBER_DIRECT_CUSTOMER_ID = customer;

  const latOrigin = origin.latitude ;
  const logOrigin = origin.longitude;

  const direccionPickup = await getAddressGoogle(latOrigin, logOrigin);


  const direccionDropoff = await getAddressGoogle2(destination, pais);

  try {

    const deliveriesClient = createDeliveriesClient(token);
        
    const estimateRequest = {
      pickup_address: direccionPickup,
      dropoff_address: direccionDropoff,
    };

    const estimate = await deliveriesClient.createQuote(estimateRequest);

    return estimate ;
    
  } catch (error) {
    console.error('Error en getUberQuote:', error);
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

  return new Promise((resolve, reject) => {
    fetch(`https://restcountries.com/v3.1/alpha/${code}`)
      .then(response => {
        if (!response.ok) {
          reject('Error en la respuesta de la API');
        }
        return response.json();
      })
      .then(data => {
        let countryName = data[0].name.common;  // Guardar el nombre del país en la variable
        resolve(countryName);  // Resolver la promesa con el nombre del país
      })
      .catch(error => reject(error));  // Rechazar la promesa en caso de error
  });
}