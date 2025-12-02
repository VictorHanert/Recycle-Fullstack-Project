import { useState } from 'react';
import Pagination from '../../shared/Pagination';
import { InlineLoader } from '../../shared/LoadingSpinners';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function ProductsTable({
  products,
  onEdit,
  onDelete,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  sortField,
  sortDirection,
  onSortChange
}) {
  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newDirection);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('title')}
                    >
                      Product <SortIcon field="title" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      User
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('price_amount')}
                    >
                      Price <SortIcon field="price_amount" />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px] cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('condition')}
                    >
                      Location & Condition <SortIcon field="condition" />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      Status <SortIcon field="status" />
                    </th>
                    <th
                      className="flex px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[110px] cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      Created <SortIcon field="created_at" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 min-w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        <InlineLoader message="Loading products..." />
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className='hover:bg-gray-50'>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.title?.substring(0, 20)}{product.title?.length > 20 ? '...' : ''}</div>
                            <div className="text-sm text-gray-500">{product.description?.substring(0, 30)}{product.description?.length > 30 ? '...' : ''}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.seller?.username || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{product.seller?.email || ''}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.price_amount} {product.price_currency}
                          </div>
                          <div className="text-sm text-gray-500">Qty: {product.quantity}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.location?.city || 'Unknown'}</div>
                          <div className="text-sm text-gray-500 capitalize">{product.condition}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : product.status === 'sold'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {new Date(product.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium sticky right-0 bg-white">
                          <button
                            onClick={() => onEdit(product)}
                            className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center gap-1"
                          >
                            <EditIcon fontSize="small" />
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(product.id)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                          >
                            <DeleteIcon fontSize="small" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

      {/* Pagination */}
      <Pagination
        productsData={{ total_pages: totalPages }}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
    </div>
  );
}

export default ProductsTable;