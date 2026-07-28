export const APPLICATION_TRANSITIONS: Record<string, readonly string[]> = {
    draft: ["submitted"],
    submitted: ["under_review", "withdrawn"],
    under_review: ["accepted", "rejected"],
    accepted: [],
    rejected: [],
    withdrawn: [],
};

export function canTransitionApplication(from: string, to: string): boolean {
    return APPLICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function hasAvailableSeat(capacity: number, occupiedSeats: number): boolean {
    return Number.isInteger(capacity) && Number.isInteger(occupiedSeats) && capacity > occupiedSeats;
}

export function isValidClassPeriod(input: {
    enrollmentOpenAt: string | Date;
    enrollmentCloseAt: string | Date;
    startAt: string | Date;
    endAt: string | Date;
}): boolean {
    const enrollmentOpen = new Date(input.enrollmentOpenAt).getTime();
    const enrollmentClose = new Date(input.enrollmentCloseAt).getTime();
    const start = new Date(input.startAt).getTime();
    const end = new Date(input.endAt).getTime();
    return [enrollmentOpen, enrollmentClose, start, end].every(Number.isFinite)
        && enrollmentOpen < enrollmentClose
        && start < end;
}
