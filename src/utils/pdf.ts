import puppeteer, { type LaunchOptions } from "puppeteer";

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
];

function buildLaunchOptions(): LaunchOptions {
  const options: LaunchOptions = {
    headless: true,
    args: LAUNCH_ARGS,
  };

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
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
    const message =
      err instanceof Error ? err.message : "Error desconocido al iniciar Chromium";
    throw new Error(
      `No se pudo iniciar el navegador para generar PDF (${message}). ` +
        "Instala Chrome o ejecuta: npx puppeteer browsers install chrome"
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
