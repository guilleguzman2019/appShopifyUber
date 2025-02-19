import React, { useState, useEffect } from 'react';

const ComponentProducts = ({productos: initialProductos, tienda}) => {
    const [productos, setProductos] = useState(initialProductos);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 3;

    const [newTime, setNewTime] = useState('');
    const [length, setLength] = useState('');
    const [heigth, setHeigth] = useState('');
    const [deepth, setDeepth] = useState('');

    // Get current products
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = productos.slice(indexOfFirstProduct, indexOfLastProduct);

    // Calculate total pages
    const totalPages = Math.ceil(productos.length / productsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setNewTime(product.preparationTime || '');
        setLength(product.length || '');
        setHeigth(product.height || '');
        setDeepth(product.depth || '');
        setIsModalOpen(true);
    };

    const handleChangeTime = async () => {
        if (!newTime) {
            alert("Por favor, ingrese un tiempo de preparación");
            return;
        }

        try {
            const response = await fetch("/api/changeTime", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tiendaId: tienda.id,
                    preparationTime: parseInt(newTime),
                    productoId: selectedProduct.id,
                    length: parseInt(length),
                    heigth: parseInt(heigth),
                    deepth: parseInt(deepth)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al actualizar");
            }

            const data = await response.json();
            
            // Update the product in the local state with all modified values
            const updatedProducts = productos.map(product => 
                product.id === selectedProduct.id 
                    ? {
                        ...product,
                        preparationTime: parseInt(newTime),
                        length: parseInt(length),
                        height: parseInt(heigth),
                        depth: parseInt(deepth)
                    }
                    : product
            );
            
            setProductos(updatedProducts);
            setIsModalOpen(false);
            setNewTime('');
            setLength('');
            setHeigth('');
            setDeepth('');
            setSelectedProduct(null);
            alert("Producto actualizado correctamente");
        } catch (error) {
            console.error("Error:", error);
            alert(error.message || "Error al actualizar el producto");
        }
    };

    return (
        <div className="grid grid-cols-4 gap-3">
            <div className="col-span-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preparation time (min)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Length</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Height</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Width</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentProducts.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4">
                                        <img 
                                            src={product.image || ''}
                                            alt={product.title}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4">{product.title}</td>
                                    <td className="px-6 py-4">{product.preparationTime || ''}</td>
                                    <td className="px-6 py-4">{product.length || ''}</td>
                                    <td className="px-6 py-4">{product.height || ''}</td>
                                    <td className="px-6 py-4">{product.depth || ''}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>

                                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <h5 className="text-lg font-medium mb-4">
                                            Edit: {selectedProduct?.title}
                                        </h5>
                                        <label>Preparation Time</label>
                                        <input
                                            type="number"
                                            value={newTime}
                                            onChange={(e) => setNewTime(e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                                            min="1"
                                            placeholder="Ingrese el tiempo en minutos"
                                        />
                                        <label>Length</label>
                                        <input
                                            type="number"
                                            value={length}
                                            onChange={(e) => setLength(e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                                            min="1"
                                            placeholder="Ingrese el Largo"
                                        />
                                        <label>Height</label>
                                        <input
                                            type="number"
                                            value={heigth}
                                            onChange={(e) => setHeigth(e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                                            min="1"
                                            placeholder="Ingrese la Altura"
                                        />
                                        <label>Width</label>
                                        <input
                                            type="number"
                                            value={deepth}
                                            onChange={(e) => setDeepth(e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                                            min="1"
                                            placeholder="Ingrese el Ancho"
                                        />
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="button"
                                            onClick={handleChangeTime}
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Pagination */}
                <div className="flex justify-center mt-4 space-x-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
                            className={`px-3 py-1 rounded ${
                                currentPage === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                            }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComponentProducts;