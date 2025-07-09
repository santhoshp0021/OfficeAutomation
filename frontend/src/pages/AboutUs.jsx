import React from 'react';

const AboutUs = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl mx-auto mt-10 animate-fade-in">
      <h1 className="text-3xl font-bold mb-4 text-center text-blue-800">About Us</h1>
      <p className="text-lg text-gray-700 mb-6 text-center">
        Welcome to the PG Examinations Portal! Our mission is to streamline and simplify the examination process for faculty, HODs, and administrators. We are dedicated to providing a seamless, user-friendly experience for managing duties, claims, seating arrangements, and more.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-blue-50 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-2 text-blue-700">Our Mission</h2>
          <p className="text-gray-600">To empower educational institutions with efficient digital tools for examination management, ensuring accuracy, transparency, and ease of use for all stakeholders.</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-2 text-blue-700">Our Team</h2>
          <p className="text-gray-600">We are a passionate group of developers, educators, and administrators committed to improving the academic experience through technology.</p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs; 