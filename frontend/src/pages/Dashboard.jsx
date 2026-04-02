import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Search, Tags, AlertCircle, CheckCircle, Clock, Trash2, Edit3, X, Save } from 'lucide-react';
import { format, differenceInDays, isBefore, startOfDay } from 'date-fns';

const API_URL = import.meta.env.MODE === 'production' 
  ? 'https://freshtrack-api-sg33.onrender.com/api' 
  : 'http://localhost:5000/api';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editFormData, setEditFormData] = useState({
      name: '',
      brand: '',
      expiryDate: '',
      quantity: 1
  });

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

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product and all its batches?')) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      // Notify parent/global if needed
      window.dispatchEvent(new CustomEvent('inventoryUpdated'));
    } catch (err) {
      alert('Delete failed');
    }
  };

  const deleteBatch = async (batchId, productId) => {
      if (!window.confirm('Remove this batch?')) return;
      try {
          await axios.delete(`${API_URL}/batches/${batchId}`);
          setProducts(products.map(p => {
              if (p._id === productId) {
                  return { ...p, batches: p.batches.filter(b => b._id !== batchId) };
              }
              return p;
          }));
          window.dispatchEvent(new CustomEvent('inventoryUpdated'));
      } catch (err) {
          alert('Delete failed');
      }
  };

  const updateBatchQuantity = async (batchId, productId, newQty) => {
    if (newQty < 1) return;
    try {
        await axios.put(`${API_URL}/batches/${batchId}`, { quantity: newQty });
        setProducts(products.map(p => {
            if (p._id === productId) {
                return { 
                    ...p, 
                    batches: p.batches.map(b => b._id === batchId ? { ...b, quantity: newQty } : b) 
                };
            }
            return p;
        }));
        window.dispatchEvent(new CustomEvent('inventoryUpdated'));
    } catch (err) {
        alert('Update failed');
    }
  };

  const handleEditClick = (batch, product) => {
      setEditingBatch({ ...batch, productId: product._id });
      setEditFormData({
          name: product.name,
          brand: product.brand || '',
          expiryDate: format(new Date(batch.expiryDate), 'yyyy-MM-dd'),
          quantity: batch.quantity
      });
  };

  const handleUpdateFullBatch = async (e) => {
      e.preventDefault();
      try {
          // 1. Update Product
          await axios.put(`${API_URL}/products/${editingBatch.productId}`, {
              name: editFormData.name,
              brand: editFormData.brand
          });

          // 2. Update Batch
          await axios.put(`${API_URL}/batches/${editingBatch._id}`, {
              expiryDate: editFormData.expiryDate,
              quantity: editFormData.quantity
          });

          // Refresh products
          await fetchProducts();
          window.dispatchEvent(new CustomEvent('inventoryUpdated'));
          setEditingBatch(null);
      } catch (err) {
          alert('Update failed');
      }
  };

  const calculateStatus = (batch) => {
    const expiry = new Date(batch.expiryDate);
    const today = startOfDay(new Date());
    const days = differenceInDays(expiry, today);

    if (isBefore(expiry, today)) {
        return { label: 'Expired', color: 'bg-danger text-white', ring: 'ring-danger/20' };
    }
    if (days <= 3) {
        return { label: 'Expiring Soon', color: 'bg-warning text-white', ring: 'ring-warning/20' };
    }
    return { label: 'Safe', color: 'bg-safe/10 text-safe', ring: 'ring-safe/20' };
  };

  const getSummary = () => {
    let expired = 0, near = 0, safe = 0;
    const today = startOfDay(new Date());

    products.forEach(p => {
      p.batches?.forEach(b => {
        const expiry = new Date(b.expiryDate);
        const days = differenceInDays(expiry, today);
        
        if (isBefore(expiry, today)) {
          expired += b.quantity;
        } else if (days <= 3) {
          near += b.quantity;
        } else {
          safe += b.quantity;
        }
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

      <div className="relative max-w-xl lg:max-w-2xl mx-auto md:mx-0 group">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col group h-full">
                <div className="p-5 pb-4 border-b border-slate-50 flex items-center justify-between gap-4">
                   <div className="flex items-center gap-4 overflow-hidden">
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
                   <button onClick={() => deleteProduct(product._id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all self-start">
                      <Trash2 className="w-5 h-5" />
                   </button>
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
                             <div key={batch._id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm ring-1 ring-inset ring-transparent hover:ring-slate-200 transition-all group/batch">
                                <div>
                                  <p className="text-sm font-bold text-slate-700">{format(new Date(batch.expiryDate), 'MMM dd, yyyy')}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <button 
                                        onClick={() => updateBatchQuantity(batch._id, product._id, batch.quantity - 1)}
                                        className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-slate-500 hover:bg-slate-200"
                                      >-</button>
                                      <span className="text-xs font-black text-slate-800 w-4 text-center">{batch.quantity}</span>
                                      <button 
                                        onClick={() => updateBatchQuantity(batch._id, product._id, batch.quantity + 1)}
                                        className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-slate-500 hover:bg-slate-200"
                                      >+</button>
                                  </div>
                                </div>
                                <div className="flex xl:flex-row flex-col items-center gap-2 border-l border-slate-100 pl-3 ml-1 shrink-0">
                                  <button 
                                     onClick={() => handleEditClick(batch, product)} 
                                     className="flex items-center justify-center gap-1 px-3 py-2 bg-primary/5 text-primary rounded-xl hover:bg-primary hover:text-white transition-all text-[9.5px] font-black uppercase tracking-wider shadow-sm border border-primary/10 w-full xl:w-auto min-w-[70px]"
                                  >
                                      <Edit3 className="w-3.5 h-3.5" /> Edit
                                  </button>
                                  <button 
                                     onClick={() => deleteBatch(batch._id, product._id)} 
                                     className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all text-[9.5px] font-black uppercase tracking-wider shadow-sm border border-red-100 w-full xl:w-auto min-w-[74px]"
                                  >
                                      <Trash2 className="w-3.5 h-3.5" /> Remove
                                  </button>
                                </div>
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

      {/* Edit Modal */}
      {editingBatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-scale-in border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Edit Detail</h3>
                    <button onClick={() => setEditingBatch(null)} className="p-2 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleUpdateFullBatch} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-widest ml-1">Product Name</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-800"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-widest ml-1">Brand</label>
                        <input 
                            type="text" 
                            className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-800"
                            value={editFormData.brand}
                            onChange={(e) => setEditFormData({...editFormData, brand: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest ml-1">Expiry Date</label>
                            <input 
                                type="date" 
                                required
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-800 text-sm"
                                value={editFormData.expiryDate}
                                onChange={(e) => setEditFormData({...editFormData, expiryDate: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest ml-1">Quantity</label>
                            <input 
                                type="number" 
                                min="1"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-800 text-center"
                                value={editFormData.quantity}
                                onChange={(e) => setEditFormData({...editFormData, quantity: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-[1.25rem] shadow-xl hover:bg-primary transition-all flex items-center justify-center gap-2 mt-4 group"
                    >
                        Save Changes <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
