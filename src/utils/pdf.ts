import fs from "fs";
import path from "path";
import puppeteer, { Browser, type LaunchOptions } from "puppeteer";
import { AppError } from "./app-error";

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-extensions",
  "--disable-background-networking",
];

const LAUNCH_TIMEOUT_MS = 90_000;
const PAGE_TIMEOUT_MS = 30_000;
const MAX_USES_BEFORE_RECYCLE = 50;

let browserPromise: Promise<Browser> | null = null;
let browserUseCount = 0;

function resolveExecutablePath(): string | undefined {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  if (process.platform === "win32") {
    const candidates = [
      path.join(
        process.env.PROGRAMFILES || "C:\\Program Files",
        "Google",
        "Chrome",
        "Application",
        "chrome.exe"
      ),
      path.join(
        process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)",
        "Google",
        "Chrome",
        "Application",
        "chrome.exe"
      ),
      process.env.LOCALAPPDATA
        ? path.join(
            process.env.LOCALAPPDATA,
            "Google",
            "Chrome",
            "Application",
            "chrome.exe"
          )
        : "",
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  if (process.platform === "darwin") {
    const macChrome =
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    if (fs.existsSync(macChrome)) {
      return macChrome;
    }
  }

  try {
    const bundled = puppeteer.executablePath();
    if (bundled && fs.existsSync(bundled)) {
      return bundled;
    }
  } catch {
    // Puppeteer aún no descargó el navegador.
  }

  return undefined;
}

function buildLaunchOptions(): LaunchOptions {
  const options: LaunchOptions = {
    headless: true,
    args: LAUNCH_ARGS,
    timeout: LAUNCH_TIMEOUT_MS,
  };

  const executablePath = resolveExecutablePath();
  if (executablePath) {
    options.executablePath = executablePath;
  }

  return options;
}

async function launchBrowser(): Promise<Browser> {
  try {
    const browser = await puppeteer.launch(buildLaunchOptions());
    browserUseCount = 0;
    browser.on("disconnected", () => {
      browserPromise = null;
    });
    return browser;
  } catch (err) {
    console.error("Puppeteer launch failed:", err);
    throw new AppError(
      503,
      "No se pudo iniciar el navegador para generar el PDF. En el servidor ejecuta: npx puppeteer browsers install chrome"
    );
  }
}

async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    const browser = await browserPromise;
    if (browser.connected) {
      return browser;
    }
    browserPromise = null;
  }

  browserPromise = launchBrowser();
  return browserPromise;
}

async function resetBrowser(): Promise<void> {
  if (!browserPromise) {
    return;
  }

  const current = browserPromise;
  browserPromise = null;

  try {
    const browser = await current;
    if (browser.connected) {
      await browser.close();
    }
  } catch {
    // ignore
  }
}

async function maybeRecycleBrowser(browser: Browser): Promise<void> {
  browserUseCount += 1;
  if (browserUseCount < MAX_USES_BEFORE_RECYCLE) {
    return;
  }

  console.log("Reciclando navegador PDF tras varios usos...");
  browserPromise = null;
  browserUseCount = 0;

  try {
    if (browser.connected) {
      await browser.close();
    }
  } catch {
    // ignore
  }
}

async function renderOnce(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({
      format: "A4",
      landscape: false,
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => undefined);
    await maybeRecycleBrowser(browser);
  }
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  try {
    return await renderOnce(html);
  } catch (firstError) {
    console.warn("PDF render failed, reiniciando navegador...", firstError);
    await resetBrowser();

    try {
      return await renderOnce(html);
    } catch (secondError) {
      console.error("PDF render failed after retry:", secondError);
      throw new AppError(
        503,
        "No se pudo generar el PDF. Intenta de nuevo en unos segundos."
      );
    }
  }
}

/** Precalienta Chrome al arrancar el servidor para que la primera receta no tarde tanto. */
export async function warmupPdfEngine(): Promise<void> {
  try {
    await renderHtmlToPdf(
      "<!DOCTYPE html><html><body><p>Rise PDF warmup</p></body></html>"
    );
    console.log("Motor PDF listo.");
  } catch (err) {
    console.warn(
      "Warmup PDF omitido (se iniciará al generar la primera receta):",
      err instanceof Error ? err.message : err
    );
  }
}
