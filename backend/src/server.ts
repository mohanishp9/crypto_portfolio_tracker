import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import portfolioRoutes from "./routes/portfolio.routes";
import marketRoutes from "./routes/market.routes";
import helmet from "helmet";
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(
    helmet({
      contentSecurityPolicy: false
    })
  );
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://grove-portfolio.onrender.com",
            "https://grove-crypto-tracker.vercel.app",
        ],
        credentials: true,
    })
);
app.use(cookieParser());


// app.get("/api/health", (req: Request, res: Response) => {
//     res.json({ status: "ok" });
// })

app.use("/api/auth", authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);

app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err: any, _req: Request, res: Response, _next: any) => {
    console.error(err.stack);
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : (err.message || 'Internal Server Error')
    });
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to connect to database: ', err);
    process.exit(1);
});
