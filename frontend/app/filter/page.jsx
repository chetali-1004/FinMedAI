"use client";
import { useState } from "react";
import jsPDF from "jspdf";
import Navbar1 from "@/components/Navbar1";
import { useNavigate } from "react-router-dom";

const Filtering = () => {
  const [show, setShow] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [noPatientFound, setNoPatientFound] = useState(false);

  const handleSearch = async () => {
    if (!patientName && !email && !phoneNumber) {
      alert("Please enter at least one search criterion.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/filter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName, email, phoneNumber }),
      });
      const data = await response.json();
      console.log(data);
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

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Patient Report", 20, 20);

    if (selectedPatient) {
      doc.setFontSize(14);
      doc.text(`Name: ${selectedPatient.name}`, 20, 40);
      doc.text(`Sex: ${selectedPatient.sex}`, 20, 50);
      doc.text(`Email: ${selectedPatient.email}`, 20, 60);

      doc.text("Past Prescriptions:", 20, 80);
      selectedPatient.prescriptions.forEach((prescription, index) => {
        doc.text(`- ${prescription.details}`, 20, 90 + index * 10);
      });
    }

    doc.save(`${selectedPatient?.name}_report.pdf`);
  };

  function SearchResults({ results, setSelectedPatient }) {
    const handlePatientClick = async (patient) => {
      window.location.href = `/claim?patientId=${patient._id}`;
    };

    return (
      <div>
        {results.map((patient) => (
          <div
            key={patient.id}
            className="cursor-pointer p-2 border-b border-gray-300 hover:bg-gray-200 text-black"
            onClick={() => handlePatientClick(patient)}
          >
            {patient.name}
            {patient.phone} {/* Display other relevant info if needed */}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#003366] pt-10">
      <Navbar1 show={show} setShow={setShow} />
      <div className="flex flex-grow justify-center">
        <div className="w-3/4 mt-10">
          <h1 className="text-4xl font-bold text-[#E8F1F5] mb-8 text-center">
            Patient Management System
          </h1>
          <div className="w-4/6 mx-auto bg-[#E8F1F5] p-6 rounded-lg shadow-lg space-y-4">
            {/* Search Input */}
            <div className="space-y-4">
              {/* Patient Name */}
              <div>
                <label
                  htmlFor="patientName"
                  className="text-black font-semibold"
                >
                  Patient Name
                </label>
                <input
                  type="text"
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  className="w-full p-2 border border-gray-300 rounded-md text-black"
                />
              </div>

              <div>
                <label htmlFor="email" className="text-black font-semibold">
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full p-2 border border-gray-300 rounded-md text-black"
                />
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="text-black font-semibold"
                >
                  Phone Number
                </label>
                <input
                  type="text"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full p-2 border border-gray-300 rounded-md text-black"
                />
              </div>

              <button
                onClick={handleSearch}
                className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-300"
              >
                Search
              </button>
            </div>

            {results.length > 0 ? (
              <div className="mt-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  Search Results
                </h2>
                <SearchResults
                  results={results}
                  setSelectedPatient={setSelectedPatient}
                />
              </div>
            ) : (
              <div>
                <p className="text-black">No record found</p>
              </div>
            )}

            {selectedPatient && (
              <div className="mt-8 p-4 bg-green-50 rounded-lg shadow-md w-full">
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedPatient?.name}'s Past Prescriptions
                </h2>
                <ul className="bg-gray-100 p-4 rounded-md mt-2 space-y-2">
                  {selectedPatient?.prescriptions.map((prescription, index) => (
                    <li key={index} className="border-b border-gray-300 pb-2">
                      <p className="font-medium">{prescription.details}</p>{" "}
                      {/* Display only diagnosis names */}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-center mt-10">
                  <button
                    onClick={handleGenerateReport}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-300"
                  >
                    Generate Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filtering;
