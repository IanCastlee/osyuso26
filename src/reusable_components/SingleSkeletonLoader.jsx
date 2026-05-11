function SingleSkeletonLoader() {
  return (
    <div
      className="
        w-full
        flex flex-col lg:flex-row
        gap-4 lg:gap-6
        animate-pulse
      "
    >
      {/* IMAGE SKELETON */}
      <div
        className="
          w-full lg:w-[40%]
          h-[230px] sm:h-[320px]
          bg-gray-200
        "
      />

      {/* DETAILS SKELETON */}
      <div className="flex-1 flex flex-col gap-3">
        {/* TITLE */}
        <div className="h-5 sm:h-7 w-[80%] bg-gray-200" />

        {/* PRICE */}
        <div className="h-8 sm:h-10 w-[140px] bg-gray-200" />

        {/* DESCRIPTION */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="h-3 w-full bg-gray-200" />
          <div className="h-3 w-[95%] bg-gray-200" />
          <div className="h-3 w-[70%] bg-gray-200" />
        </div>

        {/* STOCK */}
        <div className="h-4 w-[100px] bg-gray-200 mt-2" />

        {/* WEIGHT SELECTOR */}
        <div className="flex items-center gap-3 mt-3">
          <div className="h-4 w-[60px] bg-gray-200" />

          <div className="h-9 w-[140px] bg-gray-200" />
        </div>

        {/* TOTAL */}
        <div className="h-5 w-[150px] bg-gray-200 mt-2" />

        {/* BUTTONS */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 mt-5">
          <div className="h-[38px] flex-1 bg-gray-200" />

          <div className="h-[38px] flex-1 bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export default SingleSkeletonLoader;
