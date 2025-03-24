import React, { useState, useEffect } from 'react';

import prisma from '../db.server';

import { json } from "@remix-run/node";

import { useLoaderData, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

import ComponentAjustes from '../components/ComponentAjustes';
import ComponentProducts from '../components/ComponentProducts';
import ComponentPedidos from '../components/ComponentPedidos';
import ComponentSucursales from '../components/ComponentSucursales';
import ComponentLogs from '../components/ComponentLogs';

import { promises as fs } from "fs";
import path from "path";

export const loader = async ({ request }) => {
  try {
    // Autenticación
    const { admin, session } = await authenticate.admin(request);

    // Consulta GraphQL
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

    // Operaciones de base de datos
    const result = await prisma.$transaction(async (tx) => {

      let store = await tx.tienda.findUnique({
        where: { nombre: session.shop },
        select: {
          id:true,
          nombre: true,
          ajustes: true,
          ajustesEmail: true,
          sucursales: true,
          propina: true,
          ajustesPickupDrop: true,
          ajustesProductos: true,
        },
      });

      if (!store) {
        store = await tx.tienda.create({
          data: {
            nombre: session.shop,
            plan: "free",
            CantidadEnvios: 0,
            ajustes: {
              create: {
                apiKey: "",
                secretKey: "",
                modo: "Pruebas",
                titulo: "Uber Delivery final",
                idioma: "es",
                customer: "",
              },
            },
          },
          select: {
            id:true,
            nombre: true,
            ajustes: true,
            ajustesEmail: true,
            sucursales: true,
            propina: true,
            ajustesPickupDrop: true,
            ajustesProductos: true,
          },
        });
      }

      // Obtener productos existentes
      const existingProducts = await tx.producto.findMany({
        where: { tiendaId: store.id },
      });
      const existingProductTitles = new Set(existingProducts.map((p) => p.title));

      // Crear productos nuevos si no existen
      const productsToCreate = data.products.edges
        .filter((edge) => !existingProductTitles.has(edge.node.title))
        .map((edge) => ({
          title: edge.node.title,
          image: edge.node.images.edges[0]?.node.url || null,
          preparationTime: 1,
          length: 1,
          height: 1,
          depth: 1,
          weight: 1,
          tiendaId: store.id,
        }));

      if (productsToCreate.length > 0) {
        await tx.producto.createMany({ data: productsToCreate });
      }

      // Obtener lista final de productos
      const finalProducts = await tx.producto.findMany({
        where: { tiendaId: store.id },
      });

      // Manejo de logs sin caer en el catch
      const filePath = path.join(process.cwd(), "logs", `logs-${store.nombre}.txt`);
      let content = ""; // Contenido por defecto

      try {
        await fs.access(filePath);
        content = await fs.readFile(filePath, "utf-8");
      } catch (error) {
        if (error.code === "ENOENT") {
          await fs.writeFile(filePath, content, "utf-8");
        } else {
          throw error; // Solo lanzar si no es un error de archivo inexistente
        }
      }

      return {
        tienda: store,
        location: data.locations.edges,
        productos: finalProducts,
        ordenes: data.orders.edges,
        logs: content,
        error: null,
      };
    });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Loader error:", error);
    return new Response(
      JSON.stringify({
        tienda: null,
        location: [],
        productos: [],
        ordenes: [],
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
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

  const { tienda, productos, ordenes, logs, error} = useLoaderData();
  const [pestanaActiva, setPestanaActiva] = useState('Settings');

  console.log(tienda);


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
    Logs: (
      <ComponentLogs tienda={tienda} logs={logs} />
    ),
  };


  return (

    <div>
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
            <li>
              <button
                onClick={() => setPestanaActiva('Logs')}
                className={`py-3 ${
                  pestanaActiva === 'Logs'
                    ? 'text-indigo-700 border-b-2 border-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Logs
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
    </div>
  );
};

export default AdditionalPage;