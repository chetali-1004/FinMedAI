// pages/page.jsx
"use client";
import React, { useEffect, useState } from "react";
import Navbar1 from "@/components/Navbar1";
const Page = ({ searchParams }) => {
  const [parsedData, setParsedData] = useState([]);

  useEffect(() => {
    if (searchParams.data) {
      try {
        const data = JSON.parse(searchParams.data);
        setParsedData(data);
      } catch (error) {
        console.error("Failed to parse data:", error);
      }
    }
  }, [searchParams]);

  return (
    <div className="bg-gradient-to-r from-[#004A7C] to-[#112D4E] min-h-screen font-sans text-white flex flex-col gap-4 py-4">
      <Navbar1 />
      <div className="mt-10 flex flex-col items-center bg-gray-100 py-10 w-3/4 mx-auto rounded-xl px-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Diagnosis Results
        </h1>
        {parsedData.length === 0 ? (
          <p className="text-lg text-gray-600 mt-15">
            No diagnosis data available.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mx-4 px-4">
            {parsedData.map((data, index) => (
              <div key={index} className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-blue-600">
                  {data.file_name}
                </h2>
                <p className="text-lg text-gray-500">
                  {data.provisional_diagnosis}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
