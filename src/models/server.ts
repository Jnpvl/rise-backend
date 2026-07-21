import express, { Application } from "express";
import v1Router from "../routes";
import path from "path";
import cors from "cors";
import { initializeDatabases } from "../config/database";
import morgan from "morgan";
import { uploadsDir } from "../utils/uploads-path";

class Server {
    public app: Application;
    public PORT = parseInt(process.env.PORT || '8080', 10);

    constructor() {
        this.app = express();
        this.config();
        this.router();
        this.database();
    }

    async database(): Promise<void> {
        return initializeDatabases()
            .then(() => {
                console.log("Todas las bases de datos han sido inicializadas correctamente.");
            })
            .catch((error) => {
                console.error("Error conectando a las bases de datos:", error);
                process.exit(1);
            });
    }

    config(): void {
        this.app.use(morgan("dev"));
        this.app.use(
            cors({
                origin: "*",
                methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
                allowedHeaders: ["Content-Type", "Authorization"]
            })
        );
        // Podology consultations include base64 signatures + foot diagram drawings.
        this.app.use(express.json({ limit: "20mb" }));
        this.app.use(express.urlencoded({ extended: true, limit: "20mb" }));
        this.app.use('/uploads', express.static(uploadsDir));
        // Prescription template assets (logo, etc.)
        this.app.use(
            '/assets',
            express.static(path.join(__dirname, '../utils/assets'))
        );
    }

    router(): void {
        this.app.use("/api/v1", v1Router);
    }

    start(): void {
        this.app.get("/", (_req, res) => {
            res.send("El servidor está funcionando correctamente");
        });
        this.app.listen(this.PORT, () => {
            console.log(`Server running at http://localhost:${this.PORT}`);
        });
    }
}

export default Server;
