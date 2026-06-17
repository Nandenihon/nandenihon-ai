import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

import mongoose from "mongoose";
import { Question } from "../lib/db/models/question";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/nandenihon";

const n5Questions = [
  {
    text: "Huruf yang digunakan untuk menulis kata serapan asing dalam bahasa Jepang adalah…",
    options: ["Kanji", "Hiragana", "Katakana", "Romaji"],
    correctAnswer: "Katakana",
    timeLimit: 30,
    category: "WRITING SYSTEM",
    level: "N5",
  },
  {
    text: "Ibukota Jepang adalah…",
    options: ["Osaka", "Kyoto", "Tokyo", "Sapporo"],
    correctAnswer: "Tokyo",
    timeLimit: 30,
    category: "CULTURE",
    level: "N5",
  },
  {
    text: "“おはようございます” digunakan pada waktu…",
    options: ["Malam", "Siang", "Pagi", "Sore"],
    correctAnswer: "Pagi",
    timeLimit: 30,
    category: "GREETING",
    level: "N5",
  },
  {
    text: "Jepang memiliki berapa pulau utama?",
    options: ["2", "3", "4", "5"],
    correctAnswer: "4",
    timeLimit: 30,
    category: "GEOGRAPHY",
    level: "N5",
  },
  {
    text: "“ありがとうございます” berarti…",
    options: ["Selamat tinggal", "Terima kasih", "Sampai jumpa", "Selamat datang"],
    correctAnswer: "Terima kasih",
    timeLimit: 30,
    category: "GREETING",
    level: "N5",
  },
  {
    text: "Mata uang Jepang adalah…",
    options: ["Won", "Yen", "Yuan", "Dollar"],
    correctAnswer: "Yen",
    timeLimit: 30,
    category: "CULTURE",
    level: "N5",
  },
  {
    text: "Perayaan musim panas di Jepang biasa disebut…",
    options: ["Tanabata", "Obon", "Gion Matsuri / Natsu Matsuri", "Hanami"],
    correctAnswer: "Gion Matsuri / Natsu Matsuri",
    timeLimit: 30,
    category: "CULTURE",
    level: "N5",
  },
  {
    text: "Alat makan tradisional orang Jepang adalah…",
    options: ["Sendok", "Garpu", "Chopstick / Hashi", "Tangan"],
    correctAnswer: "Chopstick / Hashi",
    timeLimit: 30,
    category: "CULTURE",
    level: "N5",
  },
  {
    text: "“すみません” biasanya digunakan untuk…",
    options: ["Berterima kasih", "Memanggil orang / minta maaf", "Menolak ajakan", "Memberi salam"],
    correctAnswer: "Memanggil orang / minta maaf",
    timeLimit: 30,
    category: "GREETING",
    level: "N5",
  },
  {
    text: "Simbol pada bendera Jepang melambangkan…",
    options: ["Bunga sakura", "Matahari", "Bulan", "Gunung Fuji"],
    correctAnswer: "Matahari",
    timeLimit: 30,
    category: "CULTURE",
    level: "N5",
  },
  {
    text: "Sistem tulisan paling kompleks dalam bahasa Jepang adalah…",
    options: ["Hiragana", "Katakana", "Kanji", "Romaji"],
    correctAnswer: "KANJI",
    timeLimit: 30,
    category: "WRITING SYSTEM",
    level: "N5",
  },
  {
    text: "“こんにちは” digunakan pada waktu…",
    options: ["Pagi", "Siang", "Malam", "Tengah malam"],
    correctAnswer: "Siang",
    timeLimit: 30,
    category: "GREETING",
    level: "N5",
  },
  {
    text: "Kota penghasil matcha paling terkenal di Jepang adalah…",
    options: ["Osaka", "Tokyo", "Kyoto", "Kabuki"],
    correctAnswer: "Kyoto",
    timeLimit: 30,
    category: "CULTURE",
    level: "N5",
  },
  {
    text: "“nihon” berarti…",
    options: ["Orang Jepang", "Bahasa Jepang", "Jepang", "Kota Tokyo"],
    correctAnswer: "Jepang",
    timeLimit: 30,
    category: "VOCABULARY",
    level: "N5",
  },
  {
    text: "Pakaian tradisional Jepang disebut…",
    options: ["Kimono", "Hanbok", "Cheongsam", "Sari"],
    correctAnswer: "Kimono",
    timeLimit: 30,
    category: "CULTURE",
    level: "N5",
  },
  {
    text: "Kereta super cepat khas Jepang adalah…",
    options: ["Tokaido Bus", "Skytrain", "Shinkansen", "Monorail"],
    correctAnswer: "Shinkansen",
    timeLimit: 30,
    category: "CULTURE",
    level: "N5",
  },
  {
    text: "Kanji “山” dibaca…",
    options: ["kawa", "yama", "sora", "mizu"],
    correctAnswer: "yama",
    timeLimit: 30,
    category: "KANJI",
    level: "N5",
  },
  {
    text: "Makanan Jepang berbahan nasi + ikan mentah adalah…",
    options: ["Ramen", "Sushi", "Soba", "Dango"],
    correctAnswer: "Sushi",
    timeLimit: 30,
    category: "CULTURE",
    level: "N5",
  },
  {
    text: "Negara Jepang memiliki berapa musim?",
    options: ["1", "2", "4", "3"],
    correctAnswer: "4",
    timeLimit: 30,
    category: "GEOGRAPHY",
    level: "N5",
  },
  {
    text: "Bahasa Jepang untuk “guru” adalah…",
    options: ["がくせい", "いえ", "せんせい", "ほん"],
    correctAnswer: "せんせい",
    timeLimit: 30,
    category: "VOCABULARY",
    level: "N5",
  },
  {
    text: "Musim dingin di Jepang berlangsung pada bulan…",
    options: ["Juni–Agustus", "Desember–Februari", "September–November", "Maret–Mei"],
    correctAnswer: "Desember–Februari",
    timeLimit: 30,
    category: "CULTURE",
    level: "N5",
  },
  {
    text: "Bunga nasional Jepang adalah…",
    options: ["Mawar", "Sakura", "Tulip", "Teratai"],
    correctAnswer: "Sakura",
    timeLimit: 30,
    category: "CULTURE",
    level: "N5",
  },
  {
    text: "Huruf bulat-lentur khas Jepang (bukan katakana) adalah…",
    options: ["Kanji", "Hiragana", "Romaji", "Emoji"],
    correctAnswer: "Hiragana",
    timeLimit: 30,
    category: "WRITING SYSTEM",
    level: "N5",
  },
  {
    text: "“Tomodachi” berarti…",
    options: ["Buku", "Teman", "Sekolah", "Jalan"],
    correctAnswer: "Teman",
    timeLimit: 30,
    category: "VOCABULARY",
    level: "N5",
  },
  {
    text: "Melengkapi kalimat perkenalan: “____ と いいます。”",
    options: ["あなた", "わたしは", "(Nama)", "あれ"],
    correctAnswer: "(Nama)",
    timeLimit: 30,
    category: "GRAMMAR",
    level: "N5",
  }
];

