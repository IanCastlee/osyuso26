import nodataImage from "../assets/icons/nodata.png";

function NoData({
  text = "No data found",
  subText = "There’s nothing to display right now.",
  imageSize = "h-20 w-20",
  className = "",
}) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center px-4 py-12 text-center sm:py-16 ${className}`}
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
        <img
          src={nodataImage}
          alt="No Data"
          className={`${imageSize} object-contain opacity-90`}
        />
      </div>

      <h2 className="mt-5 text-sm font-semibold text-gray-700 sm:text-lg">
        {text}
      </h2>

      <p className="mt-1 max-w-md text-xs leading-6 text-gray-500 sm:text-sm">
        {subText}
      </p>
    </div>
  );
}

export default NoData;
