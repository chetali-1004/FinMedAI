import { useState } from "react";

const JsonOutputDisplay = ({ jsonList, confidence, updateDiagnosis , uploadedFileURL}) => {
  // State to track which entry is being modified
  const [isModifying, setIsModifying] = useState(null);
  const [modifiedDiagnosis, setModifiedDiagnosis] = useState(""); 

  // Handler for accepting or modifying diagnosis
  const handleAcceptOrModify = (index) => {
    if (!uploadedFileURL || uploadedFileURL.length === 0) {
      console.error("No uploaded file URLs found.");
      return;
    }
  
    const updatedDiagnosis = [...jsonList];
  
    if (modifiedDiagnosis) {
      // If diagnosis was modified, replace the original
      updatedDiagnosis[index].provisional_diagnosis = modifiedDiagnosis;
    }
  
    console.log(uploadedFileURL);
    console.log(updatedDiagnosis[index].provisional_diagnosis);
    // Call updateDiagnosis with the correct diagnosis and corresponding uploaded file URL
    updateDiagnosis(updatedDiagnosis[index].provisional_diagnosis, uploadedFileURL[index]);
  };
  
  

  // Handler for copy to clipboard
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  

  return (
    <div className="json-output-display">
      {jsonList.map((entry, index) => (
        <div key={index} className="text-black mb-4 p-4 border rounded-lg bg-gray-50">
          <p><strong>File Name:</strong> {entry.file_name}</p>
          <p><strong>Diagnosis:</strong> {entry.provisional_diagnosis}</p>
          <p><strong>Confidence Score:</strong> {confidence[index]}</p>

          {/* Show Accept/Modify buttons if confidence score is below the threshold */}
          {confidence[index] < 0.99 && (
            <div className="mt-2">
              <button
                onClick={() => handleAcceptOrModify(index)}
                className="bg-green-500 text-white px-3 py-1 rounded mr-2"
              >
                Accept
              </button>

              <button
                onClick={() => setIsModifying(index)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Modify
              </button>

              {/* If modifying, show input box and submit button */}
              {isModifying === index && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={modifiedDiagnosis}
                    onChange={(e) => setModifiedDiagnosis(e.target.value)}
                    placeholder="Enter modified diagnosis"
                    className="border px-2 py-1 rounded w-full text-black"
                  />
                  <button
                    onClick={() => handleAcceptOrModify(index)}
                    className="mt-2 bg-purple-500 text-white px-3 py-1 rounded"
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Copy to Clipboard button */}
          <button
            onClick={() => handleCopy(entry.provisional_diagnosis)}
            className="mt-2 bg-gray-500 text-white px-3 py-1 rounded"
          >
            Copy to Clipboard
          </button>
        </div>
      ))}

      {/* CSV download button */}
      <div className="mt-4">
        <button
          onClick={() => {
            // Convert the jsonList to CSV format
            const csvContent = "data:text/csv;charset=utf-8," + 
              jsonList.map(entry => `${entry.file_name},${entry.provisional_diagnosis},${confidence[jsonList.indexOf(entry)]}`).join("\n");
            
            // Create download link
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "diagnosis_data.csv");
            document.body.appendChild(link); // Required for FF

            link.click();
            document.body.removeChild(link);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Download CSV
        </button>
      </div>
    </div>
  );
};

export default JsonOutputDisplay;
