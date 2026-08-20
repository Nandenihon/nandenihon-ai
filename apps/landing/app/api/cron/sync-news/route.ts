import { NextRequest, NextResponse } from "next/server";
import { syncNewsFromWordPress } from "@repo/database";

/**
 * Scheduled full resync of the `news` table from the WordPress `wp_posts` /
 * `wp_postmeta` / `wp_terms` tables (see news-mysql.ts). Real-time sync
 * already happens via MySQL triggers when the DB user has trigger/binlog
 * privileges (createSyncTriggers), with a 5-minute sync-on-read fallback
 * otherwise. This cron is the guaranteed-freshness backstop: it runs once
 * every 24h regardless of site traffic or trigger availability, so the news
 * table never silently drifts stale if nobody happens to browse /berita for
 * a while (or the DB user never had trigger privileges to begin with).
 *
 * Triggered by Vercel Cron (see vercel.json). Requires the CRON_SECRET env
 * var to be set on the Vercel project — Vercel automatically sends it as
 * `Authorization: Bearer $CRON_SECRET` on cron-triggered requests.
 */
export async function GET(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    } else {
        console.warn("CRON_SECRET is not set — /api/cron/sync-news is unauthenticated. Set CRON_SECRET in the Vercel project env vars.");
    }

    try {
        const startedAt = Date.now();
        await syncNewsFromWordPress();
        return NextResponse.json({
            success: true,
            syncedAt: new Date().toISOString(),
            durationMs: Date.now() - startedAt,
        });
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        console.error("Scheduled news sync failed:", error);
        return NextResponse.json({ success: false, error: "Sinkronisasi news gagal", details }, { status: 500 });
    }
}
