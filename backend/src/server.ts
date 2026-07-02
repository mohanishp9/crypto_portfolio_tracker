import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { startCronJobs } from "./services/cron.service";
import { initWebSocketServer } from "./services/websocket.service";
import "./worker";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
        startCronJobs();
    });
    initWebSocketServer(server);
}).catch((err) => {
    console.error('Failed to connect to database: ', err);
    process.exit(1);
});
