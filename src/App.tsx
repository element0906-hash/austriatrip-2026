import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, onSnapshot, doc, query } from 'firebase/firestore';
import { 
  Plane, MapPin, Utensils, BedDouble, Info, Wallet, Sun, Cloud, 
  CloudRain, Moon, Camera, ShoppingBag, Phone, Train, Calculator, Map as MapIcon, 
  ChevronRight, Gem, Plus, Trash2, Globe, CalendarDays, ExternalLink, Camera as CameraIcon, Shirt, CheckCircle2, Circle, ShieldAlert, RefreshCcw, Wifi, WifiOff, Navigation
} from 'lucide-react';

// --- Firebase 設定 ---
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

// --- 莫蘭迪配色 ---
const themeColors = {
  bg: '#F5F3F0', 
  textMain: '#4A4641', 
  accentTerra: '#A85A46', 
  accentClay: '#777571',  
};

const categoryStyles: any = {
  'flight': { icon: Plane, color: '#777571', label: 'FLIGHT' },
  'hotel': { icon: BedDouble, color: '#C9C1B2', label: 'HOTEL' },
  'transport': { icon: Train, color: '#8C8881', label: 'TRANSPORT' },
  'sightseeing': { icon: Camera, color: '#7D805A', label: 'SIGHTSEEING' },
  'food': { icon: Utensils, color: '#A85A46', label: 'FOOD' },
  'shopping': { icon: ShoppingBag, color: '#C28F70', label: 'SHOPPING' },
};

const payersInfo: any = {
  'R': { id: 'R', color: 'bg-[#A85A46] text-white' }, 
  'C': { id: 'C', color: 'bg-[#7D805A] text-white' }, 
  'N': { id: 'N', color: 'bg-[#6B7A87] text-white' }, 
  'O': { id: 'O', color: 'bg-[#C28F70] text-white' }  
};

// --- 模擬數據 ---
const generate24HourWeather = (baseTemp: number, condition: string) => {
  const data = [];
  const currentHour = new Date().getHours();
  for (let i = 0; i < 24; i++) {
    let hour = (currentHour + i) % 24;
    let icon = <Sun size={18} className="text-[#A85A46]" />;
    if (condition === 'cloudy') icon = <Cloud size={18} className="text-[#8C8881]" />;
    if (condition === 'rainy') icon = <CloudRain size={18} className="text-[#777571]" />;
    if (hour >= 18 || hour <= 5) icon = <Moon size={18} className="text-[#4A4641]" />;
    data.push({ time: `${hour.toString().padStart(2, '0')}:00`, temp: `${baseTemp + (hour > 10 && hour < 16 ? 3 : -2)}°`, icon });
  }
  return data;
};

