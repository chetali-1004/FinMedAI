"use client";
import { useState, useCallback } from "react";
import jsPDF from "jspdf";
import Navbar1 from "@/components/Navbar1";
import Notification from "@/components/Notification";

const Filtering = () => {
  const [show, setShow] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [noPatientFound, setNoPatientFound] = useState(false);
  const [notification, setNotification] = useState("");

  const handleSearch = async () => {
    if (!patientName && !email && !phoneNumber) {
      setNotification("Please enter at least 1 field");
      return;
      return;
    }

    try {
      const response = await fetch(`http://20.244.90.70:3000/filter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName, email, phoneNumber }),
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
    const handlePatientClick = (patient) => {
      window.location.href = `/claim?patientId=${patient._id}`;
    };

    return (
      <div className="mt-6 space-y-3">
        {results.map((patient) => (
          <div
            key={patient.id}
            className="cursor-pointer p-3 bg-white shadow-lg rounded-md hover:shadow-xl transition-shadow duration-300 ease-in-out text-black"
            onClick={() => handlePatientClick(patient)}
          >
            <h3 className="text-lg font-semibold">{patient.name}</h3>
            <p className="text-sm text-gray-500">Phone: {patient.phone}</p>
          </div>
        ))}
      </div>
    );
  }

  const handleCloseNotification = useCallback(() => {
    setNotification("");
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-[#004A7C] to-[#112D4E] text-white pt-6">
      <Navbar1 show={show} setShow={setShow} />
      <div className="flex flex-grow justify-center">
        <div className="w-full max-w-4xl mt-16">
          <h1 className="text-4xl font-bold mb-8 text-center animate__animated animate__fadeInDown">
            Patient Management System
          </h1>
          <div className="w-full bg-white p-8 rounded-lg shadow-lg text-black space-y-8 animate__animated animate__fadeInUp">
            <p className="text-left text-sm text-gray-600 ">
              *Enter at least 1 value
            </p>
            {/* Search Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Name */}
              <div>
                <label
                  htmlFor="patientName"
                  className="text-lg font-semibold text-gray-700"
                >
                  Patient Name
                </label>
                <input
                  type="text"
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="text-lg font-semibold text-gray-700"
                >
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="text-lg font-semibold text-gray-700"
                >
                  Phone Number
                </label>
                <input
                  type="text"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
            </div>
            {/* bg-gradient-to-r from-[#007bff] to-[#004a7c] */}
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSearch}
                className="w-full md:w-auto px-8 py-3 bg-[#007bff]  text-white font-semibold rounded-lg hover:scale-105 hover:shadow-lg transition-transform duration-300 ease-in-out"
              >
                🔍 Search
              </button>
            </div>

            {results.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mt-8">
                  Search Results
                </h2>
                <SearchResults
                  results={results}
                  setSelectedPatient={setSelectedPatient}
                />
              </div>
            )}

            {noPatientFound && (
              <p className="text-red-500 text-center mt-4">
                No records found. Please try again with different criteria.
              </p>
            )}

            {/* Selected Patient */}
            {selectedPatient && (
              <div className="mt-10 p-6 bg-gray-100 rounded-lg shadow-lg animate__animated animate__fadeInUp">
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedPatient?.name}'s Past Prescriptions
                </h2>
                <ul className="mt-4 space-y-3">
                  {selectedPatient?.prescriptions.map((prescription, index) => (
                    <li
                      key={index}
                      className="p-4 bg-white rounded-lg shadow-md border border-gray-200"
                    >
                      <p>{prescription.details}</p>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleGenerateReport}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out"
                  >
                    Generate Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {notification && (
        <Notification
          message={notification}
          onClose={handleCloseNotification}
        />
      )}
    </div>
  );
};

export default Filtering;
