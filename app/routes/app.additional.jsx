import React, { useState, useEffect } from 'react';

import { LoadScript } from '@react-google-maps/api';

import { json } from "@remix-run/node";

import { useLoaderData, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

import ComponentAjustes from '../components/ComponentAjustes';
import ComponentProducts from '../components/ComponentProducts';
import ComponentPedidos from '../components/ComponentPedidos';
import ComponentSucursales from '../components/ComponentSucursales';


export const loader = async ({ request }) => {

  try {
    // Authentication
    const { admin, session } = await authenticate.admin(request);
    
    // GraphQL query execution with error handling
    const response = await admin.graphql(`#graphql
      query getShopData {
        shop {
          name
        }
        locations(first: 1) {
          edges {
            node {
              id
              name
              address {
                formatted
              }
            }
          }
        }
        products(first: 50) {
          edges {
            node {
              id
              title
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              handle
              metafields(first: 5) {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
                  }
                }
              }
            }
          }
        }
        orders(first: 200) {
          edges {
            node {
              id
              name
              createdAt
              totalPrice
              displayFinancialStatus
              currencyCode
              updatedAt
              metafields(first: 10) {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
                    type
                    createdAt
                    updatedAt
                  }
                }
              }
            }
          }
        }
    }`);


    const { data } = await response.json();
    
    // Database operations with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find or create store
      let store = await tx.tienda.findUnique({
        where: {
          nombre: session.shop
        },
        include: {
          ajustes: true,
          ajustesEmail:true,
          sucursales:true,
          propina: true,
          ajustesPickupDrop:true,
          ajustesProductos:true
        }
      });
      
      // If store doesn't exist, create it
      if (!store) {
        store = await tx.tienda.create({
          data: {
            nombre: session.shop,
            ajustes: {
              create: {
                apiKey: "",
                secretKey: "",
                modo: "Pruebas",
                titulo: "Uber Delivery final",
                idioma: "es",
                customer: ""
              }
            }
          },
          include: {
            ajustes: true,
            ajustesEmail:true,
            sucursales:true,
            propina:true,
            ajustesPickupDrop:true,
            ajustesProductos:true
          }
        });
      }
      
      // Get existing products
      const existingProducts = await tx.producto.findMany({
        where: {
          tiendaId: store.id, // Filtro para traer solo los productos con el tiendaId correspondiente
        }
      });
      const existingProductTitles = new Set(existingProducts.map(p => p.title));
      
      // Batch create new products
      const productsToCreate = data.products.edges
        .filter(edge => !existingProductTitles.has(edge.node.title))
        .map(edge => ({
          title: edge.node.title,
          image: edge.node.images.edges[0]?.node.url || null,
          preparationTime: 1,
          length: 1,
          height: 1,
          depth: 1,
          weight:1,
          tiendaId: store.id,
        }));
      
      if (productsToCreate.length > 0) {
        await tx.producto.createMany({
          data: productsToCreate
        });
      }
      
      // Get final product list, filtered by tiendaId
      const finalProducts = await tx.producto.findMany({
        where: {
          tiendaId: store.id, // Filtro para traer solo los productos con el tiendaId correspondiente
        }
      });

      
      // Always return the expected structure
      return {
        tienda: store,
        location: data.locations.edges,
        productos: finalProducts,
        ordenes: data.orders.edges,
        error: null
      };

    });

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Loader error:', error);
    // Return the error response with the same structure
    return new Response(JSON.stringify({
      tienda: null,
      location: [],
      productos: [],
      ordenes: [],
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};


export const action = async ({ request }) => {


    try {
      return json({ success: true, mensaje: 'hola mundo'});

    } catch (error) {
      console.error("Error:", error);
      return json({ 
        success: false, 
        error: error.message 
      });
    }

};


const AdditionalPage = () => {

  const { tienda, productos, ordenes, error,} = useLoaderData();
  const [pestanaActiva, setPestanaActiva] = useState('Settings');

  console.log(error);


  // Componentes de contenido por pestaña
  const ContenidoPestanas = {
    Settings: (
      <ComponentAjustes tienda={tienda}/>
    ),
    Products: (
      <ComponentProducts tienda={tienda} productos={productos}/>
    ),
    Stores: (
      <ComponentSucursales tienda={tienda}/>
    ),
    Orders: (
      <ComponentPedidos tienda={tienda} ordenes={ordenes}/>
    ),
  };


  return (
    <LoadScript googleMapsApiKey="AIzaSyDGa5xQES7MMhkvcpIA5Y85QzlVEqL1sJg" libraries={['places']}>
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "Montserrat, serif" }}>
      <header className="border-b bg-white flex justify-between">
        <nav className="px-4">
          <ul className="flex gap-8">
            <li>
              <button
                onClick={() => setPestanaActiva('Settings')}
                className={`py-3 ${
                  pestanaActiva === 'Settings' 
                    ? 'text-indigo-700 border-b-2 border-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Settings
              </button>
            </li>
            <li>
              <button
                onClick={() => setPestanaActiva('Products')}
                className={`py-3 ${
                  pestanaActiva === 'Products'
                    ? 'text-indigo-700 border-b-2 border-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Products
              </button>
            </li>
            <li>
              <button
                onClick={() => setPestanaActiva('Stores')}
                className={`py-3 ${
                  pestanaActiva === 'Stores'
                    ? 'text-indigo-700 border-b-2 border-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Stores
              </button>
            </li>
            <li>
              <button
                onClick={() => setPestanaActiva('Orders')}
                className={`py-3 ${
                  pestanaActiva === 'Orders'
                    ? 'text-indigo-700 border-b-2 border-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Orders
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-medium text-gray-900">Uber delivery for Shopify</h1>
            <p className="text-sm text-gray-500">by Vex Soluciones</p>
          </div>
          {ContenidoPestanas[pestanaActiva]}
        </div>
      </main>
      </div>
    </LoadScript>
  );
};

export default AdditionalPage;