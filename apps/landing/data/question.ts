export type Option = {
  label: string;
  text: string;
};

export type Question = {
  id: number;
  category: string;
  question: string;
  options: Option[];
  correctAnswer: string; 
};

export const questions: Question[] = Array.from({ length: 25 }, (_, i) => {
  const labels = ["A", "B", "C", "D"];
  const randomAnswer = labels[Math.floor(Math.random() * labels.length)];

  return {
    id: i + 1,
    category: "Grammar (Bunpou)",
    question: `Pola kalimat yang tepat untuk situasi ini adalah...? Lorem ipsum dolor sit amet consectetur adipisicing elit. Amet, nulla.`,
    correctAnswer: randomAnswer, 
    options: [
      { label: "A", text: "Watashi wa nande nihon ga suki desu" },
      { label: "B", text: "Kore wa pen desu" },
      { label: "C", text: "Anata no namae wa nan desu ka" },
      { label: "D", text: "Arigatou gozaimasu" },
    ],
  };
});