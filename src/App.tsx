import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, onSnapshot, query, doc } from 'firebase/firestore';
import { 
  Plane, 
  MapPin, 
  Utensils, 
  BedDouble, 
  Navigation, 
  Info, 
  Wallet, 
  Sun, 
  Cloud, 
  CloudRain, 
  Moon, 
  Camera, 
  ShoppingBag, 
  Phone, 
  Train, 
  ArrowRight, 
  Map as MapIcon, 
  ChevronRight, 
  Gem, 
  Plus, 
  Trash2, 
  Globe, 
  ShieldAlert,
  Wifi,
  WifiOff
} from 'lucide-react';

// --- Firebase 設定與初始化 ---

const firebaseConfig = {
  apiKey: "AIzaSyDY6Ss9V08KcokLxJg4xCxhJIYvq-A9AYU",
  authDomain: "austriatravel-2026.firebaseapp.com",
  projectId: "austriatravel-2026",
  storageBucket: "austriatravel-2026.firebasestorage.app",
  messagingSenderId: "296545344595",
  appId: "1:296545344595:web:d9cdbbcc08ff067326baa6",
  measurementId: "G-SCPRFJKMWW"
};

const appId = 'austria-czech-trip-v1';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 類型定義 ---

type Category = 'sightseeing' | 'food' | 'transport' | 'hotel' | 'flight' | 'shopping';

interface HourlyWeather {
  time: string;
  temp: string;
  icon: React.ReactNode;
}

interface ItineraryItem {
  time: string;
  title: string;
  category: Category;
  categoryLabel?: string; 
  description?: string;
  subLocations?: string[];
  location?: string;
  phone?: string;
  aiTips?: {
    type: 'must-eat' | 'must-buy' | 'story' | 'tip' | 'luxury';
    content: string;
  }[];
}

interface DayPlan {
  day: number;
  dateStr: string; 
  dayOfWeek: string; 
  fullDate: string; 
  title: string;
  locationName: string; 
  imageUrl: string;
  hourlyWeather: HourlyWeather[];
  items: ItineraryItem[];
}

interface Expense {
  id: string;
  item: string;
  currency: 'EUR' | 'CZK';
  amount: number;
  twdAmount: number;
  payer: 'R' | 'C' | 'N' | 'O';
  date: string;
  timestamp: number; 
}

// --- 模擬數據生成 ---

const generate24HourWeather = (baseTemp: number, condition: 'sunny' | 'cloudy' | 'rainy'): HourlyWeather[] => {
  const data: HourlyWeather[] = [];
  const startHour = 8;
  
  for (let i = 0; i < 24; i += 3) {
    let currentHour = (startHour + i) % 24;
    let timeLabel = `${currentHour.toString().padStart(2, '0')}:00`;
    let tempAdjust = 0;
    if (currentHour >= 10 && currentHour <= 16) tempAdjust = 3;
    else if (currentHour >= 0 && currentHour <= 5) tempAdjust = -4;

    let icon = <Sun size={18} className="text-[#A65D57]" />;
    if (condition === 'cloudy') icon = <Cloud size={18} className="text-[#8C8881]" />;
    if (condition === 'rainy') icon = <CloudRain size={18} className="text-[#7A838F]" />;
    if (currentHour >= 18 || currentHour <= 5) icon = <Moon size={18} className="text-[#44403C]" />;

    data.push({
      time: timeLabel,
      temp: `${baseTemp + tempAdjust}°`,
      icon: icon
    });
  }
  return data;
};

// --- 數據資料 ---

