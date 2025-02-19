import { useState, useEffect } from 'react';

const ComponentAjustesProduct = ({ tienda }) => {
  const [peso, setPeso] = useState('');
  const [largo, setLargo] = useState('');
  const [alto, setAlto] = useState('');
  const [ancho, setAncho] = useState('');
  const [tiempoPreparacion, setTiempoPreparacion] = useState('');

  useEffect(() => {
    if (tienda && tienda.ajustesProductos) {
      const ajustes = tienda.ajustesProductos;

      setPeso(ajustes.peso || '');
      setLargo(ajustes.largo || '');
      setAlto(ajustes.alto || '');
      setAncho(ajustes.ancho || '');
      setTiempoPreparacion(ajustes.tiempoPreparacion || '');
    }
  }, [tienda]);

  const handleSubmit = async () => {
    const data = {
      tiendaId: tienda.id,  // El ID de la tienda se pasa desde las props
      peso: parseFloat(peso),
      largo: parseFloat(largo),
      alto: parseFloat(alto),
      ancho: parseFloat(ancho),
      tiempoPreparacion: parseInt(tiempoPreparacion, 10),
    };

    try {
      const response = await fetch('/api/ajustesProduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Ajustes guardados correctamente:', result.ajustesProducto);
        alert('Ajustes guardados correctamente');
      } else {
        console.log('Error al guardar ajustes:', result.error);
      }
    } catch (error) {
      console.error('Error de red:', error);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3 mt-5">
      <div className="col-span-1">
        <h1 className="font-bold text-md text-gray-900 mb-4">
          Default product settings
        </h1>
      </div>

      <div className="col-span-3">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Default weight
              </label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Default Length
              </label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={largo}
                onChange={(e) => setLargo(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Default High
              </label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={alto}
                onChange={(e) => setAlto(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Default Width
              </label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={ancho}
                onChange={(e) => setAncho(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Default preparation time
              </label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={tiempoPreparacion}
                onChange={(e) => setTiempoPreparacion(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSubmit} className="bg-blue-500 p-2 text-white rounded">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentAjustesProduct;
