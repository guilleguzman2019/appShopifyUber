import { useState, useEffect, useMemo } from "react";

import { useActionData } from "@remix-run/react";

const ComponentAjustesEmail = ({ tienda }) => {

  console.log(tienda);

  const actionData = useActionData();

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const manejarGuardado = async () => {

    try {
      const response = await fetch("/api/ajustesEmails", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiendaId: tienda.id,
          user: user || "defaultUser",
          pass: pass || "defaultPass",
        }),
      });
  
      const data = await response.json();
  
      if (data.success) {
        console.log("Ajustes guardados:", data.ajustes);
        alert('datos Guardados')
      } else {
        console.error("Error al guardar ajustes:", data.error);
      }
    } catch (error) {
      console.error("Error al realizar la solicitud:", error.message);
    }

  };

  useEffect(() => {
        if (tienda && tienda.ajustesEmail) {

          setUser(tienda.ajustesEmail.user || "");
          setPass(tienda.ajustesEmail.pass || "");
        }
      }, [tienda]);

  

  return (
    <div className="grid grid-cols-4 gap-3 mt-5">
      <div className="col-span-1">
        <h1 className="font-bold text-md text-gray-900 mb-4">Email Sending Settings</h1>
      </div>

      <div className="col-span-3">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow px-9 py-5">

            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  User
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
            </div>

            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                />
            </div>
            
          </div>

          {/* Botón de guardar */}
          <div className="mt-6 flex justify-end">
            <button onClick={manejarGuardado} className="bg-blue-500 p-2 text-white rounded">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentAjustesEmail;
