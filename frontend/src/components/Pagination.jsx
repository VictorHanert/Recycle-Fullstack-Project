const Pagination = ({ productsData, currentPage, onPageChange }) => {
  if (!productsData || productsData.total_pages <= 1) {
    return null;
  }

  const { total_pages } = productsData;
  const page = currentPage;

  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(total_pages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < total_pages - 1) {
      rangeWithDots.push('...', total_pages);
    } else if (total_pages > 1) {
      rangeWithDots.push(total_pages);
    }

    return rangeWithDots;
  };

  return (
    <div className="flex justify-center mt-8 gap-2 flex-wrap">
      {/* Previous */}
      {page > 1 && (
        <button
          onClick={() => onPageChange(page - 1)}
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>
      )}

      {/* Page numbers */}
      {getVisiblePages().map((pageNumber, index) => (
        <button
          key={index}
          onClick={() => typeof pageNumber === 'number' && onPageChange(pageNumber)}
          disabled={pageNumber === '...'}
          className={`px-4 py-2 rounded transition-colors ${
            pageNumber === page
              ? "bg-blue-600 text-white"
              : pageNumber === '...'
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {pageNumber}
        </button>
      ))}

      {/* Next */}
      {page < total_pages && (
        <button
          onClick={() => onPageChange(page + 1)}
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
        >
          Next
        </button>
      )}
    </div>
  );
};

export default Pagination;
