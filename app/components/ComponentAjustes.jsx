import React, { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Page,
  Text,
  BlockStack,
  InlineGrid,
  TextField,
Button,
} from "@shopify/polaris";

import { useActionData } from "@remix-run/react";

import { useLoaderData, Form } from "@remix-run/react";

import HorariosForm from './ComponentAjustesHorarios';

import ComponentPropina from './ComponentPropina';
import ComponentPickupDrop from './ComponentPickupDrop';
import ComponentAjustesProduct from './ComponentAjustesProduct';
import ComponentAjustesEmail from './ComponentAjustesEmail';


const ComponentAjustes = ({tienda}) => {

    const actionData = useActionData();

    const [modo, setModo] = useState("");
    const [habilitado, setHabilitado] = useState(false);
    const [clave, setClave] = useState("");
    const [secreto, setSecreto] = useState("");
    const [customer, setCustomer] = useState("");
    const [titulo, setTitulo] = useState("");
    const [montoMin, setMontoMin] = useState(0);


    const manejarGuardado = async () => {

        try {
          const response = await fetch("/api/ajustes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tiendaId: tienda.id,
              apiKey: clave || "defaultApiKey",
              secretKey: secreto || "defaultSecretKey",
              modo: modo || "Pruebas",
              titulo: titulo || "Uber Delivery",
              idioma: "es",
              customer: customer,
              montoMin: parseInt(montoMin, 10) || 0,
              habilitado: habilitado || false
            }),
          });
      
          const data = await response.json();
      
          if (data.success) {
            console.log("Ajustes guardados:", data.ajustes, data.carrier);
            alert('datos Guardados')
          } else {
            console.error("Error al guardar ajustes:", data.error);
          }
        } catch (error) {
          console.error("Error al realizar la solicitud:", error.message);
        }
    
    };

    const manejarCambioRadio = (evento) => {
      setModo(evento.target.value);
    };

    const manejarCambioEnable = (e) => {
      setHabilitado(e.target.checked); // Actualiza el estado según el valor del checkbox
    };

    console.log(tienda);

    useEffect(() => {
      if (tienda && tienda.ajustes) {
        setClave(tienda.ajustes.apiKey || "");
        setSecreto(tienda.ajustes.secretKey || "");
        setCustomer(tienda.ajustes.customer || "");
        setModo(tienda.ajustes.modo || "Pruebas");
        setTitulo(tienda.ajustes.titulo || "Uber Delivery");
        setHabilitado(tienda.ajustes.habilitado || false);
        setMontoMin(tienda.ajustes.montoMin || 0);
      }
    }, [tienda]);

    useEffect(() => {
      if (actionData?.mensaje) {
        alert(actionData.mensaje);
      }
    }, [actionData]);

  return (
    <div>

      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1">
          <h1 className="font-bold text-md text-gray-900 mb-4">Basic settings</h1>
        </div>
        
        <div className="col-span-3">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">

              <div className="mb-5">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    checked={habilitado} // Usa el estado como valor
                    onChange={manejarCambioEnable}
                  />
                  <span className="ml-2 text-xs text-gray-700">Enable Uber Direct</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Choose your language
                </label>
                <select className="mt-1 block w-full pl-3 pr-10 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md">
                  <option>Spanish</option>
                  <option>English</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Server
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="servidor"
                      className="form-radio text-indigo-600"
                      value="Produccion"
                      checked={modo === "Produccion"}
                      onChange={manejarCambioRadio}
                    />
                    <span className="ml-2">Production</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="servidor"
                      className="form-radio text-indigo-600"
                      value="Pruebas"
                      checked={modo === "Pruebas"}
                      onChange={manejarCambioRadio}
                    />
                    <span className="ml-2">Test</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  API Secret
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={secreto}
                  onChange={(e) => setSecreto(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Customer id
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Minimum Amount
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={montoMin}
                  onChange={(e) => setMontoMin(e.target.value)}
                />
              </div>

            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={manejarGuardado} className="bg-blue-500 p-2 text-white rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <HorariosForm tienda={tienda}/>

      <ComponentPropina tienda={tienda}/>

      <ComponentPickupDrop tienda={tienda}/>

      <ComponentAjustesProduct  tienda={tienda}/>

      <ComponentAjustesEmail  tienda={tienda}/>

    </div>
  );
};

export default ComponentAjustes;