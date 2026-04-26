import React from 'react';
import { Mailbox } from 'lucide-react';

const GeneralRequests = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">General User Requests</h1>
        <p className="text-textSubtle">Inbox for general library inquiries, missing book reports, and other issues.</p>
      </div>

      <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Mailbox size={40} className="text-primary opacity-50" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Inbox Empty</h2>
        <p className="text-textSubtle max-w-md">There are currently no general support tickets or inquiries from students. Have a great day!</p>
      </div>
    </div>
  );
};

export default GeneralRequests;