const tripData: DayPlan[] = [
  {
    day: 1,
    dateStr: "25",
    dayOfWeek: "WED",
    fullDate: "2026.02.25",
    title: "啟程．飛往維也納",
    locationName: "Taipei",
    imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop", 
    hourlyWeather: generate24HourWeather(22, 'cloudy'),
    items: [
      {
        time: "20:35",
        title: "桃園機場集合",
        category: "transport",
        categoryLabel: "DEPARTURE",
        description: "第二航站長榮航空 20 號後方團體櫃檯。",
        location: "Taoyuan International Airport",
        aiTips: [{ type: 'tip', content: '領隊：邵十立先生 0933-991-954。行李牌：黃色。' }]
      },
      {
        time: "23:35",
        title: "台北(桃園)/維也納",
        category: "flight",
        categoryLabel: "FLIGHT",
        description: "BR065(長榮航空) 直飛維也納。",
        aiTips: [{ type: 'tip', content: '機上過夜，建議攜帶頸枕與保濕用品。' }]
      }
    ]
  },
  {
    day: 2,
    dateStr: "26",
    dayOfWeek: "THU",
    fullDate: "2026.02.26",
    title: "哈爾斯塔特",
    locationName: "Salzburg",
    imageUrl: "https://image.kkday.com/v2/image/get/s1.kkday.com/product_36568/20200122064534_xxRQH/jpg",
    hourlyWeather: generate24HourWeather(4, 'cloudy'),
    items: [
      {
        time: "06:45",
        title: "抵達維也納",
        category: "transport",
        categoryLabel: "ARRIVAL",
        location: "Vienna Airport",
        description: "專車前往奧地利湖區。"
      },
      {
        time: "10:00",
        title: "哈爾斯塔特 Hallstatt",
        category: "sightseeing",
        categoryLabel: "SIGHTSEEING",
        description: "世界最美湖畔小鎮。",
        location: "Hallstatt Viewpoint",
        subLocations: ["市集廣場", "人骨教堂"],
        aiTips: [
          { type: 'must-buy', content: '哈爾斯塔特天然岩鹽 (七彩瓶)' },
          { type: 'story', content: '明信片拍攝點在小鎮北端的 Gosaumühlstraße 路邊。' }
        ]
      },
      {
        time: "12:30",
        title: "湖區鱒魚料理",
        category: "food",
        categoryLabel: "LUNCH",
        description: "品嚐當地新鮮捕獲的鱒魚。",
        aiTips: [{ type: 'must-eat', content: '乾煎鱒魚佐水煮馬鈴薯，口感細緻清淡。' }]
      },
      {
        time: "15:00",
        title: "薩爾茲堡市區觀光 Salzburg City Tour",
        category: "sightseeing",
        categoryLabel: "CITY TOUR",
        description: "莫札特故居與電影真善美場景。",
        location: "Salzburg Old Town",
        subLocations: ["米拉貝爾花園", "蓋特萊德巷", "莫札特故居"],
        aiTips: [
          { type: 'must-buy', content: 'Furst 創始店莫札特巧克力 (銀藍包裝)' },
          { type: 'luxury', content: '蓋特萊德巷：LV, Hermès, Montblanc 精品店林立。' }
        ]
      },
      {
        time: "18:00",
        title: "Mercure Salzburg City Hotel",
        category: "hotel",
        categoryLabel: "HOTEL",
        location: "Mercure Salzburg City Hotel",
        phone: "+43-6-62881438",
        description: "舒適的現代風格飯店。"
      }
    ]
  },
  {
    day: 3,
    dateStr: "27",
    dayOfWeek: "FRI",
    fullDate: "2026.02.27",
    title: "國王湖",
    locationName: "Český Krumlov",
    imageUrl: "https://blog-static.kkday.com/zh-tw/blog/wp-content/uploads/shutterstock_711751918.jpg",
    hourlyWeather: generate24HourWeather(2, 'rainy'),
    items: [
      {
        time: "07:30",
        title: "飯店早餐",
        category: "food",
        categoryLabel: "BREAKFAST",
        description: "Mercure Hotel 自助早餐。",
      },
      {
        time: "09:00",
        title: "國王湖 Königssee",
        category: "sightseeing",
        categoryLabel: "NATURE",
        description: "德國最深、最清澈的高山湖泊。",
        location: "Königssee",
        subLocations: ["聖巴多羅買教堂 (紅蔥頭教堂)"],
        aiTips: [{ type: 'must-eat', content: '湖區煙燻鱒魚 (Fischer vom Königssee)' }]
      },
      {
        time: "14:00",
        title: "古老鹽礦探秘 薩爾茲堡鹽礦",
        category: "sightseeing",
        categoryLabel: "ADVENTURE",
        description: "換穿礦工服，體驗木滑梯。",
        location: "Salt Mine Berchtesgaden",
        aiTips: [{ type: 'tip', content: '地底恆溫約 12 度，體驗滑梯建議穿著褲裝。' }]
      },
      {
        time: "17:30",
        title: "契斯科庫倫洛夫 Český Krumlov",
        category: "transport",
        categoryLabel: "TRANSFER",
        description: "前往南波希米亞的童話小鎮。",
        location: "Cesky Krumlov",
        aiTips: [{ type: 'story', content: '如果時間允許，可在晚餐前先到城堡斗篷橋拍夕陽。' }]
      },
      {
        time: "19:00",
        title: "中世紀晚宴",
        category: "food",
        categoryLabel: "DINNER",
        description: "庫倫洛夫變裝晚宴。",
        aiTips: [{ type: 'must-eat', content: '捷克黑啤酒 (Dark Lager)、烤豬腳' }]
      },
      {
        time: "21:00",
        title: "Hotel OLDINN",
        category: "hotel",
        categoryLabel: "HOTEL",
        location: "Hotel Oldinn",
        phone: "+420-380-772500",
        description: "位於古城廣場旁的經典飯店。"
      }
    ]
  },
  {
    day: 4,
    dateStr: "28",
    dayOfWeek: "SAT",
    fullDate: "2026.02.28",
    title: "庫倫洛夫",
    locationName: "Karlovy Vary",
    imageUrl: "https://image.cdn-eztravel.com.tw/HJ8HZhW9imcQcnmLEJnsbHKSBX4t8piudvOzUSlWoL0/g:ce/aHR0cHM6Ly92YWNhdGlvbi5jZG4tZXp0cmF2ZWwuY29tLnR3L2ltZy9WRFIvQ1pfMjU3ODU5MzkyLmpwZw.jpg",
    hourlyWeather: generate24HourWeather(5, 'cloudy'),
    items: [
      {
        time: "07:30",
        title: "飯店早餐",
        category: "food",
        categoryLabel: "BREAKFAST",
        description: "Hotel OLDINN 自助早餐。",
      },
      {
        time: "09:30",
        title: "契斯科庫倫洛夫 Český Krumlov",
        category: "sightseeing",
        categoryLabel: "OLD TOWN",
        description: "伏爾他瓦河環繞的中世紀小鎮。",
        location: "Cesky Krumlov Castle",
        subLocations: ["彩繪塔", "理髮師橋", "舊城廣場"],
        aiTips: [
          { type: 'must-buy', content: 'Koh-i-noor 刺蝟筆 (捷克國營鉛筆)' },
          { type: 'must-eat', content: 'Trdelník (肉桂煙囪捲)' }
        ]
      },
      {
        time: "14:00",
        title: "卡羅維瓦利 Karlovy Vary",
        category: "sightseeing",
        categoryLabel: "SPA TOWN",
        description: "著名的溫泉療養聖地。",
        location: "Karlovy Vary",
        subLocations: ["磨坊溫泉迴廊", "市場溫泉迴廊"],
        aiTips: [
          { type: 'must-eat', content: '溫泉餅 (Oplatky)' },
          { type: 'must-buy', content: '溫泉杯、貝赫洛夫卡草藥酒' },
          { type: 'luxury', content: '此處有許多水晶玻璃與瓷器精品店。' }
        ]
      },
      {
        time: "18:00",
        title: "Hotel Imperial",
        category: "hotel",
        categoryLabel: "HOTEL",
        location: "Hotel Imperial Karlovy Vary",
        phone: "+420-353-203113",
        description: "宏偉的五星級溫泉飯店。"
      }
    ]
  },
  {
    day: 5,
    dateStr: "01",
    dayOfWeek: "SUN",
    fullDate: "2026.03.01",
    title: "布拉格天文鐘",
    locationName: "Prague",
    imageUrl: "https://photo.settour.com.tw/900x600/https://www.settour.com.tw/ss_img/info/location/PRG/G0/PRG0000011/PRG0000011_45988.jpg",
    hourlyWeather: generate24HourWeather(7, 'sunny'),
    items: [
      {
        time: "07:30",
        title: "飯店早餐",
        category: "food",
        categoryLabel: "BREAKFAST",
        description: "Hotel Imperial 自助早餐。",
      },
      {
        time: "12:00",
        title: "伏爾他瓦河遊船 Vltava Cruise",
        category: "food",
        categoryLabel: "LUNCH CRUISE",
        description: "船上享用自助餐，欣賞河岸風光。",
        location: "Vltava River"
      },
      {
        time: "14:30",
        title: "布拉格老城天文鐘 Old Town",
        category: "sightseeing",
        categoryLabel: "CITY TOUR",
        description: "布拉格的心臟地帶。",
        location: "Old Town Square Prague",
        subLocations: ["舊市政廳", "提恩教堂", "火藥塔"],
        aiTips: [
          { type: 'must-buy', content: '菠丹妮 (Botanicus) 手工皂' },
          { type: 'luxury', content: '巴黎大街：聚集 LV, Dior, Gucci 等一線精品。' }
        ]
      },
      {
        time: "18:00",
        title: "Art Nouveau Palace Hotel",
        category: "hotel",
        categoryLabel: "HOTEL",
        location: "Art Nouveau Palace Hotel",
        phone: "+420-224-093111",
        description: "新藝術風格設計飯店。"
      }
    ]
  },
  {
    day: 6,
    dateStr: "02",
    dayOfWeek: "MON",
    fullDate: "2026.03.02",
    title: "布拉格老城",
    locationName: "Prague",
    imageUrl: "https://www.sundaytour.com.tw/upfiles/chinese/attractions/tw_attractions_caty01481734310.jpg",
    hourlyWeather: generate24HourWeather(8, 'sunny'),
    items: [
      {
        time: "07:30",
        title: "飯店早餐",
        category: "food",
        categoryLabel: "BREAKFAST",
        description: "Art Nouveau Palace 自助早餐。",
      },
      {
        time: "09:00",
        title: "布拉格城堡 Prague Castle",
        category: "sightseeing",
        categoryLabel: "CASTLE",
        description: "世界最大古堡群，歷代國王的住所。",
        location: "Prague Castle"
      },
      {
        time: "10:30",
        title: "聖維特大教堂 St. Vitus Cathedral",
        category: "sightseeing",
        categoryLabel: "CATHEDRAL",
        description: "哥德式建築的傑作。",
        location: "St. Vitus Cathedral",
        aiTips: [{ type: 'story', content: '尋找慕夏 (Mucha) 繪製的彩繪玻璃窗。' }]
      },
      {
        time: "11:30",
        title: "布拉格黃金巷 Golden Lane",
        category: "sightseeing",
        categoryLabel: "HISTORY",
        description: "色彩繽紛的小屋，曾是煉金術師與卡夫卡的居所。",
        location: "Golden Lane",
        aiTips: [
          { type: 'story', content: '22 號藍色小屋曾是作家卡夫卡的書房。' },
          { type: 'must-buy', content: '黃金巷內的金屬書籤與錫製士兵。' }
        ]
      },
      {
        time: "14:00",
        title: "查理大橋 Charles Bridge",
        category: "sightseeing",
        categoryLabel: "LANDMARK",
        description: "露天的巴洛克雕像博物館。",
        location: "Charles Bridge",
        aiTips: [{ type: 'tip', content: '橋上第 8 尊聖約翰雕像，摸底座的浮雕據說會帶來好運。' }]
      },
      {
        time: "16:00",
        title: "市民會館下午茶 Restaurace Obecní dům",
        category: "food",
        categoryLabel: "TEA TIME",
        description: "優雅的新藝術風格咖啡廳。",
        location: "Municipal House",
        aiTips: [{ type: 'must-eat', content: '經典蜂蜜蛋糕 (Medovnik)' }]
      },
      {
        time: "17:30",
        title: "布拉格老城天文鐘 Old Town",
        category: "sightseeing",
        categoryLabel: "CITY CENTER",
        description: "再次回到舊城廣場感受傍晚氛圍。",
        location: "Prague Astronomical Clock",
        aiTips: [{ type: 'must-buy', content: '天文鐘造型冰箱貼' }]
      }
    ]
  },
  {
    day: 7,
    dateStr: "03",
    dayOfWeek: "TUE",
    fullDate: "2026.03.03",
    title: "特爾奇",
    locationName: "Vienna",
    imageUrl: "https://image.cdn-eztravel.com.tw/HgCf8CdO18qYpil0KI8X_nKoi8-lxIMYgDnwJadhLQA/g:ce/aHR0cHM6Ly92YWNhdGlvbi5jZG4tZXp0cmF2ZWwuY29tLnR3L2ltZy9WRFIvQUFfMTQxNzUxMTU5Ny5qcGc.jpg",
    hourlyWeather: generate24HourWeather(10, 'cloudy'),
    items: [
      {
        time: "07:00",
        title: "飯店早餐",
        category: "food",
        categoryLabel: "BREAKFAST",
        description: "Art Nouveau Palace 自助早餐。",
      },
      {
        time: "10:30",
        title: "特爾奇 Telc",
        category: "sightseeing",
        categoryLabel: "UNESCO",
        description: "夢幻的文藝復興風格小鎮。",
        location: "Telč",
        aiTips: [{ type: 'story', content: '廣場兩旁的山形牆屋頂，每棟造型都不同。' }]
      },
      {
        time: "15:00",
        title: "貝爾維第宮 Schloss Belvedere",
        category: "sightseeing",
        categoryLabel: "MUSEUM",
        description: "巴洛克宮殿，欣賞克林姆名畫《吻》。",
        location: "Belvedere Palace"
      },
      {
        time: "18:30",
        title: "帽子餐廳",
        category: "food",
        categoryLabel: "DINNER",
        description: "Ribs of Vienna 豬肋排。",
        aiTips: [{ type: 'must-eat', content: '一公尺長的炭烤豬肋排。' }]
      },
      {
        time: "20:00",
        title: "Andaz Vienna Am Belvedere",
        category: "hotel",
        categoryLabel: "HOTEL",
        location: "Andaz Vienna Am Belvedere",
        phone: "+43-1-20577441234",
        description: "緊鄰美景宮的奢華飯店。"
      }
    ]
  },
  {
    day: 8,
    dateStr: "04",
    dayOfWeek: "WED",
    fullDate: "2026.03.04",
    title: "維也納皇室風華",
    locationName: "Vienna",
    imageUrl: "https://ht-cdn.panyou.com/uploadhk/2025/ht/1223/202512231611-8793123815.png",
    hourlyWeather: generate24HourWeather(11, 'sunny'),
    items: [
      {
        time: "09:00",
        title: "熊布朗宮 Schloss Schönbrunn",
        category: "sightseeing",
        categoryLabel: "PALACE",
        description: "哈布斯堡王朝的夏宮。",
        location: "Schönbrunn Palace"
      }
    ]
  },
  {
    day: 9,
    dateStr: "05",
    dayOfWeek: "THU",
    fullDate: "2026.03.05",
    title: "再見維也納",
    locationName: "Vienna Airport",
    imageUrl: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=2070&auto=format&fit=crop",
    hourlyWeather: generate24HourWeather(12, 'cloudy'),
    items: [
      {
        time: "12:05",
        title: "維也納/台北(桃園)",
        category: "flight",
        categoryLabel: "FLIGHT",
        description: "BR066(長榮航空) 返回台北。",
      }
    ]
  },
  {
    day: 10,
    dateStr: "06",
    dayOfWeek: "FRI",
    fullDate: "2026.03.06",
    title: "抵達台北",
    locationName: "Taipei",
    imageUrl: "https://images.unsplash.com/photo-1470004914212-05527e49370b?q=80&w=2074&auto=format&fit=crop",
    hourlyWeather: generate24HourWeather(25, 'sunny'),
    items: [
      {
        time: "06:40",
        title: "台北(桃園)",
        category: "transport",
        categoryLabel: "ARRIVAL",
        description: "平安歸賦，回到溫暖的家。"
      }
    ]
  }
];

