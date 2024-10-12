import Image from "next/image";

const Aboutproject = () => (
  <section className="flex flex-col lg:flex-row p-10 bg-black rounded-lg shadow-lg">
    <div className="flex-1 lg:pr-8 mb-6 lg:mb-0">
      <h2 className="text-3xl font-bold mb-4">What We Do</h2>
      <p className="text-lg mb-4">
        Our website is dedicated to improving your health and wellness journey
        through seamless access to essential services. We provide:
      </p>
      <ul className="list-disc list-inside space-y-2">
        <li>
          📍 Pharmacy Services: Locate nearby pharmacies and access your
          medications with ease.
        </li>
        <li>
          💸 Discounts on Medicines: Enjoy exclusive discounts by uploading your
          prescriptions.
        </li>
        <li>
          🩺 Health Consultations: Schedule video consultations with healthcare
          professionals within minutes.
        </li>
        <li>
          🏠 Lab Tests at Home: Book lab tests from the comfort of your home for
          convenience and accuracy.
        </li>
        <li>
          🌱 Wellness Programs: Join our wellness programs tailored to enhance
          your overall health.
        </li>
      </ul>
      <p className="mt-4">
        We aim to make healthcare accessible, efficient, and user-friendly,
        empowering you to take charge of your health.
      </p>
    </div>
    <div className="flex-1">
      <Image
        src="/path-to-your-image.jpg"
        alt="Health and Wellness"
        layout="responsive"
        width={500}
        height={400}
        className="rounded-lg"
      />
    </div>
  </section>
);

export default Aboutproject;
