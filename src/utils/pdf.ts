import fs from "fs";
import path from "path";
import puppeteer, { type LaunchOptions } from "puppeteer";
import { AppError } from "./app-error";

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
];

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
  };

  const executablePath = resolveExecutablePath();
  if (executablePath) {
    options.executablePath = executablePath;
  }

  return options;
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  let browser;

  try {
    browser = await puppeteer.launch(buildLaunchOptions());
  } catch (err) {
    console.error("Puppeteer launch failed:", err);
    throw new AppError(
      503,
      "No se pudo iniciar el navegador para generar el PDF. En el servidor ejecuta: npx puppeteer browsers install chrome"
    );
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    return Buffer.from(
      await page.pdf({
        format: "A4",
        landscape: false,
        printBackground: true,
      })
    );
  } finally {
    await browser.close();
  }
}
