import { ClipLoader, BeatLoader, FadeLoader } from 'react-spinners';

// Page Loading Spinner (larger, centered)
export const PageLoader = ({ size = 50, color = "#3B82F6", message = "Loading..." }) => {
  return (
    <div className="flex flex-col justify-center items-center min-h-64 space-y-4">
      <ClipLoader size={size} color={color} />
      <div className="text-lg text-gray-600">{message}</div>
    </div>
  );
};

// Button Loading Spinner (small, inline)
export const ButtonLoader = ({ size = 20, color = "#ffffff" }) => {
  return <BeatLoader size={size} color={color} />;
};

// Inline Loading Spinner (for small areas)
export const InlineLoader = ({ size = 25, color = "#3B82F6", message }) => {
  return (
    <div className="flex items-center space-x-2">
      <ClipLoader size={size} color={color} />
      {message && <span className="text-gray-600">{message}</span>}
    </div>
  );
};

// Overlay Loading Spinner (covers the entire screen or container)
export const OverlayLoader = ({ 
  size = 60, 
  color = "#3B82F6", 
  message = "Loading...",
  background = "bg-white bg-opacity-80"
}) => {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-center items-center ${background}`}>
      <FadeLoader size={size} color={color} />
      <div className="text-xl text-gray-700 mt-4">{message}</div>
    </div>
  );
};

// Card Loading Spinner (for content areas)
export const CardLoader = ({ size = 35, color = "#3B82F6", message = "Loading content..." }) => {
  return (
    <div className="flex flex-col justify-center items-center py-8 space-y-3">
      <ClipLoader size={size} color={color} />
      <div className="text-gray-600">{message}</div>
    </div>
  );
};