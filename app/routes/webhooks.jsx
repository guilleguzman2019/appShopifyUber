import { authenticate } from "../shopify.server";

import {getUberToken} from '../functions/getDeliveryQuote'

import {getCountryName} from '../functions/getDeliveryQuote'

import {getAddressGoogle} from '../functions/getDeliveryQuote'
import {getAddressGoogle2} from '../functions/getDeliveryQuote'

import nodemailer from 'nodemailer';


import { getAccessToken } from 'uber-direct/auth';

import { createDeliveriesClient } from 'uber-direct/deliveries';

const updateOrders = async (payload, admin) => {

  console.log('Received payload:', payload);

  const orderId = payload.id; // assuming the payload contains an 'id' field for the order
  const orderNumber = payload.order_number; // assuming the payload contains an 'order_number' field

  console.log(`Updating order with ID: ${orderId} and order number: ${orderNumber}`);

  const response = await admin.graphql(
    `#graphql
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          key
          namespace
          value
          createdAt
          updatedAt
        }
        userErrors {
          field
          message
          code
        }
      }
    }`,
    {
      variables: {
        metafields: [
          {
            key: "example_key",
            namespace: "example_namespace",
            ownerId: `gid://shopify/Order/${orderId}`,
            type: "single_line_text_field",
            value: "Example Value"
          }
        ]
      },
    }
  );

  const data = await response.json();
  console.log('Metafields update response:', data);

  
};

