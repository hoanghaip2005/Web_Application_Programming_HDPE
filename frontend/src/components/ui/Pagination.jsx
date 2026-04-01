function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="pagination" aria-label="Phân trang">
      <button
        type="button"
        className="secondary-button pagination__button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Trước
      </button>

      <div className="pagination__list">
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={`pagination__button ${pageNumber === page ? "is-active" : ""}`}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="secondary-button pagination__button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Sau
      </button>
    </nav>
  );
}

export default Pagination;
