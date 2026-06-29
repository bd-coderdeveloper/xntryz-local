const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

let mainWindow;
let serverProcess;
const PORT = 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: "UPFEEDTH Launcher",
    autoHideMenuBar: true,
  });

  mainWindow.loadFile("launcher-gui.html");

  mainWindow.on("closed", function () {
    mainWindow = null;
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit();
  });
}

function startNextJsServer() {
  const isDev = !app.isPackaged;
  
  // In dev mode, we might just be testing the GUI. 
  // We'll try to run the standalone server if it exists.
  const serverPath = path.join(__dirname, ".next", "standalone", "server.js");
  
  // Set env vars
  const env = {
    ...process.env,
    PORT: PORT.toString(),
    HOSTNAME: "localhost",
    NODE_ENV: "production",
  };

  serverProcess = spawn("node", [serverPath], { env });

  serverProcess.stdout.on("data", (data) => {
    const msg = data.toString();
    console.log(`[Next.js] ${msg}`);
    if (mainWindow) {
      mainWindow.webContents.send("server-log", msg);
    }
  });

  serverProcess.stderr.on("data", (data) => {
    const msg = data.toString();
    console.error(`[Next.js Error] ${msg}`);
    if (mainWindow) {
      mainWindow.webContents.send("server-log", `ERROR: ${msg}`);
    }
  });

  serverProcess.on("close", (code) => {
    console.log(`Next.js server exited with code ${code}`);
    if (mainWindow) {
      mainWindow.webContents.send("server-log", `Server exited with code ${code}`);
    }
  });
}

app.on("ready", () => {
  createWindow();
  startNextJsServer();
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) createWindow();
});

// IPC handler to open the browser
ipcMain.on("open-browser", () => {
  shell.openExternal(`http://localhost:${PORT}`);
});

ipcMain.on("stop-server", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
    if (mainWindow) {
      mainWindow.webContents.send("server-log", "Server stopped manually.");
    }
  }
});
