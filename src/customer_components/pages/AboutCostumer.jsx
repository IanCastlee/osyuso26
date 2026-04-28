import React from "react";
import aboutbg from "../../assets/bg_pictures/aboutbg.webp";

import { PiShoppingCartSimpleFill } from "react-icons/pi";
import { RxQuestionMarkCircled } from "react-icons/rx";
import { LazyLoadImage } from "react-lazy-load-image-component";

function AboutCostumer() {
  return (
    <div className="flex flex-col w-full bg-gray-100 min-h-screen">
      {/* HEADER */}
      <header className="w-full h-[70px] bg-secondary text-white shadow-md px-8 flex justify-between items-center">
        <h2 className="flex items-center font-bold text-2xl md:text-[24px] tracking-wide">
          OSY
          <PiShoppingCartSimpleFill />
          SO
        </h2>

        <button
          className="flex items-center gap-1 text-xs hover:opacity-80 transition"
          title="FAQ"
        >
          <RxQuestionMarkCircled className="text-sm" />
          FAQ
        </button>
      </header>

      {/* HERO IMAGE */}
      <div className="relative w-full h-[300px] overflow-hidden">
        <LazyLoadImage src={aboutbg} className="w-full h-full object-cover" />

        {/* overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <h1 className="text-white text-3xl md:text-4xl font-bold tracking-wide">
            About OSYUSO
          </h1>
        </div>
      </div>

      {/* INTRO */}
      <div className="px-6 md:px-28 py-10 space-y-6">
        <h2 className="text-2xl font-bold text-primary">
          Fresh. Local. Trusted.
        </h2>

        <p className="text-gray-600 leading-relaxed">
          OSYUSO is a local marketplace platform that connects customers with
          nearby sellers of fresh meat, fruits, and vegetables. Our goal is to
          make buying fresh products easier, faster, and more reliable for every
          community.
        </p>

        {/* MISSION / VISION */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-secondary mb-2">
              Mission
            </h3>
            <p className="text-sm text-gray-600">
              To empower local sellers by providing a digital marketplace where
              they can easily reach customers and grow their business.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-secondary mb-2">
              Vision
            </h3>
            <p className="text-sm text-gray-600">
              To become the leading community-based marketplace for fresh and
              affordable local products in every region.
            </p>
          </div>
        </div>
      </div>

      {/* OUR WAY */}
      <div className="bg-white px-6 md:px-28 py-10">
        <h2 className="text-2xl font-bold text-primary mb-6">Our Way</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-5 border rounded-xl hover:shadow-md transition">
            <h3 className="text-secondary font-semibold mb-2">Simple</h3>
            <p className="text-sm text-gray-600">
              We believe in simplicity and integrity, ensuring a life that’s
              honest, down to earth and true to self.
            </p>
          </div>

          <div className="p-5 border rounded-xl hover:shadow-md transition">
            <h3 className="text-secondary font-semibold mb-2">Happy</h3>
            <p className="text-sm text-gray-600">
              We are friendly, fun-loving and full of energy, spreading joy with
              everyone we meet.
            </p>
          </div>

          <div className="p-5 border rounded-xl hover:shadow-md transition">
            <h3 className="text-secondary font-semibold mb-2">Together</h3>
            <p className="text-sm text-gray-600">
              We build on teamwork and collaboration while enjoying meaningful
              relationships in the workplace.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER VALUE */}
      <div className="px-6 md:px-28 py-10">
        <h2 className="text-2xl font-bold text-primary mb-4">Our Values</h2>

        <div className="bg-secondary text-white p-6 rounded-xl">
          <p className="text-sm leading-relaxed">
            We value trust, transparency, and community. OSYUSO is built for
            people who believe in supporting local businesses and enjoying
            fresh, quality products every day.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AboutCostumer;