const paidOrders = async (payload, admin) => {


  try {

    //console.log(`estos son los datos del payload paid ${payload}`);

    //const direccion1 = payload.shipping_address.address1 ;

    const orderId = payload.id; // id de la orden

    const datos = payload.line_items[0].properties; // propiedades que se van a usar en el uber direct

    const datosTransformados = datos.reduce((acc, item) => {
      acc[item.name] = item.value; // Asigna el `value` al nombre
      return acc;
    }, {});

    const id = datosTransformados?.idTienda || '';
    const indicacionesEntrega = datosTransformados?.IndicacionesDropoff || '';
    const diaHora = datosTransformados?.diaHorariofinal || '';
    const propina = datosTransformados?.propina || '';
    const tiempoPreparacion = datosTransformados?.tiempoPreparacion || '';

    let store = await prisma.tienda.findUnique({
      where: {
        id: id 
      },
      include: {
        ajustes: true,
        ajustesEmail:true
      }
    });

    const apiKey = store.ajustes?.apiKey || '';

    const secretKey = store.ajustes?.secretKey || '';

    const customer = store.ajustes?.customer || '';

    // Sobrescribe las variables de entorno programáticamente
    process.env.UBER_DIRECT_CLIENT_ID = apiKey;
    process.env.UBER_DIRECT_CLIENT_SECRET = secretKey;
    process.env.UBER_DIRECT_CUSTOMER_ID = customer;
    

    const sucursal = await prisma.sucursal.findMany({
      where: {
        tiendaId: id,
        esPrincipal: true
      }
    });

    const latOrigin = sucursal[0].latitud;
    const logOrigin = sucursal[0].longitud;

    console.log('esta es la latitud de la tienda origen');
    console.log(latOrigin);
    console.log(logOrigin);

    const direccionPickup = await getAddressGoogle(latOrigin, logOrigin);

    console.log(direccionPickup);

    const latDestino = payload.shipping_address.latitude || payload.billing_address.latitude;
    const logDestino = payload.shipping_address.longitude || payload.billing_address.longitude;

    console.log(latDestino);
    console.log(logDestino);

    const direccionDrop = await getAddressGoogle(latDestino, logDestino);

    const uberToken = await getUberToken(store.ajustes);


    const deliveriesClient = createDeliveriesClient(uberToken);

    const productosPaylod = payload.line_items;

    const productosPayload = payload.line_items;

    const productosFinal = productosPayload.map(item => ({
      name: item.name || '', 
      quantity: item.quantity || 1, 
      size: item.variant_title || 'small', 
      dimensions: {
        length: 20,  
        height: 20,
        depth: 20
      },
      price: parseFloat(item.price) || 0, 
      weight: item.grams / 1000 || 1, 
      vat_percentage: 1250000
    }));

    const deliveryRequest = {
      pickup_name: 'Mager',
      pickup_address: direccionPickup,
      pickup_phone_number: '+14155551212',
      pickup_verification: {
          signature: true,
          signature_requirement: {
              enabled: true,
              collect_signer_name: true,
              collect_signer_relationship: true
          },
          barcodes: [
              {
                  value: "string",
                  type: "CODE39"
              }
          ],
          identification: {
              min_age: 21,
              no_sobriety_check: false
          },
          picture: true
      },
      dropoff_name: 'Anant',
      dropoff_address: direccionDrop,
      dropoff_phone_number: '+14155551212',
      dropoff_verification: {
          barcodes: [
              {
                  value: "string",
                  type: "CODE39"
              }
          ],
          identification: {
              min_age: 21,
              no_sobriety_check: false
          },
          pincode: {
              enabled: true,
          },
          picture: true
      },
      manifest_items: productosFinal,
      testSpecifications: {
        roboCourierSpecification: {
          mode: 'auto',
        },
      },
      return_verification: {
          signature: true,
          signature_requirement: {
              enabled: true,
              collect_signer_name: true,
              collect_signer_relationship: true
          },
          barcodes: [
              {
                  value: "string",
                  type: "CODE39"
              }
          ],
          picture: true,
          pincode: {
              enabled: true,
          }
      },
    };

    console.log(payload.shipping_lines[0].code);

    if(payload.shipping_lines[0].code == 'UBER_DIRECT'){

      const delivery = await deliveriesClient.createDelivery(deliveryRequest);

      const urlTracking = delivery.tracking_url ;

      const nuevaUrl = urlTracking.replace("/ar/", "/mx/");
      console.log(nuevaUrl);

      console.log(delivery);

      const pincode = delivery.return.verification_requirements.pincode.value || '6789';

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: store.ajustesEmail.user,
          pass: store.ajustesEmail.pass,
        },
      });

      const to = payload.email || 'guillermoguzman.2016@gmail.com';
    
      // Configura el mensaje de correo
      const mailOptions = {
        from: store.ajustesEmail.user, // Correo electrónico de origen
        to: to, // Correo electrónico de destino
        subject: 'AVISO DE ENVIO CON UBER DIRECT', // Asunto del correo
        html: `<!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Detalles de Pedido</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              padding: 8px 12px;
              text-align: left;
              border: 1px solid #ddd;
            }
            th {
              background-color: #4CAF50;
              color: white;
            }
            td {
              background-color: #ffffff;
            }
            .header {
              background-color: #333;
              color: white;
              text-align: center;
              padding: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Detalles del Pedido</h2>
          </div>
          
          <table>
            <tr>
              <th>Dirección de Pickup</th>
              <td>${delivery.pickup.address}</td>
            </tr>
            <tr>
              <th>Dirección de Dropoff</th>
              <td>${delivery.dropoff.address}</td>
            </tr>
            <tr>
              <th>Total del Envio</th>
              <td>${delivery.fee} ${delivery.currency}</td>
            </tr>
            <tr>
              <th>Pincode</th>
              <td>${delivery.dropoff.verification_requirements.pincode.value}</td>
            </tr>
          </table>
      
          <h3>Lista de Productos</h3>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              ${delivery.manifest_items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.price} ${delivery.currency}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </body>
        </html>`
      };

      await transporter.sendMail(mailOptions);

      const responsefinal = await admin.graphql(
        `#graphql
        mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              key
              namespace
              value
              createdAt
              updatedAt
            }
            userErrors {
              field
              message
              code
            }
          }
        }`,
        {
          variables: {
            metafields: [
              {
                key: "urlTracking",
                namespace: "example_namespace",
                ownerId: `gid://shopify/Order/${orderId}`,
                type: "single_line_text_field",
                value: nuevaUrl
              }
            ]
          },
        }
      );
    
      const datafinal = await responsefinal.json();
      console.log('Metafields update response:', datafinal);

    }

  }
  catch (error) {
  // Manejo de errores
  console.error('Error en paidOrders:', error);
  }

}


export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } =
    await authenticate.webhook(request);

  if (!admin) {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    console.log("No admin context", { topic, shop, session, payload });
    throw new Response();
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        console.log("App uninstalled", { shop });
      }

      break;
    case "ORDERS_CREATE":
      if (session) {
        //console.log("Order created", payload);

        //updateOrders(payload, admin);
        return new Response(`Recieved new order for ${shop}`, {status:200});
      }
      break;
    case "ORDERS_PAID":
      if (session) {
        console.log("Order paid", payload);

        paidOrders(payload, admin);
      }
  
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};