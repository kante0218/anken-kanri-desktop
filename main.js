const { app, BrowserWindow, shell, session } = require("electron");
const fs = require("fs");
const path = require("path");

const APP_URL = "https://anken-kanri-ten.vercel.app";
const APP_ORIGIN = new URL(APP_URL).origin;

function isAppUrl(rawUrl) {
  try {
    return new URL(rawUrl).origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

// 外部に渡してよいのはブラウザ/メーラーで開く一般的なリンクのみ
function isSafeExternalUrl(rawUrl) {
  try {
    const { protocol } = new URL(rawUrl);
    return protocol === "https:" || protocol === "http:" || protocol === "mailto:";
  } catch {
    return false;
  }
}

const boundsFile = () => path.join(app.getPath("userData"), "window-bounds.json");

function loadBounds() {
  try {
    const b = JSON.parse(fs.readFileSync(boundsFile(), "utf8"));
    if (Number.isFinite(b.width) && Number.isFinite(b.height)) return b;
  } catch {}
  return { width: 1360, height: 860 };
}

function saveBounds(win) {
  try {
    if (!win.isMinimized() && !win.isFullScreen()) {
      fs.writeFileSync(boundsFile(), JSON.stringify(win.getBounds()));
    }
  } catch {}
}

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
    ...loadBounds(),
    minWidth: 900,
    minHeight: 600,
    title: "clearAI 案件管理ダッシュボード",
    autoHideMenuBar: true,
    backgroundColor: "#fafafa",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  win.loadURL(APP_URL);
  win.on("close", () => saveBounds(win));

  // 新規ウィンドウは作らない: 同一オリジンは同じウィンドウで、外部はOSの既定アプリで開く
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url)) {
      win.loadURL(url);
    } else if (isSafeExternalUrl(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // レンダラー起点の遷移は同一オリジンのみ許可（data:等への遷移も遮断。
  // main側のloadURLはこのイベントの対象外なのでエラー画面表示は影響を受けない）
  win.webContents.on("will-navigate", (e, url) => {
    if (isAppUrl(url)) return;
    e.preventDefault();
    if (isSafeExternalUrl(url)) shell.openExternal(url);
  });

  // 読み込み失敗（オフライン等）はリトライ画面へ。-3(ABORTED)はSPA遷移で起きるので無視
  win.webContents.on("did-fail-load", (_e, code, desc, _url, isMainFrame) => {
    if (!isMainFrame || code === -3) return;
    win.loadURL(errorPage(`${desc} ${code}`));
  });
}

app.whenReady().then(() => {
  // Web側が権限を要求しても基本拒否（コピー操作のみ許可）
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === "clipboard-sanitized-write");
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
