import { authenticate } from "../shopify.server";

import {getUberToken} from '../functions/getDeliveryQuote'

import {getCountryName} from '../functions/getDeliveryQuote'

import {getAddressGoogle} from '../functions/getDeliveryQuote'
import {getAddressGoogle2} from '../functions/getDeliveryQuote'

import {sucursalMasCercana} from '../functions/getDeliveryQuote'

import nodemailer from 'nodemailer';

import prisma from '../db.server';

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

    const orderId = payload.id; // id de la orden

    const datos = payload.line_items[0].properties; // propiedades que se van a usar en el uber direct

    const {idTienda , IndicacionesDropoff , diaHorariofinal, propina , tiempoPreparacion } = dataFormated(datos);

    const {apiKey, secretKey, customer, user , pass, plan, CantidadEnvios} = await getAjustesTienda(idTienda);

    // Sobrescribe las variables de entorno programáticamente
    process.env.UBER_DIRECT_CLIENT_ID = apiKey;
    process.env.UBER_DIRECT_CLIENT_SECRET = secretKey;
    process.env.UBER_DIRECT_CUSTOMER_ID = customer;

    const sucursales = await getSucursales(idTienda);

    const destino = payload.shipping_address || {} ;

    const { latitude, longitude } = getDestino(destino);

    var sucursalfinal = await sucursalMasCercana(idTienda, { latitude, longitude });

    const { latitud,longitud } = sucursalfinal || {};

    const direccionPickup = await getAddressGoogle(latitud, longitud);

    const direccionDrop = await getAddressGoogle(latitude, longitude);

    const uberToken = await getUberToken({apiKey, secretKey, customer});

    const deliveriesClient = createDeliveriesClient(uberToken);

    const productosPayload = payload.line_items;

    const productos = await getProductosFinal(idTienda, productosPayload);

    const {pickup_verification, dropoff_verification} = await getVerificationData(idTienda);

    const pickupReadyTime = "2025-02-22T23:00:00.000Z" ;

    const deliveryRequest = {
      pickup_name: 'Store Main',
      pickup_address: direccionPickup,
      pickup_phone_number: sucursalfinal.telefono || '+14155551212',
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
      dropoff_name: 'Client',
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
      //pickup_ready_dt: pickupReadyTime,
      manifest_items: productos,
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

    const tipoEnvio = payload.shipping_lines[0].code;

    if(tipoEnvio == 'UBER_DIRECT'){

      if(plan == 'free'  &&  CantidadEnvios > 5){

        return ;
      }

      const delivery = await deliveriesClient.createDelivery(deliveryRequest);

      const urlTraking = getUrlTracking(delivery);

      const pincode = delivery.return.verification_requirements.pincode.value || '6789';

      const email = payload.email || 'guillermoguzman.2016@gmail.com';

      await envioEmail({user,pass},email, delivery);

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
                  value: urlTraking
                }
              ]
            },
          }
      );
      
      const datafinal = await responsefinal.json();
      console.log('Metafields update response:', datafinal);

      if(plan == 'free'  &&  CantidadEnvios < 5){

        const tienda = await prisma.tienda.findUnique({
          where: {
            id: idTienda, // Aquí se está usando el ID de la tienda como identificador
          },
          select: {
            CantidadEnvios: true, // Solo seleccionamos el campo que necesitamos
          },
        });
        
        if (tienda) {
          const actualizado = await prisma.tienda.update({
            where: {
              id: idTienda, // Aquí se está usando el ID de la tienda como identificador
            },
            data: {
              CantidadEnvios: tienda.CantidadEnvios + 1, // Aumentamos en uno la cantidad
            },
          });
        
          console.log('CantidadEnvios actualizada:', actualizado);
        }

        
      }

      

    }

  }
  catch (error) {
  // Manejo de errores
  console.error('Error en paidOrders:', error);
  }

}

const dataFormated = (datos) => {

  const datosTransformados = datos.reduce((acc, item) => {
    acc[item.name] = item.value; // Asigna el `value` al nombre
    return acc;
  }, {});

  // Desestructuración con valores por defecto
  const {
    idTienda = '',
    IndicacionesDropoff = '',
    diaHorariofinal = '',
    propina = '',
    tiempoPreparacion = ''
  } = datosTransformados || {}; 

  return { idTienda, IndicacionesDropoff, diaHorariofinal, propina, tiempoPreparacion };
};

const getDestino = (destino) => {
  if (!destino) return null; // Manejo de caso donde destino es undefined o null

  const { latitude, longitude } = destino; // Extrae las propiedades correctamente

  return { latitude, longitude }; // Devuelve el objeto correctamente
};

