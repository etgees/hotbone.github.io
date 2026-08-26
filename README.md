# 文華哈棒隊 (HotBone) 官方網站

> **「棒球只是理由，聚在一起才是目的。」**  
> 揮灑費洛蒙汗汁，生氣勃勃走出校園！

---

## ⚾ 專案簡介

文華哈棒隊（HotBone Baseball Club）創立於 2003 年台中市立文華高級中學第 14 屆。本專案為哈棒隊官方旗艦靜態網站，融合美式復古運動風（Vintage Baseball）、Gay Pride 彩虹光暈與幽默幹話迷因，全站採用高對比深色模式建置。

---

## 📁 檔案與目錄架構

- `CNAME`：自訂網域配置 (`hotbone.com`)
- `.github/workflows/pages.yml`：GitHub Pages 自動化部署腳本
- `assets/`
  - `css/custom.css`：美式復古運動紋理、彩虹光暈漸層、無縫跑馬燈、卡片微光與模糊遮罩樣式
  - `js/main.js`：老司機警示彩蛋、跑馬燈暫停、深夜專欄解鎖、表單互動回饋與 Podcast 播放器
- `index.html`：首頁（16:9 Hero Banner、金句無縫跑馬燈、品牌故事、幹部快照）
- `roster.html`：哈棒陣容（核心幹部四巨頭、傳奇黑歷史名冊、微光升起卡牌）
- `legends.html`：傳奇戰績（2003/2014/2026 史詩戰役時間軸、YouTube 影音、Podcast 播客）
- `merch.html`：哈棒庶務（官方周邊逸品、老司機 18+ 深夜模糊解鎖專欄）
- `meet_the_team.html`：團隊基地（文華高中怡園 Google Maps 嵌入、發源地故事、發射費洛蒙表單）

---

## 🛠️ 技術規格

- **標記語言**：HTML5（語意化標籤，標準繁體中文 `zh-TW`）
- **樣式架構**：Tailwind CSS (CDN) + Custom CSS 擴充
- **互動腳本**：Vanilla JavaScript (ES6+)
- **部署平台**：GitHub Pages
