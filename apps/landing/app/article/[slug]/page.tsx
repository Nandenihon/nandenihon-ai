import { getAllArticles, getArticleBySlug } from "@/data/articles";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/article/Breadcrumb";
import ArticleSidebar from "@/components/article/ArticleSidebar";
import CommentSection from "@/components/article/CommentSection";
import RelatedArticlesGrid from "@/components/article/RelatedArticlesGrid";
import NewsletterBanner from "@/components/article/NewsletterBanner";
import { CategoryTag } from "@repo/ui";

const socialIcons = [
  {
    name: "facebook",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_fb)">
          <path
            d="M24 12C24 5.37262 18.6274 0 12 0C5.37262 0 0 5.37262 0 12C0 17.6278 3.87431 22.3498 9.10106 23.6466V15.6669H6.62663V12H9.10106V10.4199C9.10106 6.33544 10.9494 4.44244 14.9593 4.44244C15.7196 4.44244 17.0314 4.59131 17.568 4.74056V8.06475C17.2849 8.03494 16.7929 8.01994 16.1816 8.01994C14.214 8.01994 13.4537 8.76525 13.4537 10.7031V12H17.3734L16.7001 15.6669H13.4537V23.9121C19.3956 23.1945 24 18.1352 24 12Z"
            fill="#0766FF"
          />
          <path
            d="M16.7 15.6661L17.3733 11.9992H13.4538V10.7022C13.4538 8.76441 14.214 8.01909 16.1816 8.01909C16.7928 8.01909 17.2848 8.03391 17.568 8.06372V4.73972C17.0313 4.59047 15.7196 4.44141 14.9593 4.44141C10.9494 4.44141 9.10102 6.33459 9.10102 10.4191V11.9992H6.62659V15.6661H9.10102V23.6457C10.0295 23.8762 11.0002 23.9992 12 23.9992C12.4921 23.9992 12.977 23.9688 13.4538 23.9112V15.6661"
            fill="white"
          />
        </g>
        <defs>
          <clipPath id="clip0_fb">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
    link: "#",
  },
  {
    name: "whatsapp",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M20.3898 3.48501C18.1465 1.23878 15.1628 0.00113964 11.9838 0C5.43322 0 0.101997 5.33065 0.099718 11.883C0.0985783 13.9776 0.646174 16.0221 1.68609 17.8239L0 23.9825L6.29991 22.33C8.03556 23.2771 9.99003 23.7756 11.9787 23.7762H11.9838C18.5333 23.7762 23.8651 18.445 23.8674 11.8927C23.8685 8.7171 22.6337 5.7318 20.3898 3.48558V3.48501ZM11.9838 21.7693H11.9798C10.2077 21.7688 8.46922 21.2924 6.95238 20.3926L6.59166 20.1784L2.85308 21.159L3.85083 17.5139L3.61606 17.1401C2.62743 15.5674 2.10491 13.7497 2.10605 11.8836C2.10833 6.43781 6.53923 2.0069 11.9879 2.0069C14.6261 2.00804 17.106 3.03656 18.9709 4.90386C20.836 6.77059 21.8622 9.25273 21.8611 11.8915C21.8588 17.3379 17.4279 21.7688 11.9838 21.7688V21.7693ZM17.4017 14.372C17.1048 14.2232 15.645 13.5052 15.3725 13.4061C15.1002 13.3069 14.9025 13.2574 14.7047 13.5548C14.507 13.8523 13.9378 14.5213 13.7645 14.719C13.5913 14.9173 13.4181 14.9418 13.1212 14.793C12.8244 14.6443 11.8676 14.3309 10.7331 13.3195C9.85048 12.532 9.25439 11.5599 9.08122 11.2624C8.90798 10.965 9.06298 10.8043 9.21109 10.6567C9.34442 10.5234 9.50798 10.3097 9.65668 10.1365C9.80546 9.96325 9.85445 9.83907 9.95357 9.6413C10.0528 9.44301 10.0032 9.26983 9.92911 9.12106C9.85498 8.97235 9.26128 7.51074 9.01339 6.91644C8.77233 6.33752 8.52736 6.41615 8.34557 6.40647C8.17233 6.39792 7.97463 6.39621 7.77633 6.39621C7.57803 6.39621 7.25662 6.47029 6.98427 6.76774C6.71191 7.06515 5.94491 7.78369 5.94491 9.24471C5.94491 10.7057 7.0088 12.1183 7.1575 12.3166C7.30621 12.5149 9.25154 15.5139 12.23 16.8005C12.9383 17.1065 13.4916 17.2894 13.9229 17.4262C14.6341 17.6524 15.2814 17.6205 15.7931 17.5441C16.3635 17.4587 17.5498 16.8256 17.7971 16.1321C18.0444 15.4386 18.0444 14.8437 17.9704 14.7201C17.8963 14.5964 17.698 14.5218 17.4011 14.3731L17.4017 14.372Z"
          fill="#25D366"
        />
      </svg>
    ),
    link: "#",
  },
  {
    name: "instagram",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_ig)">
          <path
            d="M13.0984 0H14.6528L15.6684 0.0207254L16.4974 0.0414508L16.9326 0.0621762C18.2176 0.124352 19.0881 0.331606 19.8342 0.621762C20.6218 0.932643 21.285 1.34715 21.9689 2.01036C22.6321 2.67358 23.0466 3.35751 23.3575 4.14508C23.6269 4.82902 23.8135 5.59585 23.8964 6.65285L23.9585 7.79275L23.9793 8.87047L24 10.9223V14.7772L23.9793 15.9793L23.9378 16.9741C23.8756 18.2591 23.6684 19.1295 23.3782 19.8964C23.0674 20.6839 22.6528 21.3472 21.9896 22.0311C21.3264 22.6943 20.6632 23.1088 19.8549 23.4197C19.171 23.6891 18.4041 23.8756 17.3471 23.9585L16.0622 24.0207L14.9223 24.0415L13.0777 24.0622H9.2228L8.02073 24.0415L7.02591 24C5.74093 23.9378 4.87047 23.7306 4.12435 23.4404C3.33679 23.1295 2.67357 22.715 1.98964 22.0518C1.32642 21.3886 0.911917 20.7047 0.601036 19.9171C0.331606 19.2332 0.145078 18.4663 0.0621762 17.4093L0.0207254 16.5596L0 15.7306V9.32642L0.0207254 8.31088L0.0414508 7.48186L0.0621762 7.04663C0.124352 5.78238 0.331606 4.91192 0.621762 4.14508C0.932642 3.35751 1.34715 2.6943 2.01036 2.01036C2.67357 1.34715 3.35751 0.932643 4.14508 0.621762C4.82902 0.352332 5.59585 0.165803 6.65285 0.0829016L7.50259 0.0414508L8.33161 0.0207254L9.32642 0H10.8808C10.9016 0 13.0984 0 13.0984 0ZM14.6114 2.17617H9.36788L8.45596 2.19689L7.12953 2.23834C6.79793 2.25907 6.46632 2.27979 6.13471 2.32124L5.94819 2.34197C5.82383 2.36269 5.67876 2.38342 5.5544 2.42487L5.40933 2.46632C5.36788 2.48705 5.32642 2.48705 5.28497 2.50777L5.01554 2.59067L4.89119 2.63212C4.33161 2.8601 3.93782 3.10881 3.50259 3.52332C3.08808 3.93782 2.81865 4.35233 2.6114 4.91192L2.54922 5.18135L2.50777 5.3057C2.40415 5.65803 2.30052 6.15544 2.23834 6.83938L2.21762 7.35751L2.17617 8.43523L2.15544 10.2798V14.5492L2.17617 15.8756L2.21762 16.8497C2.23834 17.2021 2.25907 17.5544 2.32124 17.9067L2.34197 18.0725C2.34197 18.0933 2.34197 18.1347 2.36269 18.1554L2.40415 18.3005L2.4456 18.4456C2.4456 18.4663 2.46632 18.487 2.46632 18.5078L2.50777 18.6321L2.54922 18.7565L2.56995 18.8187L2.65285 19.0674C2.8601 19.6269 3.12953 20.0207 3.54404 20.456C3.95855 20.8705 4.37306 21.1399 4.93264 21.3472L5.18135 21.4301L5.28497 21.4715L5.34715 21.4922L5.4715 21.5337C5.49223 21.5337 5.51295 21.5544 5.53368 21.5544L5.67876 21.5959L5.82383 21.6373L5.98964 21.658C6.30052 21.7202 6.67357 21.7617 7.12953 21.7824L8.60104 21.8446L10.5492 21.8653H14.7772L15.8549 21.8446L16.829 21.8031C17.285 21.7824 17.658 21.7409 17.9689 21.6788L18.1347 21.658L18.2798 21.6166L18.4456 21.5544L18.5078 21.5337L18.6321 21.4922L18.7565 21.4508L18.8187 21.4301L19.0674 21.3472C19.6269 21.1399 20.0207 20.8705 20.456 20.456C20.8705 20.0415 21.1399 19.6269 21.3471 19.0674L21.43 18.8187C21.5544 18.4456 21.6788 17.9275 21.7409 17.1399L21.8031 15.8756L21.8238 14.5907V9.40933L21.8031 8.12435L21.7617 7.15026C21.7409 6.8601 21.7202 6.54922 21.6788 6.25907L21.658 6.07254C21.6373 5.98964 21.6373 5.90674 21.6166 5.82383L21.5751 5.67876C21.5544 5.63731 21.5544 5.57513 21.5337 5.53368L21.4922 5.40933L21.4715 5.34715L21.3679 5.01554L21.3471 4.95337C21.1192 4.39378 20.8705 4 20.456 3.56477C20.0414 3.12953 19.6269 2.88083 19.0674 2.67358L18.943 2.63212L18.6736 2.54922L18.6114 2.48705L18.4456 2.4456C18.114 2.36269 17.6995 2.27979 17.1399 2.23834L16.2487 2.19689L15.5233 2.17617H14.6114Z"
            fill="url(#paint0_ig)"
          />
          <path
            d="M12 5.84428C15.399 5.84428 18.1555 8.60076 18.1555 11.9997C18.1555 15.3987 15.399 18.1552 12 18.1552C8.60108 18.1552 5.8446 15.3987 5.8446 11.9997C5.8446 8.60076 8.60108 5.84428 12 5.84428ZM12 7.99972C9.78243 7.99972 8.00004 9.78211 8.00004 11.9997C8.00004 14.2173 9.78243 15.9997 12 15.9997C14.2177 15.9997 16 14.2173 16 11.9997C16 9.78211 14.1969 7.99972 12 7.99972ZM19.8342 5.59558C19.855 6.38314 19.2332 7.04636 18.4456 7.06708C17.6581 7.08781 16.9949 6.46604 16.9741 5.67848C16.9741 5.65775 16.9741 5.6163 16.9741 5.59558C16.9949 4.80801 17.6581 4.16553 18.4456 4.20698C19.2125 4.20698 19.8135 4.82874 19.8342 5.59558Z"
            fill="url(#paint1_ig)"
          />
        </g>
        <defs>
          <linearGradient id="paint0_ig" x1="4.84866" y1="24.1312" x2="18.9949" y2="0.135787" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDD074" />
            <stop offset="0.25" stopColor="#F77F34" />
            <stop offset="0.5" stopColor="#DD326E" />
            <stop offset="0.75" stopColor="#D82B7E" />
            <stop offset="1" stopColor="#A432B1" />
          </linearGradient>
          <linearGradient id="paint1_ig" x1="8.40156" y1="18.0839" x2="16.6229" y2="4.09853" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDD074" />
            <stop offset="0.25" stopColor="#F77F34" />
            <stop offset="0.5" stopColor="#DD326E" />
            <stop offset="0.75" stopColor="#D82B7E" />
            <stop offset="1" stopColor="#A432B1" />
          </linearGradient>
          <clipPath id="clip0_ig">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
    link: "#",
  },
  {
    name: "threads",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.6921 11.1235C17.5887 11.074 17.4837 11.0263 17.3774 10.9806C17.1921 7.56728 15.327 5.61312 12.1952 5.59312C12.181 5.59304 12.1669 5.59304 12.1528 5.59304C10.2795 5.59304 8.72164 6.39261 7.76275 7.84759L9.48512 9.0291C10.2014 7.94229 11.3257 7.7106 12.1536 7.7106C12.1631 7.7106 12.1727 7.7106 12.1822 7.71069C13.2134 7.71726 13.9915 8.01708 14.4951 8.60175C14.8616 9.02741 15.1067 9.61563 15.2281 10.358C14.3139 10.2026 13.3251 10.1548 12.2681 10.2154C9.29059 10.3869 7.37639 12.1235 7.50495 14.5365C7.57019 15.7605 8.17996 16.8135 9.22188 17.5014C10.1028 18.0829 11.2374 18.3673 12.4165 18.3029C13.9738 18.2175 15.1954 17.6234 16.0476 16.537C16.6949 15.712 17.1042 14.6429 17.285 13.2957C18.0271 13.7436 18.5771 14.333 18.8809 15.0415C19.3974 16.2459 19.4275 18.225 17.8126 19.8385C16.3978 21.252 14.697 21.8635 12.1267 21.8824C9.27552 21.8612 7.11922 20.9469 5.71726 19.1646C4.40444 17.4958 3.72596 15.0852 3.70065 12C3.72596 8.91473 4.40444 6.5042 5.71726 4.83534C7.11922 3.05311 9.27549 2.13875 12.1266 2.11756C14.9985 2.13891 17.1924 3.05767 18.648 4.8485C19.3618 5.7267 19.8999 6.8311 20.2546 8.11879L22.273 7.58028C21.843 5.99528 21.1664 4.62946 20.2456 3.49675C18.3795 1.20084 15.6503 0.0243935 12.1337 0H12.1196C8.6102 0.0243088 5.91151 1.20522 4.09854 3.50991C2.48524 5.5608 1.65305 8.41446 1.62509 11.9916L1.625 12L1.62509 12.0084C1.65305 15.5855 2.48524 18.4393 4.09854 20.4901C5.91151 22.7948 8.6102 23.9757 12.1196 24H12.1337C15.2538 23.9784 17.453 23.1615 19.2647 21.3514C21.6351 18.9832 21.5637 16.0149 20.7825 14.1926C20.222 12.8859 19.1534 11.8245 17.6921 11.1235ZM12.3051 16.1884C11.0001 16.2619 9.6443 15.6761 9.57745 14.4215C9.5279 13.4913 10.2395 12.4532 12.3851 12.3296C12.6309 12.3154 12.872 12.3085 13.1089 12.3085C13.8883 12.3085 14.6174 12.3842 15.2802 12.5291C15.033 15.6169 13.5828 16.1182 12.3051 16.1884Z"
          fill="black"
        />
      </svg>
    ),
    link: "#",
  },
];

