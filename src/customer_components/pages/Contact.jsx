import React, { useMemo } from "react";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
  FiMessageCircle,
} from "react-icons/fi";
import { FaFacebookF } from "react-icons/fa";

import useGetData from "../../hooks/useGetData";

const FALLBACK_SETTINGS = {
  email: "osyuso38@gmail.com",
  phone: "+63 912 345 6789",
  fb_url: "https://www.facebook.com/osyuso",
};

function Contact() {
  const { data, loading } = useGetData("admin_setting/get-public-settings.php");

  const settings = useMemo(() => {
    const payload = data?.data || data || {};

    return {
      email: payload.email || FALLBACK_SETTINGS.email,
      phone: payload.phone || FALLBACK_SETTINGS.phone,
      fb_url: payload.fb_url || FALLBACK_SETTINGS.fb_url,
    };
  }, [data]);

  const facebookUrl = settings.fb_url?.startsWith("http")
    ? settings.fb_url
    : `https://${settings.fb_url}`;

  const phoneHref = `tel:${String(settings.phone).replace(/[^\d+]/g, "")}`;

  const contactItems = [
    {
      label: "Email",
      value: settings.email,
      description: "Send us your questions or concerns.",
      href: `mailto:${settings.email}`,
      icon: FiMail,
      color: "bg-orange-50 text-secondary",
    },
    {
      label: "Phone",
      value: settings.phone,
      description: "Call us for urgent support.",
      href: phoneHref,
      icon: FiPhone,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Facebook",
      value: "OSYUSO Official",
      description: "Visit our official Facebook page.",
      href: facebookUrl,
      icon: FaFacebookF,
      color: "bg-blue-50 text-blue-700",
      external: true,
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
                OSYUSO Support
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                Contact Us
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Need help with your account, order, vendor shop, or marketplace
                concern? Reach out to our team through any of the contact
                channels below.
              </p>
            </div>

            <div className="rounded-lg bg-orange-50 px-4 py-3 text-sm font-semibold text-secondary">
              Monday to Sunday Support
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-secondary">
                <FiMessageCircle />
                Contact OSYUSO
              </div>

              <h2 className="mt-5 text-2xl font-bold text-slate-950 sm:text-3xl">
                We're here to help
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Reach out to OSYUSO for account concerns, marketplace support,
                vendor inquiries, or general questions. Choose any contact
                channel below.
              </p>

              <div className="mt-8 grid gap-3">
                {contactItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noreferrer" : undefined}
                      className="group flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-secondary/40 hover:bg-slate-50"
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${item.color}`}
                      >
                        <Icon className="text-lg" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-950">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block break-words text-sm font-medium text-slate-700">
                          {loading ? "Loading..." : item.value}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {item.description}
                        </span>
                      </span>

                      <FiSend className="shrink-0 text-slate-400 transition group-hover:text-secondary" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-orange-400 bg-orange-500 p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/75">
                    Support Hours
                  </p>

                  <h2 className="mt-3 text-xl font-bold text-white">
                    Monday to Sunday
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/90">
                    Our team monitors messages regularly. For order-related
                    concerns, please include your order reference or account
                    email so we can assist you faster.
                  </p>
                </div>

                <div className="rounded-lg border border-white/25 bg-white/15 p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-orange-600">
                      <FiMapPin />
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        OSYUSO Marketplace
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/85">
                        Local marketplace support for customers, vendors, and
                        administrators.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs font-medium text-white/70">
                  © OSYUSO. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Contact;
