import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  Plane, MapPin, Utensils, BedDouble, Info, Wallet, Sun, Cloud, 
  CloudRain, Moon, Camera, ShoppingBag, Phone, Train, Calculator, Map as MapIcon, 
  ChevronRight, Gem, Plus, Trash2, Globe, CalendarDays, ExternalLink, Camera as CameraIcon, Shirt, CheckCircle2, Circle
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

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : manualConfig;

let app, auth, db;
let globalAppId = 'austria-czech-trip-v1';

if (firebaseConfig && (firebaseConfig.apiKey || typeof __firebase_config !== 'undefined')) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    if (typeof __app_id !== 'undefined') globalAppId = __app_id;
  } catch (e) {
    console.error("Firebase init error:", e);
  }
}

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

const categoryStyles = {
  'flight': { icon: Plane, color: themeColors.accentClay, label: 'FLIGHT' },
  'hotel': { icon: BedDouble, color: themeColors.accentSand, label: 'HOTEL' },
  'transport': { icon: Train, color: themeColors.textLight, label: 'TRANSPORT' },
  'sightseeing': { icon: Camera, color: themeColors.accentOlive, label: 'SIGHTSEEING' },
  'food': { icon: Utensils, color: themeColors.accentTerra, label: 'FOOD' },
  'shopping': { icon: ShoppingBag, color: themeColors.accentGreyOrange, label: 'SHOPPING' },
};

// 共用人物資料
const payersInfo = {
  'R': { id: 'R', color: 'bg-[#A85A46] text-white' }, // Ruby - 陶土紅
  'C': { id: 'C', color: 'bg-[#7D805A] text-white' }, // Cora - 橄欖綠
  'N': { id: 'N', color: 'bg-[#6B7A87] text-white' }, // Nina - 灰藍色
  'O': { id: 'O', color: 'bg-[#C28F70] text-white' }  // Oliver - 灰橘色
};

