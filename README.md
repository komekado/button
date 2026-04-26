# ⚡ 按鈕競速 Button Race

多人即時反應速度遊戲。房主建立房間，玩家輸入代碼加入，看誰按得最快！

## 本地執行

```bash
npm install
npm start
```

開啟 http://localhost:3000

## 部署到 Railway（免費）

1. 前往 https://railway.app 註冊帳號
2. 點「New Project」→「Deploy from GitHub repo」
3. 把這個資料夾推到 GitHub，選擇 repo
4. Railway 會自動偵測 Node.js 並部署
5. 部署完成後會給你一個 `xxxx.up.railway.app` 網址，分享給朋友！

## 部署到 Render（免費）

1. 前往 https://render.com 註冊
2. 點「New Web Service」→ 連接 GitHub repo
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. 選 Free 方案，Deploy！

## 部署到 Fly.io

```bash
npm install -g flyctl
flyctl auth login
flyctl launch
flyctl deploy
```

## 遊戲規則

- 輸入名字，房間代碼留空 → 建立新房間
- 把 4 位房間代碼分享給朋友
- 房主按「開始遊戲」
- 倒數 3、2、1 後按鈕亮起
- 最快按下的人獲勝
- 結果顯示每個人的反應時間（毫秒）
