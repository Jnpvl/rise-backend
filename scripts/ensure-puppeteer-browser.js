const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

function fileExists(filePath) {
  try {
    return Boolean(filePath && fs.existsSync(filePath));
  } catch {
    return false;
  }
}

function systemChromeCandidates() {
  if (process.platform === "win32") {
    return [
      process.env.PUPPETEER_EXECUTABLE_PATH,
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
        : null,
    ].filter(Boolean);
  }

  if (process.platform === "darwin") {
    return [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ].filter(Boolean);
  }

  return [process.env.PUPPETEER_EXECUTABLE_PATH].filter(Boolean);
}

function hasBrowserAvailable() {
  for (const candidate of systemChromeCandidates()) {
    if (fileExists(candidate)) {
      return true;
    }
  }

  try {
    return fileExists(puppeteer.executablePath());
  } catch {
    return false;
  }
}

try {
  if (process.env.PUPPETEER_SKIP_BROWSER_DOWNLOAD === "1") {
    console.log("Puppeteer: instalación de Chrome omitida.");
    process.exit(0);
  }

  if (hasBrowserAvailable()) {
    console.log("Puppeteer: navegador disponible.");
    process.exit(0);
  }

  console.log("Puppeteer: descargando Chrome...");
  execSync("npx puppeteer browsers install chrome", { stdio: "inherit" });
  console.log("Puppeteer: Chrome instalado.");
} catch (error) {
  console.warn(
    "Puppeteer: no se pudo instalar Chrome automáticamente:",
    error.message
  );
  console.warn(
    "Configura PUPPETEER_EXECUTABLE_PATH o instala Google Chrome en el servidor."
  );
}
