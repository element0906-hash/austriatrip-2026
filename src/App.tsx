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
  description?: string;
  location?: string;
  aiTips?: {
    type: 'must-eat' | 'must-buy' | 'story' | 'tip' | 'luxury';
    content: string;
  }[];
}

// --- 數據資料 ---
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
  { day: 1, dateStr: "25", dayOfWeek: "WED", title: "啟程．飛往維也納", locationName: "Taipei", imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop", hourlyWeather: generate24HourWeather(22, 'cloudy'), items: [{ time: "23:35", title: "台北/維也納", category: "flight" as Category, description: "BR065 長榮航空" }] },
  { day: 2, dateStr: "26", dayOfWeek: "THU", title: "哈爾斯塔特", locationName: "Salzburg", imageUrl: "https://image.kkday.com/v2/image/get/s1.kkday.com/product_36568/20200122064534_xxRQH/jpg", hourlyWeather: generate24HourWeather(4, 'cloudy'), items: [{ time: "10:00", title: "哈爾斯塔特 Hallstatt", category: "sightseeing" as Category, description: "世界最美湖畔小鎮", aiTips: [{type:'must-buy' as const, content:'天然岩鹽'}] }] },
  { day: 3, dateStr: "27", dayOfWeek: "FRI", title: "國王湖", locationName: "Český Krumlov", imageUrl: "https://blog-static.kkday.com/zh-tw/blog/wp-content/uploads/shutterstock_711751918.jpg", hourlyWeather: generate24HourWeather(2, 'rainy'), items: [{ time: "09:00", title: "國王湖 Königssee", category: "sightseeing" as Category }] },
  { day: 4, dateStr: "28", dayOfWeek: "SAT", title: "庫倫洛夫", locationName: "Karlovy Vary", imageUrl: "https://image.cdn-eztravel.com.tw/HJ8HZhW9imcQcnmLEJnsbHKSBX4t8piudvOzUSlWoL0/g:ce/aHR0cHM6Ly92YWNhdGlvbi5jZG4tZXp0cmF2ZWwuY29tLnR3L2ltZy9WRFIvQ1pfMjU3ODU5MzkyLmpwZw.jpg", hourlyWeather: generate24HourWeather(5, 'cloudy'), items: [{ time: "09:30", title: "契斯科庫倫洛夫", category: "sightseeing" as Category }] },
  { day: 5, dateStr: "01", dayOfWeek: "SUN", title: "布拉格老城", locationName: "Prague", imageUrl: "https://photo.settour.com.tw/900x600/https://www.settour.com.tw/ss_img/info/location/PRG/G0/PRG0000011/PRG0000011_45988.jpg", hourlyWeather: generate24HourWeather(7, 'sunny'), items: [{ time: "14:30", title: "天文鐘", category: "sightseeing" as Category }] },
  { day: 6, dateStr: "02", dayOfWeek: "MON", title: "布拉格城堡", locationName: "Prague", imageUrl: "https://www.sundaytour.com.tw/upfiles/chinese/attractions/tw_attractions_caty01481734310.jpg", hourlyWeather: generate24HourWeather(8, 'sunny'), items: [{ time: "09:00", title: "聖維特大教堂", category: "sightseeing" as Category }] },
  { day: 7, dateStr: "03", dayOfWeek: "TUE", title: "特爾奇", locationName: "Vienna", imageUrl: "https://image.cdn-eztravel.com.tw/HgCf8CdO18qYpil0KI8X_nKoi8-lxIMYgDnwJadhLQA/g:ce/aHR0cHM6Ly92YWNhdGlvbi5jZG4tZXp0cmF2ZWwuY29tLnR3L2ltZy9WRFIvQUFfMTQxNzUxMTU5Ny5qcGc.jpg", hourlyWeather: generate24HourWeather(10, 'cloudy'), items: [{ time: "18:30", title: "維也納肋排", category: "food" as Category }] },
  { day: 8, dateStr: "04", dayOfWeek: "WED", title: "維也納風華", locationName: "Vienna", imageUrl: "https://ht-cdn.panyou.com/uploadhk/2025/ht/1223/202512231611-8793123815.png", hourlyWeather: generate24HourWeather(11, 'sunny'), items: [{ time: "09:00", title: "熊布朗宮", category: "sightseeing" as Category }] },
  { day: 9, dateStr: "05", dayOfWeek: "THU", title: "再見維也納", locationName: "Vienna", imageUrl: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=2070&auto=format&fit=crop", hourlyWeather: generate24HourWeather(12, 'cloudy'), items: [{ time: "12:05", title: "維也納機場", category: "transport" as Category }] },
  { day: 10, dateStr: "06", dayOfWeek: "FRI", title: "抵達台北", locationName: "Taipei", imageUrl: "https://images.unsplash.com/photo-1470004914212-05527e49370b?q=80&w=2074&auto=format&fit=crop", hourlyWeather: generate24HourWeather(25, 'sunny'), items: [{ time: "06:40", title: "溫暖的家", category: "transport" as Category }] }
];

// --- 子組件 ---
const Tag = ({ type, content }: { type: string; content: string }) => {
  const config: any = {
    'must-eat': { icon: <Utensils size={10} />, color: 'text-[#C49A6C]', bg: 'bg-[#C49A6C]/10', label: '必吃' },
    'must-buy': { icon: <ShoppingBag size={10} />, color: 'text-[#788F7A]', bg: 'bg-[#788F7A]/10', label: '必買' },
    'story': { icon: <Info size={10} />, color: 'text-[#7A838F]', bg: 'bg-[#7A838F]/10', label: '物語' },
    'tip': { icon: <Navigation size={10} />, color: 'text-[#A65D57]', bg: 'bg-[#A65D57]/10', label: '貼士' },
    'luxury': { icon: <Gem size={10} />, color: 'text-[#64748B]', bg: 'bg-[#E2E8F0]', label: '精品' },
  };
  const style = config[type] || config['tip'];
  return (
    <div className={`mt-2 flex items-start gap-2 text-xs p-2 rounded-lg ${style.bg} text-[#5C5C59]`}>
      <span className={`shrink-0 font-bold ${style.color} flex items-center gap-1 uppercase`}>{style.icon} {style.label}</span>
      <span>{content}</span>
    </div>
  );
};

const ItineraryCard = ({ item }: { item: ItineraryItem }) => {
  const getIcon = (cat: Category) => {
    switch (cat) {
      case 'flight': return <Plane size={14} />;
      case 'food': return <Utensils size={14} />;
      case 'hotel': return <BedDouble size={14} />;
      case 'transport': return <Train size={14} />;
      case 'shopping': return <ShoppingBag size={14} />;
      case 'sightseeing': return <Camera size={14} />;
      default: return <MapPin size={14} />;
    }
  };

  return (
    <div className="relative pl-6 pb-8 last:pb-2 group">
      <div className="absolute left-[7px] top-3 bottom-0 w-[1px] bg-[#E5E3DB]"></div>
      <div className="absolute left-0 top-3 w-[15px] h-[15px] rounded-full bg-[#FDFCF8] border border-[#C4C2BA] flex items-center justify-center z-10">
        <div className="w-[5px] h-[5px] rounded-full bg-[#8C8881]"></div>
      </div>
      <div>
        <div className="text-xl font-serif text-[#44403C] mb-2 flex items-center gap-2">{item.time} <div className="h-[1px] bg-[#E5E3DB] flex-1"></div></div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[#8C8881]">{getIcon(item.category)}</span>
          <h3 className="text-[#44403C] font-serif text-lg font-medium">{item.title}</h3>
        </div>
        {item.description && <p className="text-[#6E6B65] text-sm">{item.description}</p>}
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
    await addDoc(collection(db, 'expenses'), {
      item: itemName, amount: parseFloat(amountStr), twdAmount: Math.round(parseFloat(amountStr) * 34.5),
      payer: 'R', timestamp: Date.now(), date: new Date().toLocaleDateString()
    });
    setItemName(''); setAmountStr('');
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="bg-[#44403C] text-[#FDFCF8] p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <p className="text-[#8C8881] text-[10px] uppercase tracking-widest mb-2">Total Expenses</p>
        <div className="text-4xl font-serif">NT$ {expenses.reduce((acc, curr) => acc + curr.twdAmount, 0).toLocaleString()}</div>
        <div className="mt-2 text-xs">{user ? <Wifi size={10} className="inline text-green-500" /> : <WifiOff size={10} className="inline text-red-500" />} {user ? 'Syncing Online' : 'Offline'}</div>
        <Wallet className="absolute right-6 bottom-6 text-[#5C5C59] opacity-30" size={60} />
      </div>
      <div className="bg-white p-6 rounded-2xl border border-[#F2F0E9] space-y-4">
        <input type="text" placeholder="項目" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-[#F2F0E9] rounded-lg px-4 py-3 text-sm focus:outline-none" />
        <input type="number" placeholder="金額 (EUR)" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} className="w-full bg-[#F2F0E9] rounded-lg px-4 py-3 text-sm focus:outline-none" />
        <button onClick={handleAdd} className="w-full bg-[#44403C] text-white py-3 rounded-xl flex items-center justify-center gap-2"><Plus size={16} /> 記一筆</button>
      </div>
      <div className="space-y-3">
        {expenses.map(ex => (
          <div key={ex.id} className="bg-white p-4 rounded-xl border border-[#F2F0E9] flex justify-between items-center">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#D3C4BE] flex items-center justify-center text-xs">R</div>
            <div><div className="text-[#44403C] font-medium text-sm">{ex.item}</div><div className="text-[10px] text-[#8C8881]">€ {ex.amount}</div></div></div>
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
          <div ref={scrollRef} className="flex overflow-x-auto gap-6 px-6 pb-2 scrollbar-hide items-center">
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
                <div className="space-y-4">{currentDayData.items.map((item, idx) => <ItineraryCard key={idx} item={item} />)}</div>
                <div className="mt-8 p-4 bg-[#EFECE6] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2"><MapIcon size={18} /><span className="text-sm font-serif">當日地圖指引</span></div>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentDayData.title)}`} target="_blank" rel="noreferrer" className="text-xs bg-[#44403C] text-white px-4 py-2 rounded-full flex items-center gap-1">開啟 Maps <ArrowRight size={12} /></a>
                </div>
              </div>
            </div>
          )}
          {view === 'budget' && <BudgetView />}
          {view === 'info' && (
            <div className="p-8 space-y-10 animate-fade-in">
              <div className="bg-[#EFECE6] h-44 rounded-2xl flex items-center justify-center border border-[#E5E3DB]"><Globe size={40} className="text-[#A65D57] opacity-20" /></div>
              <section className="space-y-4">
                <h3 className="font-serif border-b pb-2 flex items-center gap-2 text-lg"><Phone size={18} /> 重要聯絡資訊</h3>
                <div className="bg-[#F2F0E9] p-4 rounded-xl flex justify-between items-center"><span className="font-serif">領隊 邵十立 先生</span><a href="tel:0933991954" className="text-[#A65D57] font-bold">0933-991-954</a></div>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex justify-between items-center"><span className="font-serif text-sm">外交部緊急助救</span><ShieldAlert size={18} className="text-rose-400" /></div>
              </section>
              <section className="space-y-4">
                <h3 className="font-serif border-b pb-2 flex items-center gap-2 text-lg"><ChevronRight size={18} /> 住宿概覽</h3>
                <div className="text-sm text-[#8C8881] space-y-3">
                  <p className="flex justify-between"><span>Salzburg: Mercure City</span><ChevronRight size={14} /></p>
                  <p className="flex justify-between"><span>Prague: Art Nouveau</span><ChevronRight size={14} /></p>
                  <p className="flex justify-between"><span>Vienna: Andaz Belvedere</span><ChevronRight size={14} /></p>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
