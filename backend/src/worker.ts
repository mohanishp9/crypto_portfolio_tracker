import dotenv from "dotenv";
dotenv.config();

// Initialize workers
import { emailWorker } from "./jobs/email.worker";

console.log("[Worker] Background worker process started. Listening for jobs...");

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
    console.log(`\n[Worker] Received ${signal}, closing workers gracefully...`);
    
    // Wait for active jobs to finish
    await emailWorker.close();
    
    console.log("[Worker] Shutdown complete.");
    process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
