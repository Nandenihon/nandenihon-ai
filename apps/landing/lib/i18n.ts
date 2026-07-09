export const languages = [
  {
    code: "id",
    label: "Indonesia",
    shortLabel: "ID",
    flagSrc: "/images/flags/id.png",
  },
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
    flagSrc: "/images/flags/en.png",
  },
  {
    code: "ja",
    label: "日本語",
    shortLabel: "JA",
    flagSrc: "/images/flags/ja.png",
  },
] as const;

export type Language = (typeof languages)[number]["code"];

export const defaultLanguage: Language = "id";

export function getLanguage(value?: string | string[] | null): Language {
  const language = Array.isArray(value) ? value[0] : value;

  return languages.some((item) => item.code === language)
    ? (language as Language)
    : defaultLanguage;
}

export const homeTranslations = {
  id: {
    nav: {
      home: "Home",
      about: "Tentang",
      class: "Kelas",
      article: "Artikel",
      information: "Informasi",
      counseling: "Konseling",
      merchandise: "Merchandise",
      gallery: "Galeri",
      contact: "Kontak",
      contactUs: "Hubungi Kami",
      language: "Bahasa",
    },
    footer: {
      tagline: "Temukan Dunia Jepang Bersama Kami",
      contactTitle: "Kontak Kami",
      subscribeLabel: "Tetap Terhubung",
      subscribePlaceholder: "Masukan Email Anda disini",
      subscribeButton: "Subscribe",
      copyright: "© 2025 Nande Nihon. All rights reserved.",
    },
    hero: {
      title: "Belajar Bahasa Jepang Jadi Lebih Mudah & Menyenangkan",
      description:
        "Berangkat dari pengalaman pernah kesulitan dan merasa bingung sendirian. Kami tergerak untuk mewujudkan gerakan bermanfaat melalui akses belajar yang lebih mudah dan menyenangkan. Berperan menjadi seorang teman saat kamu sedang di fase sulit dan bingung belajar Bahasa Jepang.",
      primaryCta: "Mulai Belajar",
      secondaryCta: "Lihat Kelas",
      imageAlt: "Siswa belajar bahasa Jepang bersama Nande Nihon",
    },
    partners: {
      title: "Our Partner",
    },
    benefits: {
      title: "Benefit yang Akan Kamu Dapatkan di Nande Nihon",
      items: [
        {
          title: "Belajar Dari 0",
          description:
            "Mulai dari Hiragana, Katakana, hingga percakapan sehari-hari. Materi disusun bertahap dan mudah dipahami.",
        },
        {
          title: "Kelas Online Interaktif",
          description:
            "2x pertemuan via Zoom. Setiap sesi direkam, jadi kamu bisa tonton ulang kapan saja.",
        },
        {
          title: "E-book & Worksheet Eksklusif",
          description:
            "Desain menarik dan bisa dicetak untuk membantumu latihan dan belajar kapan saja.",
        },
        {
          title: "Belajar Bahasa Sambil Mengenal Budaya",
          description:
            "Bukan cuma bahasa, kami ajarkan juga etika, kehidupan sehari-hari, dan cara memahami Jepang dari perspektif budaya.",
        },
        {
          title: "Komunitas Belajar yang Supportif",
          description:
            "Kamu tidak akan merasa sendirian di grup komunitas kami untuk berinteraksi, berbagi informasi, dan saling memotivasi.",
        },
        {
          title: "Didampingi Pengajar & Tim Responsif",
          description:
            "Kami pantau perkembanganmu, jawab pertanyaan, dan siap membimbing setiap kali kamu membutuhkan.",
        },
      ],
    },
    publications: {
      title: "Publikasi",
      viewAll: "Lihat Semua",
      allCategories: "Semua Kategori",
      empty: "Belum ada publikasi.",
    },
    testimonials: {
      title: "Kata Mereka",
      empty: "Belum ada testimoni.",
      yearSuffix: "Tahun",
      anonymous: "Anonymous",
    },
    team: {
      title: "Temui Tim Kami",
      empty: "Data tim belum tersedia.",
      fallbackName: "Nama Tim",
      fallbackRole: "Tim Nande Nihon",
      fallbackMotto:
        "Belajar bahasa Jepang itu kayak ramen kadang rumit, tapi nagih!",
    },
    gallery: {
      title: "Gallery Kegiatan",
      description:
        "Lihat suasana belajar, komunitas, dan momen seru bersama Nande Nihon.",
      viewMore: "Lihat lebih banyak",
      empty: "Belum ada foto kegiatan.",
      zoomLabel: "Perbesar foto",
    },
    cta: {
      title: "Mulai Belajar Hari Ini Biar Jepang Nggak Cuma Sebatas Mimpi!",
      description:
        "Berangkat dari mimpi sederhana bersama Nande Nihon. Kamu tidak belajar sendirian. Kamu akan belajar dalam lingkungan yang suportif, responsif, dan kooperatif. Sekarang, ambil aksi pertama dan biarkan Nande Nihon membantumu mewujudkannya!",
      join: "Gabung Sekarang",
      consultation: "Konsultasi Gratis",
    },
  },
  en: {
    nav: {
      home: "Home",
      about: "About",
      class: "Classes",
      article: "Articles",
      information: "Information",
      counseling: "Counseling",
      merchandise: "Merchandise",
      contact: "Contact",
      contactUs: "Contact Us",
      language: "Language",
    },
    footer: {
      tagline: "Discover Japan With Us",
      contactTitle: "Contact Us",
      subscribeLabel: "Stay Connected",
      subscribePlaceholder: "Enter your email here",
      subscribeButton: "Subscribe",
      copyright: "© 2025 Nande Nihon. All rights reserved.",
    },
    hero: {
      title: "Learning Japanese Made Easier & More Enjoyable",
      description:
        "Born from our own experience of feeling stuck and confused while learning alone, Nande Nihon makes Japanese learning easier, friendlier, and more enjoyable. We are here as a companion when learning Japanese feels difficult.",
      primaryCta: "Start Learning",
      secondaryCta: "View Classes",
      imageAlt: "Students learning Japanese with Nande Nihon",
    },
    partners: {
      title: "Our Partners",
    },
    benefits: {
      title: "Benefits You Will Get at Nande Nihon",
      items: [
        {
          title: "Start From Zero",
          description:
            "Begin with Hiragana, Katakana, and daily conversation through step-by-step lessons that are easy to follow.",
        },
        {
          title: "Interactive Online Classes",
          description:
            "Join two Zoom sessions. Each session is recorded, so you can rewatch it anytime.",
        },
        {
          title: "Exclusive E-books & Worksheets",
          description:
            "Beautifully designed printable materials to help you practice and learn whenever you want.",
        },
        {
          title: "Learn Language Through Culture",
          description:
            "Go beyond vocabulary with etiquette, daily life, and cultural perspectives that help you understand Japan better.",
        },
        {
          title: "Supportive Learning Community",
          description:
            "You will not learn alone. Connect, share information, and stay motivated with our community.",
        },
        {
          title: "Responsive Teachers & Team",
          description:
            "We follow your progress, answer questions, and guide you whenever you need support.",
        },
      ],
    },
    publications: {
      title: "Publications",
      viewAll: "View All",
      allCategories: "All Categories",
      empty: "No publications yet.",
    },
    testimonials: {
      title: "What They Say",
      empty: "No testimonials yet.",
      yearSuffix: "Years Old",
      anonymous: "Anonymous",
    },
    team: {
      title: "Meet Our Team",
      empty: "Team data is not available yet.",
      fallbackName: "Team Name",
      fallbackRole: "Nande Nihon Team",
      fallbackMotto:
        "Learning Japanese is like ramen: sometimes complex, but always worth coming back to.",
    },
    gallery: {
      title: "Activity Gallery",
      description:
        "Explore learning moments, community activities, and highlights with Nande Nihon.",
      viewMore: "View more",
      empty: "No activity photos yet.",
      zoomLabel: "Zoom photo",
    },
    cta: {
      title: "Start Learning Today and Make Japan More Than a Dream!",
      description:
        "Begin with a simple dream together with Nande Nihon. You will not learn alone. You will grow in a supportive, responsive, and collaborative environment. Take your first step now and let Nande Nihon help you make it real.",
      join: "Join Now",
      consultation: "Free Consultation",
    },
  },
  ja: {
    nav: {
      home: "ホーム",
      about: "私たちについて",
      class: "クラス",
      article: "記事",
      information: "情報",
      counseling: "カウンセリング",
      merchandise: "グッズ",
      contact: "お問い合わせ",
      contactUs: "お問い合わせ",
      language: "言語",
    },
    footer: {
      tagline: "私たちと一緒に日本の世界を見つけよう",
      contactTitle: "お問い合わせ",
      subscribeLabel: "最新情報を受け取る",
      subscribePlaceholder: "メールアドレスを入力してください",
      subscribeButton: "登録",
      copyright: "© 2025 Nande Nihon. All rights reserved.",
    },
    hero: {
      title: "日本語学習をもっと簡単に、もっと楽しく",
      description:
        "一人で悩みながら学んだ経験から、Nande Nihon は日本語をより学びやすく、楽しいものにしたいと考えています。日本語学習で迷ったとき、そばで支える友だちのような存在を目指しています。",
      primaryCta: "学習を始める",
      secondaryCta: "クラスを見る",
      imageAlt: "Nande Nihonで日本語を学ぶ学生",
    },
    partners: {
      title: "パートナー",
    },
    benefits: {
      title: "Nande Nihonで得られるメリット",
      items: [
        {
          title: "ゼロから学べる",
          description:
            "ひらがな、カタカナ、日常会話まで、段階的でわかりやすい教材で学べます。",
        },
        {
          title: "参加型オンラインクラス",
          description:
            "Zoomで2回の授業を実施します。各回は録画されるので、いつでも復習できます。",
        },
        {
          title: "限定Eブックとワークシート",
          description:
            "印刷できる見やすい教材で、好きな時間に練習と学習ができます。",
        },
        {
          title: "文化も一緒に学べる",
          description:
            "言葉だけでなく、マナー、日常生活、文化的な視点から日本を理解します。",
        },
        {
          title: "支え合える学習コミュニティ",
          description:
            "一人で学ぶ必要はありません。交流し、情報を共有し、励まし合える場所があります。",
        },
        {
          title: "講師とチームが丁寧にサポート",
          description:
            "学習の進み具合を見守り、質問に答え、必要なときにいつでもサポートします。",
        },
      ],
    },
    publications: {
      title: "記事",
      viewAll: "すべて見る",
      allCategories: "すべてのカテゴリー",
      empty: "記事はまだありません。",
    },
    testimonials: {
      title: "受講者の声",
      empty: "受講者の声はまだありません。",
      yearSuffix: "歳",
      anonymous: "匿名",
    },
    team: {
      title: "チーム紹介",
      empty: "チーム情報はまだありません。",
      fallbackName: "チーム名",
      fallbackRole: "Nande Nihonチーム",
      fallbackMotto:
        "日本語学習はラーメンのように、少し複雑でもまた続けたくなるものです。",
    },
    gallery: {
      title: "活動ギャラリー",
      description:
        "Nande Nihonでの学習の様子やコミュニティ活動の瞬間をご覧ください。",
      viewMore: "もっと見る",
      empty: "活動写真はまだありません。",
      zoomLabel: "写真を拡大",
    },
    cta: {
      title: "今日から学んで、日本を夢で終わらせない！",
      description:
        "Nande Nihon と一緒に、小さな夢から始めましょう。一人で学ぶ必要はありません。支え合い、質問しやすく、協力的な環境で学べます。最初の一歩を踏み出し、夢を形にしていきましょう。",
      join: "今すぐ参加",
      consultation: "無料相談",
    },
  },
} as const;

