import React, { useState, useRef } from 'react';
import { LoadScript, Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';

const ComponentSucursales = ({ tienda: initialTienda, onSaveSucursal }) => {
    // Changed to maintain local state of tienda
    const [tienda, setTienda] = useState(initialTienda);
    const [selectedSucursal, setSelectedSucursal] = useState(null);
    const [isNewSucursalModalOpen, setIsNewSucursalModalOpen] = useState(false);
    
    const [newSucursal, setNewSucursal] = useState({
        direccion: '',
        latitud: null,
        longitud: null,
        ciudad: '',
        estado: '',
        codigoPostal: '',
        pais: '',
        telefono: '',
        email: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const sucursalesPerPage = 3;

    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);

    // Cálculo de paginación
    const indexOfLastSucursal = currentPage * sucursalesPerPage;
    const indexOfFirstSucursal = indexOfLastSucursal - sucursalesPerPage;
    const currentSucursales = tienda.sucursales.slice(indexOfFirstSucursal, indexOfLastSucursal);
    const totalPages = Math.ceil(tienda.sucursales.length / sucursalesPerPage);

    // Método para establecer sucursal principal
    const handleDelete = async (sucursal) => {
        try {
            const response = await fetch("/api/deleteSucursal", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ sucursalId: sucursal.id }),
            });
    
            const result = await response.json();
            if (result.success) {
                // Actualizar el estado eliminando la sucursal de la tienda
                setTienda(prev => ({
                    ...prev,
                    sucursales: prev.sucursales.filter(s => s.id !== sucursal.id)
                }));
    
                alert("Sucursal eliminada con éxito");
            } else {
                alert("Error al eliminar la sucursal: " + result.error);
            }
        } catch (error) {
            alert("Error en la solicitud: " + error.message);
        }
    };

    // Manejo de cambios en la dirección desde Autocomplete
    const handlePlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry) {
                setNewSucursal(prev => ({
                    ...prev,
                    direccion: place.formatted_address || '',
                    latitud: place.geometry.location.lat(),
                    longitud: place.geometry.location.lng(),
                    ciudad: place.address_components.find(component => 
                        component.types.includes('locality'))?.long_name || '',
                    estado: place.address_components.find(component => 
                        component.types.includes('administrative_area_level_1'))?.long_name || '',
                    codigoPostal: place.address_components.find(component => 
                        component.types.includes('postal_code'))?.long_name || '',
                    pais: place.address_components.find(component => 
                        component.types.includes('country'))?.long_name || ''
                }));
            }
        }
    };

    // Guardar nueva sucursal
    const handleSaveSucursal = async() => {
        // Validaciones básicas
        if (!newSucursal.direccion || !newSucursal.telefono || !newSucursal.email || !newSucursal.codigoPostal) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        try {
            const response = await fetch("/api/sucursal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tiendaId: tienda.id,
                    sucursal: {
                        ...newSucursal
                    }
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Add the new sucursal to the local state
                const newSucursalWithId = {
                    ...newSucursal,
                    id: data.sucursal.id, // Assuming the API returns the new sucursal with an ID
                };

                setTienda(prev => ({
                    ...prev,
                    sucursales: [...prev.sucursales, newSucursalWithId]
                }));

                alert('Sucursal agregada exitosamente');
                
                // Cerrar modal y resetear formulario
                setIsNewSucursalModalOpen(false);
                setNewSucursal({
                    direccion: '',
                    latitud: null,
                    longitud: null,
                    ciudad: '',
                    estado: '',
                    codigoPostal: '',
                    pais: '',
                    telefono: '',
                    email:''
                });
            } else {
                alert("Error al guardar sucursal: " + data.error);
            }
        } catch (error) {
            alert("Error al realizar la solicitud: " + error.message);
        }
    };

    // Cambiar de página
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Rest of the component remains the same...
    return (
        <div className="grid grid-cols-4 gap-3">
            <div className="col-span-4">
                <div className="flex justify-end mb-4">
                    <button 
                        onClick={() => setIsNewSucursalModalOpen(true)}
                        className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        new store
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentSucursales.map((sucursal) => (
                                <tr key={sucursal.id}>
                                    <td className="px-6 py-4">{sucursal.direccion}</td>
                                    <td className="px-6 py-4">{sucursal.ciudad}</td>
                                    <td className="px-6 py-4">{sucursal.telefono}</td>
                                    <td className="px-6 py-4">{sucursal.email}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleDelete(sucursal)} className="mt-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700">
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Paginación */}
                    <div className="flex justify-center mt-4">
                        {[...Array(totalPages)].map((_, index) => (
                            <button 
                                key={index} 
                                onClick={() => paginate(index + 1)}
                                className={`mx-1 px-3 py-1 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Modal Nueva Sucursal */}
            {isNewSucursalModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-5 mx-auto p-5 border w-2/5 shadow-lg rounded-md bg-white">
                        <div className="grid mt-5">
                            <div className="col-span-3 space-y-6">
                                {/* Google Maps */}
                                <GoogleMap
                                    id="map"
                                    mapContainerStyle={{ width: '100%', height: '300px' }}
                                    center={{ 
                                        lat: newSucursal.latitud || 19.4326, 
                                        lng: newSucursal.longitud || -99.1332 
                                    }}
                                    zoom={12}
                                    onLoad={(map) => (mapRef.current = map)}
                                >
                                    {newSucursal.latitud && newSucursal.longitud && (
                                        <Marker 
                                            position={{ 
                                                lat: newSucursal.latitud, 
                                                lng: newSucursal.longitud 
                                            }} 
                                        />
                                    )}
                                </GoogleMap>

                                {/* Campos de Entrada */}
                                <Autocomplete
                                    onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                                    onPlaceChanged={handlePlaceChanged}
                                >
                                    <input
                                        type="text"
                                        value={newSucursal.direccion}
                                        onChange={(e) => setNewSucursal(prev => ({...prev, direccion: e.target.value}))}
                                        placeholder="Address"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                                    />
                                </Autocomplete>

                                {/* Campos adicionales con dos columnas */}
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={newSucursal.latitud}
                                        onChange={(e) => setNewSucursal(prev => ({...prev, latitud: e.target.value}))}
                                        placeholder="latitude"
                                        className="border border-gray-300 rounded-md py-2 px-3"
                                    />
                                    <input
                                        type="text"
                                        value={newSucursal.longitud}
                                        onChange={(e) => setNewSucursal(prev => ({...prev, longitud: e.target.value}))}
                                        placeholder="longitude"
                                        className="border border-gray-300 rounded-md py-2 px-3"
                                    />

                                    <input
                                        type="text"
                                        value={newSucursal.ciudad}
                                        onChange={(e) => setNewSucursal(prev => ({...prev, ciudad: e.target.value}))}
                                        placeholder="City"
                                        className="border border-gray-300 rounded-md py-2 px-3"
                                    />
                                    <input
                                        type="text"
                                        value={newSucursal.estado}
                                        onChange={(e) => setNewSucursal(prev => ({...prev, estado: e.target.value}))}
                                        placeholder="State"
                                        className="border border-gray-300 rounded-md py-2 px-3"
                                    />
                                    <input
                                        type="text"
                                        value={newSucursal.pais}
                                        onChange={(e) => setNewSucursal(prev => ({...prev, pais: e.target.value}))}
                                        placeholder="Country"
                                        className="border border-gray-300 rounded-md py-2 px-3"
                                    />
                                    <input
                                        type="text"
                                        value={newSucursal.telefono}
                                        onChange={(e) => setNewSucursal(prev => ({...prev, telefono: e.target.value}))}
                                        placeholder="Phone"
                                        className="border border-gray-300 rounded-md py-2 px-3"
                                    />

                                    <input
                                        type="text"
                                        value={newSucursal.email}
                                        onChange={(e) => setNewSucursal(prev => ({...prev, email: e.target.value}))}
                                        placeholder="Email"
                                        className="border border-gray-300 rounded-md py-2 px-3"
                                    />
                                    <input
                                        type="text"
                                        value={newSucursal.codigoPostal}
                                        onChange={(e) => setNewSucursal(prev => ({...prev, codigoPostal: e.target.value}))}
                                        placeholder="Zip Code"
                                        className="border border-gray-300 rounded-md py-2 px-3"
                                    />
                                </div>

                                {/* Botones de Acción */}
                                <div className="mt-6 flex justify-between">
                                    <button 
                                        onClick={() => setIsNewSucursalModalOpen(false)}
                                        className="bg-gray-500 p-2 text-white rounded mr-2"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveSucursal}
                                        className="bg-blue-500 p-2 text-white rounded"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComponentSucursales;