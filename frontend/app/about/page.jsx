"use client";
import Head from "next/head";
import dynamic from "next/dynamic";
import Navbar1 from "@/components/Navbar1"; // Import Navbar1
import React, { useState } from "react";
import Email from "../../components/Email";

// Dynamic imports for animations using Framer Motion
const MotionH1 = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.h1),
  { ssr: false }
);
const MotionP = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.p),
  { ssr: false }
);

// Team member data
const teamMembers = [
  {
    name: "Yash Khandelwal",
    role: "Data Scientist",
    description:
      "Responsible for server-side logic, database management, and ensuring seamless API integrations.",
    photo: "./yash.jpg",
  },
  {
    name: "Chetali Goyal",
    role: "Frontend Developer",
    description:
      "Focused on creating user-friendly interfaces and enhancing user experience.",
    photo: "./chemz.jpg",
  },
  {
    name: "Eshita Rastogi",
    role: "ML Engineer",
    description:
      "Specialization in machine learning algorithms and data analysis to drive innovative solutions.",
    photo: "./eshita.png",
  },
  {
    name: "Vedant Gholap",
    role: "Full Stack Developer",
    description:
      "Focused majorly on the frontend configurations and logics along with API integrations",
    photo: "./vedant.jpg",
  },
];

// TeamCard component
const TeamCard = ({ name, role, description, photo }) => (
  <div
    className="relative overflow-hidden group w-full h-80"
    style={{
      borderTopLeftRadius: "2.5rem",
      borderBottomRightRadius: "2.5rem",
    }}
  >
    {/* Card Image with Gradient Overlay */}
    <div
      className="h-full bg-cover bg-center"
      style={{
        backgroundImage: `url(${photo})`,
      }}
    >
      <div className="bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.7)] p-4 h-full flex flex-col justify-end">
        <h3 className="text-lg font-semibold text-white text-center">{name}</h3>
        <p className="text-sm text-white text-center">{role}</p>
      </div>
    </div>

    {/* Hover Effect: Cover the entire card with text */}
    <div
      className="absolute bottom-0 left-0 right-0 h-full bg-[#B0E0E6] bg-opacity-70 text-gray-800 p-4 transform translate-y-full transition-all duration-300 ease-in-out group-hover:translate-y-0 flex flex-col justify-center items-center"
      style={{
        borderTopLeftRadius: "2.5rem",
        borderBottomRightRadius: "2.5rem",
      }}
    >
      <p className="text-lg font-semibold text-center">{description}</p>
    </div>
  </div>
);

const TeamGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-8 max-w-6xl mx-auto">
    {teamMembers.map((member, index) => (
      <div
        key={index}
        className="w-full"
        style={{
          clipPath:
            "polygon(0 0, 100% 0, 100% calc(100% - 0.5rem), calc(100% - 0.5rem) 100%, 0 100%)",
        }}
      >
        <TeamCard {...member} />
      </div>
    ))}
  </div>
);

// Main About component
const About = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // State for navbar visibility (if applicable)
  const [showNavbar, setShowNavbar] = useState(true); // Add state if needed

  return (
    <div className="screen flex flex-col items-center justify-center bg-gradient-to-r from-[#004A7C] to-[#112D4E] p-4 min-h-screen">
      <Head>
        <title>About Us</title>
        <meta
          name="description"
          content="Learn more about our team and mission."
        />
      </Head>
      <Navbar1 show={showNavbar} setShow={setShowNavbar} data={[]} />
      <main className="text-center mt-16 flex-grow w-3/4 my-auto">
        <MotionH1
          className="text-5xl font-bold text-white mb-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ duration: 0.5 }}
        >
          About Our Team
        </MotionH1>

        <MotionP
          className="mt-4 text-lg text-gray-300"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ duration: 0.5, delay: 0.2 }} // Optional delay for the paragraph
        >
          Meet the dedicated team behind FinMedAI, committed to revolutionizing
          medical diagnosis.
        </MotionP>

        {/* Render the TeamGrid component */}
        <TeamGrid />
        <Email />
      </main>
    </div>
  );
};

export default About;
