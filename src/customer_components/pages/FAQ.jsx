import React, { useState } from "react";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { IoIosArrowDown } from "react-icons/io";

const faqs = [
  {
    id: 1,
    question: {
      en: "What is OSYUSO?",
      tl: "Ano ang OSYUSO?",
    },
    answer: {
      en: "OSYUSO is a local marketplace platform where you can buy fresh meat, fruits, and vegetables directly from local sellers in your area.",
      tl: "Ang OSYUSO ay isang lokal na marketplace kung saan maaari kang bumili ng sariwang karne, prutas, at gulay mula sa mga lokal na tindero.",
    },
  },
  {
    id: 2,
    question: {
      en: "How do I place an order?",
      tl: "Paano mag-order?",
    },
    answer: {
      en: "Simply browse products, select weight (kg), add to cart, and proceed to checkout.",
      tl: "Mag-browse ng produkto, pumili ng timbang (kg), ilagay sa cart, at mag-checkout.",
    },
  },
  {
    id: 3,
    question: {
      en: "Can I buy half kilo products?",
      tl: "Maaari ba akong bumili ng kalahating kilo?",
    },
    answer: {
      en: "Yes! You can select 0.5 kg, 1 kg, or more depending on your needs.",
      tl: "Oo! Maaari kang pumili ng 0.5 kg, 1 kg, o higit pa ayon sa iyong pangangailangan.",
    },
  },
  {
    id: 4,
    question: {
      en: "How does delivery work?",
      tl: "Paano ang delivery?",
    },
    answer: {
      en: "Orders are processed by local sellers and delivered based on your location and availability.",
      tl: "Ang orders ay inaasikaso ng mga seller at ide-deliver depende sa iyong lokasyon at availability.",
    },
  },
  {
    id: 5,
    question: {
      en: "Is payment cash or online?",
      tl: "Cash ba o online ang bayad?",
    },
    answer: {
      en: "Currently, most sellers accept cash on delivery, with online payments coming soon.",
      tl: "Sa ngayon, cash on delivery ang karamihan, ngunit magkakaroon din ng online payment soon.",
    },
  },
];

function FAQ() {
  const [openId, setOpenId] = useState(null);
  const [lang, setLang] = useState("en");

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100">
      <section className="bg-secondary px-4 py-8 text-white sm:px-6 md:px-10 lg:px-28">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
                <AiOutlineQuestionCircle className="text-2xl" />
              </div>

              <div>
                <h1 className="text-xl font-bold sm:text-2xl">
                  Frequently Asked Questions
                </h1>
                <p className="mt-1 text-sm leading-6 text-white/80">
                  Find quick answers about ordering, payments, and OSYUSO.
                </p>
              </div>
            </div>
          </div>

          <div className="inline-flex w-fit rounded-lg bg-white/10 p-1">
            <button
              onClick={() => setLang("en")}
              className={`rounded-md px-4 py-2 text-xs font-semibold transition ${
                lang === "en"
                  ? "bg-white text-secondary shadow-sm"
                  : "text-white/75 hover:text-white"
              }`}
            >
              EN
            </button>

            <button
              onClick={() => setLang("tl")}
              className={`rounded-md px-4 py-2 text-xs font-semibold transition ${
                lang === "tl"
                  ? "bg-white text-secondary shadow-sm"
                  : "text-white/75 hover:text-white"
              }`}
            >
              TL
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:px-10 lg:px-0 lg:py-10">
        <div className="space-y-3">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100"
              >
                <button
                  onClick={() => toggle(faq.id)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-gray-50 sm:px-5"
                >
                  <span className="text-sm font-semibold text-gray-900 sm:text-base">
                    {faq.question[lang]}
                  </span>

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-secondary transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <IoIosArrowDown />
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 pb-5 pt-4 sm:px-5">
                    <p className="text-sm leading-7 text-gray-600">
                      {faq.answer[lang]}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default FAQ;
