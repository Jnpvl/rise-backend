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
  const browser = await puppeteer.launch(buildLaunchOptions());

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
