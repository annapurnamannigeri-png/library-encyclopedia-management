import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { BookPlus, Check, X, Search, Zap, Barcode } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('requests'); // requests, add_book
  const [requests, setRequests] = useState([]);
  
  // New book state
  const [bookForm, setBookForm] = useState({
    title: '', author: '', category: 'Fiction', total_quantity: 1, floor: '', row: '', rack: ''
  });
  const [submittingBook, setSubmittingBook] = useState(false);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/requests');
      setRequests(res.data);
    } catch (error) {
      console.error("Failed to fetch requests", error);
    }
  };

  const handleFineAction = async (id, action) => {
    try {
      await api.put(`/admin/request/${id}`, { action });
      fetchRequests(); // Refresh
    } catch (error) {
      alert("Error processing request");
    }
  };

  const handeBookSubmit = async (e) => {
    e.preventDefault();
    setSubmittingBook(true);
    try {
      await api.post('/books', bookForm);
      alert('Book added to catalog successfully!');
      setBookForm({ title: '', author: '', category: 'Fiction', total_quantity: 1, floor: '', row: '', rack: '' });
    } catch (error) {
       alert("Error adding book");
    } finally {
      setSubmittingBook(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-textSubtle">Manage library catalog and fine waivers.</p>
      </div>

      <div className="flex space-x-2 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'requests' ? 'bg-primary text-white' : 'text-textSubtle hover:bg-white/5'
          }`}
        >
          Fine Waiver Requests
        </button>
        <button 
          onClick={() => setActiveTab('add_book')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'add_book' ? 'bg-primary text-white' : 'text-textSubtle hover:bg-white/5'
          }`}
        >
          Add New Book
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-2">Pending Fine Waivers</h2>
          {requests.length === 0 ? (
            <p className="text-textSubtle text-center py-6">No pending waiver requests.</p>
          ) : (
            <div className="grid gap-4">
               {requests.map(req => (
                 <div key={req.id} className="bg-black/20 border border-white/5 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div>
                     <div className="flex items-center space-x-2 mb-1">
                       <span className="font-semibold text-white">{req.user_name}</span>
                       <span className="text-sm text-textSubtle">({req.usn_or_email})</span>
                     </div>
                     <p className="text-sm text-white/80"><span className="text-textSubtle">Reason: </span>{req.reason}</p>
                     <p className="text-xs text-textSubtle mt-2">Submitted on {new Date(req.created_at).toLocaleDateString()}</p>
                   </div>
                   <div className="flex gap-2">
                     <button 
                        onClick={() => handleFineAction(req.id, 'approve')}
                        className="bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30 px-3 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                     >
                        <Check size={16} className="mr-1" /> Approve
                     </button>
                     <button 
                        onClick={() => handleFineAction(req.id, 'reject')}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                     >
                        <X size={16} className="mr-1" /> Reject
                     </button>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'add_book' && (
        <div className="glass-card p-8 max-w-2xl mx-auto">
          <div className="flex items-center mb-6 text-xl font-semibold border-b border-white/10 pb-4">
            <BookPlus className="mr-2 text-primary" /> Add Book to Catalog
          </div>
          <form onSubmit={handeBookSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-textSubtle mb-1">Book Title</label>
                <input required type="text" className="input-field" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSubtle mb-1">Author</label>
                <input required type="text" className="input-field" value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSubtle mb-1">Category</label>
                <select className="input-field bg-black/40" value={bookForm.category} onChange={e => setBookForm({...bookForm, category: e.target.value})}>
                  <option>Fiction</option>
                  <option>Computer Science</option>
                  <option>Mathematics</option>
                  <option>Science</option>
                  <option>History</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-textSubtle mb-1">Total Copies</label>
                <input required type="number" min="1" className="input-field" value={bookForm.total_quantity} onChange={e => setBookForm({...bookForm, total_quantity: parseInt(e.target.value)})} />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold mb-3 text-textSubtle">Location Metadata</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                   <input placeholder="Floor" className="input-field" value={bookForm.floor} onChange={e => setBookForm({...bookForm, floor: e.target.value})} />
                </div>
                <div>
                   <input placeholder="Row" className="input-field" value={bookForm.row} onChange={e => setBookForm({...bookForm, row: e.target.value})} />
                </div>
                <div>
                   <input placeholder="Rack" className="input-field" value={bookForm.rack} onChange={e => setBookForm({...bookForm, rack: e.target.value})} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={submittingBook} className="btn-primary w-full py-3 mt-4 text-lg">
              {submittingBook ? 'Adding...' : 'Add Book'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