const n4Questions = [
  // Bagian 1: Kosakata (Vocabulary)
  {
    text: "昨日、＿＿＿で新しい靴を買いました。",
    options: ["デパート", "びょういん", "えき", "こうえん"],
    correctAnswer: "デパート", // [cite: 133]
    timeLimit: 30,
    category: "VOCABULARY",
    level: "N4",
  },
  {
    text: "毎朝、顔を＿＿＿。",
    options: ["あらいます", "のみます", "きります", "ならいます"],
    correctAnswer: "あらいます", // [cite: 134]
    timeLimit: 30,
    category: "VOCABULARY",
    level: "N4",
  },
  {
    text: "この漢字の読み方が＿＿＿、辞書で調べます。",
    options: ["わからなければ", "わかるから", "わかっても", "わかるのに"],
    correctAnswer: "わからなければ", // [cite: 135]
    timeLimit: 30,
    category: "VOCABULARY", // As per Bagian 1 [cite: 1]
    level: "N4",
  },
  {
    text: "弟は＿＿＿が上手です。",
    options: ["およぎ", "およぐ", "およいで", "およぐこと"],
    correctAnswer: "およぎ", // [cite: 136]
    timeLimit: 30,
    category: "VOCABULARY",
    level: "N4",
  },
  {
    text: "＿＿＿、映画を見に行きませんか。",
    options: ["いっしょに", "ゆっくり", "たくさん", "すぐに"],
    correctAnswer: "いっしょに", // [cite: 137]
    timeLimit: 30,
    category: "VOCABULARY",
    level: "N4",
  },
  {
    text: "日本では春に桜が＿＿＿。",
    options: ["さきます", "おちます", "なきます", "とびます"],
    correctAnswer: "さきます", // [cite: 138]
    timeLimit: 30,
    category: "VOCABULARY",
    level: "N4",
  },
  {
    text: "会議は午後3時に＿＿＿予定です。",
    options: ["はじまる", "はじめる", "はじめた", "はじまり"],
    correctAnswer: "はじまる", // [cite: 139]
    timeLimit: 30,
    category: "VOCABULARY",
    level: "N4",
  },
  {
    text: "この道を＿＿＿行くと、駅があります。",
    options: ["まっすぐ", "ゆっくり", "たくさん", "すこし"],
    correctAnswer: "まっすぐ", // [cite: 140]
    timeLimit: 30,
    category: "VOCABULARY",
    level: "N4",
  },
  // Bagian 2: Tata Bahasa (Grammar)
  {
    text: "日本語＿＿＿勉強したいです。",
    options: ["が", "を", "に", "で"],
    correctAnswer: "を", // [cite: 141]
    timeLimit: 30,
    category: "GRAMMAR",
    level: "N4",
  },
  {
    text: "明日は雨＿＿＿降るでしょう。",
    options: ["が", "を", "に", "で"],
    correctAnswer: "が", // [cite: 142]
    timeLimit: 30,
    category: "GRAMMAR",
    level: "N4",
  },
  {
    text: "田中さんは去年、大阪＿＿＿住んでいました。",
    options: ["が", "を", "に", "で"],
    correctAnswer: "に", // [cite: 143]
    timeLimit: 30,
    category: "GRAMMAR",
    level: "N4",
  },
  {
    text: "コーヒー＿＿＿紅茶、どちらがいいですか。",
    options: ["と", "や", "か", "も"],
    correctAnswer: "か", // [cite: 144]
    timeLimit: 30,
    category: "GRAMMAR",
    level: "N4",
  },
  {
    text: "この本は私＿＿＿書きました。",
    options: ["が", "を", "に", "で"],
    correctAnswer: "が", // [cite: 145]
    timeLimit: 30,
    category: "GRAMMAR",
    level: "N4",
  },
  {
    text: "漢字が読め＿＿＿なりました。",
    options: ["る", "られる", "ない", "ように"],
    correctAnswer: "ように", // [cite: 146]
    timeLimit: 30,
    category: "GRAMMAR",
    level: "N4",
  },
  {
    text: "もう宿題を＿＿＿しまいました。",
    options: ["し", "して", "する", "した"],
    correctAnswer: "して", // [cite: 147]
    timeLimit: 30,
    category: "GRAMMAR",
    level: "N4",
  },
  {
    text: "友達＿＿＿プレゼントをもらいました。",
    options: ["が", "を", "に", "から"],
    correctAnswer: "から", // [cite: 148]
    timeLimit: 30,
    category: "GRAMMAR",
    level: "N4",
  },
  {
    text: "電車が来る＿＿＿、ホームで待っています。",
    options: ["まで", "までに", "あとで", "から"],
    correctAnswer: "まで", // [cite: 149]
    timeLimit: 30,
    category: "GRAMMAR",
    level: "N4",
  },
  {
    text: "この仕事は明日まで＿＿＿ければなりません。",
    options: ["し", "して", "する", "しな"],
    correctAnswer: "しな", // [cite: 150]
    timeLimit: 30,
    category: "GRAMMAR",
    level: "N4",
  },
  // Bagian 3: Membaca Kanji
  {
    text: "試験（　　）",
    options: ["しあい", "しけん", "じけん", "じあい"],
    correctAnswer: "しけん", // [cite: 151]
    timeLimit: 20,
    category: "KANJI",
    level: "N4",
  },
  {
    text: "彼女（　　）",
    options: ["かれじょ", "かのじょ", "かのじょう", "かれじょう"],
    correctAnswer: "かのじょ", // [cite: 152]
    timeLimit: 20,
    category: "KANJI",
    level: "N4",
  },
  {
    text: "授業（　　）",
    options: ["じゅぎょう", "しゅぎょう", "じゅうぎょう", "しゅうぎょう"],
    correctAnswer: "じゅぎょう", // [cite: 153]
    timeLimit: 20,
    category: "KANJI",
    level: "N4",
  },
  // Bagian 4: Pemahaman Bacaan (Reading)
  {
    text: "【読解】私の友達の山田さんは、今、大学生です。毎日、朝7時に起きて、8時に家を出ます。\n\n質問：山田さんは何時に家を出ますか。",
    options: ["7時", "8時", "9時", "4時"],
    correctAnswer: "8時", // [cite: 154]
    timeLimit: 60,
    category: "READING",
    level: "N4",
  },
  {
    text: "【読解】大学まで電車で1時間かかります。\n\n質問：大学まで何で行きますか。",
    options: ["バス", "電車", "自転車", "歩いて"],
    correctAnswer: "電車", // [cite: 155]
    timeLimit: 60,
    category: "READING",
    level: "N4",
  },
  {
    text: "【読解】大学では英語と歴史を勉強しています。\n\n質問：山田さんは大学で何を勉強していますか。",
    options: ["日本語と数学", "英語と歴史", "科学と英語", "歴史と数学"],
    correctAnswer: "英語と歴史", // [cite: 156]
    timeLimit: 60,
    category: "READING",
    level: "N4",
  },
  {
    text: "【読解】授業が終わったあと、よく図書館で本を読みます。\n\n質問：授業が終わったあと、山田さんは何をしますか。",
    options: ["家に帰ります", "友達と遊びます", "図書館で本を読みます", "レストランで食べます"],
    correctAnswer: "図書館で本を読みます", // [cite: 157]
    timeLimit: 60,
    category: "READING",
    level: "N4",
  }
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    console.log("Clearing existing questions...");
    await Question.deleteMany({});

    console.log("Inserting N5 questions...");
    const n5Result = await Question.insertMany(n5Questions);
    console.log(`Successfully inserted ${n5Result.length} N5 questions`);

    console.log("Inserting N4 questions...");
    const n4Result = await Question.insertMany(n4Questions);
    console.log(`Successfully inserted ${n4Result.length} N4 questions`);

    console.log(`Total questions seeded: ${n5Result.length + n4Result.length}`);
    console.log("Seeding completed!");
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seed();
