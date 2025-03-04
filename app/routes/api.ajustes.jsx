import { json } from "@remix-run/node";

import prisma from '../db.server';

export const action = async ({ request }) => {
  
  const body = await request.json();
  const { tiendaId, apiKey, secretKey, modo, titulo, idioma, customer, montoMin, habilitado } = body;

  var data2 ;

  try {

    if(habilitado !== undefined){

      const tienda = await prisma.tienda.findFirst({
        where: {
          id: tiendaId,
        }
      });

      const session = await prisma.session.findFirst({
        where: {
          shop: tienda.nombre,
        }
      });

      const token =  session.accessToken ;

      const nombre = session.shop;

      const myHeaders = new Headers();
      myHeaders.append("X-Shopify-Access-Token", token);

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
      };

      const response = await fetch(`https://${nombre}/admin/api/2024-07/carrier_services.json`, requestOptions);

      const data = await response.json();  // Parsear la respuesta como JSON

      var idCarrier;  // Declaramos la variable fuera del bloque if

      if (!data.carrier_services || data.carrier_services.length === 0) {

        // Si no hay carrier_services o está vacío, crear un nuevo servicio
        const responsefinal = await fetch(`https://${nombre}/admin/api/2025-01/graphql.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token
          },
          body: JSON.stringify({
            query: `
              mutation CarrierServiceCreate($input: DeliveryCarrierServiceCreateInput!) {
                carrierServiceCreate(input: $input) {
                  carrierService {
                    id
                    name
                    callbackUrl
                    active
                    supportsServiceDiscovery
                  }
                  userErrors {
                    field
                    message
                  }
                }
              }
            `,
            variables: {
              input: {
                name: "test carrier service",
                callbackUrl: "https://example.com/",
                supportsServiceDiscovery: true,
                active: true
              }
            }
          })
        });

        const responsefinalData = await responsefinal.json(); // Parsear la respuesta de la creación


        const id = responsefinalData.data.carrierServiceCreate.carrierService.id;
        const idNumber = id.split('/').pop(); // Obtener solo el número del final 

        idCarrier = parseInt(idNumber);  // Asignar el ID extraído a la variable
      } else {
        // Si ya existen carrier_services, tomar el ID del primer servicio
        idCarrier = data.carrier_services[0].id;  // Extraemos solo el número del ID
      }

      //return idCarrier;

      const endpoint = `https://${nombre}/admin/api/2024-07/carrier_services/${idCarrier}.json`;
      
      const payload = {
        carrier_service: {
          id:idCarrier,
          active: habilitado,
          callback_url: 'https://sealed-briefing-lasting-stations.trycloudflare.com/carrier-service-callback'
        }
      };

      const response2 = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      data2 = await response2.json();

    }

    const ajustes = await prisma.ajustes.upsert({
      where: {
        tiendaId
      },
      update: {
        apiKey,
        secretKey,
        modo,
        titulo,
        idioma,
        customer,
        montoMin,
        habilitado,
        updatedAt: new Date()
      },
      create: {
        tiendaId,
        apiKey,
        secretKey,
        modo,
        titulo,
        idioma,
        customer,
        montoMin,
        habilitado,
      }
    });

    return json({ success: true, ajustes, carrier: data2 });
  } catch (error) {
    console.error("Error en ajustes:", error);
    return json({ 
      success: false, 
      error: error.message 
    }, {
      status: 400
    });
  }
};