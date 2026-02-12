// src/globals.d.ts

// 1. 解決 __firebase_config 找不到的問題
declare const __firebase_config: string;

// 2. 解決 app, auth, db 隱含 any 的問題
// 我們在全域命名空間中宣告這些變數的型別
declare var app: any;
declare var auth: any;
declare var db: any;
