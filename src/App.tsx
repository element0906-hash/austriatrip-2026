import React, { useState, useEffect } from 'react';
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
  Gem, 
  Plus, 
  Trash2, 
  Wifi,
  WifiOff
} from 'lucide-react';

// --- Firebase 標準初始化 ---

const firebaseConfig = {
  apiKey: "AIzaSyDY6Ss9V08KcokLxJg4xCxhJIYvq-A9AYU",
  authDomain: "austriatravel-2026.firebaseapp.com",
  projectId: "austriatravel-2026",
  storageBucket: "austriatravel-2026.firebasestorage.app",
  messagingSenderId: "296545344595",
  appId: "1:296545344595:web:d9cdbbcc08ff067326baa6",
  measurementId: "G-SCPRFJKMWW"
};

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
    let tempAdjust = (currentHour >= 10 && currentHour <= 16) ? 3 : (currentHour >= 0 && currentHour <= 5 ? -4 : 0);
    let icon = <Sun size={18} className="text-[#A65D57]" />;
    if (condition === 'cloudy') icon = <Cloud size={18} className="text-[#8C8881]" />;
    if (condition === 'rainy') icon = <CloudRain size={18} className="text-[#7A838F]" />;
    if (currentHour >= 18 || currentHour <= 5) icon = <Moon size={18} className="text-[#44403C]" />;
    data.push({ time: timeLabel, temp: `${baseTemp + tempAdjust}°`, icon });
  }
  return data;
};

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
        title: "契斯科庫倫洛夫",
        category: "transport",
        categoryLabel: "TRANSFER",
        description: "前往南波希米亞的童話小鎮。",
        location: "Cesky Krumlov"
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
        time: "09:30",
        title: "契斯科庫倫洛夫 Český Krumlov",
        category: "sightseeing",
        categoryLabel: "OLD TOWN",
        location: "Cesky Krumlov Castle",
        aiTips: [{ type: 'must-buy', content: 'Koh-i-noor 刺蝟筆' }]
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
        time: "14:30",
        title: "布拉格老城天文鐘 Old Town",
        category: "sightseeing",
        categoryLabel: "CITY TOUR",
        location: "Old Town Square Prague"
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
        time: "09:00",
        title: "布拉格城堡 Prague Castle",
        category: "sightseeing",
        categoryLabel: "CASTLE",
        location: "Prague Castle"
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
        time: "10:30",
        title: "特爾奇 Telc",
        category: "sightseeing",
        categoryLabel: "UNESCO",
        location: "Telč"
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
        description: "BR066(長榮航空) 返回台北。"
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

// --- 組件部分 ---

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
          {item.time} <div className="h-[1px] bg-[#E5E3DB] flex-1 ml-2"></div>
        </div>
        <h3 className="text-[#44403C] font-serif text-lg font-medium mb-1">{item.title}</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-[#8C8881] uppercase tracking-[0.15em] mb-3 font-medium">
          {getCategoryIcon(item.category)} <span>{item.categoryLabel || item.category}</span>
        </div>
        {item.phone && <div className="flex items-center gap-2 text-xs text-[#A65D57] mb-2 font-mono"><Phone size={12} /><a href={`tel:${item.phone}`}>{item.phone}</a></div>}
        {item.description && <p className="text-[#6E6B65] text-sm leading-relaxed font-light mb-2">{item.description}</p>}
        {item.aiTips && <div className="space-y-1">{item.aiTips.map((tip, idx) => <Tag key={idx} type={tip.type} content={tip.content} />)}</div>}
      </div>
    </div>
  );
};

