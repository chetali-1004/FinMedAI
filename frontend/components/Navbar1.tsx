import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";

interface Navbar1Props {
  show: boolean;
  setShow: (show: boolean) => void;
  data: Array<{ [key: string]: any }>; // Define data as an array of JSON objects
}

const Navbar1: React.FC<Navbar1Props> = ({ show, setShow, data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-[#E8F1F5] backdrop-blur-lg sm:w-2/3 mx-auto sm:relative text-black font-sans font-medium tracking-wide sm:shadow-lg sm:rounded-full z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 gap-4 sm:gap-6 justify-between items-center ml-0">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img src="./logo.png" alt="Logo" className="h-10 w-auto" />
            </Link>
          </div>
          <div className="hidden md:flex gap-6 font-semibold text-lg">
            <Link
              href="/"
              className="text-black hover:bg-gray-300 px-4 py-2 rounded transition-colors duration-200"
            >
              Home
            </Link>
            {/* <Link
              href={{
                pathname: "/history",
                query: { data: JSON.stringify(data) },
              }}
              className="text-black hover:bg-gray-300 px-4 py-2 rounded transition-colors duration-200"
            >
              Past Prescriptions
            </Link> */}
            <Link
              href="/about"
              className="text-black hover:bg-gray-300 px-4 py-2 rounded transition-colors duration-200"
            >
              Contact Us
            </Link>
            <Link
              href="/filter"
              className="text-black hover:bg-gray-300 px-4 py-2 rounded transition-colors duration-200"
            >
              Filter
            </Link>
          </div>
          <div className="flex items-center gap-2 pl-10">
            <UserButton />
          </div>
          <div className="md:hidden items-centre flex">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-black hover:text-gray-400 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    !isOpen ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"
                  }
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        ref={menuRef}
        className={`fixed inset-0 md:hidden gradient_host z-50 overflow-x-hidden h-[100vh] w-[100vw] flex flex-col items-start p-5 space-y-4 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0 bg-gray-50" : "translate-x-full"
        }`}
        style={{ touchAction: "none" }} // Prevent horizontal scrolling
      >
        <button
          className="text-black self-end"
          onClick={() => setIsOpen(false)}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="black"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <Link
          href="/"
          className="text-black hover:bg-gray-300 px-4 py-2 rounded transition-colors duration-200"
        >
          Home
        </Link>
        {/* <Link
          href={{
            pathname: "/history",
            query: { data: JSON.stringify(data) },
          }}
          className="text-black hover:bg-gray-300 px-4 py-2 rounded transition-colors duration-200"
        >
          Past Prescriptions
        </Link> */}
        <Link
          href="/about"
          className="text-black hover:bg-gray-300 px-4 py-2 rounded transition-colors duration-200"
        >
          Contact Us
        </Link>
        <Link
          href="/filtering"
          className="text-black hover:bg-gray-300 px-4 py-2 rounded transition-colors duration-200"
        >
          Filter
        </Link>
      </div>
    </nav>
  );
};

export default Navbar1;
