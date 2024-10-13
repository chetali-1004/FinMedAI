"use client";
import { useState, useCallback, useEffect } from "react";
import {
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import Navbar1 from "./Navbar1";
import Notification from "./Notification";
import JsonOutputDisplay from "./JsonOutput";
import Features from "./Features";
import { useUser } from "@clerk/nextjs";
import { type } from "os";

const Header = () => {
  const [show, setShow] = useState(true);
  const [files, setFiles] = useState([]);
  const [fileURLs, setFileURLs] = useState([]);
  const [diagnosis, setDiagnosis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [jsonList, setJsonList] = useState([]);
  const [patientName, setPatientName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confidence, setConfidence] = useState([]);
  const [uploadedFileURL, setUploadedFileURL] = useState([]);

  const handleFileChange = useCallback((e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
    setFileURLs((prevURLs) => [
      ...prevURLs,
      ...uploadedFiles.map((file) => URL.createObjectURL(file)),
    ]);
  }, []);

  const removeFile = useCallback((index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setFileURLs((prevURLs) => prevURLs.filter((_, i) => i !== index));
  }, []);

  const handleExtract = useCallback(
    async (e) => {
      e.preventDefault();
      if (files.length === 0) {
        setNotification("Please upload at least one file.");
        return;
      }

      setLoading(true);

      try {
        // Cloudinary code starts
        const uploadedFileURLs = [];
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "bcpgv8rb"); // Add your Cloudinary upload preset
          formData.append("cloud_name", "dhnpwlqef"); // Add your Cloudinary cloud name

          const cloudinaryResponse = await fetch(
            "https://api.cloudinary.com/v1_1/dhnpwlqef/image/upload", // Replace YOUR_CLOUD_NAME
            {
              method: "POST",
              body: formData,
            }
          );

          if (!cloudinaryResponse.ok) {
            throw new Error(
              `Cloudinary upload failed: ${cloudinaryResponse.statusText}`
            );
          }

          const cloudinaryData = await cloudinaryResponse.json();
          uploadedFileURLs.push(cloudinaryData.secure_url); // Collect the Cloudinary URL
          console.log(uploadedFileURLs);
          setUploadedFileURL(uploadedFileURLs);
        }
        // Cloudinary code ends

        const formData = new FormData();
        files.forEach((f) => {
          formData.append("images", f);
        });

        const response = await fetch(
          "https://8d7f-125-16-34-110.ngrok-free.app/process_images",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log(responseData);

        if (responseData.length === 0) {
          setNotification("No diagnosis found");
        } else {
          const diagnoses = responseData.map((data) => ({
            fileName: data.file_name,
            diagnosis: data["provisional_diagnosis"],
            confidence_score: data["confidence_score"],
          }));

          // Store the confidence scores in a state variable
          const confidenceScores = responseData.map(
            (data) => data["Confidence_score"]
          );
          setConfidence(confidenceScores); // Save confidence scores

          setDiagnosis(diagnoses);
          setJsonList(responseData);
          setNotification("Diagnosis extracted successfully!");

          const provisionalDiagnosis = responseData.map(
            (data) => data["provisional_diagnosis"]
          );
          console.log(provisionalDiagnosis);

          // Call the update function here
        }
      } catch (error) {
        console.error("Error during file upload:", error);
        setNotification("Failed to extract diagnosis. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [files]
  );

  const updateDiagnosis = async (provisionalDiagnosis, prop1) => {
    console.log(prop1);
    const urls = prop1.split(",");
    console.log(provisionalDiagnosis);
    // const newDiagnosis = provisionalDiagnosis.split(",");
    const newDiagnosis = provisionalDiagnosis.map(diagnosis => diagnosis.split(",").join(","));

    console.log(typeof provisionalDiagnosis);
    try {
      const response = await fetch("http://20.244.90.70:3000/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: patientName,
          email: email,
          phone: phoneNumber,
          diagnoses: newDiagnosis,
          prescriptions: urls.map((url) => ({
            extractedDiagnosis: url,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log(responseData);
    } catch (error) {
      console.error("Error during file upload:", error);
      setNotification("Failed to extract diagnosis. Please try again.");
    }
  };

  const handleCloseNotification = useCallback(() => {
    setNotification("");
  }, []);

  // const { user } = useUser();

  // useEffect(() => {
  //   if (user) {
  //     console.log(user.id);
  //   }
  // }, [user]);
  useEffect(() => {
    console.log("this is confidence ", confidence); // Log confidence scores
  }, [confidence]);

  return (
    <div className="bg-gradient-to-r from-[#004A7C] to-[#112D4E] min-h-screen font-sans text-white flex flex-col gap-4 py-4">
      <Navbar1 data={jsonList} show={show} setShow={setShow} />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-center text-[#E8F1F5] pb-4 mt-10">
          FinMedAI Diagnosis Extractor
        </h1>
        <p className="text-center text-lg md:text-xl mb-8 md:mb-14 text-[#E8F1F5]">
          Revolutionizing medical diagnosis with cutting-edge AI technology
        </p>

        <div className="bg-[#dce9ef] rounded-xl p-6 md:px-8 md:py-6 shadow-2xl w-full md:w-4/5 lg:w-3/4 mx-auto">
          <p className="text-right text-red-500 text-sm py-0 font-semibold">
            * fields are mandatory
          </p>
          <form onSubmit={handleExtract} className="space-y-4 md:space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <label htmlFor="file-upload" className="w-full cursor-pointer">
                {/* ///////////////////////////////////////////////// */}
                <div className="space-y-4">
                  {/* Patient Name */}
                  <div>
                    <div className="flex flex-row">
                      <label
                        htmlFor="patientName"
                        className="text-black font-semibold"
                      >
                        Patient Name
                      </label>
                      <p className=" text-red-500 font-bold">*</p>
                    </div>

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
                    <div className="flex flex-row">
                      <label
                        htmlFor="email"
                        className="text-black font-semibold"
                      >
                        Email
                      </label>
                      <p className=" text-red-500 font-bold">*</p>
                    </div>

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
                    <div className="flex flex-row">
                      <label
                        htmlFor="phoneNumber"
                        className="text-black font-semibold"
                      >
                        Phone Number
                      </label>
                      <p className=" text-red-500 font-bold">*</p>
                    </div>

                    <input
                      type="text"
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full p-2 border border-gray-300 rounded-md text-black"
                    />
                  </div>
                </div>
                {/* ////////////////////////////////////////////////////////// */}
                <div className="flex items-center justify-center w-full h-32 md:h-40 border-2 border-dashed border-gray-300 rounded-lg bg-[#E8F1F5] hover:bg-[#cadfe8] hover:bg-opacity-70 transition duration-300 mt-8">
                  <div className="flex flex-col items-center justify-center pt-4 pb-4">
                    <CloudArrowUpIcon className="w-12 md:w-14 h-12 md:h-14 mb-3 text-[#003366]" />
                    <p className="mb-1 text-sm md:text-base text-[#003366]">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*"
                />
              </label>

              {fileURLs.length > 0 && (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 md:mt-6">
                  {fileURLs.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 md:h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className={`w-full bg-[#E8F1F5] text-[#003366] font-bold py-2 px-4 md:py-3 md:px-6 rounded-lg flex items-center justify-center space-x-2 ease-in-out transform hover:bg-[#cadfe8] hover:bg-opacity-70 transition duration-300 hover:scale-105 ${
                  loading ? "animate-pulse" : ""
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-3 text-[#003366]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
                      ></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Extract Diagnosis</span>
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {jsonList.length > 0 && (
            <div className="mt-4 md:mt-6 bg-white bg-opacity-5 p-4 md:p-6 rounded-lg">
              <JsonOutputDisplay
                jsonList={jsonList}
                confidence={confidence}
                updateDiagnosis={updateDiagnosis}
                uploadedFileURL={uploadedFileURL}
              />
            </div>
          )}
        </div>

        {/* <div className="mt-8 md:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Fast Processing",
              description:
                "Get results in seconds with our optimized AI algorithms",
            },
            {
              title: "High Accuracy",
              description:
                "State-of-the-art models ensure precise medical diagnosis extraction",
            },
            {
              title: "Secure & Compliant",
              description:
                "Your data is protected with enterprise-grade security measures",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-[#ffffff]">
                {feature.title}
              </h3>
              <p className="text-sm md:text-base text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div> */}
        <div className="mt-8 md:mt-16 w-full md:w-3/4 mx-auto bg-[#dce9ef] rounded-xl">
          {" "}
          <h1 className="text-3xl text-center pt-8 text-[#112D4E] font-extrabold">
            Our Features & Services.
          </h1>
          <p className="text-center pb-4 text-gray-500">Coming Soon</p>
          <Features />
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

export default Header;
