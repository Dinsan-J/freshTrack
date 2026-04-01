import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Search, Tags, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const API_URL = import.meta.env.MODE === 'production' 
  ? 'https://freshtrack-api-zprr.onrender.com/api' 
  : 'http://localhost:5000/api';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products`);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatus = (batch) => {
    const days = differenceInDays(new Date(batch.expiryDate), new Date());
    if (days < 0) return { label: 'Expired', color: 'bg-danger text-white', ring: 'ring-danger/20' };
    if (days <= 3) return { label: 'Expiring Soon', color: 'bg-warning text-white', ring: 'ring-warning/20' };
    return { label: 'Safe', color: 'bg-safe/10 text-safe', ring: 'ring-safe/20' };
  };

  const getSummary = () => {
    let expired = 0, near = 0, safe = 0;
    products.forEach(p => {
      p.batches?.forEach(b => {
        const days = differenceInDays(new Date(b.expiryDate), new Date());
        if (days < 0) expired += b.quantity;
        else if (days <= 3) near += b.quantity;
        else safe += b.quantity;
      });
    });
    return { expired, near, safe };
  };

  const summary = getSummary();
  
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full pt-32">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Inventory</h2>
          <p className="text-slate-500 mt-1 font-medium">Manage your products and their expiry dates</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-xl transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-safe/10 flex items-center justify-center text-safe">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Safe Items</p>
            <p className="text-3xl font-extrabold text-slate-800">{summary.safe}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-xl transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center text-warning">
             <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Expiring Soon</p>
            <p className="text-3xl font-extrabold text-slate-800">{summary.near}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-xl transition-all duration-300">
           <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center text-danger">
              <AlertCircle className="w-7 h-7" />
           </div>
           <div>
             <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Expired Items</p>
             <p className="text-3xl font-extrabold text-slate-800">{summary.expired}</p>
           </div>
        </div>
      </div>

      <div className="relative max-w-xl mx-auto md:mx-0 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder="Search products by name..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-800 placeholder-slate-400 shadow-sm"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-300">
          <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">No products found</h3>
          <p className="text-slate-500 mt-2">Start by adding a product or scanning a barcode.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col group">
               <div className="p-6 pb-4 border-b border-slate-50 flex items-center gap-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500 p-2">
                    {product.image ? (
                       <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                       <Package className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                    {product.brand && (
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 line-clamp-1">
                        <Tags className="w-3 h-3" /> {product.brand}
                      </p>
                    )}
                  </div>
               </div>

               <div className="p-6 bg-slate-50/50 flex-grow">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Inventory Batches</h4>
                 {product.batches && product.batches.length > 0 ? (
                    <div className="space-y-2.5">
                      {product.batches
                        .sort((a,b) => new Date(a.expiryDate) - new Date(b.expiryDate))
                        .map(batch => {
                          const status = calculateStatus(batch);
                          return (
                            <div key={batch._id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm ring-1 ring-inset ring-transparent hover:ring-slate-200 transition-all">
                               <div>
                                 <p className="text-sm font-bold text-slate-700">{format(new Date(batch.expiryDate), 'MMM dd, yyyy')}</p>
                                 <p className="text-xs text-slate-500 font-medium mt-0.5">Qty: {batch.quantity}</p>
                               </div>
                               <span className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-full ring-1 ${status.color} ${status.ring}`}>
                                 {status.label}
                               </span>
                            </div>
                          );
                      })}
                    </div>
                 ) : (
                   <p className="text-sm text-slate-500 italic">No batches available.</p>
                 )}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
