import nodataImage from "../assets/icons/nodata.png";

function NoData({
  text = "No data found",
  subText = "There’s nothing to display right now.",
  imageHeight = "h-32",
}) {
  return (
    <div
      className="
        w-full
        flex flex-col
        items-center
        justify-center
        py-10 sm:py-16
        px-4
        text-center
      "
    >
      {/* IMAGE */}
      <img
        src={nodataImage}
        alt="No Data"
        className={`${imageHeight} object-contain opacity-90 h-[62px] w-[62px]`}
      />

      {/* TITLE */}
      <h2
        className="
          mt-4
          text-sm sm:text-lg
          font-semibold
          text-gray-500
        "
      >
        {text}
      </h2>

      {/* SUBTEXT */}
      <p
        className="
          mt-1
          text-[11px] sm:text-sm
          text-gray-500
          max-w-md
        "
      >
        {subText}
      </p>
    </div>
  );
}

export default NoData;
