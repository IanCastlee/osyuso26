function Loader({ size = 10, color = "blue-400", fullScreen = false }) {
  return (
    <div
      className={`flex justify-center items-center ${
        fullScreen ? "h-screen" : "py-10"
      }`}
    >
      <div
        className={`w-${size} h-${size} border-4 border-orange-500 border-t-transparent rounded-full animate-spin`}
      ></div>
    </div>
  );
}

export default Loader;
