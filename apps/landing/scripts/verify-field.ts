
import { Student } from "../lib/db/models/student";
import { connectDB } from "../lib/db/connection";
import mongoose from "mongoose";

async function test() {
    await connectDB();
    console.log("Connected to DB");

    const email = "test_japanese_level_" + Date.now() + "@example.com";
    const fullName = "Test User Japanese Level";
    const level = "N5";
    const japaneseLevel = "Belum Pernah";

    console.log(`Testing with email: ${email}`);

    // Simulate API call logic
    const newStudent = await Student.create({
        fullName,
        email,
        level,
        japaneseLevel,
        testStatus: "not_started",
        passStatus: "pending",
        score: 0,
        answerHistory: [],
        registrationComplete: false,
    });

    console.log("Student created:", newStudent);

    const foundStudent = await Student.findOne({ email });
    console.log("Found student in DB:", foundStudent);

    if (foundStudent && foundStudent.japaneseLevel === japaneseLevel) {
        console.log("SUCCESS: japaneseLevel saved correctly!");
    } else {
        console.log("FAILURE: japaneseLevel not saved correctly!");
    }

    await mongoose.connection.close();
}

test().catch(console.error);