// --- 介面組件 ---

const Tag = ({ type, content }: { type: string; content: string }) => {
  const styles = {
    'must-eat': { icon: <Utensils size={10} />, color: 'text-[#C49A6C]', bg: 'bg-[#C49A6C]/10', label: '必吃' },
    'must-buy': { icon: <ShoppingBag size={10} />, color: 'text-[#788F7A]', bg: 'bg-[#788F7A]/10', label: '必買' },
    'story': { icon: <Info size={10} />, color: 'text-[#7A838F]', bg: 'bg-[#7A838F]/10', label: '物語' },
    'tip': { icon: <Navigation size={10} />, color: 'text-[#A65D57]', bg: 'bg-[#A65D57]/10', label: '貼士' },
    'luxury': { icon: <Gem size={10} />, color: 'text-[#64748B]', bg: 'bg-[#E2E8F0]', label: '精品' },
  };

  const style = styles[type as keyof typeof styles] || styles['tip'];

  return (
    <div className={`mt-2 flex items-start gap-2 text-xs leading-relaxed text-[#5C5C59] ${style.bg} p-2 rounded-lg`}>
      <span className={`shrink-0 font-bold ${style.color} flex items-center gap-1 uppercase tracking-wider`}>
        {style.icon} {style.label}
      </span>
      <span>{content}</span>
    </div>
  );
};

