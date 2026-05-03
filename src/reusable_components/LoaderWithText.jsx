import React from "react";

function LoaderWithText({
  text = "Loading...",
  size = "w-3 h-3",
  className = "",
  textClass = "text-xs text-white",
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`animate-spin border-2 border-white border-t-transparent rounded-full ${size}`}
      ></span>

      <span className={textClass}>{text}</span>
    </div>
  );
}

export default LoaderWithText;
