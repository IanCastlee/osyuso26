import React from "react";

function SelectField({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  error,
  disabled = false,
}) {
  return (
    <div className="flex flex-col w-full gap-1">
      {label && (
        <label className="text-sm font-medium text-primary">{label}</label>
      )}

      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full border p-2 rounded-md text-sm mt-1 bg-white outline-none transition
        ${error ? "border-red-400" : "border-gray-200 focus:border-secondary"}`}
      >
        <option value="">{placeholder}</option>

        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export default SelectField;
