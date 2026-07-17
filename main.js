const { app, BrowserWindow, shell } = require("electron");

const APP_URL = "https://anken-kanri-ten.vercel.app";

const errorPage = (detail) =>
  "data:text/html;charset=utf-8," +
  encodeURIComponent(`<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><title>接続エラー</title>
<style>
  body{font-family:-apple-system,"Segoe UI","Hiragino Sans","Yu Gothic UI",sans-serif;background:#fafafa;color:#18181b;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
  .box{text-align:center;max-width:28rem;padding:2rem}
  h1{font-size:1.1rem;font-weight:600;margin:0 0 .5rem}
  p{font-size:.85rem;color:#71717a;margin:0 0 1.5rem}
  button{background:#18181b;color:#fafafa;border:0;border-radius:.5rem;padding:.6rem 1.6rem;font-size:.9rem;font-weight:600;cursor:pointer}
</style></head><body>
<div class="box">
  <h1>ダッシュボードに接続できません</h1>
  <p>インターネット接続を確認してください。（${detail}）</p>
  <button onclick="location.replace('${APP_URL}')">再読み込み</button>
</div></body></html>`);

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: "clearAI 案件管理ダッシュボード",
    autoHideMenuBar: true,
    backgroundColor: "#0a0a0a",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  win.loadURL(APP_URL);

  // アプリ外のリンクはOSの既定ブラウザで開く
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(APP_URL) && !url.startsWith("data:")) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  // 読み込み失敗（オフライン等）はリトライ画面へ。-3(ABORTED)はSPA遷移で起きるので無視
  win.webContents.on("did-fail-load", (_e, code, desc, _url, isMainFrame) => {
    if (!isMainFrame || code === -3) return;
    win.loadURL(errorPage(`${desc} ${code}`));
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
