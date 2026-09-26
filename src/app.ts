/* eslint-disable @typescript-eslint/no-explicit-any */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import path from "path";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFound from "./middlewares/notFound";
import router from "./routes";
import { logger, logHttpRequests } from "./logger/logger";
import { logsRoutes } from "./routes/logs.route";
import { checkoutController } from "./modules/make_modules/subscription/checkout/checkout.controller";
import { PublicPdfRoutes } from "./modules/make_modules/pdf.generator/pdf.routes";

// Create an Express application
const app: Application = express();
app.use("/stripe/webhook", express.raw({ type: "application/json" }), checkoutController.webhook);
// // Define __dirname manually

//parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
// Serve uploads from absolute public dir so /files/* never falls through to API 404.
const publicDir = path.resolve(process.cwd(), "public");
app.use("/files", express.static(path.join(publicDir, "files")));
app.use(express.static(publicDir));
app.use(logsRoutes);
app.use(logHttpRequests);
app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ limit: "16mb", extended: true }));
// app.use((req: Request, res: Response, next: NextFunction) => {
//   logger.info(`Incoming request: ${req.method} ${req.url}`);

//   next();
// });

//application router
app.use(router);


app.get("/", (req: Request, res: Response) => {
  logger.info("Root endpoint hit");
  const template = `<h1 style="text-align:center">Hello</h1>
    <h2 style="text-align:center">Welcome to the invoice Server </h2>
 
    `;
  res.status(200).send(template);
});

// Public QR-code target: /<user_id>/<doc-slug>/<number> → the document PDF.
// Mounted after the API router and "/" so it only catches otherwise-unmatched
// root paths; unknown docs fall through to notFound.
app.use(PublicPdfRoutes);

app.all("*", notFound);
app.use(globalErrorHandler);

// Log errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error occurred: ${err.message}`, { stack: err.stack });
  next(err);
});

export default app;