// --- 模擬數據 ---
const generate24HourWeather = (baseTemp, condition) => {
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
      { 
        time: "20:35", title: "桃園機場集合", category: "transport", 
        description: "第二航站長榮航空 20 號後方團體櫃檯。", location: "桃園國際機場", 
        outfit: "寬鬆舒適長褲、層次穿搭方便機上穿脫，帶保暖外套。"
      },
      { 
        time: "23:35", title: "台北(桃園)/維也納", category: "flight", 
        description: "BR065(長榮航空) 直飛維也納。", location: "Vienna Airport" 
      }
    ]
  },
  {
    day: 2, dateStr: "26", dayOfWeek: "THU", fullDate: "2026.02.26",
    title: "哈爾斯塔特", locationName: "Salzburg",
    imageUrl: "https://image.kkday.com/v2/image/get/s1.kkday.com/product_36568/20200122064534_xxRQH/jpg",
    hourlyWeather: generate24HourWeather(4, 'cloudy'),
    items: [
      { time: "06:45", title: "抵達維也納", category: "transport", location: "Vienna Airport", description: "專車前往奧地利湖區。" },
      { 
        time: "10:00", title: "哈爾斯塔特 Hallstatt", category: "sightseeing", 
        description: "世界最美湖畔小鎮。", location: "Hallstatt", 
        outfit: "防風防水外套必備，內搭保暖毛衣與防滑靴。",
        aiTips: [
          { type: 'must-buy', content: '哈爾斯塔特天然岩鹽 (推薦玫瑰鹽)' },
          { type: 'must-buy', content: '湖區天然果醬' },
          { type: 'souvenir', content: '傳統木雕手作藝品' }
        ] 
      },
      { 
        time: "12:30", title: "湖區鱒魚料理", category: "food", description: "品嚐當地新鮮捕獲的鱒魚。", location: "Hallstatt",
        aiTips: [
          { type: 'must-eat', content: '清蒸鱒魚佐香草奶油' },
          { type: 'must-eat', content: '奧地利傳統煎餅湯' }
        ]
      },
      { 
        time: "15:00", title: "薩爾茲堡市區觀光", category: "sightseeing", 
        description: "莫札特故居與電影真善美場景。", location: "Salzburg Old Town",
        subLocations: ["王宮廣場", "蓋特萊徳巷", "莫札特故居", "米拉貝爾花園"],
        aiTips: [
          { type: 'must-buy', content: 'FÜRST 創始店銀藍包裝莫札特巧克力' },
          { type: 'must-eat', content: '薩爾茲堡舒芙蕾 (Salzburger Nockerl)' },
          { type: 'luxury', content: '蓋特萊德巷：LV, Hermès 精品街' }
        ]
      },
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
      { 
        time: "09:00", title: "國王湖 Königssee", category: "sightseeing", 
        description: "德國最深、最清澈的高山湖泊。", location: "Königssee",
        outfit: "國王湖較冷，需攜帶防風手套與毛帽保暖。"
      },
      { 
        time: "14:00", title: "薩爾茲堡鹽礦", category: "sightseeing", 
        description: "換穿礦工服，體驗木滑梯。", location: "Salt Mine Berchtesgaden",
        outfit: "入內需換穿礦工服，建議內穿輕便褲裝。"
      },
      { time: "17:30", title: "前往庫倫洛夫", category: "transport", description: "前往南波希米亞的童話小鎮。", location: "Cesky Krumlov" },
      { 
        time: "19:00", title: "中世紀變裝晚宴", category: "food", description: "體驗中世紀風情與捷克烤豬腳。",
        aiTips: [
          { type: 'must-eat', content: '捷克黑啤酒 (Dark Lager)' },
          { type: 'must-eat', content: '波西米亞炭烤大豬腳' }
        ]
      },
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
      { 
        time: "09:30", title: "契斯科庫倫洛夫 Český Krumlov", category: "sightseeing", 
        description: "伏爾他瓦河環繞的中世紀小鎮。", location: "Cesky Krumlov Castle",
        outfit: "石板路較多，請務必穿著吸震好走的平底鞋或球鞋。",
        aiTips: [
          { type: 'souvenir', content: 'Koh-i-noor 刺蝟鉛筆' },
          { type: 'must-buy', content: 'Manufaktura 蔓越莓護唇膏' },
          { type: 'must-eat', content: 'Trdelník (肉桂煙囪捲)' }
        ]
      },
      { 
        time: "14:00", title: "卡羅維瓦利 Karlovy Vary", category: "sightseeing", 
        description: "著名的溫泉療養聖地。", location: "Karlovy Vary",
        outfit: "溫泉區漫步，建議穿著優雅舒適的秋裝。",
        aiTips: [
          { type: 'must-eat', content: '比臉還大的溫泉餅 (Oplatky)' },
          { type: 'must-buy', content: '捷克特色溫泉杯 (手柄可吸水)' },
          { type: 'must-buy', content: 'Becherovka 草藥酒' }
        ]
      },
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
      { 
        time: "14:30", title: "布拉格老城區", category: "sightseeing", 
        description: "漫步舊市政廳、提恩教堂與火藥塔。", location: "Old Town Square Prague",
        outfit: "城市漫步，搭配簡約風衣與大容量肩背包，時尚實用。",
        aiTips: [
          { type: 'must-buy', content: '✨ 布拉格天文鐘造型冰箱貼 (必收!)' },
          { type: 'must-buy', content: '菠丹妮 (Botanicus) 玫瑰死海泥手工皂' },
          { type: 'must-buy', content: 'Bata 捷克國民真皮鞋款' },
          { type: 'luxury', content: '巴黎大街：Dior, Gucci 等一線精品' }
        ]
      },
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
      { 
        time: "09:00", title: "布拉格城堡區", category: "sightseeing", 
        description: "世界最大古堡群。", location: "Prague Castle",
        outfit: "城堡區地勢較高風大，請備妥防風保暖大衣及圍巾。" 
      },
      { 
        time: "10:30", title: "聖維特大教堂", category: "sightseeing", 
        description: "哥德式建築的傑作。", location: "St. Vitus Cathedral" 
      },
      { 
        time: "11:30", title: "黃金巷 Golden Lane", category: "sightseeing", 
        description: "色彩繽紛的小屋，卡夫卡的故居。", location: "Golden Lane",
        aiTips: [{ type: 'souvenir', content: '精緻金屬書籤與錫製小士兵' }]
      },
      { 
        time: "14:00", title: "查理大橋 Charles Bridge", category: "sightseeing", 
        description: "露天的巴洛克雕像博物館。", location: "Charles Bridge",
        aiTips: [{ type: 'souvenir', content: '摸橋上聖約翰雕像底座祈求好運' }]
      },
      { 
        time: "16:00", title: "市民會館下午茶", category: "food", 
        description: "優雅的新藝術風格咖啡廳。", location: "Municipal House",
        aiTips: [
          { type: 'must-eat', content: '經典蜂蜜蛋糕 (Medovnik)' },
          { type: 'must-eat', content: '捷克道地蘋果派' }
        ]
      },
      { 
        time: "17:30", title: "布拉格老城天文鐘", category: "sightseeing", 
        description: "再次回到舊城廣場感受傍晚氛圍。", location: "Prague Astronomical Clock"
      },
      { 
        time: "19:00", title: "晚餐自理", category: "food", 
        description: "自由品嚐當地美食。" 
      },
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
      { 
        time: "10:30", title: "特爾奇 Telc", category: "sightseeing", 
        description: "夢幻的文藝復興風格小鎮。", location: "Telč",
        outfit: "跨國移動日車程較長，建議穿著寬鬆舒適服飾。"
      },
      { 
        time: "15:00", title: "貝爾維第宮", category: "sightseeing", 
        description: "欣賞克林姆名畫《吻》。", location: "Belvedere Palace",
        aiTips: [{ type: 'souvenir', content: '美術館《吻》絲巾與畫作周邊商品' }]
      },
      { 
        time: "17:30", title: "維也納", category: "transport", 
        description: "抵達音樂之都維也納。", location: "Vienna" 
      },
      { 
        time: "18:30", title: "帽子餐廳", category: "food", 
        description: "Ribs of Vienna 炭烤豬肋排。", location: "Ribs of Vienna",
        aiTips: [{ type: 'must-eat', content: '一公尺長的招牌香嫩豬肋排' }]
      },
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
      { 
        time: "09:00", title: "熊布朗宮 Schönbrunn", category: "sightseeing", 
        description: "哈布斯堡王朝的夏宮，媲美凡爾賽宮。", location: "Schönbrunn Palace",
        outfit: "皇宮參觀與精品街購物，可搭配微正式的大衣與皮靴。"
      },
      { 
        time: "13:00", title: "維也納市區觀光", category: "sightseeing", 
        description: "感受奧匈帝國的繁華與歷史建築。", location: "Stephansplatz",
        subLocations: ["瑪麗亞泰瑞莎廣場", "霍夫堡宮", "聖史帝芬教堂", "環城大道", "國會大廈", "市政廳", "國家歌劇院"],
        aiTips: [
          { type: 'must-eat', content: '百年名店炸牛排 (Schnitzel)' },
          { type: 'must-eat', content: '中央咖啡館：薩赫蛋糕與米朗琪咖啡' },
          { type: 'must-buy', content: '小紅帽咖啡豆、Manner 榛果威化餅' },
          { type: 'must-buy', content: '施華洛世奇 (Swarovski) 水晶飾品' },
          { type: 'luxury', content: '格拉本大街：Cartier, Rolex 旗艦店' }
        ]
      },
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
      { 
        time: "09:00", title: "前往機場", category: "transport", 
        description: "辦理退稅與登機。", location: "Vienna Airport",
        outfit: "機場準備返程，以輕鬆、多層次穿搭為主。"
      },
      { time: "12:05", title: "維也納/台北(桃園)", category: "flight", description: "BR066(長榮航空) 返回台北。" }
    ]
  },
  {
    day: 10, dateStr: "06", fullDate: "2026.03.06", dayOfWeek: "FRI", 
    title: "抵達台北", locationName: "Taipei",
    imageUrl: "https://images.unsplash.com/photo-1470004914212-05527e49370b?q=80&w=2074&auto=format&fit=crop",
    hourlyWeather: generate24HourWeather(25, 'sunny'),
    items: [
      { 
        time: "06:40", title: "台北(桃園)", category: "transport", description: "平安歸賦，回到溫暖的家。", location: "Taoyuan International Airport",
        outfit: "台灣氣候溫暖，抵達後可脫去厚重冬衣。"
      }
    ]
  }
];

