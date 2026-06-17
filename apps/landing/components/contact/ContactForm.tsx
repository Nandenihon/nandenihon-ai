import ContactField from "./ContactField";
import ContactTextarea from "./ContactTextarea";

export default function ContactForm() {
  return (
    <div className="flex w-full flex-col gap-6 pt-8 pb-8">
      <div className="flex w-full flex-col gap-4 md:flex-row">
        <ContactField
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.0001 8.33463C11.841 8.33463 13.3334 6.84225 13.3334 5.0013C13.3334 3.16035 11.841 1.66797 10.0001 1.66797C8.15913 1.66797 6.66675 3.16035 6.66675 5.0013C6.66675 6.84225 8.15913 8.33463 10.0001 8.33463Z"
                fill="#2563EB"
              />
              <path
                opacity="0.5"
                d="M16.6666 14.582C16.6666 16.6529 16.6666 18.332 9.99992 18.332C3.33325 18.332 3.33325 16.6529 3.33325 14.582C3.33325 12.5112 6.31825 10.832 9.99992 10.832C13.6816 10.832 16.6666 12.5112 16.6666 14.582Z"
                fill="#2563EB"
              />
            </svg>
          }
          label="Nama Kamu"
          placeholder="masukan nama kamu"
        />

        <ContactField
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
                d="M3.33341 3.33203H16.6667C17.5834 3.33203 18.3334 4.08203 18.3334 4.9987V14.9987C18.3334 15.9154 17.5834 16.6654 16.6667 16.6654H3.33341C2.41675 16.6654 1.66675 15.9154 1.66675 14.9987V4.9987C1.66675 4.08203 2.41675 3.33203 3.33341 3.33203Z"
                fill="#2563EB"
              />
              <path
                d="M10.0001 11.6654L1.66675 5.8317V5.3317C1.66675 4.22713 2.56218 3.3327 3.66675 3.3327H16.3334C17.438 3.3327 18.3334 4.22713 18.3334 5.3317V5.8317L10.0001 11.6654Z"
                fill="#2563EB"
              />
            </svg>
          }
          label="Email Kamu"
          placeholder="masukan email kamu"
        />
      </div>

      <ContactField
        label="Subject"
        placeholder="Apa yang ingin kamu sampaikan"
      />

      <ContactTextarea
        label="Apa Pesan Kamu?"
        placeholder="Apa yang ingin kamu sampaikan"
      />

      <button className="h-[52px] w-full rounded-md bg-blue-600 px-6 py-2 text-white md:w-[160px]">
        Kirim Pesan
      </button>
    </div>
  );
}