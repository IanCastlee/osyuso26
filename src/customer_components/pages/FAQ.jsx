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
    <div>
      <div className="flex justify-between  bg-secondary px-2 lg:px-20 py-6 items-center">
        <div>
          <h1 className="text-sm lg:text-2xl font-bold text-white flex items-center gap-2">
            <AiOutlineQuestionCircle className="text-white" />
            Frequently Asked Questions
          </h1>

          <p className="text-[10px] lg:text-sm text-gray-200 mt-1 leading-relaxed">
            Find quick answers about ordering, payments, and OSYUSO.
          </p>
        </div>

        {/* LANGUAGE TOGGLE */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1 text-xs rounded-md border transition ${
              lang === "en"
                ? "bg-secondary text-white border-secondary"
                : "bg-white text-gray-600"
            }`}
          >
            EN
          </button>

          <button
            onClick={() => setLang("tl")}
            className={`px-3 py-1 text-xs rounded-md border transition ${
              lang === "tl"
                ? "bg-secondary text-white border-secondary"
                : "bg-white text-gray-600"
            }`}
          >
            TL
          </button>
        </div>
      </div>
      <div className="w-full bg-gray-100 min-h-[calc(100vh-4rem)] px-6 md:px-28 py-8 pt-10">
        {/* HEADER */}

        {/* FAQ LIST */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-xs shadow-xs border border-gray-100 overflow-hidden"
            >
              {/* QUESTION */}
              <button
                onClick={() => toggle(faq.id)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition"
              >
                <span className="font-medium text-primary">
                  {faq.question[lang]}
                </span>

                <IoIosArrowDown
                  className={`text-secondary transition-transform duration-300 ${
                    openId === faq.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* ANSWER */}
              <div
                className={`px-4 pb-4 text-sm text-gray-600 transition-all duration-300 ${
                  openId === faq.id ? "block" : "hidden"
                }`}
              >
                {faq.answer[lang]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FAQ;
