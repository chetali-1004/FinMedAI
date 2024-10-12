import React, { useState } from "react";
import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { saveAs } from "file-saver"; // You need to install this package

const JsonOutputDisplay = ({ jsonList }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [csvPreview, setCsvPreview] = useState(null);

  const toggleExpand = (index) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          alert("Copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          alert("Failed to copy text. Please try again.");
        });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        alert("Copied to clipboard!");
      } catch (err) {
        console.error("Fallback copy failed: ", err);
        alert("Failed to copy text. Please try again.");
      }
      document.body.removeChild(textArea);
    }
  };

  const generateCsvContent = () => {
    const headers = ["file_name,provisional_diagnosis"];
    const rows = jsonList.map((item) => {
      const diagnosis = item.provisional_diagnosis.includes(
        "CUDA out of memory"
      )
        ? "No diagnosis found"
        : item.provisional_diagnosis;
      return `${item.file_name},${diagnosis}`;
    });

    return `${headers.join("\n")}\n${rows.join("\n")}`;
  };

  const handlePreviewCsv = () => {
    const csvContent = generateCsvContent();
    setCsvPreview(csvContent);
  };

  const handleDownloadCsv = () => {
    const csvContent = generateCsvContent();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "diagnosis_data.csv");
  };

  return (
    <div className="mt-8 p-4 bg-green-50 rounded-lg shadow-md w-full">
      <h3 className="text-lg sm:text-xl font-semibold mb-4 text-green-800">
        Extracted Diagnosis
      </h3>

      <div className="flex space-x-4 mb-4">
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
          onClick={handlePreviewCsv}
        >
          Preview CSV
        </button>
        <button
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700"
          onClick={handleDownloadCsv}
        >
          Download CSV
        </button>
      </div>

      {csvPreview && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
          <h4 className="text-md font-semibold mb-2 text-gray-800">
            CSV Preview:
          </h4>
          <pre className="text-sm text-black whitespace-pre-wrap">
            {csvPreview}
          </pre>
        </div>
      )}

      {jsonList.length > 0 ? (
        <ul className="space-y-4 mt-4">
          {jsonList.map((item, index) => (
            <li
              key={index}
              className={`rounded-lg shadow-sm border ${
                item.provisional_diagnosis.includes("CUDA out of memory")
                  ? "bg-white hover:bg-red-100 border-red-200"
                  : "bg-white border-green-200"
              }`}
            >
              <div
                className={`flex items-center justify-between p-3 cursor-pointer ${
                  item.provisional_diagnosis.includes("CUDA out of memory")
                    ? "hover:bg-red-100"
                    : "hover:bg-green-100"
                }`}
                onClick={() => toggleExpand(index)}
              >
                <span
                  className={`font-medium text-sm sm:text-base ${
                    item.provisional_diagnosis.includes("CUDA out of memory")
                      ? "text-red-700"
                      : "text-green-700"
                  }`}
                >
                  {item.file_name}
                </span>
                {expandedItems[index] ? (
                  <ChevronDown
                    size={20}
                    className={`${
                      item.provisional_diagnosis.includes("CUDA out of memory")
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  />
                ) : (
                  <ChevronRight
                    size={20}
                    className={`${
                      item.provisional_diagnosis.includes("CUDA out of memory")
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  />
                )}
              </div>

              {expandedItems[index] && (
                <div
                  className={`p-3 border-t ${
                    item.provisional_diagnosis.includes("CUDA out of memory")
                      ? "border-red-300 bg-red-100 text-red-900"
                      : "border-green-300 bg-green-100 text-green-900"
                  }`}
                >
                  <pre className="text-sm sm:text-md p-2 rounded overflow-auto max-w-full bg-opacity-60 whitespace-pre-wrap">
                    {item.provisional_diagnosis.includes("CUDA out of memory")
                      ? "No diagnosis found"
                      : item.provisional_diagnosis}
                  </pre>
                  {!item.provisional_diagnosis.includes(
                    "CUDA out of memory"
                  ) && (
                    <button
                      className="mt-2 flex items-center text-xs sm:text-sm text-green-600 hover:text-green-800"
                      onClick={() =>
                        copyToClipboard(item.provisional_diagnosis)
                      }
                    >
                      <Copy size={16} className="mr-1 text-green-600" />
                      Copy to clipboard
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No JSON data to display.</p>
      )}
    </div>
  );
};

export default JsonOutputDisplay;
