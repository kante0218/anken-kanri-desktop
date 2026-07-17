# clearAI Dashboard (Desktop)

clearAI 案件管理ダッシュボード ( https://anken-kanri-ten.vercel.app ) のデスクトップアプリ版。
Electron シェルが本番サイトを読み込む方式のため、Web側の更新は自動で反映される。

## ダウンロード

[Releases](https://github.com/kante0218/anken-kanri-desktop/releases/latest) から:

- macOS: `clearAI-Dashboard-mac.dmg` (Universal / Apple Silicon + Intel)
- Windows: `clearAI-Dashboard-windows-setup.exe` (x64)

### 初回起動

- **macOS**: Developer ID 署名済み・notarization 未実施のため、初回はブロックされる場合あり。
  「システム設定 > プライバシーとセキュリティ」最下部の「このまま開く」で起動。
- **Windows**: SmartScreen が出たら「詳細情報」→「実行」。

## 開発

```bash
npm install
npm start        # ローカル起動
npm run dist:mac # macOS ビルド (要 Developer ID 証明書)
npm run dist:win # Windows ビルド
```

## リリース手順

1. `package.json` の version を上げる
2. `git tag vX.Y.Z && git push origin main --tags`
3. GitHub Actions が Windows 版をビルドしてリリースに添付
4. macOS 版は証明書のあるMacでローカルビルドしてアップロード:
   ```bash
   npm run dist:mac
   gh release upload vX.Y.Z dist/clearAI-Dashboard-mac.dmg
   ```
