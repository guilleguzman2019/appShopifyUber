import React, { useState, useEffect } from 'react';

const ComponentPickupDrop = ({ tienda }) => {

  const translations = {
    firma: 'Signature',
    nombreFirma: 'Name of Signature',
    relacionFirma: 'Relation of Signature',
    foto: 'Photo',
    pincode: 'Pincode',
    edadMinima: 'Minimum Age'
  };

  // Estado para checkboxes y inputs
  const [pickupSteps, setPickupSteps] = useState({
    firma: false,
    nombreFirma: false,
    relacionFirma: false,
    foto: false,
  });
  
  const [dropSteps, setDropSteps] = useState({
    firma: false,
    nombreFirma: false,
    relacionFirma: false,
    foto: false,
    edadMinima: '',
    pincode: false
  });

  console.log(tienda);

  useEffect(() => {
    // Verifica si 'tienda' y 'tienda.ajustesPickupDrop' están definidos
    if (tienda && tienda.ajustesPickupDrop) {
      setPickupSteps({
        firma: tienda.ajustesPickupDrop.firmaPickup || false,
        nombreFirma: tienda.ajustesPickupDrop.nombreFirmaPickup || false,
        relacionFirma: tienda.ajustesPickupDrop.relacionFirmaPickup || false,
        foto: tienda.ajustesPickupDrop.fotoPickup || false,
      });
  
      setDropSteps({
        firma: tienda.ajustesPickupDrop.firmaDrop || false,
        nombreFirma: tienda.ajustesPickupDrop.nombreFirmaDrop || false,
        relacionFirma: tienda.ajustesPickupDrop.relacionFirmaDrop || false,
        foto: tienda.ajustesPickupDrop.fotoDrop || false,
        edadMinima: tienda.ajustesPickupDrop.edadMinimaDrop || '',
        pincode: tienda.ajustesPickupDrop.pincodeDrop || false,
      });
    }
  }, [tienda]);

  // Manejar el cambio de los checkboxes
  const handleCheckboxChange = (section, name) => {
    if (section === 'pickup') {
      setPickupSteps(prevState => ({
        ...prevState,
        [name]: !prevState[name]
      }));
    } else if (section === 'drop') {
      setDropSteps(prevState => ({
        ...prevState,
        [name]: !prevState[name]
      }));
    }
  };

  // Manejar el cambio de los campos de texto
  const handleInputChange = (section, name, value) => {
    if (section === 'pickup') {
      setPickupSteps(prevState => ({
        ...prevState,
        [name]: value
      }));
    } else if (section === 'drop') {
      setDropSteps(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  // Guardar los datos
  const handleSave = async () => {
    const data = {
      tiendaId: tienda.id,
      pickup: pickupSteps,
      drop: dropSteps
    };

    console.log(data);

    try {
      const response = await fetch('/api/ajustesPickupDrop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        alert('Datos guardados correctamente');
      } else {
        alert('Error al guardar los datos');
      }
    } catch (error) {
      console.error('Error al guardar los datos:', error);
      alert('Error al guardar los datos');
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3 mt-5">
      <div className="col-span-1">
        <h1 className="font-bold text-md text-gray-900 mb-4">Uber Verification Steps</h1>
      </div>

      <div className="col-span-3">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Pickup */}
            <div className="mb-4">
              <label className="block text-base font-medium text-gray-700 mb-1">Pickup</label>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Verification steps that must be performed before collection can be completed.
              </label>
            </div>

            {['firma', 'nombreFirma', 'relacionFirma', 'foto'].map((field, index) => (
              <div className="mb-5" key={index}>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    checked={pickupSteps[field]}
                    onChange={() => handleCheckboxChange('pickup', field)}
                  />
                  <span className="ml-2 text-xs text-gray-700">{translations[field] || field.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                </div>
              </div>
            ))}

            {/* Drop */}
            <div className="mb-7">
              <label className="block text-base font-medium text-gray-700 mb-1">Dropoff</label>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Verification steps that must be performed before delivery can be completed.
              </label>
            </div>

            {['firma', 'nombreFirma', 'relacionFirma', 'foto', 'pincode'].map((field, index) => (
              <div className="mb-5" key={index}>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    checked={dropSteps[field]}
                    onChange={() => handleCheckboxChange('drop', field)}
                  />
                  <span className="ml-2 text-xs text-gray-700">{translations[field] || field.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                </div>
              </div>
            ))}

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Minimum age</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={dropSteps.edadMinima}
                onChange={(e) => handleInputChange('drop', 'edadMinima', e.target.value)}
              />
            </div>

          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} className="bg-blue-500 p-2 text-white rounded">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentPickupDrop;
