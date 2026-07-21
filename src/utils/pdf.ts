import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";

function isRenderRuntime(): boolean {
  return process.env.RENDER === "true" || Boolean(process.env.RENDER_SERVICE_ID);
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const onRender = isRenderRuntime();

  const browser = await puppeteer.launch({
    args: onRender
      ? chromium.args
      : [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
    executablePath: onRender ? await chromium.executablePath() : undefined,
    headless: true,
  });

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
