import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import portfolioRoutes from "./routes/portfolio.routes";
import marketRoutes from "./routes/market.routes";
import watchlistRoutes from "./routes/watchlist.routes";
import alertsRoutes from "./routes/alerts.routes";

const app: Application = express();

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
            process.env.FRONTEND_URL || "",
        ].filter(Boolean),
        credentials: true,
    })
);
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts', alertsRoutes);

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

export default app;
