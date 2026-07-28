import assert from "node:assert/strict";
import test from "node:test";
import {
    canTransitionApplication,
    hasAvailableSeat,
    isValidClassPeriod,
} from "../src/enrollment-domain.ts";

test("application lifecycle only permits documented transitions", () => {
    assert.equal(canTransitionApplication("draft", "submitted"), true);
    assert.equal(canTransitionApplication("submitted", "under_review"), true);
    assert.equal(canTransitionApplication("under_review", "accepted"), true);
    assert.equal(canTransitionApplication("under_review", "rejected"), true);
    assert.equal(canTransitionApplication("accepted", "rejected"), false);
    assert.equal(canTransitionApplication("withdrawn", "submitted"), false);
});

test("seat availability blocks a full class", () => {
    assert.equal(hasAvailableSeat(20, 19), true);
    assert.equal(hasAvailableSeat(20, 20), false);
    assert.equal(hasAvailableSeat(20, 21), false);
});

test("class and enrollment periods must be increasing", () => {
    assert.equal(isValidClassPeriod({
        enrollmentOpenAt: "2026-07-01T00:00:00Z",
        enrollmentCloseAt: "2026-07-10T00:00:00Z",
        startAt: "2026-07-15T00:00:00Z",
        endAt: "2026-10-15T00:00:00Z",
    }), true);
    assert.equal(isValidClassPeriod({
        enrollmentOpenAt: "2026-07-10T00:00:00Z",
        enrollmentCloseAt: "2026-07-01T00:00:00Z",
        startAt: "2026-07-15T00:00:00Z",
        endAt: "2026-10-15T00:00:00Z",
    }), false);
});
