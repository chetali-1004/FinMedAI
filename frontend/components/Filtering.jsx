import { useState } from "react";
// import SearchResults from "./SearchResults";
// import AddPatientForm from "./AddPatientForm";
import Navbar1 from "./Navbar1";

export default function Filter() {
  const [show, setShow] = useState(true);
  const [searchParam, setSearchParam] = useState("patientName");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [noPatientFound, setNoPatientFound] = useState(false);

  const handleSearch = async () => {
    try {
      const response = await fetch(`/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchParam, query }),
      });
      const data = await response.json();
      if (data.length === 0) {
        setNoPatientFound(true);
      } else {
        setResults(data);
        setNoPatientFound(false);
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#003366] py-10">
      <Navbar1 show={show} setShow={setShow} />
      <div className="flex flex-col my-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Patient Management System
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg space-y-4">
          <div className="flex items-center space-x-3">
            <select
              value={searchParam}
              onChange={(e) => setSearchParam(e.target.value)}
              className="w-40 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="patientName">Patient Name</option>
              <option value="doctorName">Doctor Name</option>
              <option value="phoneNumber">Phone Number</option>
            </select>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search query"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-300"
            >
              Search
            </button>
          </div>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-gray-700">
                Search Results
              </h2>
              <SearchResults
                results={results}
                setSelectedPatient={setSelectedPatient}
                setShowAddForm={setShowAddForm}
                setNoPatientFound={setNoPatientFound}
              />
            </div>
          )}

          {/* No Patient Found */}
          {noPatientFound && (
            <div className="mt-4 text-center">
              <p className="text-red-500 font-medium">No patient found.</p>
              <AddPatientForm />
            </div>
          )}

          {/* Selected Patient Details */}
          {selectedPatient && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Patient Details
              </h2>
              <pre className="bg-gray-100 p-4 rounded-md mt-2">
                {JSON.stringify(selectedPatient, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