export default async function ArticleDetailPage(props: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const params = await props.params;
  const slug = params.slug;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Get related articles for sidebar (same category, max 3)
  const sidebarRelatedArticles = getAllArticles()
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .slice(0, 3);

  const relatedArticle = getAllArticles().find(
    (a) => a.category === article.category && a.slug !== article.slug
  );

  return (
    <article className="max-w-full">
      {/* Breadcrumb */}
      <Breadcrumb
        category={article.category}
        title={article.title}
        author={article.author}
        date={article.date}
      />

      {/* Full-width Hero Image */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10 group">
        <Image
          src={article.image || "/images/placeholder.jpg"}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      {/* Two-Column Layout: Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content Column */}
        <div className="lg:col-span-2" data-article-content>
          {/* Article Title */}
          <h1 className="text-3xl md:text-4xl lg:text-[42px] font-extrabold text-neutral-90 mb-5 leading-[1.15] tracking-tight">
            {article.title}
          </h1>

          {/* Category Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <CategoryTag category={article.category} />
          </div>

          {/* Article Description (Blockquote) */}
          <div className="text-lg md:text-xl text-neutral-70 leading-relaxed font-medium mb-10 border-l-4 border-primary-base pl-6 italic bg-primary-10/50 py-4 pr-4 rounded-r-xl">
            {article.description}
          </div>

          {/* Article Body */}
          <div className="text-neutral-70 leading-[1.85] space-y-7 text-base md:text-lg text-justify">
            {article.content ? (
              <p>{article.content}</p>
            ) : (
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </p>
            )}

            <div className="pt-6 space-y-8">
              <h2
                id="heading-1"
                className="text-2xl md:text-3xl font-bold text-neutral-90 tracking-tight"
              >
                Heading 1
              </h2>

              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-neutral-10 group">
                <Image
                  src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop"
                  alt="Section Image"
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>

              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur.
              </p>

              {/* Baca Juga Callout */}
              <div className="bg-primary-10 border-l-4 border-primary-base p-5 rounded-r-xl">
                <p className="text-primary-100 font-medium flex flex-wrap items-center gap-2">
                  <span className="font-bold">Baca Juga :</span>
                  {relatedArticle ? (
                    <Link
                      href={`/article/${relatedArticle.slug}`}
                      className="text-primary-base hover:text-primary-80 underline decoration-2 underline-offset-4 transition-colors"
                    >
                      [{relatedArticle.title}]
                    </Link>
                  ) : (
                    <span className="text-primary-base underline">
                      [Judul berita yang kategorinya sama]
                    </span>
                  )}
                </p>
              </div>

              <p>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
                quae ab illo inventore veritatis et quasi architecto beatae vitae
                dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas
                sit aspernatur aut odit aut fugit.
              </p>

              <div className="pt-4 space-y-6">
                <h3
                  id="heading-2"
                  className="text-xl md:text-2xl font-bold text-neutral-90 tracking-tight"
                >
                  Heading 2
                </h3>

                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-neutral-10 group">
                  <Image
                    src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop"
                    alt="Section Image"
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>

                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur.
                </p>

                {/* Baca Juga Callout */}
                <div className="bg-primary-10 border-l-4 border-primary-base p-5 rounded-r-xl">
                  <p className="text-primary-100 font-medium flex flex-wrap items-center gap-2">
                    <span className="font-bold">Baca Juga :</span>
                    {relatedArticle ? (
                      <Link
                        href={`/article/${relatedArticle.slug}`}
                        className="text-primary-base hover:text-primary-80 underline decoration-2 underline-offset-4 transition-colors"
                      >
                        [{relatedArticle.title}]
                      </Link>
                    ) : (
                      <span className="text-primary-base underline">
                        [Judul berita yang kategorinya sama]
                      </span>
                    )}
                  </p>
                </div>

                <div className="space-y-4">
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                    ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                  <p>
                    Duis aute irure dolor in reprehenderit in voluptate velit
                    esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
                    occaecat cupidatat non proident, sunt in culpa qui officia
                    deserunt mollit anim id est laborum.
                  </p>
                </div>
              </div>

              <div className="pt-4 space-y-6">
                <h4
                  id="heading-3"
                  className="text-lg md:text-xl font-bold text-neutral-90 tracking-tight"
                >
                  Heading 3
                </h4>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium doloremque laudantium, totam rem aperiam, eaque
                  ipsa quae ab illo inventore veritatis et quasi architecto
                  beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem
                  quia voluptas sit aspernatur aut odit aut fugit, sed quia
                  consequuntur magni dolores eos qui ratione voluptatem sequi
                  nesciunt.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile-only Social Share */}
          <div className="lg:hidden mt-10 pt-8 border-t border-neutral-10">
            <h3 className="text-sm font-bold text-neutral-80 uppercase tracking-wider mb-4">
              Bagikan Artikel
            </h3>
            <div className="flex items-center gap-3">
              {socialIcons.map((social) => (
                <a
                  key={social.name}
                  href={social.link}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-0 hover:bg-primary-10 border border-neutral-10 hover:border-primary-30 hover:shadow-md transition-all duration-300"
                  aria-label={`Share on ${social.name}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Comment Section */}
          <CommentSection />
        </div>

        {/* Sidebar */}
        <ArticleSidebar
          socialIcons={socialIcons}
          relatedArticles={sidebarRelatedArticles}
        />
      </div>

      {/* Related Articles Grid (Bottom) */}
      <RelatedArticlesGrid
        currentSlug={article.slug}
        currentCategory={article.category}
      />

      {/* Newsletter/CTA Banner */}
      <NewsletterBanner />
    </article>
  );
}
