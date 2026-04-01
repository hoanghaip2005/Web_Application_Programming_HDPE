import { Search } from "lucide-react";

function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Tìm kiếm",
  buttonLabel = "Tìm",
  disabled = false
}) {
  return (
    <form
      className="search-input"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <div className="search-input__field">
        <Search className="search-input__icon" aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>

      <button type="submit" className="primary-button search-input__action" disabled={disabled}>
        {buttonLabel}
      </button>
    </form>
  );
}

export default SearchInput;
