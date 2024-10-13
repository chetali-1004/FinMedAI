"use client";
import Navbar1 from "@/components/Navbar1";
import { useEffect, useState } from "react";

const ClaimPage = () => {
  const [patientId, setPatientId] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [diagnoses, setDiagnoses] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientIdFromURL = urlParams.get("patientId");

    if (patientIdFromURL) {
      setPatientId(patientIdFromURL);
    }
  }, []);

  function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  }

  useEffect(() => {
    const fetchPatientData = async () => {
      if (patientId) {
        try {
          const response = await fetch("http://20.244.90.70:3000/patient", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "patient-id": patientId,
            },
          });

          const data = await response.json();

          const fetchedPrescriptions = data.patient.prescriptions || [];
          const patientDiagnoses = data.patient ? data.patient.diagnoses : [];

          setPatientName(data.patient.name); // Set the patient's name here
          setDiagnoses(patientDiagnoses);
          setPrescriptions(fetchedPrescriptions);
        } catch (error) {
          console.error("Error fetching patient data:", error);
        }
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  return (
    <div className="bg-gradient-to-r from-[#004A7C] to-[#112D4E] min-h-screen bg-gray-50 flex flex-col pt-6">
      {/* Ensure the navbar is not being affected by the flex-col */}
      <Navbar1 show={show} setShow={setShow} />

      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="container w-3/4 space-y-8 mx-auto">
          <div>
            <h1 className="text-3xl font-extrabold text-center text-[#E8F1F5] pt-5">
              Past Diagnoses for{" "}
              {patientName ? toTitleCase(patientName) : "Patient"}
            </h1>
          </div>

          <div className="bg-[#E8F1F5] shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Diagnoses and Prescriptions
            </h2>

            {prescriptions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {prescriptions.map((prescription, index) => (
                  <div
                    key={index}
                    className="prescription-item p-4 bg-gray-100 rounded-md"
                  >
                    {prescription.extractedDiagnosis ? (
                      <div className="image-preview mb-2">
                        <img
                          src={prescription.extractedDiagnosis}
                          alt={`Diagnosis image ${index + 1}`}
                          className="w-full h-64 object-cover rounded-md"
                        />
                      </div>
                    ) : (
                      <p>No prescription image available</p>
                    )}

                    {diagnoses[index] ? (
                      <div>
                        <div>
                          <p className="text-gray-700 mt-2 font-bold">
                            Diagnosis:
                          </p>
                          <p className="text-gray-700">
                            {toTitleCase(diagnoses[index])}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-700 mt-2 font-bold">
                            ICD-10 Code:
                          </p>
                          <p className="text-gray-700">
                            {toTitleCase(diagnoses[index])}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">No diagnosis available</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                No prescriptions found or loading...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimPage;
