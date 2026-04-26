import React, { useState } from 'react';
import api from '../../lib/axios';
import { BookPlus } from 'lucide-react';

const AdminInventory = () => {
  const [bookForm, setBookForm] = useState({
    title: '', author: '', category: 'Fiction', total_quantity: 1, floor: '', row: '', rack: ''
  });
  const [submittingBook, setSubmittingBook] = useState(false);

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
        <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
        <p className="text-textSubtle">Add new books to the physical library catalog.</p>
      </div>

      <div className="glass-card p-8 max-w-2xl">
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
    </div>
  );
};

export default AdminInventory;
