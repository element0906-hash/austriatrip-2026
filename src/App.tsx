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

// --- Firebase 配置 ---
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

// --- 類型與數據 ---
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

const generate24HourWeather = (baseTemp: number, condition: 'sunny' | 'cloudy' | 'rainy'): HourlyWeather[] => {
  const data: HourlyWeather[] = [];
  for (let i = 0; i < 24; i += 3) {
    let hour = (8 + i) % 24;
    let icon = <Sun size={18} className="text-[#A65D57]" />;
    if (condition === 'cloudy') icon = <Cloud size={18} className="text-[#8C8881]" />;
    if (condition === 'rainy') icon = <CloudRain size={18} className="text-[#7A838F]" />;
    if (hour >= 18 || hour <= 5) icon = <Moon size={18} className="text-[#44403C]" />;
    data.push({ time: `${hour.toString().padStart(2, '0')}:00`, temp: `${baseTemp + (hour > 10 && hour < 16 ? 3 : -2)}°`, icon });
  }
  return data;
};

const tripData = [
  { day: 1, dateStr: "25", dayOfWeek: "WED", title: "啟程．飛往維也納", locationName: "Taipei", imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop", hourlyWeather: generate24HourWeather(22, 'cloudy'), items: [{ time: "23:35", title: "台北/維也納", category: "flight", description: "BR065 長榮航空" }] },
  { day: 2, dateStr: "26", dayOfWeek: "THU", title: "哈爾斯塔特", locationName: "Salzburg", imageUrl: "https://image.kkday.com/v2/image/get/s1.kkday.com/product_36568/20200122064534_xxRQH/jpg", hourlyWeather: generate24HourWeather(4, 'cloudy'), items: [{ time: "10:00", title: "哈爾斯塔特 Hallstatt", category: "sightseeing", location: "Hallstatt", aiTips: [{type:'must-buy', content:'岩鹽'}] }] },
  { day: 3, dateStr: "27", dayOfWeek: "FRI", title: "國王湖", locationName: "Český Krumlov", imageUrl: "https://blog-static.kkday.com/zh-tw/blog/wp-content/uploads/shutterstock_711751918.jpg", hourlyWeather: generate24HourWeather(2, 'rainy'), items: [{ time: "09:00", title: "國王湖 Königssee", category: "sightseeing", location: "Königssee" }] },
  { day: 4, dateStr: "28", dayOfWeek: "SAT", title: "庫倫洛夫", locationName: "Karlovy Vary", imageUrl: "https://image.cdn-eztravel.com.tw/HJ8HZhW9imcQcnmLEJnsbHKSBX4t8piudvOzUSlWoL0/g:ce/aHR0cHM6Ly92YWNhdGlvbi5jZG4tZXp0cmF2ZWwuY29tLnR3L2ltZy9WRFIvQ1pfMjU3ODU5MzkyLmpwZw.jpg", hourlyWeather: generate24HourWeather(5, 'cloudy'), items: [{ time: "09:30", title: "庫倫洛夫舊城", category: "sightseeing", location: "Cesky Krumlov" }] },
  { day: 5, dateStr: "01", dayOfWeek: "SUN", title: "布拉格天文鐘", locationName: "Prague", imageUrl: "https://photo.settour.com.tw/900x600/https://www.settour.com.tw/ss_img/info/location/PRG/G0/PRG0000011/PRG0000011_45988.jpg", hourlyWeather: generate24HourWeather(7, 'sunny'), items: [{ time: "14:30", title: "老城廣場", category: "sightseeing", location: "Prague" }] },
  { day: 6, dateStr: "02", dayOfWeek: "MON", title: "布拉格城堡", locationName: "Prague", imageUrl: "https://www.sundaytour.com.tw/upfiles/chinese/attractions/tw_attractions_caty01481734310.jpg", hourlyWeather: generate24HourWeather(8, 'sunny'), items: [{ time: "09:00", title: "布拉格城堡", category: "sightseeing", location: "Prague Castle" }] },
  { day: 7, dateStr: "03", dayOfWeek: "TUE", title: "特爾奇小鎮", locationName: "Vienna", imageUrl: "https://image.cdn-eztravel.com.tw/HgCf8CdO18qYpil0KI8X_nKoi8-lxIMYgDnwJadhLQA/g:ce/aHR0cHM6Ly92YWNhdGlvbi5jZG4tZXp0cmF2ZWwuY29tLnR3L2ltZy9WRFIvQUFfMTQxNzUxMTU5Ny5qcGc.jpg", hourlyWeather: generate24HourWeather(10, 'cloudy'), items: [{ time: "10:30", title: "特爾奇 Telc", category: "sightseeing" }] },
  { day: 8, dateStr: "04", dayOfWeek: "WED", title: "維也納皇室", locationName: "Vienna", imageUrl: "https://ht-cdn.panyou.com/uploadhk/2025/ht/1223/202512231611-8793123815.png", hourlyWeather: generate24HourWeather(11, 'sunny'), items: [{ time: "09:00", title: "熊布朗宮", category: "sightseeing" }] },
  { day: 9, dateStr: "05", dayOfWeek: "THU", title: "再見維也納", locationName: "Vienna", imageUrl: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=2070&auto=format&fit=crop", hourlyWeather: generate24HourWeather(12, 'cloudy'), items: [{ time: "12:05", title: "維也納/台北", category: "flight" }] },
  { day: 10, dateStr: "06", dayOfWeek: "FRI", title: "抵達台北", locationName: "Taipei", imageUrl: "https://images.unsplash.com/photo-1470004914212-05527e49370b?q=80&w=2074&auto=format&fit=crop", hourlyWeather: generate24HourWeather(25, 'sunny'), items: [{ time: "06:40", title: "抵達桃園機場", category: "transport" }] }
];

// --- 組件 ---
const Tag = ({ type, content }: { type: string; content: string }) => {
  const styles: any = {
    'must-eat': { icon: <Utensils size={10} />, color: 'text-[#C49A6C]', bg: 'bg-[#C49A6C]/10', label: '必吃' },
    'must-buy': { icon: <ShoppingBag size={10} />, color: 'text-[#788F7A]', bg: 'bg-[#788F7A]/10', label: '必買' },
    'story': { icon: <Info size={10} />, color: 'text-[#7A838F]', bg: 'bg-[#7A838F]/10', label: '物語' },
    'tip': { icon: <Navigation size={10} />, color: 'text-[#A65D57]', bg: 'bg-[#A65D57]/10', label: '貼士' },
    'luxury': { icon: <Gem size={10} />, color: 'text-[#64748B]', bg: 'bg-[#E2E8F0]', label: '精品' },
  };
  const style = styles[type] || styles['tip'];
  return (
    <div className={`mt-2 flex items-start gap-2 text-xs leading-relaxed text-[#5C5C59] ${style.bg} p-2 rounded-lg`}>
      <span className={`shrink-0 font-bold ${style.color} flex items-center gap-1 uppercase tracking-wider`}>{style.icon} {style.label}</span>
      <span>{content}</span>
    </div>
  );
};

const ItineraryCard = ({ item }: { item: ItineraryItem }) => {
  return (
    <div className="relative pl-6 pb-8 last:pb-2">
      <div className="absolute left-[7px] top-3 bottom-0 w-[1px] bg-[#E5E3DB]"></div>
      <div className="absolute left-0 top-3 w-[15px] h-[15px] rounded-full bg-[#FDFCF8] border border-[#C4C2BA] flex items-center justify-center z-10">
        <div className="w-[5px] h-[5px] rounded-full bg-[#8C8881]"></div>
      </div>
      <div>
        <div className="text-xl font-serif text-[#44403C] mb-2 flex items-center gap-2">{item.time} <div className="h-[1px] bg-[#E5E3DB] flex-1"></div></div>
        <h3 className="text-[#44403C] font-serif text-lg font-medium">{item.title}</h3>
        {item.description && <p className="text-[#6E6B65] text-sm mt-1">{item.description}</p>}
        {item.aiTips && <div className="space-y-1">{item.aiTips.map((tip, idx) => <Tag key={idx} type={tip.type} content={tip.content} />)}</div>}
      </div>
    </div>
  );
};

const BudgetView = () => {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [itemName, setItemName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<'EUR' | 'CZK'>('EUR');
  
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'expenses'));
    return onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a:any, b:any) => b.timestamp - a.timestamp));
    });
  }, [user]);

  const handleAdd = async () => {
    if (!itemName || !amountStr) return;
    const amount = parseFloat(amountStr);
    await addDoc(collection(db, 'expenses'), {
      item: itemName, currency, amount, twdAmount: Math.round(amount * (currency === 'EUR' ? 34.5 : 1.4)),
      payer: 'R', date: new Date().toLocaleDateString(), timestamp: Date.now()
    });
    setItemName(''); setAmountStr('');
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="bg-[#44403C] text-[#FDFCF8] p-8 rounded-2xl shadow-xl">
        <p className="text-[#8C8881] text-[10px] uppercase tracking-widest mb-2">Total Expenses</p>
        <div className="text-4xl font-serif">NT$ {expenses.reduce((acc, curr) => acc + curr.twdAmount, 0).toLocaleString()}</div>
        <div className="mt-2 text-xs">{user ? <Wifi size={10} className="inline text-green-500" /> : <WifiOff size={10} className="inline text-red-500" />} {user ? 'Online' : 'Offline'}</div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-[#F2F0E9] space-y-4">
        <input type="text" placeholder="項目" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-[#F2F0E9] rounded-lg px-4 py-3 text-sm focus:outline-none" />
        <div className="flex gap-2">
          <input type="number" placeholder="金額" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} className="flex-1 bg-[#F2F0E9] rounded-lg px-4 py-3 text-sm focus:outline-none" />
          <select value={currency} onChange={(e:any) => setCurrency(e.target.value)} className="bg-[#F2F0E9] px-2 rounded-lg text-sm">
            <option value="EUR">€</option><option value="CZK">Kč</option>
          </select>
        </div>
        <button onClick={handleAdd} className="w-full bg-[#44403C] text-white py-3 rounded-xl flex items-center justify-center gap-2"><Plus size={16} /> 記一筆</button>
      </div>
      <div className="space-y-3">
        {expenses.map(ex => (
          <div key={ex.id} className="bg-white p-4 rounded-xl border border-[#F2F0E9] flex justify-between items-center">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#D3C4BE] flex items-center justify-center text-xs">R</div>
            <div><div className="text-[#44403C] font-medium text-sm">{ex.item}</div><div className="text-[10px] text-[#8C8881]">{ex.currency} {ex.amount}</div></div></div>
            <div className="flex items-center gap-3"><div className="text-[#A65D57] font-bold">NT$ {ex.twdAmount}</div>
            <button onClick={() => deleteDoc(doc(db, 'expenses', ex.id))} className="text-[#E5E3DB] hover:text-red-400"><Trash2 size={16} /></button></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState<'day' | 'budget' | 'info'>('day');
  const [selectedDay, setSelectedDay] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentDayData = tripData.find(d => d.day === selectedDay) || tripData[0];

  return (
    <div className="bg-[#E5E3DB] min-h-screen font-sans text-[#44403C] flex justify-center">
      <div className="w-full max-w-md bg-[#FDFCF8] min-h-screen shadow-2xl relative flex flex-col">
        <header className="sticky top-0 z-30 bg-[#FDFCF8]/95 backdrop-blur-sm pt-4 pb-2 border-b border-[#F2F0E9]">
          <div ref={scrollRef} className="flex overflow-x-auto gap-6 px-6 pb-2 scrollbar-hide snap-x items-center">
            {tripData.map((d) => (
              <button key={d.day} onClick={() => { setView('day'); setSelectedDay(d.day); }} className="shrink-0 flex flex-col items-center gap-1 w-14">
                <span className={`text-[10px] uppercase ${selectedDay === d.day && view === 'day' ? 'text-[#A65D57] font-bold' : 'text-[#C4C2BA]'}`}>{d.dayOfWeek}</span>
                <span className={`text-xl font-serif ${selectedDay === d.day && view === 'day' ? 'text-[#44403C]' : 'text-[#C4C2BA]'}`}>{d.dateStr}</span>
              </button>
            ))}
            <button onClick={() => setView('budget')} className={`shrink-0 flex flex-col items-center gap-1 w-14 ${view === 'budget' ? 'opacity-100' : 'opacity-40'}`}><Wallet size={18} /><span className="text-[10px]">記帳</span></button>
            <button onClick={() => setView('info')} className={`shrink-0 flex flex-col items-center gap-1 w-14 ${view === 'info' ? 'opacity-100' : 'opacity-40'}`}><Info size={18} /><span className="text-[10px]">資訊</span></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-10">
          {view === 'day' && (
            <div className="animate-fade-in">
              <div className="relative h-60 w-full mt-2 px-4">
                <div className="rounded-2xl overflow-hidden h-full relative">
                  <img src={currentDayData.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white"><h2 className="text-3xl font-serif">{currentDayData.title}</h2></div>
                </div>
              </div>
              <div className="px-6 pt-6">
                <div className="flex overflow-x-auto gap-6 pb-6 border-b border-[#F2F0E9] mb-8">
                  {currentDayData.hourlyWeather.map((w, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 shrink-0"><span className="text-[10px] text-[#8C8881]">{w.time}</span>{w.icon}<span className="text-sm font-serif">{w.temp}</span></div>
                  ))}
                </div>
                <div className="space-y-4">{currentDayData.items.map((item:any, idx:number) => <ItineraryCard key={idx} item={item} />)}</div>
                <div className="mt-8 p-4 bg-[#EFECE6] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2"><MapIcon size={18} /><span className="text-sm font-serif">當日景點地圖</span></div>
                  <a href={`https://www.go