export type HomeTranslations = (typeof homeTranslations)[Language];

export const landingTranslations = {
  id: {
    ...homeTranslations.id,
    about: {
      titlePrefix: "Eksplorasi Serunya Belajar di",
      whyTitle: "Kenapa Memilih Nande Nihon?",
      whyDescription:
        "Didirikan oleh mereka yang berbekal kegigihan, keberanian, dan tekad yang telah berhasil mengalahkan keputusasaan, kebingungan, dan kesulitan. Kini, giliran kami untuk membantumu.",
      paragraphs: [
        "Nande Nihon bukan sekadar lembaga kursus, bukan pula lembaga bahasa yang besar.",
        "Kami adalah teman belajar yang mengerti perjuanganmu. Didirikan oleh orang-orang yang pernah merasakan kebingungan yang sama.",
        "Kami punya sistem belajar yang menyenangkan, terarah, dan didukung dengan suasana yang positif.",
      ],
      foundersTitle: "Founder & Co-Founder",
      adminTitle: "Admin & Data",
      fallbackName: "Nama",
      fallbackFounderRole: "Founder",
      fallbackAdminRole: "Admin",
      fallbackMotto: "Motto belum diisi.",
      foundersEmpty: "Data Founder belum tersedia.",
      adminEmpty: "Data Admin & Data belum tersedia.",
      imageAlt: "Ilustrasi belajar bersama Nande Nihon",
    },
    contactPage: {
      infoTitle: "Informasi Kontak",
      infoDescription: ["Punya pertanyaan seputar kelas atau pendaftaran?", "Kami siap bantu."],
      nameLabel: "Nama Kamu",
      namePlaceholder: "masukan nama kamu",
      emailLabel: "Email Kamu",
      emailPlaceholder: "masukan email kamu",
      subjectLabel: "Subject",
      subjectPlaceholder: "Apa yang ingin kamu sampaikan",
      messageLabel: "Apa Pesan Kamu?",
      messagePlaceholder: "Apa yang ingin kamu sampaikan",
      submit: "Kirim Pesan",
      vectorAlt: "Vector",
    },
    informationPage: {
      hero: {
        badge: "Verified Mentors from Japan",
        title: ["Dukungan Psikologis", "Melalui Layanan Konseling", "Online"],
        description: "Luangkan waktu sejenak untuk kesehatan mentalmu.",
        cta: "Booking Jadwal Sekarang",
        imageAlt: "hero-konseling",
      },
      topics: {
        badge: "Ngobrol Yuk",
        title: "Mulai dari mana kita berdiskusi?",
        description: "Pilih topik yang paling relate sama kebutuhan kamu saat ini.",
        items: [
          { image: "/images/benefit/0.png", title: "Pendidikan", description: "Mengurangi beban di tengah tuntutan akademik" },
          { image: "/images/benefit/1.png", title: "Pribadi", description: "Berdamai dengan pikiran yang tak kunjung tenang" },
          { image: "/images/benefit/2.png", title: "Sosial", description: "Membangun hubungan yang lebih sehat" },
          { image: "/images/benefit/2.png", title: "Karier", description: "Menghadapi tekanan kerja dan mengatasi kelelahan mental" },
        ],
      },
      steps: {
        title: "Get Guided in 3 Steps",
        items: [
          { number: "01", title: "Daftar & Pilih Topik", description: "Pilih topik yang sesuai dengan kondisimu saat ini (masalah pribadi, karir, sosial, atau pendidikan)" },
          { number: "02", title: "Atur Jadwal Sesi", description: "Tim kami akan membantumu menyesuaikan waktu sesi yang paling nyaman agar kamu bisa bercerita dengan tenang" },
          { number: "03", title: "Mulai Deep-Talk", description: "Mulai sesi privat dengan konselor kami" },
        ],
      },
    },
    classPage: {
      hero: {
        badge: "Level Up Yang Yang Japane Skill",
        titleStart: "Master",
        titleHighlight: "Nihongo",
        titleEnd: "With Zero Struggle",
        description: "Lupakan cara belajar yang ngebosenin! Siap belajar bahasa Jepang dari nol sampai level pro? Let's go!",
        imageAlt: "hero-class",
      },
      classes: {
        title: "Kelas Insentif",
        description: "Kelas intensif dengan mentor yang asik dan materi daging!",
        empty: "Data kelas belum tersedia.",
        availableButton: "Amankan Slot Kamu!",
        openButton: "Buka Akses",
        detailButton: "Detail Kelas",
      },
      webinars: {
        title: "Webinar",
        description: "Webinar padat ilmu dengan penyampaian yang gak ngebosenin.",
        empty: "Data webinar belum tersedia.",
        locale: "id-ID",
        timeSuffix: "WIB",
      },
    },
    articlePage: {
      featuredTitle: "Artikel Pilihan Anda",
      popularTitle: "Artikel Terpopuler",
      allCategories: "Semua Kategori",
      searchPlaceholder: "Search...",
      empty: "Tidak ada artikel yang ditemukan.",
      loadMore: "Muat Lebih Banyak",
      previousSlide: "Previous Slide",
      nextSlide: "Next Slide",
      goToSlide: "Go to slide",
    },
  },
  en: {
    ...homeTranslations.en,
    about: {
      titlePrefix: "Explore the Joy of Learning at",
      whyTitle: "Why Choose Nande Nihon?",
      whyDescription:
        "Founded by people with persistence, courage, and determination who overcame despair, confusion, and difficulty. Now, it is our turn to help you.",
      paragraphs: [
        "Nande Nihon is more than a course provider or a large language institution.",
        "We are a learning companion who understands your struggle, founded by people who once felt the same confusion.",
        "We offer a learning system that is enjoyable, focused, and supported by a positive atmosphere.",
      ],
      foundersTitle: "Founder & Co-Founder",
      adminTitle: "Admin & Data",
      fallbackName: "Name",
      fallbackFounderRole: "Founder",
      fallbackAdminRole: "Admin",
      fallbackMotto: "Motto has not been added yet.",
      foundersEmpty: "Founder data is not available yet.",
      adminEmpty: "Admin & Data information is not available yet.",
      imageAlt: "Learning illustration with Nande Nihon",
    },
    contactPage: {
      infoTitle: "Contact Information",
      infoDescription: ["Have questions about classes or registration?", "We are ready to help."],
      nameLabel: "Your Name",
      namePlaceholder: "enter your name",
      emailLabel: "Your Email",
      emailPlaceholder: "enter your email",
      subjectLabel: "Subject",
      subjectPlaceholder: "What would you like to say?",
      messageLabel: "Your Message",
      messagePlaceholder: "What would you like to say?",
      submit: "Send Message",
      vectorAlt: "Vector",
    },
    informationPage: {
      hero: {
        badge: "Verified Mentors from Japan",
        title: ["Psychological Support", "Through Online", "Counseling Services"],
        description: "Take a moment for your mental health.",
        cta: "Book a Schedule Now",
        imageAlt: "counseling hero",
      },
      topics: {
        badge: "Let's Talk",
        title: "Where should we start the discussion?",
        description: "Choose the topic that best matches what you need right now.",
        items: [
          { image: "/images/benefit/0.png", title: "Education", description: "Reduce the pressure of academic demands" },
          { image: "/images/benefit/1.png", title: "Personal", description: "Make peace with restless thoughts" },
          { image: "/images/benefit/2.png", title: "Social", description: "Build healthier relationships" },
          { image: "/images/benefit/2.png", title: "Career", description: "Handle work pressure and mental fatigue" },
        ],
      },
      steps: {
        title: "Get Guided in 3 Steps",
        items: [
          { number: "01", title: "Register & Choose a Topic", description: "Choose a topic that matches your current situation, such as personal, career, social, or education concerns" },
          { number: "02", title: "Set Your Session Schedule", description: "Our team will help adjust the most comfortable session time so you can share calmly" },
          { number: "03", title: "Start the Deep Talk", description: "Begin a private session with our counselor" },
        ],
      },
    },
    classPage: {
      hero: {
        badge: "Level Up Your Japanese Skill",
        titleStart: "Master",
        titleHighlight: "Nihongo",
        titleEnd: "With Zero Struggle",
        description: "Forget boring study methods. Ready to learn Japanese from zero to pro level? Let's go!",
        imageAlt: "class hero",
      },
      classes: {
        title: "Intensive Classes",
        description: "Intensive classes with friendly mentors and practical materials.",
        empty: "Class data is not available yet.",
        availableButton: "Secure Your Slot!",
        openButton: "Open Access",
        detailButton: "Class Details",
      },
      webinars: {
        title: "Webinars",
        description: "Knowledge-packed webinars delivered in an engaging way.",
        empty: "Webinar data is not available yet.",
        locale: "en-US",
        timeSuffix: "WIB",
      },
    },
    articlePage: {
      featuredTitle: "Featured Articles",
      popularTitle: "Most Popular Articles",
      allCategories: "All Categories",
      searchPlaceholder: "Search...",
      empty: "No articles found.",
      loadMore: "Load More",
      previousSlide: "Previous Slide",
      nextSlide: "Next Slide",
      goToSlide: "Go to slide",
    },
  },
  ja: {
    ...homeTranslations.ja,
    about: {
      titlePrefix: "Nande Nihonで楽しく学ぼう",
      whyTitle: "なぜNande Nihonを選ぶのか？",
      whyDescription:
        "粘り強さ、勇気、そして決意で不安や迷い、困難を乗り越えてきたメンバーによって生まれました。今度は私たちがあなたを支える番です。",
      paragraphs: [
        "Nande Nihonは、単なる語学コースや大きな語学機関ではありません。",
        "私たちは、あなたの悩みに寄り添う学習パートナーです。同じ迷いを経験した人たちによって作られました。",
        "楽しく、わかりやすく、前向きな雰囲気で学べる仕組みを用意しています。",
      ],
      foundersTitle: "創設者・共同創設者",
      adminTitle: "管理・データチーム",
      fallbackName: "名前",
      fallbackFounderRole: "創設者",
      fallbackAdminRole: "管理",
      fallbackMotto: "モットーはまだ入力されていません。",
      foundersEmpty: "創設者データはまだありません。",
      adminEmpty: "管理・データチームの情報はまだありません。",
      imageAlt: "Nande Nihonの学習イラスト",
    },
    contactPage: {
      infoTitle: "お問い合わせ情報",
      infoDescription: ["クラスや登録について質問がありますか？", "私たちがお手伝いします。"],
      nameLabel: "お名前",
      namePlaceholder: "お名前を入力してください",
      emailLabel: "メールアドレス",
      emailPlaceholder: "メールアドレスを入力してください",
      subjectLabel: "件名",
      subjectPlaceholder: "お問い合わせ内容を入力してください",
      messageLabel: "メッセージ",
      messagePlaceholder: "お問い合わせ内容を入力してください",
      submit: "送信する",
      vectorAlt: "ベクター",
    },
    informationPage: {
      hero: {
        badge: "日本の認定メンター",
        title: ["心理的サポート", "オンラインカウンセリング", "サービス"],
        description: "心の健康のために、少し時間を作りましょう。",
        cta: "今すぐ予約する",
        imageAlt: "カウンセリングのヒーロー画像",
      },
      topics: {
        badge: "話しましょう",
        title: "どこから相談を始めますか？",
        description: "今のあなたに一番近いテーマを選んでください。",
        items: [
          { image: "/images/benefit/0.png", title: "教育", description: "学業のプレッシャーを軽くする" },
          { image: "/images/benefit/1.png", title: "個人", description: "落ち着かない気持ちと向き合う" },
          { image: "/images/benefit/2.png", title: "人間関係", description: "より健やかな関係を築く" },
          { image: "/images/benefit/2.png", title: "キャリア", description: "仕事のストレスや心の疲れに向き合う" },
        ],
      },
      steps: {
        title: "3つのステップでサポート",
        items: [
          { number: "01", title: "登録してテーマを選ぶ", description: "個人、キャリア、人間関係、教育など、今の状況に合うテーマを選びます" },
          { number: "02", title: "セッション日時を決める", description: "安心して話せるよう、チームが都合のよい時間調整をサポートします" },
          { number: "03", title: "相談を始める", description: "カウンセラーとのプライベートセッションを始めます" },
        ],
      },
    },
    classPage: {
      hero: {
        badge: "日本語スキルをレベルアップ",
        titleStart: "Master",
        titleHighlight: "Nihongo",
        titleEnd: "With Zero Struggle",
        description: "退屈な勉強方法は忘れましょう。ゼロから上級レベルまで日本語を学ぶ準備はできていますか？",
        imageAlt: "クラスのヒーロー画像",
      },
      classes: {
        title: "集中クラス",
        description: "親しみやすいメンターと実践的な教材で学ぶ集中クラスです。",
        empty: "クラス情報はまだありません。",
        availableButton: "席を確保する",
        openButton: "アクセスを開く",
        detailButton: "クラス詳細",
      },
      webinars: {
        title: "ウェビナー",
        description: "学びの多い内容をわかりやすく楽しくお届けします。",
        empty: "ウェビナー情報はまだありません。",
        locale: "ja-JP",
        timeSuffix: "WIB",
      },
    },
    articlePage: {
      featuredTitle: "おすすめ記事",
      popularTitle: "人気記事",
      allCategories: "すべてのカテゴリー",
      searchPlaceholder: "検索...",
      empty: "記事が見つかりません。",
      loadMore: "もっと見る",
      previousSlide: "前のスライド",
      nextSlide: "次のスライド",
      goToSlide: "スライドへ移動",
    },
  },
} as const;

export type LandingTranslations = (typeof landingTranslations)[Language];
