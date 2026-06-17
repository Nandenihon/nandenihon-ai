import React from "react";

function CtaSection() {
  return (
    <div className="bg-[#FEF6DB] ">
      <div className="py-15 px-6   mx-auto max-w-7xl flex flex-col lg:flex-row justify-between items-center gap-10 lg:gap-0 ">
        <div className="text-left">
          <h1 className="leading-[48px] text-xl lg:text-[32px] font-bold">
            Mulai Belajar Hari Ini Biar Jepang Nggak Cuma
            <br className="hidden lg:block" /> Sebatas Mimpi!
          </h1>
          <p className="text-base lg:text-lg text-gray-600 mt-6 leading-6">
            Berangkat dari mimpi sederhana bersama Nande Nihon. Kamu nggak
            belajar sendirian. Kamu bakalan belajar dalam lingkungan yang
            suportif, responsif, dan kooperatif. Sudah sampai sini, kan?
            Sekarang, ambil aksi pertama dan biarkan Nande Nihon membantumu
            mewujudkannya!
          </p>
        </div>
        <div className="flex flex-col  gap-4 w-full lg:w-auto">
          <button className="btn justify-center w-full sm:w-auto text-nowrap">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.217 3.49999C13.5242 3.17113 12.7669 3.00052 12 3.00052C11.2331 3.00052 10.4758 3.17113 9.78301 3.49999L5.48901 5.51199C5.98409 5.56466 6.44772 5.78005 6.80728 6.12442C7.16684 6.4688 7.40203 6.9227 7.476 7.41504C7.54998 7.90739 7.45857 8.41037 7.21609 8.8452C6.97361 9.28003 6.59375 9.62216 6.13601 9.81799L5.06001 10.279C4.52601 10.509 4.22301 10.641 4.01801 10.746L4.01501 10.796L9.78301 13.5C10.4758 13.8289 11.2331 13.9995 12 13.9995C12.7669 13.9995 13.5242 13.8289 14.217 13.5L20.908 10.363C22.364 9.68099 22.364 7.31899 20.908 6.63699L14.217 3.49999Z"
                fill="#F9F9F9"
              />
              <path
                d="M5.545 8.44C5.728 8.36177 5.87242 8.21404 5.9465 8.02931C6.02058 7.84459 6.01824 7.638 5.94 7.455C5.86176 7.27201 5.71403 7.12758 5.52931 7.0535C5.34458 6.97943 5.138 6.98177 4.955 7.06L3.843 7.537C3.286 7.776 2.813 7.978 2.443 8.187C2.048 8.409 1.709 8.66901 1.454 9.05501C1.2 9.441 1.094 9.85501 1.046 10.305C1 10.729 1 11.243 1 11.85V14.751C1 14.9499 1.07902 15.1407 1.21967 15.2813C1.36032 15.422 1.55109 15.501 1.75 15.501C1.94891 15.501 2.13968 15.422 2.28033 15.2813C2.42098 15.1407 2.5 14.9499 2.5 14.751V11.889C2.5 11.233 2.501 10.801 2.537 10.468C2.571 10.153 2.63 9.998 2.707 9.882C2.782 9.767 2.902 9.651 3.178 9.495C3.47 9.331 3.867 9.16001 4.47 8.90201L5.545 8.44Z"
                fill="#F9F9F9"
              />
              <path
                opacity="0.5"
                d="M5 11.258L9.783 13.5C10.4758 13.8289 11.2331 13.9995 12 13.9995C12.7669 13.9995 13.5242 13.8289 14.217 13.5L19 11.258V16.625C19 17.633 18.497 18.577 17.615 19.065C16.146 19.88 13.796 21 12 21C10.204 21 7.854 19.879 6.385 19.065C5.504 18.577 5 17.633 5 16.625V11.258Z"
                fill="#F9F9F9"
              />
            </svg>
            Gabung Sekarang
          </button>
          <button className="bg-white text-primary-base border-primary-base border btn justify-center w-full sm:w-auto">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                opacity="0.5"
                d="M13.629 20.472L13.087 21.388C12.604 22.204 11.397 22.204 10.913 21.388L10.371 20.472C9.951 19.762 9.741 19.406 9.403 19.21C9.065 19.013 8.64 19.006 7.79 18.991C6.534 18.97 5.747 18.893 5.087 18.619C4.48037 18.3677 3.92917 17.9994 3.46487 17.5351C3.00057 17.0708 2.63227 16.5196 2.381 15.913C2 14.995 2 13.83 2 11.5V10.5C2 7.227 2 5.59 2.737 4.388C3.14904 3.7152 3.71445 3.14945 4.387 2.737C5.59 2 7.228 2 10.5 2H13.5C16.773 2 18.41 2 19.613 2.737C20.2854 3.14917 20.8508 3.71456 21.263 4.387C22 5.59 22 7.228 22 10.5V11.5C22 13.83 22 14.995 21.62 15.913C21.3686 16.5197 21.0002 17.071 20.5357 17.5353C20.0712 17.9996 19.5198 18.3678 18.913 18.619C18.253 18.893 17.466 18.969 16.21 18.991C15.36 19.006 14.935 19.013 14.597 19.21C14.259 19.406 14.049 19.761 13.629 20.472Z"
                fill="#2563EB"
              />
              <path
                d="M10.99 14.308C9.663 13.33 7.5 11.468 7.5 9.71501C7.5 7.03801 9.975 6.03801 12 8.10601C14.025 6.03801 16.5 7.03801 16.5 9.71501C16.5 11.467 14.337 13.33 13.01 14.308C12.556 14.643 12.329 14.81 12 14.81C11.671 14.81 11.444 14.643 10.99 14.308Z"
                fill="#2563EB"
              />
            </svg>
            Konsultasi Gratis
          </button>
        </div>
      </div>
    </div>
  );
}

export default CtaSection;
