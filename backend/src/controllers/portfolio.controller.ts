import { Request, Response } from "express";
import Transaction from "../models/Transaction.model";
import {
    addTransactionSchema,
    importTransactionsSchema,
    updateTransactionSchema,
} from "../utils/portfolioValidation";
import { asyncHandler } from "../utils/asyncHandler";
import { searchCoins } from "../services/coinGecko.service";
import {
    getPortfolioStatsForUser,
    getUserTransactions,
    validateTransactionSequence,
    validateTransactionTimeline,
} from "../services/portfolio.service";

const ensureUserId = (req: Request) => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new Error("Not authenticated");
    }
    return userId;
};

const parseCsvTransactions = (csv: string) => {
    const lines = csv.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
        throw new Error("CSV must include a header row and at least one transaction");
    }

    const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
    const required = ["coinid", "coinname", "coinsymbol", "type", "quantity", "price"];

    for (const field of required) {
        if (!headers.includes(field)) {
            throw new Error(`CSV is missing required column: ${field}`);
        }
    }

    const getValue = (row: string[], field: string) => row[headers.indexOf(field)]?.trim() || "";

    return lines.slice(1).map((line) => {
        const row = line.split(",").map((part) => part.trim());
        return addTransactionSchema.parse({
            coinId: getValue(row, "coinid"),
            coinName: getValue(row, "coinname"),
            coinSymbol: getValue(row, "coinsymbol"),
            type: getValue(row, "type").toUpperCase(),
            quantity: Number(getValue(row, "quantity")),
            price: Number(getValue(row, "price")),
            fee: getValue(row, "fee") ? Number(getValue(row, "fee")) : 0,
            timestamp: getValue(row, "timestamp") || undefined,
        });
    });
};

const getPortfolioController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    const transactions = await getUserTransactions(userId);

    res.status(200).json({
        success: true,
        transactions,
    });
});

const addTransactionController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    const payload = addTransactionSchema.parse(req.body);

    await validateTransactionTimeline(userId, payload);

    const transaction = await Transaction.create({
        user: userId,
        ...payload,
        timestamp: payload.timestamp ?? new Date(),
    });

    res.status(201).json({
        success: true,
        transaction,
    });
});

const updateTransactionController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    const payload = updateTransactionSchema.parse(req.body);

    await validateTransactionTimeline(userId, payload, req.params.id);

    const transaction = await Transaction.findOneAndUpdate(
        { _id: req.params.id, user: userId },
        {
            ...payload,
            timestamp: payload.timestamp ?? new Date(),
        },
        { new: true, runValidators: true }
    );

    if (!transaction) {
        res.status(404);
        throw new Error("Transaction not found");
    }

    res.status(200).json({
        success: true,
        transaction,
    });
});

const getPortfolioStatsController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    const stats = await getPortfolioStatsForUser(userId);

    return res.json({
        success: true,
        ...stats,
    });
});

const deleteTransactionController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);

    const transaction = await Transaction.findOneAndDelete({
        _id: req.params.id,
        user: userId,
    });

    if (!transaction) {
        res.status(404);
        throw new Error("Transaction not found");
    }

    res.status(200).json({ success: true, id: req.params.id });
});

const searchCoinsController = asyncHandler(async (req: Request, res: Response) => {
    const coins = await searchCoins(req.query.query as string);
    res.status(200).json({
        success: true,
        coins: coins.data,
        lastUpdated: coins.lastUpdated,
        stale: coins.stale,
        staleReason: coins.staleReason,
    });
});

const exportTransactionsController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    const transactions = await getUserTransactions(userId);
    const rows = [
        "coinId,coinName,coinSymbol,type,quantity,price,fee,timestamp",
        ...transactions.map((tx) => [
            tx.coinId,
            tx.coinName,
            tx.coinSymbol,
            tx.type,
            tx.quantity,
            tx.price,
            tx.fee ?? 0,
            new Date(tx.timestamp ?? new Date()).toISOString(),
        ].join(",")),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=portfolio-transactions.csv");
    res.status(200).send(rows.join("\n"));
});

const importTransactionsController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    const { csv, previewOnly } = importTransactionsSchema.parse(req.body);
    const parsedTransactions = parseCsvTransactions(csv);

    const seen = new Set<string>();
    for (const transaction of parsedTransactions) {
        const key = `${transaction.coinId}-${transaction.type}-${transaction.quantity}-${transaction.price}-${transaction.timestamp?.toISOString() || ""}`;
        if (seen.has(key)) {
            res.status(400);
            throw new Error("CSV contains duplicate transaction rows");
        }
        seen.add(key);
    }

    const existingTransactions = await getUserTransactions(userId);
    validateTransactionSequence([...((existingTransactions as unknown) as typeof parsedTransactions), ...parsedTransactions]);

    if (previewOnly) {
        return res.status(200).json({
            success: true,
            preview: parsedTransactions,
            count: parsedTransactions.length,
        });
    }

    await Transaction.insertMany(parsedTransactions.map((transaction) => ({
        user: userId,
        ...transaction,
        timestamp: transaction.timestamp ?? new Date(),
    })));

    return res.status(201).json({
        success: true,
        count: parsedTransactions.length,
    });
});

export {
    addTransactionController,
    deleteTransactionController,
    exportTransactionsController,
    getPortfolioController,
    getPortfolioStatsController,
    importTransactionsController,
    searchCoinsController,
    updateTransactionController,
};