const ItineraryCard = ({ item }: { item: ItineraryItem }) => {
  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'sightseeing': return <Camera size={14} />;
      case 'food': return <Utensils size={14} />;
      case 'transport': return <Train size={14} />;
      case 'hotel': return <BedDouble size={14} />;
      case 'flight': return <Plane size={14} />;
      case 'shopping': return <ShoppingBag size={14} />;
      default: return <MapPin size={14} />;
    }
  };

  return (
    <div className="relative pl-6 pb-8 last:pb-2 group">
      <div className="absolute left-[7px] top-3 bottom-0 w-[1px] bg-[#E5E3DB] group-last:hidden"></div>
      <div className="absolute left-0 top-3 w-[15px] h-[15px] rounded-full bg-[#FDFCF8] border border-[#C4C2BA] flex items-center justify-center z-10">
        <div className="w-[5px] h-[5px] rounded-full bg-[#8C8881]"></div>
      </div>
      <div>
        <div className="text-xl font-serif text-[#44403C] tracking-tight mb-2 flex items-center gap-2">
          {item.time}
          <div className="h-[1px] bg-[#E5E3DB] flex-1 ml-2"></div>
        </div>
        <h3 className="text-[#44403C] font-serif text-lg font-medium mb-1">{item.title}</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-[#8C8881] uppercase tracking-[0.15em] mb-3 font-medium">
          {getCategoryIcon(item.category)}
          <span>{item.categoryLabel || item.category}</span>
        </div>
        {item.phone && (
          <div className="flex items-center gap-2 text-xs text-[#A65D57] mb-2 font-mono">
            <Phone size={12} />
            <a href={`tel:${item.phone}`}>{item.phone}</a>
          </div>
        )}
        {item.description && (
          <p className="text-[#6E6B65] text-sm leading-relaxed font-light mb-2">{item.description}</p>
        )}
        {item.subLocations && item.subLocations.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {item.subLocations.map((sub, idx) => (
              <span key={idx} className="text-[10px] text-[#6E6B65] bg-[#F2F0E9] px-2 py-1 rounded">{sub}</span>
            ))}
          </div>
        )}
        {item.aiTips && (
          <div className="space-y-1">
            {item.aiTips.map((tip, idx) => (
              <Tag key={idx} type={tip.type} content={tip.content} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MapView = ({ locations, currentDayTitle }: { locations: ItineraryItem[], currentDayTitle: string }) => {
  return (
    <div className="mt-8 mb-4 border-t border-[#F2F0E9] pt-6">
      <h4 className="font-serif text-[#44403C] text-lg mb-4 flex items-center gap-2">
        <MapIcon size={18} /> 當日路徑地圖
      </h4>
      <div className="relative w-full h-48 bg-[#EFECE6] rounded-xl overflow-hidden shadow-inner border border-[#E5E3DB] flex items-center justify-center group cursor-pointer">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#8C8881 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        {locations.filter(l => l.location).slice(0, 3).map((loc, idx) => (
           <div key={idx} className="absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center gap-1" style={{ left: `${20 + idx * 30}%` }}>
              <div className="w-3 h-3 bg-[#A65D57] rounded-full ring-4 ring-white shadow-md z-10 animate-bounce"></div>
              <span className="text-[10px] bg-white/80 px-1 rounded text-[#44403C] font-bold shadow-sm whitespace-nowrap">
                {loc.title.split(' ')[0]}
              </span>
           </div>
        ))}
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentDayTitle + ' attractions')}`} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
           <span className="bg-[#44403C] text-white px-3 py-1.5 rounded-full text-xs shadow-lg flex items-center gap-1">開啟 Google Maps <ArrowRight size={12} /></span>
        </a>
      </div>
    </div>
  );
};

const FullTripMap = () => {
  return (
    <div className="relative w-full h-56 bg-[#EFECE6] rounded-2xl overflow-hidden shadow-sm border border-[#E5E3DB] mb-8 group">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#A65D57 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="absolute top-[30%] left-[45%] flex flex-col items-center">
        <div className="w-3 h-3 bg-[#A65D57] rounded-full ring-2 ring-white shadow-md"></div>
        <span className="text-[10px] font-serif font-bold mt-1 text-[#A65D57]">Prague</span>
      </div>
      <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="bg-[#44403C] text-white px-4 py-2 rounded-full text-xs shadow-xl flex items-center gap-2">View on Google Maps <ArrowRight size={14} /></span>
      </a>
    </div>
  );
};

const BudgetView = () => {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [itemName, setItemName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<'EUR' | 'CZK'>('EUR');
  const [payer, setPayer] = useState<'R' | 'C' | 'N' | 'O'>('R');
  const rates = { EUR: 34.5, CZK: 1.4 };
  const payerColors = { R: 'bg-[#D3C4BE] text-[#5D5753]', C: 'bg-[#B0B7B3] text-[#48504D]', N: 'bg-[#A9B7C0] text-[#434F58]', O: 'bg-[#D1C7B1] text-[#5C5543]' };

  useEffect(() => {
    signInAnonymously(auth).catch(e => console.error(e));
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'expenses'));
    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Expense[];
      setExpenses(data.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsubscribeSnapshot();
  }, [user]);

  const handleAdd = async () => {
    if (!itemName || !amountStr) return;
    const amount = parseFloat(amountStr);
    await addDoc(collection(db, 'expenses'), {
      item: itemName, currency, amount, twdAmount: Math.round(amount * rates[currency]),
      payer, date: new Date().toLocaleDateString(), timestamp: Date.now()
    });
    setItemName(''); setAmountStr('');
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
  };

  const totalTwd = expenses.reduce((acc, curr) => acc + curr.twdAmount, 0);

  return (
    <div className="p-8 animate-fade-in space-y-8">
      <div className="bg-[#44403C] text-[#FDFCF8] p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <p className="text-[#8C8881] text-[10px] uppercase tracking-[0.2em] mb-2">Total Expenses</p>
        <div className="text-4xl font-serif">NT$ {totalTwd.toLocaleString()}</div>
        <div className="mt-2 text-[#8C8881] text-xs flex items-center gap-1">
           {user ? <Wifi size={10} className="text-green-500" /> : <WifiOff size={10} className="text-red-500" />}
           {user ? 'Syncing Online' : 'Offline Mode'}
        </div>
        <Wallet className="absolute right-6 bottom-6 text-[#5C5C59] opacity-30" size={80} strokeWidth={0.5} />
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#F2F0E9] space-y-4">
        <input type="text" placeholder="項目" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-[#F2F0E9] rounded-lg px-4 py-3 text-sm focus:outline-none" />
        <div className="flex gap-2">
          <input type="number" placeholder="金額" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} className="flex-1 bg-[#F2F0E9] rounded-lg px-4 py-3 text-sm focus:outline-none" />
          <select value={currency} onChange={(e:any) => setCurrency(e.target.value)} className="bg-[#F2F0E9] rounded-lg px-2 text-sm">
            <option value="EUR">€</option><option value="CZK">Kč</option>
          </select>
        </div>
        <button onClick={handleAdd} className="w-full bg-[#44403C] text-white py-3 rounded-xl flex items-center justify-center gap-2"><Plus size={16} /> 記一筆</button>
      </div>
      <div className="space-y-3">
        {expenses.map(ex => (
          <div key={ex.id} className="bg-white p-4 rounded-xl border border-[#F2F0E9] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${payerColors[ex.payer]}`}>{ex.payer}</div>
              <div><div className="text-[#44403C] font-medium text-sm">{ex.item}</div><div className="text-[10px] text-[#8C8881]">{ex.currency} {ex.amount}</div></div>
            </div>
