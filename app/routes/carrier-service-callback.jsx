import { json } from "@remix-run/node";

import {getUberToken} from '../functions/getDeliveryQuote'

import {getUberQuote} from '../functions/getDeliveryQuote'

import {getCountryName} from '../functions/getDeliveryQuote'

export async function action({ request }) {

  try {

    // Obtener datos de la solicitud
    const data = await request.json();

    let store = await prisma.tienda.findUnique({
      where: {
        id: data.rate.items[0].properties.idTienda 
      },
      include: {
        ajustes: true,
        sucursales:true,
        propina: true,
        ajustesPickupDrop:true,
        ajustesProductos:true,
        productos:true
      }
    });

    let sucursal =await prisma.sucursal.findFirst({
      where: {
        tiendaId: data.rate.items[0].properties.idTienda,
        esPrincipal: true
      }
    });


    //var data = {"rate":{"origin":{"country":"AR","postal_code":"X5000","province":"X","city":"Córdoba","name":null,"address1":"Avenida Colón 76, centro","address2":"","address3":null,"latitude":-31.4132625,"longitude":-64.1839189,"phone":"+543513289703","fax":null,"email":null,"address_type":null,"company_name":"pruebafinal566"},"destination":{"country":"AR","postal_code":"5010","province":"X","city":"Córdoba","name":"GUILLERMO ALEJANDRO GUZMAN","address1":"Aviador Locatelli 2609, villa adela","address2":null,"address3":null,"latitude":-31.4391517,"longitude":-64.2500081,"phone":null,"fax":null,"email":null,"address_type":null,"company_name":null},"items":[{"name":"Yellow Snowboar","sku":"","quantity":1,"grams":522000,"price":10000,"vendor":"pruebafinal566","requires_shipping":true,"taxable":true,"fulfillment_service":"manual","properties":{},"product_id":7476932378710,"variant_id":42006006497366}],"currency":"ARS","locale":"en-AR"}};
    
    // Obtener token de Uber
    const uberToken = await getUberToken(store.ajustes);

    const origin = {latitude: sucursal.latitud , longitude: sucursal.longitud };

    const destination = data.rate.destination;

    const pais = await getCountryName(data.rate.destination.country);


    const uberQuote = await getUberQuote(store.ajustes, uberToken, origin, destination, pais);

    //return uberQuote;
    

    // Preparar respuesta para Shopify
    const rates = {
      rates: [
        {
          service_name: store.ajustes.titulo,
          service_code: "UBER_DIRECT",
          total_price: uberQuote.fee,
          currency: "MXN",
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