const tripData = [
  { day: 1, dateStr: "25", dayOfWeek: "WED", title: "啟程．飛往維也納", locationName: "Taipei", imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop", hourlyWeather: generate24HourWeather(22, 'cloudy'), items: [{ time: "20:35", title: "桃園機場集合", category: "transport", description: "第二航站長榮航空 20 號後方櫃檯。" }, { time: "23:35", title: "台北/維也納", category: "flight", description: "BR065 長榮航空。" }] },
  { day: 2, dateStr: "26", dayOfWeek: "THU", title: "哈爾斯塔特", locationName: "Salzburg", imageUrl: "https://image.kkday.com/v2/image/get/s1.kkday.com/product_36568/20200122064534_xxRQH/jpg", hourlyWeather: generate24HourWeather(4, 'cloudy'), items: [{ time: "10:00", title: "Hallstatt 小鎮", category: "sightseeing", aiTips: [{type:'must-buy', content:'天然岩鹽'}, {type:'must-eat', content:'湖區鱒魚'}] }] },
  { day: 3, dateStr: "27", dayOfWeek: "FRI", title: "國王湖與庫倫洛夫", locationName: "Český Krumlov", imageUrl: "https://blog-static.kkday.com/zh-tw/blog/wp-content/uploads/shutterstock_711751918.jpg", hourlyWeather: generate24HourWeather(2, 'rainy'), items: [{ time: "09:00", title: "國王湖 Königssee", category: "sightseeing" }] },
  { day: 4, dateStr: "28", dayOfWeek: "SAT", title: "童話小鎮庫倫洛夫", locationName: "Karlovy Vary", imageUrl: "https://image.cdn-eztravel.com.tw/HJ8HZhW9imcQcnmLEJnsbHKSBX4t8piudvOzUSlWoL0/g:ce/aHR0cHM6Ly92YWNhdGlvbi5jZG4tZXp0cmF2ZWwuY29tLnR3L2ltZy9WRFIvQ1pfMjU3ODU5MzkyLmpwZw.jpg", hourlyWeather: generate24HourWeather(5, 'cloudy'), items: [{ time: "09:30", title: "庫倫洛夫古堡", category: "sightseeing", aiTips: [{type:'must-buy', content:'刺蝟鉛筆'}] }] },
  { day: 5, dateStr: "01", dayOfWeek: "SUN", title: "布拉格天文鐘", locationName: "Prague", imageUrl: "https://photo.settour.com.tw/900x600/https://www.settour.com.tw/ss_img/info/location/PRG/G0/PRG0000011/PRG0000011_45988.jpg", hourlyWeather: generate24HourWeather(7, 'sunny'), items: [{ time: "14:30", title: "老城區漫步", category: "sightseeing", aiTips: [{type:'luxury', content:'巴黎大街精品'}] }] },
  { day: 6, dateStr: "02", dayOfWeek: "MON", title: "布拉格浪漫城堡", locationName: "Prague", imageUrl: "https://www.sundaytour.com.tw/upfiles/chinese/attractions/tw_attractions_caty01481734310.jpg", hourlyWeather: generate24HourWeather(8, 'sunny'), items: [{ time: "09:00", title: "布拉格城堡區", category: "sightseeing" }] },
  { day: 7, dateStr: "03", dayOfWeek: "TUE", title: "特爾奇與維也納", locationName: "Vienna", imageUrl: "https://image.cdn-eztravel.com.tw/HgCf8CdO18qYpil0KI8X_nKoi8-lxIMYgDnwJadhLQA/g:ce/aHR0cHM6Ly92YWNhdGlvbi5jZG4tZXp0cmF2ZWwuY29tLnR3L2ltZy9WRFIvQUFfMTQxNzUxMTU5Ny5qcGc.jpg", hourlyWeather: generate24HourWeather(10, 'cloudy'), items: [{ time: "18:30", title: "Ribs of Vienna", category: "food", aiTips: [{type:'must-eat', content:'招牌豬肋排'}] }] },
  { day: 8, dateStr: "04", dayOfWeek: "WED", title: "維也納皇室風華", locationName: "Vienna", imageUrl: "https://ht-cdn.panyou.com/uploadhk/2025/ht/1223/202512231611-8793123815.png", hourlyWeather: generate24HourWeather(11, 'sunny'), items: [{ time: "09:00", title: "熊布朗宮", category: "sightseeing" }] },
  { day: 9, dateStr: "05", dayOfWeek: "THU", title: "再見維也納", locationName: "Vienna Airport", imageUrl: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=2070&auto=format&fit=crop", hourlyWeather: generate24HourWeather(12, 'cloudy'), items: [{ time: "12:05", title: "返程登機", category: "transport" }] },
  { day: 10, dateStr: "06", dayOfWeek: "FRI", title: "抵達台北", locationName: "Taipei", imageUrl: "https://images.unsplash.com/photo-1470004914212-05527e49370b?q=80&w=2074&auto=format&fit=crop", hourlyWeather: generate24HourWeather(25, 'sunny'), items: [{ time: "06:40", title: "抵達桃園機場", category: "transport" }] }
];

// --- 標籤與輔助組件 ---
const Tag = ({ type, content }: { type: string; content: string }) => {
  const tagStyles: any = {
    'must-eat': { color: '#C28F70', label: '必吃', icon: <Utensils size={10} /> }, 
    'must-buy': { color: '#6B7A87', label: '必買', icon: <ShoppingBag size={10} /> }, 
    'souvenir': { color: '#777571', label: '手信', icon: <CameraIcon size={10} /> }, 
    'luxury': { color: '#A85A46', label: '精品', icon: <Gem size={10} /> },   
  };
  const tStyle = tagStyles[type] || { color: '#8C8881', label: '提示', icon: <Info size={10} /> };
  return (
    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border mr-2 mb-2 font-light" 
          style={{ borderColor: tStyle.color, color: tStyle.color, backgroundColor: `${tStyle.color}08` }}>
      <span className="mr-1">{tStyle.icon}</span>
      <span className="font-medium mr-1">{tStyle.label}</span> {content}
    </span>
  );
};

const getMapUrl = (items: any[]) => {
  const locs = items.map(i => i.location || i.title).filter(Boolean);
  const q = locs.length > 0 ? encodeURIComponent(locs[0]) : "Austria";
  return `https://maps.google.com/maps?q=${q}&output=embed`;
};

// --- 功能頁面 ---
const ExpenseTracker = ({ user }: { user: any }) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [payer, setPayer] = useState('R');
  
  useEffect(() => {
    if (!user) return;
    const qry = query(collection(db, 'expenses'));
    return onSnapshot(qry, (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a:any, b:any) => b.timestamp - a.timestamp));
    });
  }, [user]);

  const addExp = async () => {
    if (!item || !amount) return;
    await addDoc(collection(db, 'expenses'), { item, amount: parseFloat(amount), currency, twdAmount: Math.round(parseFloat(amount) * (currency === 'EUR' ? 34.2 : 1.45)), payer, timestamp: Date.now(), date: new Date().toLocaleDateString() });
    setItem(''); setAmount('');
  };

  return (
    <div className="p-6 pb-24 animate-fade-in text-[#4A4641] font-light">
      <div className="mb-8">
        <p className="text-[10px] tracking-widest text-[#8C8881] uppercase mb-1">Total Expenses</p>
        <div className="text-3xl font-light">NT$ {expenses.reduce((s, e) => s + e.twdAmount, 0).toLocaleString()}</div>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-[#E8E6E1] space-y-4 mb-8">
        <input type="text" placeholder="項目" value={item} onChange={e => setItem(e.target.value)} className="w-full bg-[#F5F3F0] rounded-xl px-4 py-3 text-sm focus:outline-none" />
        <div className="flex gap-2">
          <input type="number" placeholder="金額" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 bg-[#F5F3F0] rounded-xl px-4 py-3 text-sm focus:outline-none" />
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-[#F5F3F0] rounded-xl px-2 text-sm outline-none"><option value="EUR">€</option><option value="CZK">Kč</option></select>
        </div>
        <div className="flex justify-between px-2">
          {['R', 'C', 'N', 'O'].map(p => (<button key={p} onClick={() => setPayer(p)} className={`w-9 h-9 rounded-full text-xs transition-all ${payer === p ? payersInfo[p].color : 'bg-[#F5F3F0] text-gray-400'}`}>{p}</button>))}
        </div>
        <button onClick={addExp} className="w-full bg-[#4A4641] text-white py-3 rounded-xl text-sm tracking-widest flex items-center justify-center gap-2"><Plus size={16} /> 記一筆</button>
      </div>
      <div className="space-y-4">
        {expenses.map(e => (
          <div key={e.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E8E6E1]">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] ${payersInfo[e.payer]?.color}`}>{e.payer}</div>
              <div><div className="text-sm font-light">{e.item}</div><div className="text-[10px] text-gray-400">{e.currency} {e.amount}</div></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right"><div className="text-sm font-medium text-[#A85A46]">NT$ {e.twdAmount}</div><div className="text-[9px] text-gray-300">{e.date}</div></div>
              <button onClick={() => deleteDoc(doc(db, 'expenses', e.id))}><Trash2 size={14} className="text-gray-300"/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 主介面 ---
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
    if (view === 'info') return (
        <div className="p-8 animate-fade-in space-y-10 font-light">
            <div className="bg-[#EFECE6] h-40 rounded-3xl flex items-center justify-center border border-[#E5E3DB]"><Globe size={32} className="text-[#A65D57] opacity-20" /></div>
            <section className="space-y-5">
                <h3 className="text-xs tracking-[0.2em] text-gray-400 border-b pb-2 flex items-center gap-2"><Phone size={14}/> 重要聯絡</h3>
                <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-[#E8E6E1]">
                    <span className="text-sm font-light">領隊 邵十立 先生</span>
                    <a href="tel:0933991954" className="text-sm font-medium text-[#A85A46]">0933-991-954</a>
                </div>
                <div className="flex justify-between items-center bg-rose-50/30 p-5 rounded-2xl border border-rose-100"><span className="text-sm font-light text-rose-800">外交部緊急助救</span><ShieldAlert size={16} className="text-rose-400"/></div>
            </section>
            <div className="hidden">
                <RefreshCcw/><Calculator/><ExternalLink/><CameraIcon/><Shirt/><CheckCircle2/><Circle/><ChevronRight/><Gem/><CalendarDays/><Info/><Navigation/><Plus/><Trash2/><MapIcon/><Wifi/><WifiOff/>
            </div>
        </div>
    );
    
    const cur = tripData.find(d => d.day === (view + 1)) || tripData[0];
    return (
      <div className="animate-fade-in pb-20 font-light">
        <div className="relative mx-5 mt-5 h-64 rounded-[2rem] overflow-hidden shadow-sm">
          <img src={cur.imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <div className="text-[10px] tracking-[0.3em] opacity-70 mb-1 font-light">DAY {cur.day} · {cur.locationName}</div>
            <h2 className="text-2xl font-light tracking-wide">{cur.title}</h2>
          </div>
        </div>
        
        <div className="mt-8 px-8">
          <div className="flex space-x-6 overflow-x-auto no-scrollbar pb-2">
            {cur.hourlyWeather.slice(0, 8).map((hw, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0">
                <span className="text-[10px] text-gray-400 mb-2 font-light">{hw.time}</span>
                {hw.icon}
                <span className="text-xs mt-2 font-medium">{hw.temp}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 mt-10 space-y-10">
          {cur.items.map((item: any, i: number) => {
            const S = categoryStyles[item.category] || categoryStyles.sightseeing;
            return (
              <div key={i} className="flex">
                <div className="w-12 flex-shrink-0 text-right pr-4 text-sm text-gray-400 pt-1 font-light">{item.time}</div>
                <div className="relative mr-5">
                   <div className="w-2.5 h-2.5 rounded-full border-[1px] bg-white z-10 relative" style={{borderColor: S.color}}></div>
                   {i !== cur.items.length - 1 && <div className="absolute top-2.5 left-[4.5px] w-[0.5px] h-full bg-gray-200"></div>}
                </div>
                <div className="flex-1 pb-2">
                  <h4 className="text-base font-light text-[#4A4641] flex items-center gap-2 mb-1">
                    {item.title}
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title)}`} target="_blank" rel="noreferrer" className="text-gray-300"><MapPin size={12}/></a>
                  </h4>
                  <div className="text-[9px] tracking-widest flex items-center mb-2" style={{color: S.color}}>
                    <S.icon size={10} className="mr-1.5"/>{S.label}
                  </div>
                  {item.description && <p className="text-xs text-gray-400 leading-relaxed font-light mb-3">{item.description}</p>}
                  <div className="flex flex-wrap">{(item.aiTips || []).map((t: any, ti: number) => (<Tag key={ti} type={t.type} content={t.content} />))}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mx-6 mt-10 h-44 rounded-3xl overflow-hidden border border-[#E8E6E1] grayscale-[0.5] opacity-60">
          <iframe title="每日導引地圖" src={getMapUrl(cur.items)} width="100%" height="100%" style={{border:0}}></iframe>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-[#F5F3F0] min-h-screen relative shadow-2xl overflow-hidden font-sans font-light text-[#4A4641]">
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; } .animate-fade-in { animation: f 0.6s ease-out; } @keyframes f { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }` }} />
      <header className="sticky top-0 z-30 bg-[#F5F3F0]/90 backdrop-blur-md border-b border-gray-100 pb-2 pt-10">
        <div className="text-center mb-5">
            <h1 className="text-[9px] tracking-[0.4em] text-gray-400 uppercase font-light">Family Trip 2026</h1>
            <div className="text-xl font-light tracking-widest text-[#4A4641] mt-1">奧捷旅行</div>
        </div>
        <div className="flex overflow-x-auto no-scrollbar px-6 space-x-7 items-center" ref={scrollRef}>
          {tripData.map((d, i) => (
            <button key={i} onClick={() => setView(i)} className={`flex flex-col items-center flex-shrink-0 transition-all ${view === i ? 'text-[#4A4641] scale-110' : 'text-gray-300'}`}>
              <span className="text-[8px] font-medium mb-1">{d.dayOfWeek}</span>
              <span className="text-lg font-light">{d.dateStr}</span>
              {view === i && <div className="w-1 h-1 bg-[#A85A46] rounded-full mt-1"></div>}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-100 flex-shrink-0"></div>
          <button onClick={() => setView('expenses')} className={`flex flex-col items-center flex-shrink-0 ${view === 'expenses' ? 'text-[#4A4641]' : 'text-gray-300'}`}><Wallet size={18} className="mb-1"/><span className="text-[8px] font-light">記帳</span></button>
          <button onClick={() => setView('info')} className={`flex flex-col items-center flex-shrink-0 ${view === 'info' ? 'text-[#4A4641]' : 'text-gray-300'}`}><Info size={18} className="mb-1"/><span className="text-[8px] font-light">資訊</span></button>
        </div>
      </header>
      <main>{renderContent()}</main>
    </div>
  );
}