const getAjustesTienda = async (id) => {

  let store = await prisma.tienda.findUnique({
    where: {
      id: id
    },
    include: {
      ajustes: true,
      ajustesEmail: true
    }
  });

  if (!store || !store.ajustes) {
    return { apiKey: '', secretKey: '', customer: '', plan: '', CantidadEnvios: 0 }; // Retorna valores vacíos si no hay datos
  }

  const { apiKey = '', secretKey = '', customer = '' } = store.ajustes;

  const { plan = '', CantidadEnvios = 0 } = store;

  const {user , pass} = store.ajustesEmail ;

  return { apiKey, secretKey, customer, user, pass, plan, CantidadEnvios };
};

const getSucursales = async (id) =>{

  const sucursales = await prisma.sucursal.findMany({
    where: {
      tiendaId: id,
    }
  });

  return sucursales ;
}

const envioEmail = async (ajustes, email, delivery) => {

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: ajustes.user,
      pass: ajustes.pass,
    },
  });

  // Configura el mensaje de correo
  const mailOptions = {
    from: ajustes.user, // Correo electrónico de origen
    to: email, // Correo electrónico de destino
    subject: 'UBER DIRECT SHIPPING NOTICE', // Asunto del correo
    html: `<!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Details</title>
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
        <h2>Order Details</h2>
      </div>
      
      <table>
        <tr>
          <th>Pickup Address</th>
          <td>${delivery.pickup.address}</td>
        </tr>
        <tr>
          <th>Dropoff Address</th>
          <td>${delivery.dropoff.address}</td>
        </tr>
        <tr>
          <th>Total Shipping</th>
          <td>${delivery.fee} ${delivery.currency}</td>
        </tr>
        <tr>
          <th>Pincode</th>
          <td>${delivery.dropoff.verification_requirements.pincode.value}</td>
        </tr>
      </table>
  
      <h3>Product List</h3>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Amount</th>
            <th>Price</th>
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

  return {mensage: 'success'};

}

const getUrlTracking = (delivery) =>{

  const urlTracking = delivery.tracking_url ;

  const nuevaUrl = urlTracking.replace("/ar/", "/mx/");

  return nuevaUrl ;
};

async function getProductosFinal(id ,lineItems) {

  const productsDB = await prisma.producto.findMany({
    where: {
      tiendaId: id,
    }
  });

  const ajustesProductos = await prisma.ajustesProducto.findMany({
    where: {
      tiendaId: id,
    }
  });

  // Map through line items and find matching products in DB
  return lineItems.map(lineItem => {
    // Find matching product in DB by title
    const dbProduct = productsDB.find(product => 
      product.title.toLowerCase() === lineItem.title.toLowerCase()
    );

    // If found in DB, use its values, otherwise use defaults
    return {
      name: lineItem.title || '',
      quantity: lineItem.quantity || 1,
      size: lineItem.variant_title || 'small',
      dimensions: {
        length: dbProduct?.length || ajustesProductos.largo,
        height: dbProduct?.height || ajustesProductos.alto,
        depth: dbProduct?.depth || ajustesProductos.ancho,
      },
      // Since price_set is [Object] in the example, we'll need to ensure price is handled appropriately
      // You may need to adjust this based on the actual price structure
      price: lineItem.price ? parseFloat(lineItem.price) : 0,
      weight: dbProduct?.weight || ajustesProductos.peso,
      vat_percentage: 1250000
    };
  });
}

async function getVerificationData(id) {

  const prismaData = await prisma.ajustesPickupDrop.findMany({
    where: {
      tiendaId: id,
    }
  });

  // Transform pickup verification
  const pickup_verification = {
      signature: prismaData.firmaPickup,
      signature_requirement: {
          enabled: prismaData.firmaPickup,
          collect_signer_name: prismaData.nombreFirmaPickup,
          collect_signer_relationship: prismaData.relacionFirmaPickup
      },
      barcodes: [
          {
              value: "string",
              type: "CODE39"
          }
      ],
      identification: {
          min_age: prismaData.edadMinimaDrop, // Using dropoff age as it's the only one provided
          no_sobriety_check: false
      },
      picture: prismaData.fotoPickup
  };

  // Transform dropoff verification
  const dropoff_verification = {
      signature: prismaData.firmaDrop,
      signature_requirement: {
          enabled: prismaData.firmaDrop,
          collect_signer_name: prismaData.nombreFirmaDrop,
          collect_signer_relationship: prismaData.relacionFirmaDrop
      },
      barcodes: [
          {
              value: "string",
              type: "CODE39"
          }
      ],
      identification: {
          min_age: prismaData.edadMinimaDrop,
          no_sobriety_check: false
      },
      pincode: {
          enabled: prismaData.pincodeDrop
      },
      picture: prismaData.fotoDrop
  };

  return {
      pickup_verification,
      dropoff_verification
  };
}

export const action = async ({ request }) => {

  //const { topic, shop, session, admin, payload } = await request.json();
 

  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

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
        
        //console.log("Order paid", payload.line_items[0].properties);

        paidOrders(payload, admin);
        //paidOrders(payload);
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

export const loader = async ({ request }) => {

  return 'hola mundo';
}