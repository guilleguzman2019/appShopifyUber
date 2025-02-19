// app/routes/products.metafields.jsx

import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { authenticate } from "../shopify.server";

// Loader para obtener productos
export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  // Obtener todos los productos con sus metafields
  const response = await admin.graphql(
    `#graphql
    query getProducts {
      products(first: 50) {
        edges {
          node {
            id
            title
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
    }`
  );

  const { data } = await response.json();
  return json({ products: data.products.edges });
}

// Acción para procesar la actualización de los metafields
export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const products = JSON.parse(formData.get("products"));
  const namespace = formData.get("namespace");
  const key = formData.get("key");
  const type = formData.get("type");

  try {
    // Crear metafields para todos los productos seleccionados
    const mutations = products.map(async (product) => {
      return admin.graphql(
        `#graphql
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
              value
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            metafields: [
              {
                namespace,
                key,
                value: product.value || "",
                type,
                ownerId: product.id
              }
            ]
          }
        }
      );
    });

    await Promise.all(mutations);
    return json({ success: true });
  } catch (error) {
    return json({ errors: [{ message: error.message }] }, { status: 500 });
  }
}

// Componente principal para la UI
export default function ProductMetafields() {
  const { products } = useLoaderData();
  const submit = useSubmit();
  const [namespace, setNamespace] = useState("");
  const [key, setKey] = useState("");
  const [type, setType] = useState("single_line_text_field");
  const [productValues, setProductValues] = useState({});

  // Maneja el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const productsData = products.map(({ node }) => ({
      id: node.id,
      value: productValues[node.id] || ""
    }));

    const formData = new FormData();
    formData.append("products", JSON.stringify(productsData));  // Se mantiene el JSON.stringify
    formData.append("namespace", namespace);
    formData.append("key", key);
    formData.append("type", type);

    submit(formData, { method: "POST" });
  };

  // Maneja el cambio de valor del producto
  const handleValueChange = (productId, value) => {
    setProductValues(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestionar Metafields de Productos</h1>

      <div className="mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Namespace
                <input
                  type="text"
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Key
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="single_line_text_field">Text</option>
                  <option value="number_integer">Integer</option>
                  <option value="number_decimal">Decimal</option>
                  <option value="json">JSON</option>
                  <option value="boolean">Boolean</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Productos</h2>
            <div className="space-y-4">
              {products.map(({ node: product }) => (
                <div key={product.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{product.title}</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Metafields actuales:</p>
                      {product.metafields.edges.map(({ node: metafield }) => (
                        <p key={metafield.id} className="text-sm">
                          {metafield.namespace}.{metafield.key}: {metafield.value}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="w-1/3">
                    <input
                      type="text"
                      value={productValues[product.id] || ""}
                      onChange={(e) => handleValueChange(product.id, e.target.value)}
                      placeholder="Valor del metafield"
                      className="block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Actualizar Metafields
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
