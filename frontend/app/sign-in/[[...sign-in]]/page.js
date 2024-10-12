import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="relative min-h-screen flex items-center justify-center md:justify-end">
      <img
        src="./background .jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover z-[-1]"
      />
      <div className="w-full max-w-md p-8 bg-opacity-80 rounded-lg shadow-md z-10 mr-6">
        <SignIn></SignIn>
      </div>
    </div>
  );
}
