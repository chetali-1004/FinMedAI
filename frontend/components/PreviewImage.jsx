import React from "react";
import { ExternalLink, Image as ImageIcon } from "lucide-react";

const PreviewImage = ({ fileURL }) => {
  if (!fileURL || fileURL.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 w-full max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold text-center mb-4 text-indigo-700">
        Uploaded Images
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fileURL.map((url, index) => (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-4 bg-gray-50 border border-gray-300 rounded-lg shadow-md hover:bg-blue-50 transition-all duration-300 ease-in-out group"
          >
            <ImageIcon className="w-8 h-8 text-teal-500 group-hover:text-teal-600 mr-3" />
            <div className="flex-grow">
              <span className="block text-sm font-medium text-gray-800 group-hover:text-gray-900">
                Preview Image{index + 1}
              </span>
              <span className="text-xs text-gray-600 group-hover:text-gray-800 mx-auto">
                Click to open
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-gray-700 ml-2" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default PreviewImage;
