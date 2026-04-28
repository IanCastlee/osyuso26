import React from "react";

function CustomerFooter() {
  return (
    <footer className="w-full bg-secondary text-white px-6 py-8 ">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        {/* Brand */}
        <div>
          <h2 className="text-xl font-bold">OSYUSO</h2>
          <p className="text-sm text-white/80 mt-2">
            Your trusted marketplace for fresh and quality products.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Quick Links</h3>
          <span className="text-sm text-white/80 hover:text-white cursor-pointer">
            Home
          </span>
          <span className="text-sm text-white/80 hover:text-white cursor-pointer">
            Markets
          </span>
          <span className="text-sm text-white/80 hover:text-white cursor-pointer">
            Categories
          </span>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Contact</h3>
          <span className="text-sm text-white/80">
            Email: support@osyuso.com
          </span>
          <span className="text-sm text-white/80">Phone: +63 900 123 4567</span>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-8 border-t border-white/20 pt-4 text-center text-sm text-white/70">
        © {new Date().getFullYear()} OSYUSO. All rights reserved.
      </div>
    </footer>
  );
}

export default CustomerFooter;
