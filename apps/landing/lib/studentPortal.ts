export function getStudentPortalUrl(): string {
  return (
    process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://student.nandenihon.com")
  ).replace(/\/$/, "");
}
