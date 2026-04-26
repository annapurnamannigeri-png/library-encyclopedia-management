import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { Check, X } from 'lucide-react';

const FineApproval = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/requests');
      setRequests(res.data);
    } catch (error) {
      console.error("Failed to fetch requests", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Fine Approvals</h1>
        <p className="text-textSubtle">Review and process student fine waiver requests.</p>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-2">Pending Requests Queue</h2>
        {loading ? (
          <p className="text-textSubtle text-center py-6">Loading pending requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-textSubtle text-center py-10">No pending waiver requests. All caught up!</p>
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
                      className="bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30 px-3 py-2 rounded-lg flex items-center text-sm font-medium transition-colors cursor-pointer"
                   >
                      <Check size={16} className="mr-1" /> Approve
                   </button>
                   <button 
                      onClick={() => handleFineAction(req.id, 'reject')}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg flex items-center text-sm font-medium transition-colors cursor-pointer"
                   >
                      <X size={16} className="mr-1" /> Reject
                   </button>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FineApproval;
