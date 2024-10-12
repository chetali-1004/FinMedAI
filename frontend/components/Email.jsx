"use client";
import React from "react";
import { useState } from "react";

const Email = () => {
  const [messageVisible, setMessageVisible] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    formData.append("access_key", "08bd0fcc-df0c-42a5-91d1-61266184f603");

    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: json,
      });
      const result = await response.json();
      if (result.success) {
        setMessageVisible(true);
        setTimeout(() => setMessageVisible(false), 3000); // Hide message after 3 seconds
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  }

  return (
    <div className="mt-20">
      <h1 className="text-5xl font-semibold text-[#B0E0E6]">
        Nice to Meet You.
      </h1>
      <section
        className="grid justify-center lg:grid-cols-[1.5fr_1px_2fr] lg:w-3/4 mx-auto my-0 md:my-12 pb-20 gap-4 relative"
        id="contact"
      >
        <div className="text-center lg:text-left z-10">
          <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#DCE9EF] to-[#B0E0E6]">
            Let us connect
          </span>
          <p className="text-[#ADB7BE] mb-4 max-w-md">
            Have a question or want to collaborate? Feel free to reach out!{" "}
          </p>
        </div>

        {/* vertical line */}
        <div className="hidden lg:block w-[1px] bg-[#33353F] ml-7"></div>

        <div>
          <form
            className="flex flex-col gap-5 md:ml-20 text-left"
            onSubmit={handleSubmit}
          >
            <div>
              <label
                htmlFor="email"
                className="text-white block mb-2 text-sm font-medium"
              >
                Your email
              </label>
              <input
                name="email"
                type="email"
                id="email"
                required
                placeholder=""
                className="bg-[#d0e7ea] border border-[#33353F] text-black text-sm rounded-lg block w-full p-2.5 text-left" // Added text-left
              />
            </div>
            <div>
              <label
                htmlFor="subject"
                className="text-white block mb-2 text-sm font-medium"
              >
                Subject
              </label>
              <input
                name="subject"
                type="text"
                id="subject"
                placeholder=""
                className="bg-[#d0e7ea] border border-[#33353F] text-black text-sm rounded-lg block w-full p-2.5 text-left" // Added text-left
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="text-white block mb-2 text-sm font-medium"
              >
                Message
              </label>
              <textarea
                name="message"
                id="message"
                required
                placeholder=""
                className="bg-[#d0e7ea] border border-[#33353F] text-black text-sm rounded-lg block w-full p-2.5 text-left" // Added text-left
              />
            </div>
            <button
              type="submit"
              className="bg-[#B0E0E6] hover:bg-[#89dfeb] text-black font-medium py-2.5 px-5 rounded-lg w-full"
            >
              Send Message
            </button>
          </form>
        </div>
        {messageVisible && (
          <div className="flex fixed bottom-10 right-6 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg">
            Message sent
            <img src="/check.png" height={10} width={20} className="ml-2" />
          </div>
        )}
      </section>
    </div>
  );
};

export default Email;
