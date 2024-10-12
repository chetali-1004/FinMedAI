import React from "react";
import {
  BuildingStorefrontIcon,
  DocumentTextIcon,
  BuildingOffice2Icon,
  VideoCameraIcon,
  BeakerIcon,
  HeartIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    title: "Pharmacy Near Me",
    subtitle: "FIND STORE",
    icon: <BuildingStorefrontIcon className="h-12 w-12 text-teal-700" />,
    bgColor: "bg-blue-50",
  },
  {
    title: "Wellness Programs",
    subtitle: "JOIN A PROGRAM",
    icon: <HeartIcon className="h-12 w-12 text-red-700" />,
    bgColor: "bg-red-50",
  },
  {
    title: "15% off on Medicines",
    subtitle: "UPLOAD NOW",
    icon: <DocumentTextIcon className="h-12 w-12 text-green-700" />,
    bgColor: "bg-green-50",
  },

  {
    title: "Hospital Visit",
    subtitle: "PRE-BOOK",
    icon: <BuildingOffice2Icon className="h-12 w-12 text-purple-700" />,
    bgColor: "bg-purple-50",
  },

  {
    title: "Video Consult",
    subtitle: "IN 15 MIN",
    icon: <VideoCameraIcon className="h-12 w-12 text-yellow-700" />,
    bgColor: "bg-yellow-50",
  },
  {
    title: "Lab Tests",
    subtitle: "AT HOME",
    icon: <BeakerIcon className="h-12 w-12 text-pink-700" />,
    bgColor: "bg-pink-50",
  },
];

const FeatureCard = ({ title, subtitle, icon, bgColor }) => (
  <div
    className={`${bgColor} rounded-lg p-6 flex items-center justify-between h-24`}
  >
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex flex-col">
        <h3 className="text-sm md:text-lg font-semibold text-gray-800">
          {title}
        </h3>
        <p className="text-sm text-gray-600 uppercase">{subtitle}</p>
      </div>
    </div>
    <div>
      <ChevronRightIcon className="h-6 w-6 text-gray-400" />
    </div>
  </div>
);

const Features = () => (
  <div className="p-10 pt-4 bg-powder-blue">
    {/* Responsive grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {features.map((feature, index) => (
        <FeatureCard key={index} {...feature} />
      ))}
    </div>
  </div>
);

export default Features;
