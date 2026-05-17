import React from "react";
import aboutbg from "../../assets/bg_pictures/aboutbg.webp";

import { PiShoppingCartSimpleFill } from "react-icons/pi";
import { RxQuestionMarkCircled } from "react-icons/rx";
import { FiHeart, FiMapPin, FiShoppingBag, FiUsers } from "react-icons/fi";
import { LazyLoadImage } from "react-lazy-load-image-component";

function AboutCostumer() {
  return (
    <div className="min-h-screen w-full bg-gray-100">
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between bg-secondary px-4 text-white shadow-md sm:px-6 md:h-[70px] md:px-12">
        <h2 className="flex cursor-pointer items-center text-xl font-bold tracking-wide sm:text-2xl">
          OSY
          <PiShoppingCartSimpleFill className="mx-1" />
          SO
        </h2>

        <button
          className="flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition hover:bg-white/15"
          title="FAQ"
        >
          <RxQuestionMarkCircled className="text-base" />
          FAQ
        </button>
      </header>

      <section className="relative h-[300px] w-full overflow-hidden sm:h-[360px] md:h-[430px]">
        <LazyLoadImage src={aboutbg} className="h-full w-full object-cover" />

        <div className="absolute inset-0 bg-black/45" />

        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-10">
            <div className="max-w-2xl">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-200 sm:text-xs">
                Local Marketplace
              </p>

              <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
                Fresh goods from nearby sellers, made easier for every
                community.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
                OSYUSO connects customers with local shops offering fresh meat,
                fruits, and vegetables through a simple, trusted marketplace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-14">
        <section className="grid gap-4 lg:grid-cols-[1fr_360px] lg:gap-6">
          <div className="rounded-xl bg-white p-5 shadow-sm sm:p-6 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary sm:text-xs">
              About OSYUSO
            </p>

            <h2 className="mt-3 text-2xl font-bold text-gray-900 md:text-3xl">
              Fresh. Local. Trusted.
            </h2>

            <p className="mt-4 text-sm leading-7 text-gray-600 md:text-base">
              OSYUSO is a local marketplace platform that connects customers
              with nearby sellers of fresh meat, fruits, and vegetables. Our
              goal is to make buying fresh products easier, faster, and more
              reliable for every community.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3 md:gap-4">
              <div className="rounded-lg bg-orange-50 p-4">
                <FiMapPin className="text-xl text-secondary" />
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  Nearby Shops
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Find sellers close to your area.
                </p>
              </div>

              <div className="rounded-lg bg-orange-50 p-4">
                <FiShoppingBag className="text-xl text-secondary" />
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  Fresh Products
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Browse everyday essentials with ease.
                </p>
              </div>

              <div className="rounded-lg bg-orange-50 p-4">
                <FiHeart className="text-xl text-secondary" />
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  Local Trust
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Support sellers in your community.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-secondary p-5 text-white shadow-sm sm:p-6 md:p-8">
            <FiUsers className="text-3xl text-white/90" />

            <h2 className="mt-5 text-2xl font-bold">Built for communities</h2>

            <p className="mt-4 text-sm leading-7 text-white/85">
              We value trust, transparency, and community. OSYUSO is built for
              people who believe in supporting local businesses and enjoying
              fresh, quality products every day.
            </p>
          </div>
        </section>

        <section className="mt-4 grid gap-4 md:mt-6 md:grid-cols-2 md:gap-6">
          <div className="rounded-xl bg-white p-5 shadow-sm sm:p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900">Mission</h3>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              To empower local sellers by providing a digital marketplace where
              they can easily reach customers and grow their business.
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm sm:p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900">Vision</h3>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              To become the leading community-based marketplace for fresh and
              affordable local products in every region.
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-xl bg-white p-5 shadow-sm sm:p-6 md:mt-6 md:p-8">
          <div className="mb-5 md:mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary sm:text-xs">
              Our Way
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              How we serve
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3 md:gap-4">
            <div className="rounded-lg border border-gray-100 p-4 transition hover:border-orange-200 hover:bg-orange-50 sm:p-5">
              <h3 className="font-semibold text-gray-900">Simple</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                We believe in simplicity and integrity, making buying local
                goods straightforward and reliable.
              </p>
            </div>

            <div className="rounded-lg border border-gray-100 p-4 transition hover:border-orange-200 hover:bg-orange-50 sm:p-5">
              <h3 className="font-semibold text-gray-900">Happy</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                We create a friendly marketplace experience that makes everyday
                shopping feel easier.
              </p>
            </div>

            <div className="rounded-lg border border-gray-100 p-4 transition hover:border-orange-200 hover:bg-orange-50 sm:p-5">
              <h3 className="font-semibold text-gray-900">Together</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                We strengthen local commerce by connecting customers, sellers,
                and communities.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AboutCostumer;
