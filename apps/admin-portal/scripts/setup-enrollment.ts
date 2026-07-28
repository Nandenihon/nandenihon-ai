import { ensureAssignmentTables } from "@repo/database";

ensureAssignmentTables()
    .then(() => {
        console.log("Enrollment, assignment, grading, and notification schema is ready.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Failed to set up enrollment schema:", error);
        process.exit(1);
    });