const MapView = ({ locations, currentDayTitle }: { locations: ItineraryItem[], currentDayTitle: string }) => {
  const queryMap = encodeURIComponent(`${currentDayTitle} austria attractions`);
  return (
    <div className="mt-8 mb-4 border-t border-[#F2F0E9] pt-6">
      <h4 className="font-serif text-[#44403C] text-lg mb-4 flex items-center gap-2"><MapIcon size={18} /> 當日路徑地圖</h4>
      <div className="relative w-full h-48 bg-[#EFECE6] rounded-xl overflow-hidden shadow-inner border border-[#E5E3DB]">
        <iframe
          title="Google Maps"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps/embed/v1/search?key=YOUR_API_KEY&q=${queryMap}`}
        ></iframe>
        <div className="absolute inset-0 bg-black/5 pointer-events-none flex items-center justify-center">
            <a href={`https://www.google.com/maps/search/?api=1&query=${queryMap}`} target="_blank" rel="noreferrer" className="bg-[#44403C] text-white px-4 py-2 rounded-full text-xs shadow-lg flex items-center gap-2 pointer-events-auto">
              開啟 Google Maps <ArrowRight size={14} />
            </a>
        </div>
      </div>
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
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'expenses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Expense[];
      setExpenses(data.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsubscribe();
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

  const handleDelete = async (id: string) => { await deleteDoc(doc(db, 'expenses', id)); };
  const totalTwd = expenses.reduce((acc, curr) => acc + curr.twdAmount, 0);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="bg-[#44403C] text-[#FDFCF8] p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <p className="text-[#8C8881] text-[10px] uppercase tracking-[0.2em] mb-2">Total Expenses</p>
        <div className="text-4xl font-serif">NT$ {totalTwd.toLocaleString()}</div>
        <div className="mt-2 text-[#8C8881] text-xs flex items-center gap-1">
          {user ? <Wifi size={10} className="text-green-500" /> : <WifiOff size={10} className="text-red-500" />} {user ? 'Online' : 'Offline'}
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
        <div className="flex gap-2">
          {['R', 'C', 'N', 'O'].map(p => (
            <button key={p} onClick={() => setPayer(p as any)} className={`w-10 h-10 rounded-full text-xs font-bold ${payer === p ? 'bg-[#44403C] text-white' : 'bg-[#F2F0E9]'}`}>{p}</button>
          ))}
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
            <div className="flex items-center gap-3">
              <div className="text-right font-mono font-bold text-[#A65D57]">NT$ {ex.twdAmount}</div>
              <button onClick={() => handleDelete(ex.id)} className="text-[#E5E3DB] hover:text-red-400"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState<'day' | 'budget' | 'info'>('day');
  const [selectedDay, setSelectedDay] = useState(1);
  const currentDayData = tripData.find(d => d.day === selectedDay) || tripData[0];

  return (
    <div className="bg-[#E5E3DB] min-h-screen font-sans text-[#44403C] flex justify-center">
      <div className="w-full max-w-md bg-[#FDFCF8] min-h-screen shadow-2xl relative flex flex-col">
        <header className="sticky top-0 z-30 bg-[#FDFCF8]/95 backdrop-blur-sm pt-4 pb-2 border-b border-[#F2F0E9]">
          <div className="flex overflow-x-auto gap-6 px-6 pb-2 scrollbar-hide">
            {tripData.map((d) => (
              <button key={d.day} onClick={() => { setView('day'); setSelectedDay(d.day); }} className="shrink-0 flex flex-col items-center">
                <span className={`text-[10px] uppercase ${selectedDay === d.day && view === 'day' ? 'text-[#A65D57] font-bold' : 'text-[#C4C2BA]'}`}>{d.dayOfWeek}</span>
                <span className={`text-xl font-serif ${selectedDay === d.day && view === 'day' ? 'text-[#44403C]' : 'text-[#C4C2BA]'}`}>{d.dateStr}</span>
              </button>
            ))}
            <button onClick={() => setView('budget')} className={`shrink-0 flex flex-col items-center ${view === 'budget' ? 'opacity-100' : 'opacity-40'}`}><Wallet size={18} /><span className="text-[10px]">記帳</span></button>
            <button onClick={() => setView('info')} className={`shrink-0 flex flex-col items-center ${view === 'info' ? 'opacity-100' : 'opacity-40'}`}><Info size={18} /><span className="text-[10px]">資訊</span></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-10">
          {view === 'day' && (
            <div className="animate-fade-in">
              <div className="relative h-60 px-4 mt-2">
                <div className="rounded-2xl overflow-hidden h-full relative">
                  <img src={currentDayData.imageUrl} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <div className="text-[10px] tracking-widest opacity-80 mb-1">DAY {currentDayData.day}</div>
                    <h2 className="text-3xl font-serif">{currentDayData.title}</h2>
                  </div>
                </div>
              </div>
              <div className="px-6 pt-6">
                <div className="flex justify-between items-baseline mb-6">
                  <h4 className="font-serif text-xl">{currentDayData.locationName}</h4>
                  <span className="text-[10px] text-[#8C8881] bg-[#F2F0E9] px-2 py-0.5 rounded-full uppercase">Forecast</span>
                </div>
                <div className="flex overflow-x-auto gap-6 pb-6 border-b border-[#F2F0E9] mb-8">
                  {currentDayData.hourlyWeather.map((w, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                      <span className="text-[10px] text-[#8C8881]">{w.time}</span>
                      {w.icon}
                      <span className="text-sm font-serif">{w.temp}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {currentDayData.items.map((item, idx) => <ItineraryCard key={idx} item={item} />)}
                </div>
                <MapView locations={currentDayData.items} currentDayTitle={currentDayData.title} />
              </div>
            </div>
          )}
          {view === 'budget' && <BudgetView />}
          {view === 'info' && (
            <div className="p-8 space-y-8 animate-fade-in">
                <h2 className="text-2xl font-serif mb-6">Trip Info</h2>
                <section className="space-y-4">
                  <h3 className="font-serif border-b pb-2 flex items-center gap-2"><Phone size={18}/> CONTACTS</h3>
                  <div className="bg-[#F2F0E9] p-4 rounded-xl flex justify-between items-center">
                    <span className="font-serif">領隊 邵十立 先生</span>
                    <a href="tel:0933991954" className="text-[#A65D57] font-bold">0933-991-954</a>
                  </div>
                </section>
                <section className="space-y-4">
                  <h3 className="font-serif border-b pb-2 flex items-center gap-2"><Plane size={18}/> FLIGHTS</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between"><span>BR065 (TPE-VIE)</span><span className="text-[#8C8881]">23:35-06:45+1</span></div>
                    <div className="flex justify-between"><span>BR066 (VIE-TPE)</span><span className="text-[#8C8881]">12:05-06:40+1</span></div>
                  </div>
                </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
