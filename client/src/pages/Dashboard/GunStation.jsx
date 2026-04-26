import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/axios';
import { 
  Barcode, 
  Book, 
  CheckCircle, 
  AlertTriangle, 
  History, 
  Trash2, 
  RefreshCw,
  Zap,
  ArrowRight,
  Keyboard,
  Library,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Filter,
  MapPin,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GunStation = () => {
  // --- States ---
  const [scannedItems, setScannedItems] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const [identifiedBook, setIdentifiedBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { status: 'success'|'error', message: '', details: '' }
  const [isCapturing, setIsCapturing] = useState(true);

  // --- Simulation Hub States ---
  const [realBooks, setRealBooks] = useState([]);
  const [hubSearch, setHubSearch] = useState('');
  const [hubCategory, setHubCategory] = useState('');
  const [fetchingHub, setFetchingHub] = useState(false);

  // --- Gun Logic (Global Keyboard Listener) ---
  const buffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  // --- Data Fetching ---
  const fetchRealBooks = useCallback(async () => {
    setFetchingHub(true);
    try {
      const params = {};
      if (hubSearch) params.search = hubSearch;
      if (hubCategory) params.category = hubCategory;
      const res = await api.get('/books', { params });
      setRealBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch hub books", err);
    } finally {
      setFetchingHub(false);
    }
  }, [hubSearch, hubCategory]);

  useEffect(() => {
    const timer = setTimeout(fetchRealBooks, 300);
    return () => clearTimeout(timer);
  }, [fetchRealBooks]);

  const identifyBook = useCallback(async (code) => {
    if (!code || loading || actionLoading) return;
    
    setLoading(true);
    setFeedback(null);
    setIdentifiedBook(null);

    const barcode = code.startsWith('BK-') ? code : `BK-${code}`;

    try {
      const res = await api.get(`/books/barcode/${barcode}`);
      setIdentifiedBook(res.data);
      setManualInput(''); // Clear input if it was manual
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || "Book not found. Please check the barcode." });
    } finally {
      setLoading(false);
      buffer.current = '';
    }
  }, [loading, actionLoading]);

  const handleAction = async (actionType) => {
    if (!identifiedBook || actionLoading) return;
    
    setActionLoading(true);
    setFeedback(null);

    try {
      const endpoint = actionType === 'ISSUE' ? '/issues/barcode-issue' : '/issues/barcode-return';
      const res = await api.post(endpoint, { barcode: identifiedBook.barcode });
      
      let details = res.data.details || "";
      if (actionType === 'ISSUE' && res.data.returnDate) {
         const d = new Date(res.data.returnDate).toLocaleDateString(undefined, { dateStyle: 'long'});
         details = `Return Deadline: ${d}`;
      }

      const newItem = {
        id: Date.now(),
        barcode: identifiedBook.barcode,
        title: identifiedBook.title,
        type: actionType,
        time: new Date().toLocaleTimeString(),
        status: 'success',
        message: res.data.message,
        details: details
      };

      setScannedItems(prev => [newItem, ...prev]);
      setFeedback({ 
        type: 'success', 
        message: res.data.message, 
        details: details
      });
      setIdentifiedBook(null); // Reset for next scan
      fetchRealBooks(); // Refresh availability in hub
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || "Transaction failed." });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture when typing in the hub search or manual input fields
      if (e.target.tagName === 'INPUT') return;
      if (!isCapturing || identifiedBook) return;

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime.current;
      lastKeyTime.current = currentTime;

      if (e.key === 'Enter') {
        if (buffer.current.length > 2) {
          identifyBook(buffer.current);
        }
        buffer.current = '';
      } else if (e.key.length === 1) {
        buffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCapturing, identifiedBook, identifyBook]);

  return (
    <div className="min-h-[85vh] flex flex-col gap-10 p-4 md:p-10 max-w-7xl mx-auto w-full">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
        <div>
          <div className="flex items-center gap-5 mb-3">
             <div className="p-4 bg-primary/20 rounded-3xl shadow-[0_0_40px_rgba(79,70,229,0.1)]">
               <Barcode className="text-primary w-10 h-10" />
             </div>
             <div>
                <h1 className="text-5xl font-black tracking-tight uppercase italic leading-none">
                  Hardware <span className="text-primary">GunStation</span>
                </h1>
                <p className="text-textSubtle font-bold tracking-[0.2em] uppercase text-[10px] mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Scanner Synced & Ready
                </p>
             </div>
          </div>
        </div>

        <div className="flex gap-4">
           <button 
             onClick={() => { setFeedback(null); setIdentifiedBook(null); setScannedItems([]); }}
             className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all font-black text-[10px] tracking-widest uppercase flex items-center gap-3 backdrop-blur-xl"
           >
             <Trash2 size={16} /> Clear Session
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* 2. Main Terminal Shell */}
        <div className="lg:col-span-8 space-y-12">
          
          <div className="glass-card p-12 relative overflow-hidden flex flex-col items-center justify-center min-h-[500px] border-primary/20 bg-primary/5 shadow-2xl">
            <div className={`absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none transition-opacity duration-1000 ${identifiedBook ? 'opacity-100' : 'opacity-30'}`} />
             
             <AnimatePresence mode="wait">
               {loading ? (
                 <motion.div 
                   key="loading"
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="flex flex-col items-center gap-8"
                 >
                   <RefreshCw className="w-20 h-20 text-primary animate-spin" />
                   <p className="text-primary font-black tracking-[0.6em] uppercase text-[11px] animate-pulse">Querying Barcode ID...</p>
                 </motion.div>
               ) : identifiedBook ? (
                 <motion.div 
                   key="identified"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex flex-col items-center text-center gap-10 w-full max-w-2xl"
                 >
                   <div className="relative group">
                     <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full group-hover:bg-primary/30 transition-all duration-1000" />
                     <Book className="w-24 h-24 text-white relative z-10" />
                   </div>
                   
                   <div className="space-y-4 relative z-10">
                     <p className="text-primary font-black tracking-[0.6em] uppercase text-[10px]">Target Identified</p>
                     <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none">{identifiedBook.title}</h2>
                     <p className="text-textSubtle text-xl font-bold italic">by {identifiedBook.author} — <span className="text-primary">{identifiedBook.barcode}</span></p>
                   </div>

                   <div className="grid grid-cols-2 gap-6 w-full relative z-10">
                      <button 
                        onClick={() => handleAction('ISSUE')}
                        disabled={actionLoading}
                        className="py-10 rounded-[2.5rem] bg-primary text-white font-black uppercase text-xs tracking-[0.3em] flex flex-col items-center gap-4 hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-primary/30 disabled:opacity-50"
                      >
                         <ArrowDownCircle size={32} /> Confirm Issue
                      </button>
                      <button 
                        onClick={() => handleAction('RETURN')}
                        disabled={actionLoading}
                        className="py-10 rounded-[2.5rem] bg-secondary text-white font-black uppercase text-xs tracking-[0.3em] flex flex-col items-center gap-4 hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-secondary/30 disabled:opacity-50"
                      >
                         <ArrowUpCircle size={32} /> Confirm Return
                      </button>
                   </div>
                   <button onClick={() => setIdentifiedBook(null)} className="text-textSubtle text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors">Abort & Skip</button>
                 </motion.div>
               ) : (
                 <motion.div 
                   key="idle"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="flex flex-col items-center text-center gap-10"
                 >
                   <div className="relative">
                      <Zap className="w-32 h-32 text-primary/10" />
                      <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                         <Barcode className="w-16 h-16 text-primary/50" />
                      </div>
                   </div>
                   <div className="space-y-6">
                     <p className="text-white/20 font-black tracking-[0.8em] uppercase text-[10px]">Waiting for Signal</p>
                     <h2 className="text-4xl font-black text-white/40 uppercase tracking-tighter leading-none italic max-w-lg">
                       Please fire the barcode gun <br /> 
                       Or type manually below
                     </h2>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>

             {/* Inline Feedback Overlay */}
             <AnimatePresence>
               {feedback && (
                 <motion.div 
                   initial={{ opacity: 0, y: 50 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className={`absolute bottom-10 left-10 right-10 p-8 rounded-3xl flex flex-col gap-2 border shadow-2xl z-50 backdrop-blur-3xl ${
                     feedback.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                   }`}
                 >
                   <div className="flex items-center gap-4">
                      {feedback.type === 'success' ? <CheckCircle className="shrink-0" /> : <AlertTriangle className="shrink-0" />}
                      <span className="font-black text-sm tracking-[0.1em] uppercase">{feedback.message}</span>
                      <button onClick={() => setFeedback(null)} className="ml-auto opacity-40 hover:opacity-100"><Trash2 size={16} /></button>
                   </div>
                   {feedback.details && (
                     <div className="flex items-center gap-2 mt-2 ml-10">
                        <CalendarDays size={14} className="opacity-60" />
                        <p className="text-[11px] font-bold text-white tracking-widest uppercase">{feedback.details}</p>
                     </div>
                   )}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* 3. Footer: Manual Input Terminal */}
          <div className="glass-card p-6 border-white/5 bg-white/2">
             <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="p-4 bg-white/5 rounded-2xl">
                   <Keyboard className="text-white/20" size={24} />
                </div>
                <div className="flex-1 w-full">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 ml-4">Manual Barcode Input Override</p>
                   <input 
                      type="text" 
                      placeholder="ENTER BOOK BARCODE (E.G. BK-1102)..."
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && identifyBook(manualInput)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-white font-black tracking-widest text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-white/10 shadow-inner"
                   />
                </div>
                <button 
                   onClick={() => identifyBook(manualInput)}
                   disabled={!manualInput || loading}
                   className="px-10 py-5 rounded-2xl bg-white text-black font-black uppercase text-[11px] tracking-widest hover:bg-gray-100 transition-all disabled:opacity-10 shadow-xl"
                >
                   Identify
                </button>
             </div>
          </div>
        </div>

        {/* 4. Advanced Simulation Hub */}
        <div className="lg:col-span-4 space-y-8 h-[calc(100vh-160px)] flex flex-col">
           <div className="glass-card p-8 border-primary/20 bg-primary/5 flex-1 flex flex-col overflow-hidden">
              <h3 className="text-primary font-black uppercase tracking-[0.2em] text-xs flex items-center gap-3 mb-6 shrink-0">
                 <Zap size={16} /> Advanced Virtual Hub
              </h3>
              
              {/* Search & Stats */}
              <div className="space-y-4 mb-8 shrink-0">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input 
                       type="text"
                       placeholder="SEARCH CATALOG..."
                       value={hubSearch}
                       onChange={(e) => setHubSearch(e.target.value)}
                       className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-black tracking-widest text-[10px] focus:ring-2 focus:ring-primary outline-none"
                    />
                 </div>
                 <div className="flex gap-2">
                    <Filter className="text-white/20 mt-3" size={14} />
                    <select 
                       value={hubCategory}
                       onChange={(e) => setHubCategory(e.target.value)}
                       className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white/60 font-black tracking-widest text-[9px] outline-none"
                    >
                       <option value="">ALL CATEGORIES</option>
                       <option value="Fiction">FICTION</option>
                       <option value="Computer Science">COMPUTER SCIENCE</option>
                       <option value="Mathematics">MATHEMATICS</option>
                       <option value="Science">SCIENCE</option>
                       <option value="History">HISTORY</option>
                    </select>
                 </div>
                 <div className="h-[1px] bg-white/5 my-2" />
                 <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Found {realBooks.length} Real records</p>
              </div>

              {/* Real Book List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                 {fetchingHub ? (
                   <div className="flex items-center justify-center h-40">
                      <RefreshCw className="text-primary animate-spin" />
                   </div>
                 ) : realBooks.length === 0 ? (
                   <div className="text-center py-20 text-white/5 font-black uppercase tracking-[0.5em] text-[10px]">No records match search</div>
                 ) : (
                    realBooks.map((book) => (
                      <button 
                        key={book.id}
                        onClick={() => identifyBook(book.barcode)}
                        className="w-full p-4 rounded-2xl bg-white/2 border border-white/5 text-left group hover:bg-white/5 transition-all relative overflow-hidden active:scale-95"
                      >
                         <div className={`absolute top-0 right-0 w-1 h-full ${book.available_quantity > 0 ? 'bg-green-500/30' : 'bg-red-500/30'}`} />
                         
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-black uppercase tracking-tight text-[11px] leading-tight group-hover:text-primary transition-colors max-w-[80%] line-clamp-2">{book.title}</h4>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${book.available_quantity > 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                               {book.available_quantity > 0 ? 'AVAIL' : 'OUT'}
                            </span>
                         </div>
                         
                         <p className="text-textSubtle text-[9px] font-bold mb-3 italic opacity-60">by {book.author}</p>
                         
                         <div className="grid grid-cols-1 gap-2 border-t border-white/5 pt-3">
                            <div className="flex items-center gap-2 text-white/30">
                               <Barcode size={10} />
                               <span className="text-[9px] font-black tracking-widest uppercase">{book.barcode}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/30">
                               <MapPin size={10} />
                               <span className="text-[9px] font-bold uppercase tracking-tight truncate">{book.location}</span>
                            </div>
                         </div>
                      </button>
                    ))
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* 5. Session Logs */}
      <div className="space-y-8 pt-8 border-t border-white/5 mb-20">
        <div className="flex items-center gap-4">
          <History className="text-primary w-6 h-6" />
          <h2 className="text-2xl font-black uppercase tracking-tight italic text-white/80">Active Session Logs</h2>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence initial={false}>
            {scannedItems.length === 0 ? (
              <div className="col-span-full py-20 text-center text-white/5 font-black uppercase tracking-[0.5em] text-xs">Awaiting transactions for this session</div>
            ) : (
              scannedItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6 border-white/10 flex items-center justify-between hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-5">
                     <div className={`p-4 rounded-2xl ${item.type === 'RETURN' ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                       {item.type === 'RETURN' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                     </div>
                     <div className="overflow-hidden">
                        <div className="flex items-center gap-3 mb-1">
                           <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">{item.time}</span>
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${item.type === 'RETURN' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>{item.type}</span>
                        </div>
                        <h4 className="text-white font-black uppercase tracking-tight text-sm leading-tight truncate group-hover:text-primary transition-colors">{item.title}</h4>
                        <p className="text-textSubtle text-[9px] font-bold italic truncate opacity-60 mt-1">{item.details || item.barcode}</p>
                     </div>
                  </div>
                  <CheckCircle className="text-green-500/30 shrink-0 ml-4" size={20} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GunStation;
