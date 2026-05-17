import React from "react";
import { useNavigate } from "react-router-dom";
import { PiShoppingCartSimpleFill } from "react-icons/pi";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";

function CustomerFooter() {
  const navigate = useNavigate();

  const links = [
    { label: "Home", path: "/" },
    { label: "Markets", path: "/all-markets" },
    { label: "Categories", path: "/all-categories" },
    { label: "About", path: "/about" },
    { label: "FAQ", path: "/faq" },
  ];

  return (
    <footer className="w-full bg-secondary text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-10">
        <div>
          <h2 className="flex items-center text-xl font-bold tracking-wide">
            OSY
            <PiShoppingCartSimpleFill className="mx-1" />
            SO
          </h2>

          <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">
            Your trusted marketplace for fresh, quality products from local
            sellers near your community.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Quick Links</h3>

          <div className="mt-3 grid gap-2">
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="w-fit text-left text-sm text-white/75 transition hover:text-white"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Contact</h3>

          <div className="mt-3 grid gap-3 text-sm text-white/75">
            <div className="flex items-center gap-2">
              <FiMail className="shrink-0 text-white/60" />
              <span>support@osyuso.com</span>
            </div>

            <div className="flex items-center gap-2">
              <FiPhone className="shrink-0 text-white/60" />
              <span>+63 900 123 4567</span>
            </div>

            <div className="flex items-start gap-2">
              <FiMapPin className="mt-0.5 shrink-0 text-white/60" />
              <span>Bulusan, Sorsogon, Philippines</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} OSYUSO. All rights reserved.
      </div>
    </footer>
  );
}

export default CustomerFooter;
