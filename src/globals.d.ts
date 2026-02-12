// src/globals.d.ts

// 處理所有 __ 開頭的全域注入變數
declare const __firebase_config: any;
declare const __app_id: any;

// 處理 let app, auth, db 等未定義型別的變數
// 使用 declare var 可以讓 TS 容忍同名的 let 宣告而不去檢查它的隱含 any 型別
declare var app: any;
declare var auth: any;
declare var db: any;
declare var globalAppId: any;

// 為了保險起見，如果還有其他類似變數，可以在這裡繼續添加
