import { useState, useEffect, useMemo } from "react";

const HorariosForm = ({ tienda }) => {

  const horariosdb = useMemo(() => JSON.parse(tienda.horarios), [tienda.horarios]);

  // Estado inicial de los horarios, priorizando los horarios que vienen de la base de datos
  const [horarios, setHorarios] = useState(
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dia => ({
      dia,
      apertura: '',
      cierre: ''
    }))
  );

  // Efecto para actualizar los valores si horariosdb está disponible
  useEffect(() => {
    if (horariosdb && horariosdb.length > 0) {
      const nuevosHorarios = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dia => {
        const horarioExistente = horariosdb.find(h => h.dia === dia);
        return {
          dia,
          apertura: horarioExistente ? horarioExistente.apertura : '',
          cierre: horarioExistente ? horarioExistente.cierre : ''
        };
      });
      setHorarios(nuevosHorarios);
    }
  }, [horariosdb]);

  const handleChange = (index, field, value) => {
    const newHorarios = [...horarios];
    newHorarios[index][field] = value;
    setHorarios(newHorarios);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(tienda.id);

    try {
      const response = await fetch("/api/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idTienda: tienda.id, // Asegúrate de que tienda.id esté presente
          horarios: horarios,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("horarios guardados");
        alert('Horarios Guardados');
      } else {
        console.error("Error al guardar los horarios:", data.error);
      }
    } catch (error) {
      console.error("Error al realizar la solicitud:", error.message);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3 mt-5">
      <div className="col-span-1">
        <h1 className="font-bold text-md text-gray-900 mb-4">Opening Hours</h1>
      </div>

      <div className="col-span-3">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow px-9 py-5">
            {/* Día de la semana y horas de apertura/cierre */}
            <div className="grid grid-cols-1 gap-2 mb-6">
              {horarios.map((horario, index) => (
                <div key={horario.dia} className="flex items-center">
                  <label className="block text-xs font-medium text-gray-700 w-40">{horario.dia}</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="block w-30 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={horario.apertura}
                      onChange={(e) => handleChange(index, 'apertura', e.target.value)}
                      placeholder="08:00"
                    />
                    <span className="mt-2">:</span>
                    <input
                      type="text"
                      className="block w-30 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={horario.cierre}
                      onChange={(e) => handleChange(index, 'cierre', e.target.value)}
                      placeholder="21:00"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botón de guardar */}
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

export default HorariosForm;
