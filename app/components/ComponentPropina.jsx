import React, { useState, useEffect } from 'react';

const ComponentPropina = ({ tienda }) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isTipEnabled, setIsTipEnabled] = useState(false);

  // Asegurarse de que los valores de 'tienda.propina' se configuren correctamente
  useEffect(() => {
    if (tienda && tienda.propina) {
      // Establecer valores si propina tiene valores
      setSelectedOption(tienda.propina.tipo || '');
      setInputValue(tienda.propina.valor || '');
      setIsTipEnabled(tienda.propina.habilitada || false);
    }
  }, [tienda]); // Depender solo de 'tienda'

  const handleOptionChange = (value) => {
    setSelectedOption(value);
    setInputValue(''); // Resetea el input al cambiar la opción
  };

  const renderInputField = () => {
    if (
      selectedOption === '3' || // based on a fixed price
      selectedOption === '4' || // free after an amount
      selectedOption === '5'    // by percentage
    ) {
      let placeholderText = '';

      switch (selectedOption) {
        case '3':
          placeholderText = 'Enter the fixed price';
          break;
        case '4':
          placeholderText = 'Enter the minimum amount to be free';
          break;
        case '5':
          placeholderText = 'Enter the percentage';
          break;
        default:
          break;
      }

      return (
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {placeholderText}
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      );
    }
    return null;
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/propina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiendaId: tienda.id,
          selectedOption,
          inputValue,
          isTipEnabled
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("propina guardada:", data.ajustes);
        alert('Datos guardados');
      } else {
        console.error("Error al guardar propina:", data.error);
      }
    } catch (error) {
      console.error("Error al realizar la solicitud:", error.message);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3 mt-5">
      <div className="col-span-1">
        <h1 className="font-bold text-md text-gray-900 mb-4">Tip</h1>
      </div>

      <div className="col-span-3">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-700 mb-4">
                Cost of tip:
              </label>
              <div className="flex flex-col space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tipOption"
                    value="1"
                    checked={selectedOption === '1'}
                    onChange={(e) => handleOptionChange(e.target.value)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Free</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tipOption"
                    value="2"
                    checked={selectedOption === '2'}
                    onChange={(e) => handleOptionChange(e.target.value)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Cost calculated by Uber</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tipOption"
                    value="3"
                    checked={selectedOption === '3'}
                    onChange={(e) => handleOptionChange(e.target.value)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Based on a fixed price</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tipOption"
                    value="4"
                    checked={selectedOption === '4'}
                    onChange={(e) => handleOptionChange(e.target.value)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Free after an amount</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tipOption"
                    value="5"
                    checked={selectedOption === '5'}
                    onChange={(e) => handleOptionChange(e.target.value)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">By percentage</span>
                </label>
              </div>
            </div>

            {renderInputField()}

            <div className="mb-5 mt-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  checked={isTipEnabled}
                  onChange={(e) => setIsTipEnabled(e.target.checked)}
                />
                <span className="ml-2 text-xs text-gray-700">Enable Tipping</span>
              </div>
            </div>

          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} className="bg-blue-500 p-2 text-white rounded">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentPropina;
