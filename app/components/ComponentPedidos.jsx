import React, { useState } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';

const ComponentPedidos = ({ ordenes, tienda }) => {
  const app = useAppBridge();

  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 6;

  // Guard against empty ordenes array
  if (!ordenes || !Array.isArray(ordenes)) {
    return <div className="p-6">No hay órdenes disponibles</div>;
  }

  // Filter paid orders
  const paidOrders = ordenes.filter(orden => 
    orden?.node?.displayFinancialStatus?.toLowerCase() === 'paid'
  );

  // Get current orders
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = paidOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Calculate total pages
  const totalPages = Math.ceil(paidOrders.length / ordersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleOpenNewWindow = (url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      console.log('No tracking URL available');
    }
  };

  const renderPagination = () => {
    // If there are more than 10 pages, we use a different pagination strategy
    if (totalPages > 10) {
      let pages = [];
      // Add the first page
      pages.push(1);
      
      // Add "..." if there is a gap between the first page and the current page
      if (currentPage > 4) {
        pages.push('...');
      }

      // Add the current page and nearby pages
      for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      // Add "..." if there is a gap between the last page and the current page
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }

      // Add the last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }

      // Generate the pagination buttons
      return pages.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-3 py-1">...</span>
          );
        }
        return (
          <button
            key={`page-${page}`}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {page}
          </button>
        );
      });
    } else {
      // If there are 10 or fewer pages, show all of them
      return [...Array(totalPages)].map((_, index) => (
        <button
          key={`page-${index + 1}`}
          onClick={() => handlePageChange(index + 1)}
          className={`px-3 py-1 rounded ${currentPage === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          {index + 1}
        </button>
      ));
    }
  };

  // If there are no paid orders, show a message
  if (paidOrders.length === 0) {
    return <div className="p-6 bg-white rounded-lg shadow">No hay órdenes pagadas disponibles</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="col-span-4">
        <div className="bg-white rounded-lg shadow p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Id</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Create</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentOrders.map((orden) => (
                <tr key={orden.node.id}>
                  <td className="px-6 py-4">{orden.node.name}</td>
                  <td className="px-6 py-4">{orden.node.totalPrice}</td>
                  <td className="px-6 py-4">
                    {new Date(orden.node.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4">{orden.node.displayFinancialStatus}</td>
                  <td className="px-6 py-4">
                    <button 
                      className='bg-blue-600 text-white p-3 rounded' 
                      onClick={() => handleOpenNewWindow(orden?.node?.metafields?.edges?.[0]?.node?.value)}
                      disabled={!orden?.node?.metafields?.edges?.[0]?.node?.value}
                    >
                      Tracking Uber 
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
              >
                Previous
              </button>
              {renderPagination()}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComponentPedidos;