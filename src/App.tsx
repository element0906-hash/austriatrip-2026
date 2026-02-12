import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  Plane, MapPin, Utensils, BedDouble, Info, Wallet, Sun, Cloud, 
  CloudRain, Moon, Camera, ShoppingBag, Train, Plus, Trash2, Shirt, CheckCircle2, Circle
} from 'lucide-react';

// --- Firebase 設定與初始化 ---
const manualConfig = {
  apiKey: "AIzaSyDY6Ss9V08KcokLxJg4xCxhJIYvq-A9AYU",
  authDomain: "austriatravel-2026.firebaseapp.com",
  projectId: "austriatravel-2026",
  storageBucket: "austriatravel-2026.firebasestorage.app",
  messagingSenderId: "296545344595",
  appId: "1:296545344595:web:d9cdbbcc08ff067326baa6",
  measurementId: "G-SCPRFJKMWW"
};

const firebaseConfig = manualConfig;
const globalAppId = 'austria-czech-trip-v1';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 莫蘭迪色系主題 ---
const themeColors = {
  bg: '#F5F3F0', 
  textMain: '#4A4641', 
  textLight: '#8C8881',
  accentOlive: '#7D805A', 
  accentTerra: '#A85A46', 
  accentSand: '#C9C1B2',  
  accentClay: '#777571',  
  accentMuffin: '#C68B75', 
  accentGreyBlue: '#6B7A87', 
  accentGreyOrange: '#C28F70', 
};

const categoryStyles: any = {
  'flight': { icon: Plane, color: themeColors.accentClay, label: 'FLIGHT' },
  'hotel': { icon: BedDouble, color: themeColors.accentSand, label: 'HOTEL' },
  'transport': { icon: Train, color: themeColors.textLight, label: 'TRANSPORT' },
  'sightseeing': { icon: Camera, color: themeColors.accentOlive, label: 'SIGHTSEEING' },
  'food': { icon: Utensils, color: themeColors.accentTerra, label: 'FOOD' },
  'shopping': { icon: ShoppingBag, color: themeColors.accentGreyOrange, label: 'SHOPPING' },
};

const payersInfo: any = {
  'R': { id: 'R', color: 'bg-[#A85A46] text-white' }, // Ruby
  'C': { id: 'C', color: 'bg-[#7D805A] text-white' }, // Cora
  'N': { id: 'N', color: 'bg-[#6B7A87] text-white' }, // Nina
  'O': { id: 'O', color: 'bg-[#C28F70] text-white' }  // Oliver
};

// --- 模擬數據生成 ---
const generate24HourWeather = (baseTemp: number, condition: string) => {
  const data = [];
  const currentHour = new Date().getHours();
  for (let i = 0; i < 24; i++) {
    let hour = (currentHour + i) % 24;
    let timeLabel = i === 0 ? '現在' : `${hour.toString().padStart(2, '0')}:00`;
    let tempAdjust = (hour >= 10 && hour <= 16) ? 3 : ((hour >= 0 && hour <= 5) ? -4 : 0);
    let icon = <Sun size={20} className="text-[#A85A46]" />;
    if (condition === 'cloudy') icon = <Cloud size={20} className="text-[#8C8881]" />;
    if (condition === 'rainy') icon = <CloudRain size={20} className="text-[#777571]" />;
    if (hour >= 18 || hour <= 5) icon = <Moon size={20} className="text-[#4A4641]" />;
    data.push({ time: timeLabel, temp: `${baseTemp + tempAdjust}°`, icon: icon });
  }
  return data;
};

const tripData = [
  {
    day: 1, dateStr: "25", dayOfWeek: "WED", fullDate: "2026.02.25",
    title: "啟程．飛往維也納", locationName: "Taipei",
    imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop", 
    hourlyWeather: generate24HourWeather(22, 'cloudy'),
    items: [
      { time: "20:35", title: "桃園機場集合", category: "transport", description: "第二航站長榮航空 20 號後方團體櫃檯。", location: "桃園國際機場", outfit: "寬鬆舒適長褲、層次穿搭方便機上穿脫，帶保暖外套。" },
      { time: "23:35", title: "台北(桃園)/維也納", category: "flight", description: "BR065(長榮航空) 直飛維也納。", location: "Vienna Airport" }
    ]
  },
  {
    day: 2, dateStr: "26", dayOfWeek: "THU", fullDate: "2026.02.26",
    title: "哈爾斯塔特", locationName: "Salzburg",
    imageUrl: "https://image.kkday.com/v2/image/get/s1.kkday.com/product_36568/20200122064534_xxRQH/jpg",
    hourlyWeather: generate24HourWeather(4, 'cloudy'),
    items: [
      { time: "06:45", title: "抵達維也納", category: "transport", location: "Vienna Airport", description: "專車前往奧地利湖區。" },
      { time: "10:00", title: "哈爾斯塔特 Hallstatt", category: "sightseeing", description: "世界最美湖畔小鎮。", location: "Hallstatt", outfit: "防風防水外套必備，內搭保暖毛衣與防滑靴。", aiTips: [{ type: 'must-buy', content: '哈爾斯塔特天然岩鹽 (推薦玫瑰鹽)' }, { type: 'must-buy', content: '湖區天然果醬' }, { type: 'souvenir', content: '傳統木雕手作藝品' }] },
      { time: "12:30", title: "湖區鱒魚料理", category: "food", description: "品嚐當地新鮮捕獲的鱒魚。", location: "Hallstatt", aiTips: [{ type: 'must-eat', content: '清蒸鱒魚佐香草奶油' }, { type: 'must-eat', content: '奧地利傳統煎餅湯' }] },
      { time: "15:00", title: "薩爾茲堡市區觀光", category: "sightseeing", description: "莫札特故居與電影真善美場景。", location: "Salzburg Old Town", subLocations: ["王宮廣場", "蓋特萊徳巷", "莫札特故居", "米拉貝爾花園"], aiTips: [{ type: 'must-buy', content: 'FÜRST 創始店銀藍包裝莫札特巧克力' }, { type: 'must-eat', content: '薩爾茲堡舒芙蕾 (Salzburger Nockerl)' }, { type: 'luxury', content: '蓋特萊德巷：LV, Hermès 精品街' }] },
      { time: "18:00", title: "Mercure Salzburg City", category: "hotel", location: "Mercure Salzburg City Hotel" }
    ]
  },
  {
    day: 3, dateStr: "27", dayOfWeek: "FRI", fullDate: "2026.02.27",
    title: "國王湖與庫倫洛夫", locationName: "Český Krumlov",
    imageUrl: "https://blog-static.kkday.com/zh-tw/blog/wp-content/uploads/shutterstock_711751918.jpg",
    hourlyWeather: generate24HourWeather(2, 'rainy'),
    items: [
      { time: "07:30", title: "飯店 享用早餐", category: "food", description: "Mercure Hotel 自助早餐。" },
      { time: "09:00", title: "國王湖 Königssee", category: "sightseeing", description: "德國最深、最清澈的高山湖泊。", location: "Königssee", outfit: "國王湖較冷，需攜帶防風手套與毛帽保暖。" },
      { time: "14:00", title: "薩爾茲堡鹽礦", category: "sightseeing", description: "換穿礦工服，體驗木滑梯。", location: "Salt Mine Berchtesgaden", outfit: "入內需換穿礦工服，建議內穿輕便褲裝。" },
      { time: "17:30", title: "前往庫倫洛夫", category: "transport", description: "前往南波希米亞的童話小鎮。", location: "Cesky Krumlov" },
      { time: "19:00", title: "中世紀變裝晚宴", category: "food", description: "體驗中世紀風情與捷克烤豬腳。", aiTips: [{ type: 'must-eat', content: '捷克黑啤酒 (Dark Lager)' }, { type: 'must-eat', content: '波西米亞炭烤大豬腳' }] },
      { time: "21:00", title: "Hotel OLDINN", category: "hotel", location: "Hotel Oldinn Cesky Krumlov" }
    ]
  },
  {
    day: 4, dateStr: "28", dayOfWeek: "SAT", fullDate: "2026.02.28",
    title: "童話小鎮庫倫洛夫", locationName: "Karlovy Vary",
    imageUrl: "https://image.cdn-eztravel.com.tw/HJ8HZhW9imcQcnmLEJnsbHKSBX4t8piudvOzUSlWoL0/g:ce/aHR0cHM6Ly92YWNhdGlvbi5jZG4tZXp0cmF2ZWwuY29tLnR3L2ltZy9WRFIvQ1pfMjU3ODU5MzkyLmpwZw.jpg",
    hourlyWeather: generate24HourWeather(5, 'cloudy'),
    items: [
      { time: "07:30", title: "飯店 享用早餐", category: "food", description: "Hotel OLDINN 自助早餐。" },
      { time: "09:30", title: "契斯科庫倫洛夫 Český Krumlov", category: "sightseeing", description: "伏爾他瓦河環繞的中世紀小鎮。", location: "Cesky Krumlov Castle", outfit: "石板路較多，請務必穿著吸震好走的平底鞋或球鞋。", aiTips: [{ type: 'souvenir', content: 'Koh-i-noor 刺蝟鉛筆' }, { type: 'must-buy', content: 'Manufaktura 蔓越莓護唇膏' }, { type: 'must-eat', content: 'Trdelník (肉桂煙囪捲)' }] },
      { time: "14:00", title: "卡羅維瓦利 Karlovy Vary", category: "sightseeing", description: "著名的溫泉療養聖地。", location: "Karlovy Vary", outfit: "溫泉區漫步，建議穿著優雅舒適的秋裝。", aiTips: [{ type: 'must-eat', content: '比臉還大的溫泉餅 (Oplatky)' }, { type: 'must-buy', content: '捷克特色溫泉杯 (手柄可吸水)' }, { type: 'must-buy', content: 'Becherovka 草藥酒' }] },
      { time: "18:00", title: "Hotel Imperial", category: "hotel", location: "Hotel Imperial Karlovy Vary" }
    ]
  },
  {
    day: 5, dateStr: "01", dayOfWeek: "SUN", fullDate: "2026.03.01",
    title: "布拉格天文鐘", locationName: "Prague",
    imageUrl: "https://photo.settour.com.tw/900x600/https://www.settour.com.tw/ss_img/info/location/PRG/G0/PRG0000011/PRG0000011_45988.jpg",
    hourlyWeather: generate24HourWeather(7, 'sunny'),
    items: [
      { time: "07:30", title: "飯店 享用早餐", category: "food", description: "Hotel Imperial 溫泉區早餐。" },
      { time: "12:00", title: "伏爾他瓦河遊船", category: "food", description: "船上享用自助餐，欣賞河岸風光。", location: "Vltava River" },
      { time: "14:30", title: "布拉格老城區", category: "sightseeing", description: "漫步舊市政廳、提恩教堂與火藥塔。", location: "Old Town Square Prague", outfit: "城市漫步，搭配簡約風衣與大容量肩背包，時尚實用。", aiTips: [{ type: 'must-buy', content: '✨ 布拉格天文鐘造型冰箱貼 (必收!)' }, { type: 'must-buy', content: '菠丹妮 (Botanicus) 玫瑰死海泥手工皂' }, { type: 'must-buy', content: 'Bata 捷克國民真皮鞋款' }, { type: 'luxury', content: '巴黎大街：Dior, Gucci 等一線精品' }] },
      { time: "18:00", title: "Art Nouveau Palace", category: "hotel", location: "Art Nouveau Palace Hotel" }
    ]
  },
  {
    day: 6, dateStr: "02", dayOfWeek: "MON", fullDate: "2026.03.02",
    title: "布拉格浪漫城堡", locationName: "Prague",
    imageUrl: "https://www.sundaytour.com.tw/upfiles/chinese/attractions/tw_attractions_caty01481734310.jpg",
    hourlyWeather: generate24HourWeather(8, 'sunny'),
    items: [
      { time: "07:30", title: "飯店 享用早餐", category: "food", description: "Art Nouveau Palace 經典早餐。" },
      { time: "09:00", title: "布拉格城堡區", category: "sightseeing", description: "世界最大古堡群。", location: "Prague Castle", outfit: "城堡區地勢較高風大，請備妥防風保暖大衣及圍巾。" },
      { time: "10:30", title: "聖維特大教堂", category: "sightseeing", description: "哥德式建築的傑作。", location: "St. Vitus Cathedral" },
      { time: "11:30", title: "黃金巷 Golden Lane", category: "sightseeing", description: "色彩繽紛的小屋，卡夫卡的故居。", location: "Golden Lane", aiTips: [{ type: 'souvenir', content: '精緻金屬書籤與錫製小士兵' }] },
      { time: "14:00", title: "查理大橋 Charles Bridge", category: "sightseeing", description: "露天的巴洛克雕像博物館。", location: "Charles Bridge", aiTips: [{ type: 'souvenir', content: '摸橋上聖約翰雕像底座祈求好運' }] },
      { time: "16:00", title: "市民會館下午茶", category: "food", description: "優雅的新藝術風格咖啡廳。", location: "Municipal House", aiTips: [{ type: 'must-eat', content: '經典蜂蜜蛋糕 (Medovnik)' }, { type: 'must-eat', content: '捷克道地蘋果派' }] },
      { time: "17:30", title: "布拉格老城天文鐘", category: "sightseeing", description: "再次回到舊城廣場感受傍晚氛圍。", location: "Prague Astronomical Clock" },
      { time: "20:30", title: "Art Nouveau Palace", category: "hotel", location: "Art Nouveau Palace Hotel" }
    ]
  },
  {
    day: 7, dateStr: "03", dayOfWeek: "TUE", fullDate: "2026.03.03",
    title: "特爾奇與維也納", locationName: "Vienna",
    imageUrl: "https://image.cdn-eztravel.com.tw/HgCf8CdO18qYpil0KI8X_nKoi8-lxIMYgDnwJadhLQA/g:ce/aHR0cHM6Ly92YWNhdGlvbi5jZG4tZXp0cmF2ZWwuY29tLnR3L2ltZy9WRFIvQUFfMTQxNzUxMTU5Ny5qcGc.jpg",
    hourlyWeather: generate24HourWeather(10, 'cloudy'),
    items: [
      { time: "07:30", title: "飯店 享用早餐", category: "food", description: "飯店自助早餐。" },
      { time: "10:30", title: "特爾奇 Telc", category: "sightseeing", description: "夢幻的文藝復興風格小鎮。", location: "Telč", outfit: "跨國移動日車程較長，建議穿著寬鬆舒適服飾。" },
      { time: "15:00", title: "貝爾維第宮", category: "sightseeing", description: "欣賞克林姆名畫《吻》。", location: "Belvedere Palace", aiTips: [{ type: 'souvenir', content: '美術館《吻》絲巾與畫作周邊商品' }] },
      { time: "18:30", title: "帽子餐廳", category: "food", description: "Ribs of Vienna 炭烤豬肋排。", location: "Ribs of Vienna", aiTips: [{ type: 'must-eat', content: '一公尺長的招牌香嫩豬肋排' }] },
      { time: "20:00", title: "Andaz Vienna Am Belvedere", category: "hotel", location: "Andaz Vienna Am Belvedere" }
    ]
  },
  {
    day: 8, dateStr: "04", dayOfWeek: "WED", fullDate: "2026.03.04",
    title: "維也納皇室風華", locationName: "Vienna",
    imageUrl: "https://ht-cdn.panyou.com/uploadhk/2025/ht/1223/202512231611-8793123815.png",
    hourlyWeather: generate24HourWeather(11, 'sunny'),
    items: [
      { time: "07:30", title: "飯店 享用早餐", category: "food", description: "Andaz Vienna 景觀早餐。" },
      { time: "09:00", title: "熊布朗宮 Schönbrunn", category: "sightseeing", description: "哈布斯堡王朝的夏宮，媲美凡爾賽宮。", location: "Schönbrunn Palace", outfit: "皇宮參觀與精品街購物，可搭配微正式的大衣與皮靴。" },
      { time: "13:00", title: "維也納市區觀光", category: "sightseeing", description: "感受奧匈帝國的繁華與歷史建築。", location: "Stephansplatz", subLocations: ["瑪麗亞泰瑞莎廣場", "霍夫堡宮", "聖史帝芬教堂", "環城大道"], aiTips: [{ type: 'must-eat', content: '百年名店炸牛排 (Schnitzel)' }, { type: 'must-buy', content: '小紅帽咖啡豆、Manner 榛果威化餅' }, { type: 'luxury', content: '格拉本大街：Cartier, Rolex 旗艦店' }] },
      { time: "18:00", title: "Andaz Vienna Am Belvedere", category: "hotel", location: "Andaz Vienna Am Belvedere" }
    ]
  },
  {
    day: 9, dateStr: "05", dayOfWeek: "THU", fullDate: "2026.03.05",
    title: "再見維也納", locationName: "Vienna Airport",
    imageUrl: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=2070&auto=format&fit=crop",
    hourlyWeather: generate24HourWeather(12, 'cloudy'),
    items: [
      { time: "07:30", title: "飯店 享用早餐", category: "food", description: "Andaz Vienna 自助早餐。" },
      { time: "12:05", title: "維也納/台北(桃園)", category: "flight", description: "BR066(長榮航空) 返回台北。" }
    ]
  },
  {
    day: 10, dateStr: "06", fullDate: "2026.03.06", dayOfWeek: "FRI", 
    title: "抵達台北", locationName: "Taipei",
    imageUrl: "https://images.unsplash.com/photo-1470004914212-05527e49370b?q=80&w=2074&auto=format&fit=crop",
    hourlyWeather: generate24HourWeather(25, 'sunny'),
    items: [
      { time: "06:40", title: "台北(桃園)", category: "transport", description: "平安歸賦，回到溫暖的家。", location: "Taoyuan International Airport" }
    ]
  }
];

// --- 輔助函數 ---
const getMapUrl = (items: any[]) => {
  const locations = items.map(i => i.location || i.title).filter(Boolean);
  if (locations.length === 0) return `https://maps.google.com/maps?q=Austria&output=embed`;
  const saddr = encodeURIComponent(locations[0]);
  let daddr = encodeURIComponent(locations[locations.length - 1]);
  if (locations.length > 2) {
     const waypoints = locations.slice(1, -1).map(loc => encodeURIComponent(loc)).join('+to:');
     daddr = `${waypoints}+to:${daddr}`;
  }
  return `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&output=embed`;
};

// --- 功能頁面組件 ---
const ExpenseTracker = ({ user }: { user: any }) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [payer, setPayer] = useState('R');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const EXCHANGE_RATE: any = { EUR: 34.2, CZK: 1.45 };

  useEffect(() => {
    if (!user || !db) return;
    const expRef = collection(db, 'artifacts', globalAppId, 'public', 'data', 'expenses');
    return onSnapshot(expRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data.sort((a: any, b: any) => b.timestamp - a.timestamp));
    });
  }, [user]);

  const handleAddExpense = async (e: any) => {
    e.preventDefault();
    if (!item || !amount || !user || !db) return;
    const numAmount = parseFloat(amount);
    await addDoc(collection(db, 'artifacts', globalAppId, 'public', 'data', 'expenses'), {
      item, amount: numAmount, currency, twdAmount: Math.round(numAmount * EXCHANGE_RATE[currency]),
      payer, date, timestamp: Date.now()
    });
    setItem(''); setAmount('');
  };

  const totalTWD = expenses.reduce((sum, exp) => sum + exp.twdAmount, 0);

  return (
    <div className="p-5 pb-24 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-sm text-[#8C8881] mb-1">總金額 (台幣)</h2>
        <div className="text-4xl font-black text-[#4A4641] tracking-tight mb-2">${totalTWD.toLocaleString()}</div>
        <p className="text-xs text-[#8C8881]">每人均攤: ${(totalTWD/4).toLocaleString(undefined, {maximumFractionDigits:0})}</p>
      </div>
      <form onSubmit={handleAddExpense} className="bg-white p-5 rounded-xl border border-[#E8E6E1] mb-8 space-y-4">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#F5F3F0] rounded-lg px-4 py-3 text-sm" required />
        <input type="text" placeholder="項目名稱" value={item} onChange={(e) => setItem(e.target.value)} className="w-full bg-[#F5F3F0] rounded-lg px-4 py-3 text-sm" required />
        <div className="flex space-x-3">
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-[#F5F3F0] rounded-lg px-3 py-3 text-sm">
            <option value="EUR">€ EUR</option><option value="CZK">Kč CZK</option>
          </select>
          <input type="number" step="0.01" placeholder="外幣金額" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 bg-[#F5F3F0] rounded-lg px-4 py-3 text-sm" required />
        </div>
        <div className="flex justify-between py-2">
          {Object.entries(payersInfo).map(([key, info]: any) => (
            <button key={key} type="button" onClick={() => setPayer(key)} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${payer === key ? info.color : 'bg-[#E8E6E1] text-[#8C8881]'}`}>{info.id}</button>
          ))}
        </div>
        <button type="submit" className="w-full bg-[#4A4641] text-[#F5F3F0] py-3 rounded-lg text-sm tracking-widest">新增帳目</button>
      </form>
      <div className="space-y-4">
        {expenses.map((exp) => (
          <div key={exp.id} className="bg-white p-4 rounded-xl border border-[#E8E6E1] flex justify-between items-center">
            <div className="flex items-center space-x-4">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${payersInfo[exp.payer].color}`}>{exp.payer}</div>
               <div><div className="text-sm font-bold">{exp.item}</div><div className="text-[10px] text-[#8C8881]">{exp.date}</div></div>
            </div>
            <div className="text-right flex items-center">
              <div className="mr-3"><div className="text-sm font-bold">${exp.twdAmount.toLocaleString()}</div><div className="text-[10px] text-[#8C8881]">{exp.currency} {exp.amount}</div></div>
              <button onClick={() => deleteDoc(doc(db, 'artifacts', globalAppId, 'public', 'data', 'expenses', exp.id))} className="text-[#E8E6E1] hover:text-[#A85A46]"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PrepTracker = ({ user }: { user: any }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState('todo');
  const [assignee, setAssignee] = useState('R');

  useEffect(() => {
    if (!user || !db) return;
    const ref = collection(db, 'artifacts', globalAppId, 'public', 'data', 'preparations');
    return onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(data.sort((a: any, b: any) => b.timestamp - a.timestamp));
    });
  }, [user]);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!newTask || !user || !db) return;
    await addDoc(collection(db, 'artifacts', globalAppId, 'public', 'data', 'preparations'), {
      title: newTask, category, assignee, completed: false, timestamp: Date.now(), date: new Date().toLocaleDateString()
    });
    setNewTask('');
  };

  const cats = [
    { id: 'todo', label: '待辦', icon: <CheckCircle2 size={14}/>, color: '#7D805A' },
    { id: 'place', label: '想去', icon: <MapPin size={14}/>, color: '#6B7A87' },
    { id: 'shopping', label: '採購', icon: <ShoppingBag size={14}/>, color: '#C28F70' }
  ];

  return (
    <div className="p-5 pb-24 animate-fade-in">
      <h2 className="text-xl font-bold mb-6 tracking-wider">行前準備</h2>
      <form onSubmit={handleAdd} className="mb-8 bg-white p-5 rounded-xl border border-[#E8E6E1] space-y-4">
        <div className="flex space-x-2">
          {cats.map(c => (
            <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`text-[11px] px-3 py-1.5 rounded-full border ${category === c.id ? 'text-white' : 'text-[#8C8881]'}`} style={{ backgroundColor: category === c.id ? c.color : 'transparent' }}>{c.label}</button>
          ))}
        </div>
        <input type="text" value={newTask} onChange={(e)=>setNewTask(e.target.value)} placeholder="新增內容..." className="w-full bg-[#F5F3F0] rounded-lg px-4 py-2.5 text-sm" required />
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {Object.entries(payersInfo).map(([key, info]: any) => (
              <button key={key} type="button" onClick={() => setAssignee(key)} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${assignee === key ? info.color : 'bg-[#E8E6E1]'}`}>{info.id}</button>
            ))}
          </div>
          <button type="submit" className="bg-[#4A4641] text-white px-4 py-2 rounded-lg text-sm"><Plus size={16}/></button>
        </div>
      </form>
      <div className="space-y-6">
        {cats.map(cat => (
          <div key={cat.id}>
            <h3 className="text-sm font-bold mb-3 border-b pb-2" style={{color: cat.color}}>{cat.label}</h3>
            {tasks.filter(t => t.category === cat.id).map(task => (
              <div key={task.id} className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-[#E8E6E1] mb-2">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => updateDoc(doc(db, 'artifacts', globalAppId, 'public', 'data', 'preparations', task.id), { completed: !task.completed })}>
                  {task.completed ? <CheckCircle2 size={18} color={cat.color}/> : <Circle size={18}/>}
                  <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
                </div>
                <button onClick={() => deleteDoc(doc(db, 'artifacts', globalAppId, 'public', 'data', 'preparations', task.id))}><Trash2 size={14} className="text-gray-300"/></button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const InfoPage = () => {
  const ov = [{ title: "維也納", location: "Vienna" }, { title: "布拉格", location: "Prague" }];
  return (
    <div className="p-5 pb-24 animate-fade-in">
      <h2 className="text-xl font-bold mb-6 tracking-wider">旅行資訊</h2>
      <div className="bg-white p-5 rounded-xl border border-[#E8E6E1] mb-6 space-y-4">
        <div><div className="text-xs text-[#8C8881]">專業領隊</div><div className="font-bold">邵十立 先生</div><div className="text-[#A85A46]">0933-991-954</div></div>
        <div className="border-t pt-4"><div className="text-xs text-[#8C8881]">緊急救助</div><div className="font-bold">奧地利處</div><div className="text-[#A85A46]">+43-664-345-0455</div></div>
      </div>
      <div className="bg-white p-2 rounded-xl border border-[#E8E6E1] h-80 overflow-hidden">
        <iframe title="總覽地圖" src={getMapUrl(ov)} width="100%" height="100%" style={{border:0, opacity:0.7}}></iframe>
      </div>
    </div>
  );
};

// --- 主應用程式 ---
export default function App() {
  const [view, setView] = useState<any>(0);
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  const renderContent = () => {
    if (view === 'expenses') return <ExpenseTracker user={user} />;
    if (view === 'prep') return <PrepTracker user={user} />;
    if (view === 'info') return <InfoPage />;
    const cur = tripData.find(d => d.day === (view + 1)) || tripData[0];
    return (
      <div className="animate-fade-in pb-24">
        <div className="relative mx-4 mt-4 h-64 rounded-2xl overflow-hidden shadow-md">
          <img src={cur.imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-5 left-5 text-white">
            <div className="text-xs mb-1 opacity-80">DAY {cur.day} · {cur.locationName}</div>
            <h2 className="text-2xl font-bold">{cur.title}</h2>
          </div>
        </div>
        <div className="mt-8 px-6">
          <div className="flex space-x-6 overflow-x-auto no-scrollbar pb-4">
            {cur.hourlyWeather.slice(0, 8).map((hw, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0">
                <span className="text-xs mb-2">{hw.time}</span>{hw.icon}<span className="text-sm font-bold mt-2">{hw.temp}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 mt-6 space-y-8">
          {cur.items.map((item: any, i: number) => {
            const S = categoryStyles[item.category] || categoryStyles.sightseeing;
            return (
              <div key={i} className="flex">
                <div className="w-12 text-right pr-4 font-bold text-lg">{item.time}</div>
                <div className="relative mr-4"><div className="w-2.5 h-2.5 rounded-full border-2 mt-2" style={{borderColor: S.color}}></div></div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg flex items-center gap-2">{item.title} <a href={`https://www.google.com/maps/search/?api=1&query=${item.title}`}><MapPin size={14}/></a></h4>
                  <div className="text-[10px] flex items-center mt-1" style={{color: S.color}}><S.icon size={10} className="mr-1"/>{S.label}</div>
                  {item.outfit && <div className="text-[11px] text-[#C68B75] mt-2 flex items-center"><Shirt size={10} className="mr-1"/>{item.outfit}</div>}
                  <p className="text-sm text-gray-500 mt-2">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mx-4 mt-8 h-48 rounded-xl overflow-hidden grayscale opacity-70">
          <iframe title="每日地圖" src={getMapUrl(cur.items)} width="100%" height="100%" style={{border:0}}></iframe>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-[#F5F3F0] min-h-screen relative shadow-2xl overflow-hidden">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .animate-fade-in { animation: f 0.5s ease-out; } @keyframes f { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <header className="sticky top-0 z-30 bg-[#F5F3F0]/95 backdrop-blur-sm border-b pb-2 pt-10">
        <div className="text-center mb-4"><h1 className="text-[10px] tracking-widest text-gray-400">FAMILY TRIP 2026</h1><div className="text-xl font-bold">奧捷旅行</div></div>
        <div className="flex overflow-x-auto no-scrollbar px-4 space-x-6 items-center" ref={scrollRef}>
          {tripData.map((d, i) => (
            <button key={i} onClick={() => setView(i)} className={`flex flex-col items-center flex-shrink-0 ${view === i ? 'text-black' : 'text-gray-300'}`}>
              <span className="text-[9px] font-bold">{d.dayOfWeek}</span><span className="text-lg font-black">{d.dateStr}</span>
            </button>
          ))}
          <div className="w-px h-6 bg-gray-200"></div>
          <button onClick={() => setView('expenses')} className={view === 'expenses' ? 'text-black' : 'text-gray-300'}><Wallet size={20}/></button>
          <button onClick={() => setView('prep')} className={view === 'prep' ? 'text-black' : 'text-gray-300'}><ShoppingBag size={20}/></button>
          <button onClick={() => setView('info')} className={view === 'info' ? 'text-black' : 'text-gray-300'}><Info size={20}/></button>
        </div>
      </header>
      <main>{renderContent()}</main>
    </div>
  );
}
