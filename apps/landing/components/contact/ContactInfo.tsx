export default function ContactInfo() {
  return (
    <div className="relative flex min-h-[492px] w-full flex-col gap-[35px] overflow-hidden rounded-[16px] bg-[#2F5BD3] p-6 text-white lg:h-[492px] lg:w-[440px] lg:shrink-0">
      <div className="relative z-10">
        <h2 className="mb-3 self-stretch text-[24px] font-bold leading-[40px] text-white">
          Informasi Kontak
        </h2>

        <p className="mb-[35px] max-w-[392px] self-stretch text-[16px] font-normal leading-[24px] text-white">
          Punya pertanyaan seputar kelas atau pendaftaran?
          <br />
          Kami siap bantu.
        </p>

        <div className="mt-[35px] flex flex-col gap-[32px]">
          {/* EMAIL */}
          <div className="flex items-center gap-2">
            <div className="shrink-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  opacity="0.5"
                  d="M4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4Z"
                  fill="#f9f9f9"
                />
                <path
                  d="M12 14L2 7V6C2 4.89543 2.89543 4 4 4H20C21.1046 4 22 4.89543 22 6V7L12 14Z"
                  fill="#f9f9f9"
                />
              </svg>
            </div>

            <p className="min-w-0 flex-1 break-words text-[16px] font-semibold leading-[24px] text-white sm:text-[18px] sm:leading-[28px] lg:text-[20px] lg:leading-[32px]">
              Nandenihon6@gmail.com
            </p>
          </div>

          {/* WHATSAPP */}
          <div className="flex items-center gap-2">
            <div className="shrink-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g opacity="0.5">
                  <path
                    d="M19.071 4.92891C17.1822 3.04016 14.671 2 11.9999 2C9.32906 2 6.81758 3.04027 4.92891 4.92891C3.0402 6.81766 2 9.32887 2 12C2.00008 13.7004 2.43281 15.3716 3.25359 16.8497L2.02164 21.2563C1.96469 21.46 2.02203 21.6787 2.17164 21.8283C2.32125 21.9779 2.53984 22.0352 2.74375 21.9783L7.15043 20.7463C8.6284 21.5672 10.2995 22 12 22C14.6711 22 17.1823 20.9598 19.0711 19.0711C20.9599 17.1823 22 14.6711 22 12C21.9999 9.32883 20.9597 6.81766 19.071 4.92891Z"
                    fill="#f9f9f9"
                  />
                </g>
                <path
                  d="M10.7735 7.82265L11.1792 8.54953C11.5448 9.20578 11.3979 10.0658 10.8217 10.6427C10.8217 10.6427 10.1217 11.342 11.3904 12.6102C12.6573 13.8771 13.3573 13.1789 13.3573 13.1789C13.9342 12.6021 14.7948 12.4552 15.4504 12.8208L16.1773 13.2271C17.1679 13.7796 17.2848 15.1683 16.4142 16.0396C15.8911 16.5621 15.2498 16.9696 14.5417 16.9958C13.3492 17.0415 11.3235 16.7396 9.29167 14.7083C7.26041 12.6764 6.95854 10.6508 7.00416 9.45828C7.03104 8.75015 7.43791 8.1089 7.96041 7.58577C8.83167 6.71514 10.2204 6.83201 10.7729 7.82327"
                  fill="#f9f9f9"
                />
              </svg>
            </div>

            <p className="min-w-0 flex-1 break-words text-[16px] font-semibold leading-[24px] text-white sm:text-[18px] sm:leading-[28px] lg:text-[20px] lg:leading-[32px]">
              +62 812-9923-6462
            </p>
          </div>

          {/* INSTAGRAM */}
          <div className="flex items-center gap-2">
            <div className="shrink-0">
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
                  fill="#f9f9f9"
                />
                <path
                  d="M12 7.5C9.51865 7.5 7.5 9.51865 7.5 12C7.5 14.4813 9.51865 16.5 12 16.5C14.4813 16.5 16.5 14.4813 16.5 12C16.5 9.51865 14.4813 7.5 12 7.5Z"
                  fill="#f9f9f9"
                />
                <path
                  d="M17.5 5.5C18.051 5.50004 18.5 5.94907 18.5 6.5C18.5 7.05096 18.051 7.49996 17.5 7.5C16.9491 7.5 16.5 7.05104 16.5 6.5C16.5 5.9491 16.949 5.5 17.5 5.5Z"
                  stroke="#f9f9f9"
                />
              </svg>
            </div>

            <p className="min-w-0 flex-1 break-words text-[16px] font-semibold leading-[24px] text-white sm:text-[18px] sm:leading-[28px] lg:text-[20px] lg:leading-[32px]">
              @nandenihon
            </p>
          </div>
        </div>
      </div>

      {/* VECTOR */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-[190px] w-full overflow-hidden opacity-30"
           style={{
            clipPath:  "path('M 0 80 Q 220 -20 500 20 L 500 200 L 0 200 Z')",
            }}
      >
        <img
           src="/images/vector-contact.png"
           alt="Vector"
           className="absolute bottom-[-10px] left-1/2 w-[115%] -translate-x-1/2"
          />
      </div>
    </div>
  );
}