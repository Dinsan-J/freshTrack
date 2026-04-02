import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, AlertTriangle, X } from 'lucide-react';
import { isBefore, startOfDay } from 'date-fns';

const API_URL = import.meta.env.MODE === 'production' 
  ? 'https://freshtrack-api-sg33.onrender.com/api' 
  : 'http://localhost:5000/api';

const Notifications = () => {
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    checkExpiry();
    requestPermission();

    const handleUpdate = () => checkExpiry();
    window.addEventListener('inventoryUpdated', handleUpdate);

    // Optional: poll every hour
    const interval = setInterval(checkExpiry, 3600000);
    return () => {
        clearInterval(interval);
        window.removeEventListener('inventoryUpdated', handleUpdate);
    };
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.error('Notification API err:', e);
      }
    }
  };

  const checkExpiry = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products/expiring?days=3`);
      setAlerts(data);
      
      // If we got new alerts, and we haven't read them
      if (data.length > 0 && data.length !== unread) {
        setUnread(data.length);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('FreshTrack Alert', {
            body: `⚠️ You have ${data.length} item(s) expiring soon or expired!`,
            icon: '/vite.svg'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching expiry alerts', error);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnread(0);
  };

  if (alerts.length === 0) return null;

  return (
    <>
      <button 
        onClick={handleOpen}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-white p-4 rounded-full shadow-2xl shadow-danger/20 z-40 hover:scale-110 transition-transform duration-300 border border-danger/10 group"
      >
        <div className="relative">
          <Bell className="w-6 h-6 text-slate-700 group-hover:text-danger transition-colors" />
          {unread > 0 && (
            <span className="absolute -top-2 -right-2 bg-danger text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
              {unread}
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <AlertTriangle className="text-warning w-6 h-6" />
                Expiry Alerts
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {alerts.map((batch, i) => {
                const expiry = new Date(batch.expiryDate);
                const today = startOfDay(new Date());
                const isExpired = isBefore(expiry, today);
                return (
                  <div key={i} className={`p-4 rounded-2xl border-l-[6px] ${isExpired ? 'border-danger bg-red-50/50' : 'border-warning bg-orange-50/50'} relative overflow-hidden group`}>
                    <div className="absolute right-[-20px] top-[-20px] w-16 h-16 rounded-full blur-xl opacity-20 bg-current"></div>
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-white rounded-xl flex-shrink-0 flex justify-center items-center shadow-sm overflow-hidden border border-slate-100 p-1">
                        {batch.productId?.image ? (
                          <img src={batch.productId.image} alt={batch.productId.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-xl">📦</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 line-clamp-1">{batch.productId?.name || 'Unknown Product'}</p>
                        <p className={`text-sm mt-0.5 ${isExpired ? 'text-danger font-bold' : 'text-warning font-semibold'}`}>
                          {isExpired ? 'Expired' : 'Expiring'} • {new Date(batch.expiryDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Batch Qty: {batch.quantity}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Notifications;
