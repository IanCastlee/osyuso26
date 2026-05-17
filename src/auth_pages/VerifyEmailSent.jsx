import React from "react";
import { useNavigate } from "react-router-dom";

function VerifyEmailSent() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📧</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">Verify Your Email</h1>

        <p className="text-sm text-gray-500 mt-3 leading-6">
          We sent a verification link to your email address. Please make sure to
          open the same email account you used during registration.
        </p>

        <p className="text-xs text-gray-400 mt-2">
          If you can't find the email, check your spam or junk folder.
        </p>

        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center justify-center w-full h-11 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          Open Gmail
        </a>
      </div>
    </div>
  );
}

export default VerifyEmailSent;
