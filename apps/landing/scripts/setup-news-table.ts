import { loadEnvConfig } from "@next/env";
import { closeMySQLConnection, ensureNewsInfrastructure } from "@repo/database";

loadEnvConfig(process.cwd());

async function setupNewsTable() {
    try {
        await ensureNewsInfrastructure();
        console.log("News table and sync procedures are ready.");
    } finally {
        await closeMySQLConnection();
    }
}

setupNewsTable().catch((error) => {
    console.error("Failed to set up news table:", error);
    process.exit(1);
});
