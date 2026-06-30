import { createStudent, findStudentByEmail } from "@repo/database";

async function verifyField() {
    const email = `test-${Date.now()}@example.com`;
    const japaneseLevel = "N5";

    const newStudent = await createStudent({
        fullName: "Test User",
        email,
        level: "N5",
        japaneseLevel,
        testStartedAt: new Date(),
    });

    console.log("Student created:", newStudent);

    const foundStudent = await findStudentByEmail(email);
    console.log("Found student in DB:", foundStudent);

    if (foundStudent && foundStudent.japaneseLevel === japaneseLevel) {
        console.log("SUCCESS: japaneseLevel field is working!");
    } else {
        console.log("FAILED: japaneseLevel field not found or incorrect");
    }
}

verifyField().catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
});
