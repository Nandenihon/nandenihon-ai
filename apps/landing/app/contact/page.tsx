import ContactForm from "@/components/contact/ContactForm";
import ContactInfo from "@/components/contact/ContactInfo";

export default function ContactPage() {
  return (
    <main>
      <div className="h-[250px] bg-[#4A74D0]/35 md:h-[360px] lg:h-[430px]" />

      <section className="bg-white px-4 pt-[60px] pb-[60px] md:px-10 lg:px-[160px]">
        <div className="-mt-[120px] mx-auto flex w-full max-w-[1120px] flex-col gap-6 rounded-[16px] bg-white p-4 md:-mt-[200px] lg:-mt-[295px] lg:min-h-[524px] lg:flex-row lg:gap-10">
          <ContactInfo />
          <ContactForm />
        </div>
      </section>
    </main>
  );
}