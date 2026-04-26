import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { Search, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import BarcodeDisplay from '../../components/BarcodeDisplay';

const BooksCatalog = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [issuing, setIssuing] = useState(null);

  const fetchBooks = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/books';
      const params = [];
      if (search) params.push(`search=${search}`);
      if (category) params.push(`category=${category}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await api.get(url, { signal });
      if (Array.isArray(res.data)) {
        setBooks(res.data);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') return;
      console.error(err);
      setError('Could not load books from the server.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    
    const delayDebounceFn = setTimeout(() => {
      fetchBooks(abortController.signal);
    }, 400);

    return () => {
      clearTimeout(delayDebounceFn);
      abortController.abort();
    };
  }, [search, category]);

  const [reservingBook, setReservingBook] = useState(null);
  const [resDate, setResDate] = useState('');

  const handleIssue = async (bookId) => {
    setIssuing(bookId);
    try {
      const res = await api.post('/issues/issue', { book_id: bookId });
      alert(`Success: ${res.data.message}. Due date: ${new Date(res.data.returnDate).toLocaleDateString()}`);
      fetchBooks(); // refresh list
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || 'Failed to issue book'}`);
    } finally {
      setIssuing(null);
    }
  };

  const handleReserve = async (bookId) => {
    setIssuing(bookId); // reuse loading state
    try {
      const res = await api.post('/reservations/reserve', { book_id: bookId });
      alert(res.data.message);
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || 'Failed to reserve'}`);
    } finally {
      setIssuing(null);
    }
  };

  const categories = ['All', 'Fiction', 'Computer Science', 'Mathematics', 'Science', 'History'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Library Catalog</h1>
          <p className="text-textSubtle">Search and borrow books directly from the digital catalog.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSubtle" size={18} />
            <input 
              type="text" 
              placeholder="Search title, author..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full sm:w-64"
            />
          </div>
          
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value === 'All' ? '' : e.target.value)}
            className="input-field bg-black/40 sm:w-48"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="py-20 flex flex-col items-center justify-center text-red-400">
           <XCircle size={48} className="mb-4 text-red-500 opacity-80" />
           <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-textSubtle">Loading catalog...</div>
      ) : !Array.isArray(books) || books.length === 0 ? (
        <div className="py-20 text-center text-textSubtle">No books found matching your criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {books.map((book) => (
            <motion.div 
              key={book.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="glass-card flex flex-col justify-between overflow-hidden relative group"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/20">
                    {book.category}
                  </span>
                  {book.available_quantity > 0 ? (
                    <span className="flex items-center text-secondary text-xs font-medium bg-secondary/10 px-2 py-1 rounded-full">
                      <CheckCircle size={14} className="mr-1" /> Available
                    </span>
                  ) : (
                    <span className="flex items-center text-red-400 text-xs font-medium bg-red-400/10 px-2 py-1 rounded-full">
                      <XCircle size={14} className="mr-1" /> Checked Out
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">{book.title}</h3>
                <p className="text-textSubtle text-sm mb-4">by {book.author}</p>
                
                {book.barcode && (
                  <div className="mb-4">
                    <BarcodeDisplay 
                      value={book.barcode} 
                      width={1.2} 
                      height={30} 
                      showText={true} 
                      label={book.title}
                    />
                  </div>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-textSubtle">
                    <MapPin size={16} className="mr-2 text-accent" />
                    <span>{book.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-textSubtle border-t border-white/5 pt-3 mt-3">
                    <span>Copies: {book.available_quantity} / {book.total_quantity}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-black/20 border-t border-white/5 space-y-3">
                {book.available_quantity > 0 ? (
                  <button 
                    onClick={() => handleIssue(book.id)}
                    disabled={issuing === book.id}
                    className="w-full py-2.5 rounded-xl font-medium transition-all bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                  >
                    {issuing === book.id ? 'Processing...' : 'Issue Book Now'}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleReserve(book.id)}
                    disabled={issuing === book.id}
                    className="w-full py-2.5 rounded-xl font-medium transition-all bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20"
                  >
                    {issuing === book.id ? 'Reserving...' : 'Reserve (No Copies Left)'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BooksCatalog;
