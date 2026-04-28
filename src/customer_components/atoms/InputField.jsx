import React from "react";

function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
  name,
}) {
  return (
    <div className="flex flex-col w-full gap-1">
      {/* LABEL */}
      {label && (
        <label className="text-sm font-medium text-primary">{label}</label>
      )}

      {/* INPUT WRAPPER */}
      <div
        className={`flex items-center gap-2 border rounded-md px-3 py-2 bg-white transition
        ${
          error
            ? "border-red-400 focus-within:ring-2 focus-within:ring-red-200"
            : "border-gray-200 focus-within:ring-2 focus-within:ring-secondary/30 focus-within:border-secondary"
        }`}
      >
        {/* ICON */}
        {Icon && <Icon className="text-gray-400 text-lg" />}

        {/* INPUT */}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full outline-none text-sm text-primary bg-transparent"
        />
      </div>

      {/* ERROR MESSAGE */}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export default InputField;