// --- 輔助函數 ---
const getMapUrl = (items) => {
  const locations = items.map(i => i.location || i.title).filter(Boolean);
  if (locations.length === 0) return `https://maps.google.com/maps?q=Austria&output=embed`;
  if (locations.length === 1) return `https://maps.google.com/maps?q=${encodeURIComponent(locations[0])}&output=embed`;
  
  const saddr = encodeURIComponent(locations[0]);
  let daddr = encodeURIComponent(locations[locations.length - 1]);
  
  // 如果景點超過兩個，中間的景點當作途經點(waypoints)
  if (locations.length > 2) {
     const waypoints = locations.slice(1, -1).map(loc => encodeURIComponent(loc)).join('+to:');
     daddr = `${waypoints}+to:${daddr}`;
  }
  return `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&output=embed`;
};

// --- 功能頁面組件 ---
const ExpenseTracker = ({ user }) => {
  const [expenses, setExpenses] = useState([]);
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [payer, setPayer] = useState('R');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const EXCHANGE_RATE = { EUR: 34.2, CZK: 1.45 };

  useEffect(() => {
    if (!user || !db) return;
    const expRef = collection(db, 'artifacts', globalAppId, 'public', 'data', 'expenses');
    const unsubscribe = onSnapshot(expRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.timestamp - a.timestamp);
      setExpenses(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!item || !amount || !user || !db) return;
    const numAmount = parseFloat(amount);
    const twdAmount = Math.round(numAmount * EXCHANGE_RATE[currency]);
    
    try {
      await addDoc(collection(db, 'artifacts', globalAppId, 'public', 'data', 'expenses'), {
        item, amount: numAmount, currency, twdAmount, payer, date,
        timestamp: Date.now()
      });
      setItem(''); setAmount('');
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', globalAppId, 'public', 'data', 'expenses', id));
    } catch (err) { console.error(err); }
  };

  const totalTWD = expenses.reduce((sum, exp) => sum + exp.twdAmount, 0);

  return (
    <div className="p-5 pb-24 font-sans text-[#4A4641] animate-fade-in">
      <div className="mb-8">
        <h2 className="text-sm text-[#8C8881] mb-1">總金額 (台幣)</h2>
        <div className="text-4xl font-black text-[#4A4641] tracking-tight mb-2">
          ${totalTWD.toLocaleString()}
        </div>
        <p className="text-xs text-[#8C8881]">每人均攤: ${(totalTWD/4).toLocaleString(undefined, {maximumFractionDigits:0})}</p>
      </div>

      <form onSubmit={handleAddExpense} className="bg-white p-5 rounded-xl shadow-sm border border-[#E8E6E1] mb-8">
        <div className="space-y-4">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#F5F3F0] border-none rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-[#7D805A]" required />
          <input type="text" placeholder="項目名稱 (例：月洸樹 黑川)" value={item} onChange={(e) => setItem(e.target.value)} className="w-full bg-[#F5F3F0] border-none rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-[#7D805A]" required />
          <div className="flex space-x-3">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-[#F5F3F0] border-none rounded-lg px-3 py-3 text-sm focus:ring-1 focus:ring-[#7D805A]">
              <option value="EUR">€ EUR</option>
              <option value="CZK">Kč CZK</option>
            </select>
            <input type="number" step="0.01" placeholder="外幣金額" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 bg-[#F5F3F0] border-none rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-[#7D805A]" required />
          </div>
          <div className="flex justify-between py-2">
            {Object.entries(payersInfo).map(([key, info]) => (
              <button key={key} type="button" onClick={() => setPayer(key)} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${payer === key ? info.color + ' shadow-md scale-110' : 'bg-[#E8E6E1] text-[#8C8881]'}`}>
                {info.id}
              </button>
            ))}
          </div>
          <button type="submit" className="w-full bg-[#4A4641] text-[#F5F3F0] font-medium rounded-lg py-3 hover:bg-[#2C2A27] transition-colors text-sm tracking-widest">新增帳目</button>
        </div>
      </form>

      <div className="space-y-4">
        {expenses.map((exp) => (
          <div key={exp.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#E8E6E1] flex justify-between items-center group">
            <div className="flex items-center space-x-4">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${payersInfo[exp.payer].color}`}>
                {exp.payer}
              </div>
              <div>
                <div className="text-sm font-bold text-[#4A4641]">{exp.item}</div>
                <div className="text-[10px] text-[#8C8881] mt-0.5">{exp.date}</div>
              </div>
            </div>
            <div className="text-right flex items-center">
              <div className="mr-3">
                <div className="text-sm font-bold text-[#4A4641]">${exp.twdAmount.toLocaleString()}</div>
                <div className="text-[10px] text-[#8C8881]">{exp.currency} {exp.amount}</div>
              </div>
              <button onClick={() => handleDelete(exp.id)} className="text-[#E8E6E1] active:text-[#A85A46] transition-colors p-1">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PrepTracker = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState('todo'); // todo, place, shopping
  const [assignee, setAssignee] = useState('R');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!user || !db) return;
    const ref = collection(db, 'artifacts', globalAppId, 'public', 'data', 'preparations');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.timestamp - a.timestamp);
      setTasks(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTask || !user || !db) return;
    try {
      await addDoc(collection(db, 'artifacts', globalAppId, 'public', 'data', 'preparations'), {
        title: newTask, category, assignee, date, completed: false, timestamp: Date.now()
      });
      setNewTask('');
    } catch (err) { console.error(err); }
  };

  const toggleComplete = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'artifacts', globalAppId, 'public', 'data', 'preparations', id), {
        completed: !currentStatus
      });
    } catch (err) { console.error(err); }
  };

  const categories = [
    { id: 'todo', label: '待辦事項', icon: <CheckCircle2 size={14}/>, color: '#7D805A' }, // Olive
    { id: 'place', label: '想去地點', icon: <MapPin size={14}/>, color: '#6B7A87' }, // GreyBlue
    { id: 'shopping', label: '採購清單', icon: <ShoppingBag size={14}/>, color: '#C28F70' } // GreyOrange
  ];

  return (
    <div className="p-5 pb-24 font-sans animate-fade-in text-[#4A4641]">
      <h2 className="text-xl font-bold mb-6 tracking-wider">行前準備</h2>
      
      <form onSubmit={handleAdd} className="mb-8 bg-white p-5 rounded-xl shadow-sm border border-[#E8E6E1]">
        <div className="flex space-x-2 mb-4">
          {categories.map(c => (
            <button 
              key={c.id} type="button" onClick={() => setCategory(c.id)} 
              className={`flex items-center space-x-1 text-[11px] px-3 py-1.5 rounded-full transition-colors border`}
              style={{ 
                backgroundColor: category === c.id ? c.color : '#F5F3F0',
                color: category === c.id ? '#FFF' : '#8C8881',
                borderColor: category === c.id ? c.color : '#E8E6E1'
              }}
            >
              {c.icon} <span>{c.label}</span>
            </button>
          ))}
        </div>
        
        <div className="space-y-3 mb-4">
           <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#F5F3F0] border-none rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-[#7D805A]" required />
           <input type="text" value={newTask} onChange={(e)=>setNewTask(e.target.value)} placeholder="新增事項內容..." className="w-full bg-[#F5F3F0] border-none rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-[#7D805A]" required />
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex space-x-2">
            {Object.entries(payersInfo).map(([key, info]) => (
              <button key={key} type="button" onClick={() => setAssignee(key)} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${assignee === key ? info.color + ' scale-110 shadow-sm' : 'bg-[#E8E6E1] text-[#8C8881]'}`}>
                {info.id}
              </button>
            ))}
          </div>
          <button type="submit" className="bg-[#4A4641] text-[#F5F3F0] px-4 py-2 rounded-lg text-sm tracking-wider flex items-center">
            <Plus size={16} className="mr-1"/> 加入
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {categories.map(cat => {
          const catTasks = tasks.filter(t => t.category === cat.id);
          if (catTasks.length === 0) return null;
          return (
            <div key={cat.id}>
              <h3 className="text-sm font-bold mb-3 flex items-center space-x-2 border-b border-[#E8E6E1] pb-2" style={{color: cat.color}}>
                {cat.icon} <span>{cat.label}</span>
              </h3>
              <div className="space-y-3">
                {catTasks.map(task => (
                  <div key={task.id} className="flex flex-col bg-white p-3.5 rounded-lg shadow-sm border border-[#E8E6E1]/70">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 cursor-pointer flex-1" onClick={() => toggleComplete(task.id, task.completed)}>
                        <div className="mt-0.5">
                           {task.completed ? <CheckCircle2 size={18} color={cat.color}/> : <Circle size={18} className="text-[#C9C1B2]"/>}
                        </div>
                        <div>
                           <div className={`text-sm font-medium ${task.completed ? 'text-[#8C8881] line-through' : 'text-[#4A4641]'}`}>{task.title}</div>
                           <div className="text-[10px] text-[#8C8881] mt-1 flex items-center">
                              {task.date}
                           </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-2">
                         <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${payersInfo[task.assignee]?.color || 'bg-gray-200 text-gray-500'}`}>
                           {task.assignee}
                         </div>
                         <button onClick={() => deleteDoc(doc(db, 'artifacts', globalAppId, 'public', 'data', 'preparations', task.id))} className="text-[#E8E6E1] active:text-[#A85A46] p-1">
                           <Trash2 size={14} />
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InfoPage = () => {
  // 10 天全覽的大環線節點
  const overviewLocations = [
    { title: "維也納機場", location: "Vienna Airport" },
    { title: "哈爾斯塔特", location: "Hallstatt" },
    { title: "薩爾茲堡", location: "Salzburg" },
    { title: "國王湖", location: "Königssee" },
    { title: "庫倫洛夫", location: "Cesky Krumlov" },
    { title: "卡羅維瓦利", location: "Karlovy Vary" },
    { title: "布拉格", location: "Prague" },
    { title: "特爾奇", location: "Telč" },
    { title: "維也納", location: "Vienna" }
  ];

  return (
    <div className="p-5 pb-24 font-sans animate-fade-in text-[#4A4641]">
      <h2 className="text-xl font-bold mb-6 tracking-wider">旅行資訊</h2>
      
      <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E8E6E1] mb-6">
        <h3 className="text-sm font-bold text-[#8C8881] mb-4 flex items-center"><Phone size={16} className="mr-2"/> 聯絡資訊</h3>
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-xs text-[#8C8881] mb-0.5">專業領隊</div>
            <div className="font-bold">邵十立 先生</div>
            <div className="text-[#A85A46]">0933-991-954</div>
          </div>
          <div className="border-t border-[#F5F3F0] pt-4">
            <div className="text-xs text-[#8C8881] mb-0.5">駐奧地利台北經濟文化代表處</div>
            <div className="font-bold">急難救助專線</div>
            <div className="text-[#A85A46]">+43-664-345-0455</div>
          </div>
          <div className="border-t border-[#F5F3F0] pt-4">
            <div className="text-xs text-[#8C8881] mb-0.5">駐捷克台北經濟文化辦事處</div>
            <div className="font-bold">急難救助專線</div>
            <div className="text-[#A85A46]">+420-603-166-707</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-2 rounded-xl shadow-sm border border-[#E8E6E1]">
        <div className="p-3">
          <h3 className="text-sm font-bold text-[#8C8881] flex items-center"><MapIcon size={16} className="mr-2"/> 總覽地圖</h3>
        </div>
        
        {/* 全覽動態地圖區塊 */}
        <div className="relative w-full h-80 rounded-lg overflow-hidden bg-[#E8E6E1] shadow-sm">
           <iframe 
              src={getMapUrl(overviewLocations)}
              width="100%" height="100%" 
              style={{border:0, filter: 'grayscale(0.7) sepia(0.2) opacity(0.7)'}} 
              allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade">
            </iframe>
            
            {/* Route Legend Overlay 10天路線指示 */}
            <div className="absolute top-3 right-3 bottom-3 w-40 bg-white/85 backdrop-blur-md rounded-lg p-3 shadow-sm border border-white/50 overflow-y-auto no-scrollbar flex flex-col">
               <div className="text-[10px] font-bold text-[#8C8881] tracking-widest mb-2 border-b border-[#E8E6E1] pb-1">10 DAYS ROUTE</div>
               <div className="space-y-3 mt-1">
                  {overviewLocations.map((item, i) => (
                     <div key={i} className="flex items-start">
                        <div className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 shadow-sm bg-[#7D805A]">
                           {i + 1}
                        </div>
                        <div className="ml-2 text-[11px] text-[#4A4641] leading-tight font-medium mt-0.5">
                           {item.title}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- 主應用程式 ---
export default function App() {
  const [view, setView] = useState(0); // 0-9: days, 'expenses', 'info', 'prep'
  const [user, setUser] = useState(null);
  const navScrollRef = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      if (!auth) return;
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth error:", err); }
    };
    initAuth();
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, setUser);
      return () => unsubscribe();
    }
  }, []);

  const renderContent = () => {
    if (view === 'expenses') return <ExpenseTracker user={user} />;
    if (view === 'prep') return <PrepTracker user={user} />;
    if (view === 'info') return <InfoPage />;
    
    const currentDay = tripData.find(d => d.day === (view + 1)) || tripData[0];
    
    return (
      <div className="animate-fade-in pb-24 font-sans">
        {/* Hero Banner */}
        <div className="relative mx-4 mt-4 h-[280px] rounded-2xl overflow-hidden shadow-md">
          <img src={currentDay.imageUrl} alt={currentDay.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80"></div>
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <div className="flex items-center space-x-2 text-xs mb-2 opacity-90 tracking-widest">
              <span className="border border-white/50 px-2 py-0.5 rounded-sm backdrop-blur-sm">DAY {currentDay.day}</span>
              <span className="flex items-center"><MapPin size={10} className="mr-1"/> {currentDay.locationName}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-wider">{currentDay.title}</h2>
          </div>
        </div>

        {/* Weather Forecast */}
        <div className="mt-10 px-6">
          <div className="flex items-end justify-between mb-4 border-b border-[#E8E6E1] pb-3">
            <div>
              <h2 className="text-2xl font-bold text-[#4A4641] tracking-widest">{currentDay.locationName}</h2>
              <p className="text-xs text-[#8C8881] tracking-widest mt-2">未來 24 小時預報</p>
            </div>
            <span className="text-[10px] text-[#8C8881] bg-[#E8E6E1] px-2.5 py-1 rounded-full mb-1 shadow-sm">Open-Meteo</span>
          </div>
          <div className="flex space-x-7 overflow-x-auto no-scrollbar pb-3 pt-2">
            {currentDay.hourlyWeather.slice(0, 8).map((hw, idx) => (
              <div key={idx} className="flex flex-col items-center flex-shrink-0">
                <span className="text-sm font-bold text-[#4A4641] mb-3">{hw.time}</span>
                {hw.icon}
                <span className="text-lg font-medium text-[#4A4641] mt-3">{hw.temp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline (已改回空心圓設計) */}
        <div className="px-5 mt-10">
          <div>
            {currentDay.items.map((item, idx) => {
              const catStyle = categoryStyles[item.category] || categoryStyles.sightseeing;
              const Icon = catStyle.icon;
              const isLast = idx === currentDay.items.length - 1;

              return (
                <div key={idx} className="flex relative">
                  {/* Left: Time */}
                  <div className="w-16 flex-shrink-0 text-right pt-0.5 pr-3">
                    <span className="text-lg font-bold text-[#4A4641] tracking-tight">{item.time}</span>
                  </div>
                  
                  {/* Middle: Hollow Dot & Vertical Line */}
                  <div className="flex flex-col items-center mr-4 relative w-3">
                    <div className="w-2.5 h-2.5 rounded-full border-[2px] z-20 bg-[#F5F3F0] mt-1.5" style={{borderColor: catStyle.color}}></div>
                    {!isLast && <div className="w-[1.5px] absolute top-4 bottom-[-16px]" style={{backgroundColor: catStyle.color, opacity: 0.3}}></div>}
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 pb-10">
                    {/* Title + Map Link Icon */}
                    <div className="flex items-center space-x-2 mb-1">
                       <h4 className="text-lg font-bold text-[#4A4641] leading-tight">{item.title}</h4>
                       {(item.location || item.title) && (
                         <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location || item.title)}`} target="_blank" rel="noopener noreferrer" className="text-[#C9C1B2] hover:text-[#A85A46] transition-colors mt-0.5">
                            <MapPin size={16} />
                         </a>
                       )}
                    </div>
                    
                    {/* Category Label */}
                    <div className="flex items-center text-[10px] tracking-[0.1em] mb-2" style={{color: catStyle.color}}>
                      <Icon size={12} className="mr-1.5" />
                      {catStyle.label}
                    </div>

                    {/* Outfit 小提示 */}
                    {item.outfit && (
                      <div className="flex items-start text-[11px] text-[#C68B75] mb-2 leading-relaxed">
                        <Shirt size={12} className="mr-1.5 mt-[2px] flex-shrink-0" />
                        <span>穿搭：{item.outfit}</span>
                      </div>
                    )}

                    {/* Description */}
                    {item.description && (
                      <p className="text-sm text-[#777571] leading-relaxed mb-2">{item.description}</p>
                    )}

                    {/* Sub-locations (小景點標示) */}
                    {item.subLocations && item.subLocations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                        {item.subLocations.map((loc, lIdx) => (
                          <span key={lIdx} className="text-[11px] bg-[#E8E6E1]/70 text-[#777571] px-2 py-1 rounded-md flex items-center">
                            <ChevronRight size={10} className="mr-0.5 text-[#A85A46]/60" /> {loc}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* AI Tags 顏色分類 */}
                    {item.aiTips && item.aiTips.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.aiTips.map((tip, tIdx) => {
                          const tagStyles = {
                            'must-eat': { color: '#C28F70', label: '必吃' }, // 灰橘色
                            'must-buy': { color: '#6B7A87', label: '必買' }, // 灰藍色
                            'souvenir': { color: '#777571', label: '手信' }, // 泥灰色
                            'luxury': { color: '#A85A46', label: '精品' },   // 陶土紅
                          };
                          const tStyle = tagStyles[tip.type] || { color: '#8C8881', label: '提示' };
                          return (
                            <span key={tIdx} className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border" 
                                  style={{ borderColor: tStyle.color, color: tStyle.color, backgroundColor: `${tStyle.color}10` }}>
                              <span className="font-bold mr-1">{tStyle.label}</span> {tip.content}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 每日地圖底部裝飾 (加入懸浮圖例) */}
        <div className="mt-4 px-5 opacity-90 mb-8">
           <div className="h-56 rounded-xl overflow-hidden bg-[#E8E6E1] relative shadow-sm border border-[#E8E6E1]">
              <iframe 
                src={getMapUrl(currentDay.items)}
                width="100%" height="100%" 
                style={{border:0, filter: 'grayscale(0.7) sepia(0.2) opacity(0.7)'}} 
                allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade">
              </iframe>
              
              {/* Route Legend Overlay 路線指示 */}
              <div className="absolute top-3 right-3 bottom-3 w-40 bg-white/85 backdrop-blur-md rounded-lg p-3 shadow-sm border border-white/50 overflow-y-auto no-scrollbar flex flex-col">
                 <div className="text-[9px] font-bold text-[#8C8881] tracking-widest mb-2 border-b border-[#E8E6E1] pb-1">TODAY'S ROUTE</div>
                 <div className="space-y-3 mt-1">
                    {currentDay.items.filter(item => item.location || item.title).map((item, i) => (
                       <div key={i} className="flex items-start">
                          <div className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 shadow-sm" style={{backgroundColor: categoryStyles[item.category]?.color || '#A85A46'}}>
                             {i + 1}
                          </div>
                          <div className="ml-2 text-[10px] text-[#4A4641] leading-tight font-medium mt-0.5">
                             {item.title}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-[#F5F3F0] min-h-screen relative shadow-2xl overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        body { background-color: #E8E6E1; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      <header className="bg-[#F5F3F0] pt-12 pb-2 sticky top-0 z-30 border-b border-[#E8E6E1]">
        <div className="text-center mb-6">
          <h1 className="text-xs text-[#8C8881] tracking-[0.3em] uppercase mb-2">Family Trip</h1>
          <div className="text-2xl font-bold text-[#4A4641] tracking-widest flex items-center justify-center">
            奧捷旅行 <span className="ml-3 text-[10px] border border-[#C9C1B2] rounded-full px-2 py-0.5 text-[#8C8881]">2026</span>
          </div>
        </div>

        <div className="flex overflow-x-auto no-scrollbar px-5 items-center pb-2" ref={navScrollRef}>
          {tripData.map((day, idx) => (
            <button
              key={`day-${idx}`} onClick={() => setView(idx)}
              className="flex flex-col items-center mr-6 flex-shrink-0 relative group"
            >
              <span className={`text-[10px] font-medium tracking-wider mb-1 ${view === idx ? 'text-[#4A4641]' : 'text-[#A39F98]'}`}>
                {day.dayOfWeek}
              </span>
              <span className={`text-xl font-bold ${view === idx ? 'text-[#4A4641]' : 'text-[#A39F98]'}`}>
                {day.dateStr}
              </span>
              {view === idx && <div className="absolute -bottom-2 w-1 h-1 bg-[#A85A46] rounded-full"></div>}
            </button>
          ))}
          
          <div className="w-[1px] h-8 bg-[#D1C7B8] mx-2 flex-shrink-0"></div>

          <button onClick={() => setView('expenses')} className={`flex flex-col items-center mx-4 flex-shrink-0 relative ${view === 'expenses' ? 'text-[#4A4641]' : 'text-[#A39F98]'}`}>
            <Wallet size={18} className="mb-1" />
            <span className="text-[10px] font-bold tracking-widest">帳</span>
            {view === 'expenses' && <div className="absolute -bottom-2 w-1 h-1 bg-[#A85A46] rounded-full"></div>}
          </button>
          <button onClick={() => setView('prep')} className={`flex flex-col items-center mx-4 flex-shrink-0 relative ${view === 'prep' ? 'text-[#4A4641]' : 'text-[#A39F98]'}`}>
            <ShoppingBag size={18} className="mb-1" />
            <span className="text-[10px] font-bold tracking-widest">備</span>
            {view === 'prep' && <div className="absolute -bottom-2 w-1 h-1 bg-[#A85A46] rounded-full"></div>}
          </button>
          <button onClick={() => setView('info')} className={`flex flex-col items-center mx-4 flex-shrink-0 relative ${view === 'info' ? 'text-[#4A4641]' : 'text-[#A39F98]'}`}>
            <Info size={18} className="mb-1" />
            <span className="text-[10px] font-bold tracking-widest">訊</span>
            {view === 'info' && <div className="absolute -bottom-2 w-1 h-1 bg-[#A85A46] rounded-full"></div>}
          </button>
        </div>
      </header>

      <main className="h-full bg-[#F5F3F0]">
        {renderContent()}
      </main>

    </div>
  );
}
