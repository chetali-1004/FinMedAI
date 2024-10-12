import { useEffect, useState } from "react";

const Notification = ({ message, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (message) {
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress <= 0) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return oldProgress - 1;
        });
      }, 40);

      return () => clearInterval(timer);
    }
  }, [message, onClose]);

  return (
    <div
      className={`fixed top-28 right-8 w-80 p-4 bg-white shadow-lg rounded-lg border border-gray-200 ${
        message ? "block" : "hidden"
      }`}
    >
      <div className="flex justify-between items-center">
        <p className="text-gray-800">{message}</p>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>
      <div className="relative mt-2 h-1 bg-gray-300">
        <div
          className="absolute top-0 left-0 h-full bg-indigo-600 transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Notification;
