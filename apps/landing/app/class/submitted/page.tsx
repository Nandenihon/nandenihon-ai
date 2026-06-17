"use client";

import { Check, Instagram } from "lucide-react";
import Link from "next/link";

export default function SubmittedPage() {
  return (
    <div className="w-full flex justify-center pb-20">
      <div className="w-full max-w-lg bg-white/60 rounded-2xl p-8 md:p-12 text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-green-200 rounded-2xl flex items-center justify-center mb-6 animate-bounce-slow">
          <Check className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terima Kasih</h1>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Formulir Berhasil Dikirim
        </h2>

        <p className="text-gray-600 font-medium mb-8">
          Silakan tunggu konfirmasi selanjutnya dari tim kami.
        </p>

        <Link href="/" className="w-full">
          <button className="w-full border-2 border-primary-base text-primary-base hover:bg-blue-50 font-bold py-3 rounded-lg transition-colors mb-10">
            Kembali ke Halaman Utama
          </button>
        </Link>

        <div className="w-full border-t border-gray-200 pt-8">
          <p className="text-sm font-bold text-gray-900 mb-4">
            Ada pertanyaan? Hubungi kami melalui:
          </p>

          <div className="flex flex-col gap-3 items-center text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 13L2 6L3 4H21L22 6L12 13Z" fill="#9DC1FB" />
                <path
                  d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 6L12 13L2 6"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span>Nandenihon6@gmail.com</span>
            </div>

            <div className="flex items-center gap-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.071 4.92891C17.1822 3.04016 14.671 2 11.9999 2C11.9998 2 12 2 11.9998 2C9.32898 2 6.81758 3.04027 4.92891 4.92891C3.0402 6.81766 2 9.32887 2 12C2.00008 13.7004 2.43281 15.3716 3.25359 16.8497L2.02164 21.2563C1.96469 21.46 2.02203 21.6787 2.17164 21.8283C2.32125 21.9779 2.53984 22.0352 2.74375 21.9783L7.15043 20.7463C8.6284 21.5672 10.2995 22 12 22C14.6711 22 17.1823 20.9598 19.0711 19.0711C20.9599 17.1823 22 14.6711 22 12C21.9999 9.32883 20.9597 6.81766 19.071 4.92891ZM11.9999 20.8281C10.4239 20.8281 8.87691 20.4073 7.52605 19.6113C7.43508 19.5577 7.33227 19.5302 7.22859 19.5302C7.1757 19.5302 7.12266 19.5373 7.07082 19.5518L3.43043 20.5695L4.44816 16.9293C4.49109 16.7757 4.46961 16.6114 4.38871 16.4741C3.5927 15.123 3.17195 13.5759 3.17188 12C3.17188 9.64187 4.09016 7.42496 5.75758 5.75754C7.425 4.09012 9.64191 3.17188 11.9999 3.17188C16.8677 3.17188 20.828 7.13215 20.8281 12C20.8281 16.8678 16.8678 20.8281 11.9999 20.8281Z"
                  fill="#1A1A1A"
                  stroke="#1A1A1A"
                  strokeWidth="0.5"
                />
                <path
                  d="M15.9807 12.717C15.6487 12.3848 15.2059 12.2019 14.734 12.2019C14.2621 12.2019 13.8193 12.3848 13.4874 12.7169L13.2356 12.9688C13.1735 13.0308 13.09 13.0651 13.0006 13.0651C12.9111 13.0651 12.8276 13.0308 12.7654 12.9686L11.0318 11.2347C10.9697 11.1726 10.9355 11.0891 10.9355 10.9996C10.9355 10.9101 10.9696 10.8266 11.0316 10.7646L11.2835 10.5127C11.971 9.82514 11.971 8.70638 11.2836 8.01882L10.7798 7.51483C10.4477 7.1828 10.005 7 9.53309 7C9.0612 7 8.61846 7.18284 8.28639 7.51497L7.91079 7.89071C7.11668 8.68498 6.82843 9.86777 7.09905 11.2213C7.35373 12.4949 8.08172 13.7843 9.14894 14.8518C10.4939 16.1968 12.2067 16.9999 13.731 17H13.7312C14.6916 17 15.5139 16.6855 16.1088 16.0904L16.4844 15.7147C17.1719 15.0272 17.1719 13.9083 16.4844 13.2207L15.9807 12.717ZM15.7163 14.9464L15.3406 15.3221C14.9538 15.709 14.3974 15.9134 13.7313 15.9134H13.7311C12.4886 15.9133 11.0628 15.2293 9.9172 14.0835C8.99993 13.166 8.37743 12.0738 8.16439 11.0082C7.96728 10.0224 8.15005 9.18818 8.67905 8.65904L9.05461 8.28334C9.18146 8.15649 9.35137 8.08663 9.53313 8.08663C9.71495 8.08663 9.88493 8.15649 10.0117 8.28326L10.5154 8.78715C10.7792 9.05108 10.7792 9.48047 10.5154 9.74436L10.2635 9.99627C9.99625 10.2636 9.84908 10.62 9.84912 10.9998C9.84916 11.3795 9.9964 11.7359 10.2636 12.0031L11.9973 13.737C12.2646 14.0045 12.6209 14.1517 13.0006 14.1517C13.3802 14.1517 13.7365 14.0045 14.0037 13.7372L14.2556 13.4853C14.3824 13.3584 14.5523 13.2886 14.734 13.2886C14.9158 13.2886 15.0857 13.3584 15.2126 13.4854L15.7163 13.9891C15.9801 14.253 15.9802 14.6824 15.7163 14.9464Z"
                  fill="#1A1A1A"
                  stroke="#1A1A1A"
                  strokeWidth="0.5"
                />
              </svg>

              <span>+62 812-9923-6462</span>
            </div>

            <div className="flex items-center gap-2">
              <Instagram className="w-5 h-5" />
              <span>@nandenihon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
