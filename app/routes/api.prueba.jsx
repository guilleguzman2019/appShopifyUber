import { json } from "@remix-run/node";

import { getAccessToken } from 'uber-direct/auth';
import { createDeliveriesClient } from 'uber-direct/deliveries';


export const action = async ({ request }) => {

    var data = {"rate":{"origin":{"country":"AR","postal_code":"X5000","province":"X","city":"Córdoba","name":null,"address1":"Avenida Colón 76, centro","address2":"","address3":null,"latitude":-31.4132625,"longitude":-64.1839189,"phone":"+543513289703","fax":null,"email":null,"address_type":null,"company_name":"pruebafinal566"},"destination":{"country":"AR","postal_code":"5010","province":"X","city":"Córdoba","name":"GUILLERMO ALEJANDRO GUZMAN","address1":"Aviador Locatelli 2609, villa adela","address2":null,"address3":null,"latitude":-31.4391517,"longitude":-64.2500081,"phone":null,"fax":null,"email":null,"address_type":null,"company_name":null},"items":[{"name":"Yellow Snowboar","sku":"","quantity":1,"grams":522000,"price":10000,"vendor":"pruebafinal566","requires_shipping":true,"taxable":true,"fulfillment_service":"manual","properties":{},"product_id":7476932378710,"variant_id":42006006497366}],"currency":"ARS","locale":"en-AR"}};
  
    const origin = data.rate.origin;
    
    const destination = data.rate.destination;

    const uberToken = await getUberToken();
    
    const uberQuote = await getUberQuote(uberToken, origin, destination);
    
    return uberQuote;
    
};

export async function loader() {

  const session = await prisma.session.findFirst({
    where: {
      shop: 'pruebafinal566.myshopify.com',
    }
  });
  

  const token =  session.accessToken ;

  const query = `
    query {
      shop {
        id
        name
      }
    }
  `;


  const response = await fetch('https://pruebafinal566.myshopify.com/admin/api/2023-07/graphql.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/graphql',
      'X-Shopify-Access-Token': session.accessToken,
    },
    body: query
  });

  const data = await response.json();

  if (response.ok) {
    // Si la respuesta es exitosa, puedes devolver los datos o el id de la tienda.
    return json(data.data);
  } else {
    // Si la respuesta no es exitosa, puedes manejar el error.
    throw new Error('Error al obtener datos de Shopify');
  }
}


async function getUberQuote(token, origin, destination) {

  const latOrigin = origin.latitude ;
  const logOrigin = origin.longitude;

  const direccionPickup = await getAddressGoogle(latOrigin, logOrigin);

  const partialAddress = destination.address1 ;

  const direccionDropoff = await getAddressGoogle2(partialAddress);
  
    try {
      const response = await fetch('https://api.uber.com/v1/customers/7724c572-5049-5cac-b9d0-22dedffe5d0c/delivery_quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          "pickup_address": `{\"ubicacion\":[\"${direccionPickup}\"]}`,
          "dropoff_address": `{\"ubicacion\":[\"${direccionDropoff}\"]}`,
          "pickup_phone_number": "+543515555555",
          "dropoff_phone_number": "+543515555555",
          "manifest_total_value": 2000,
          "external_store_id": "mi_tienda_cba"
        })
      });
  
      if (!response.ok) {
            return response;
        throw new Error('Error obteniendo cotización de Uber');
      }
  
      const quoteData = await response.json();
      return quoteData;
    } catch (error) {
      console.error('Error en getUberQuote:', error);
      throw error;
    }

}

async function getUberToken() {

    const params = new URLSearchParams({
        client_id: 'faFHopE6gqyHgrj0EguIBy9-k7yvrI-J',
        client_secret: '1oaEp01r0vBVUlaE2sCEEY8ZPbhuwx9oCP7LY5aS',
        grant_type: 'client_credentials',
        scope: 'eats.deliveries'
      });
    
      try {
        const response = await fetch('https://auth.uber.com/oauth/v2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params
        });
    
        if (!response.ok) {
          throw new Error('Error obteniendo token de Uber');
        }
    
        const data = await response.json();
        return data.access_token;
      } catch (error) {
        console.error('Error en getUberToken:', error);
        throw error;
      }
}


async function getAddressGoogle(lat, lng){


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

async function getAddressGoogle2(destination, pais){

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

