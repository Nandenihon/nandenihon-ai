import React from "react";
import Image from "next/image";
import { title } from "process";
import Link from "next/link";
import FormInput from "../ui/FormInput";

function NewFooter() {
  const links = [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Tentang",
      href: "/Tentang",
    },
    {
      title: "Kelas",
      href: "/class",
    },
    {
      title: "Artikel",
      href: "/blog/",
    },
    {
      title: "Kontak",
      href: "/contact",
    },
  ];
  return (
    <footer>
      <div className="bg-[#A8C1F7] py-15 ">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex lg:flex-row flex-col lg:justify-between lg:space-y-0 space-y-10">
            <div className="lg:w-95 w-full">
              <div className="relative h-13 w-29">
                <Image
                  src="/images/logo-nandenihon.png"
                  alt="Nande Nihon Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
              <h3 className="mt-2 text-xl font-bold">
                Temukan Dunia Jepang Bersama Kami
              </h3>
              <div className="mt-10 py-2 space-x-4 border-t-2 border-primary-base">
                {links.map((link) => (
                  <Link
                    key={link.title}
                    href={link.href}
                    className="sm:text-lg text-base text-gray-900"
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>
            <div className="lg:w-[320px] w-full">
              <h3 className="text-2xl font-bold text-gray-900">Kontak Kami</h3>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      opacity="0.5"
                      d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                      fill="#2563EB"
                    />
                    <path
                      d="M12 14L2 7V6C2 4.89543 2.89543 4 4 4H20C21.1046 4 22 4.89543 22 6V7L12 14Z"
                      fill="#2563EB"
                    />
                  </svg>
                  <p className="text-lg font-semibold">Nandenihon6@gmail.com</p>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g opacity="0.5">
                      <path
                        d="M19.071 4.92891C17.1822 3.04016 14.671 2 11.9999 2C11.9998 2 12.0001 2 11.9999 2C9.32906 2 6.81758 3.04027 4.92891 4.92891C3.0402 6.81766 2 9.32887 2 12C2.00008 13.7004 2.43281 15.3716 3.25359 16.8497L2.02164 21.2563C1.96469 21.46 2.02203 21.6787 2.17164 21.8283C2.32125 21.9779 2.53984 22.0352 2.74375 21.9783L7.15043 20.7463C8.6284 21.5672 10.2995 22 12 22C14.6711 22 17.1823 20.9598 19.0711 19.0711C20.9599 17.1823 22 14.6711 22 12C21.9999 9.32883 20.9597 6.81766 19.071 4.92891ZM11.9999 20.8281C10.4239 20.8281 8.87691 20.4073 7.52605 19.6113C7.43508 19.5577 7.33227 19.5302 7.22859 19.5302C7.1757 19.5302 7.12266 19.5373 7.07082 19.5518L3.43043 20.5695L4.44816 16.9293C4.49109 16.7757 4.46961 16.6114 4.38871 16.4741C3.5927 15.123 3.17195 13.5759 3.17188 12C3.17188 9.64188 4.09016 7.42496 5.75758 5.75754C7.425 4.09012 9.64191 3.17188 11.9999 3.17188C16.8677 3.17188 20.828 7.13215 20.8281 12C20.8281 16.8678 16.8678 20.8281 11.9999 20.8281Z"
                        fill="#2563EB"
                      />
                      <path
                        d="M11.9999 20.8281C10.4239 20.8281 8.87691 20.4073 7.52605 19.6113C7.43508 19.5577 7.33227 19.5302 7.22859 19.5302C7.1757 19.5302 7.12266 19.5373 7.07082 19.5518L3.43043 20.5695L4.44816 16.9293C4.49109 16.7757 4.46961 16.6114 4.38871 16.4741C3.5927 15.123 3.17195 13.5759 3.17188 12C3.17188 9.64188 4.09016 7.42496 5.75758 5.75754C7.425 4.09012 9.64191 3.17188 11.9999 3.17188C16.8677 3.17188 20.828 7.13215 20.8281 12C20.8281 16.8678 16.8678 20.8281 11.9999 20.8281Z"
                        fill="#2563EB"
                      />
                    </g>
                    <path
                      d="M10.7735 7.82265L11.1792 8.54953C11.5448 9.20578 11.3979 10.0658 10.8217 10.6427C10.8217 10.6427 10.1217 11.342 11.3904 12.6102C12.6573 13.8771 13.3573 13.1789 13.3573 13.1789C13.9342 12.6021 14.7948 12.4552 15.4504 12.8208L16.1773 13.2271C17.1679 13.7796 17.2848 15.1683 16.4142 16.0396C15.8911 16.5621 15.2498 16.9696 14.5417 16.9958C13.3492 17.0415 11.3235 16.7396 9.29167 14.7083C7.26041 12.6764 6.95854 10.6508 7.00416 9.45828C7.03104 8.75015 7.43791 8.1089 7.96041 7.58577C8.83167 6.71514 10.2204 6.83201 10.7729 7.82327"
                      fill="#2563EB"
                    />
                  </svg>

                  <p className="text-lg font-semibold">+62 812-9923-6462</p>
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
                      opacity="0.5"
                      d="M16.5862 2H7.41382C4.42859 2 2 4.42859 2 7.41382V16.5863C2 19.5714 4.42859 22 7.41382 22H16.5863C19.5714 22 22 19.5714 22 16.5863V7.41382C22 4.42859 19.5714 2 16.5862 2Z"
                      fill="#2563EB"
                    />
                    <path
                      d="M12 7.5C9.51865 7.5 7.5 9.51865 7.5 12C7.5 14.4813 9.51865 16.5 12 16.5C14.4813 16.5 16.5 14.4813 16.5 12C16.5 9.51865 14.4813 7.5 12 7.5Z"
                      fill="#2563EB"
                    />
                    <path
                      d="M17.5 5.5C18.051 5.50004 18.5 5.94907 18.5 6.5C18.5 7.05096 18.051 7.49996 17.5 7.5C16.9491 7.5 16.5 7.05104 16.5 6.5C16.5 5.9491 16.949 5.5 17.5 5.5ZM17.5 5.58789C17.0283 5.58789 16.6393 5.94743 16.5928 6.40723L16.5879 6.5L16.5928 6.59277C16.6394 7.05231 17.0283 7.41113 17.5 7.41113C18.003 7.41109 18.4121 7.0031 18.4121 6.5C18.4121 6.02795 18.0523 5.63932 17.5928 5.59277L17.5 5.58789Z"
                      stroke="#2563EB"
                    />
                  </svg>

                  <p className="text-lg font-semibold">@nandenihon</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-15 lg:w-150 flex items-end gap-5 mx-auto">
            <FormInput
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    opacity="0.5"
                    d="M3.33341 3.33331H16.6667C17.5834 3.33331 18.3334 4.08331 18.3334 4.99998V15C18.3334 15.9166 17.5834 16.6666 16.6667 16.6666H3.33341C2.41675 16.6666 1.66675 15.9166 1.66675 15V4.99998C1.66675 4.08331 2.41675 3.33331 3.33341 3.33331Z"
                    fill="#2563EB"
                  />
                  <path
                    d="M10.0001 11.6666L1.66675 5.83331V5.33331C1.66675 4.22874 2.56218 3.33331 3.66675 3.33331H16.3334C17.438 3.33331 18.3334 4.22874 18.3334 5.33331V5.83331L10.0001 11.6666Z"
                    fill="#2563EB"
                  />
                </svg>
              }
              label="Tetap Terhubung"
              placeholder="Masukan Email Anda disini"
            />
            <button className="btn bg-white border border-primary-base text-primary-base">
              Subscribe
            </button>
          </div>
        </div>
      </div>
      <div className="py-4 text-center bg-primary-base">
        <p className="lg:text-lg  text-base font-bold text-white">
          © 2025 Nande Nihon. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default NewFooter;
