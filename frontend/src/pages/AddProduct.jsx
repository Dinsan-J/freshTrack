import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, Loader2, ArrowLeft, ArrowRight, Tag, Calendar, Hash, Image as ImageIcon } from 'lucide-react';

const API_URL = import.meta.env.MODE === 'production' 
  ? 'https://freshtrack-api-zprr.onrender.com/api' 
  : 'http://localhost:5000/api';

const AddProduct = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    brand: '',
    image: '',
    expiryDate: '',
    quantity: 1,
  });

  useEffect(() => {
    if (location.state?.productData) {
      setFormData(prev => ({ ...prev, ...location.state.productData }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    try {
      // 1. Add/Update Product
      const productRes = await axios.post(`${API_URL}/products`, {
        barcode: formData.barcode,
        name: formData.name,
        brand: formData.brand,
        image: formData.image,
      });

      const productId = productRes.data._id;

      // 2. Add Batch
      await axios.post(`${API_URL}/batches`, {
        productId,
        expiryDate: formData.expiryDate,
        quantity: formData.quantity,
      });

      setSuccess('Product batch added successfully!');
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Error saving', error);
      alert('Error saving data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in relative z-10 pt-4">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-4 focus:ring-primary/10 border border-slate-100 group"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
           <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add Record</h2>
           <p className="text-slate-500 mt-1 font-medium">Create a new batch inventory</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 md:p-8 border border-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-indigo-500"></div>
        {success && (
          <div className="mb-6 p-4 bg-safe/10 border border-safe/20 text-safe rounded-2xl flex items-center justify-center gap-2 animate-slide-up font-bold tracking-wide">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="space-y-1.5 col-span-1 md:col-span-2 relative group">
                <label className="text-sm font-bold tracking-wide uppercase text-slate-500 ml-1">Barcode</label>
                <div className="relative">
                   <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-primary" />
                   <input
                     type="text"
                     name="barcode"
                     required
                     value={formData.barcode}
                     onChange={handleChange}
                     className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-800"
                     placeholder="Ex: 890123456789"
                   />
                </div>
             </div>

             <div className="space-y-1.5 col-span-1 md:col-span-2 relative group">
                <label className="text-sm font-bold tracking-wide uppercase text-slate-500 ml-1">Product Name</label>
                <div className="relative">
                   <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-primary" />
                   <input
                     type="text"
                     name="name"
                     required
                     value={formData.name}
                     onChange={handleChange}
                     className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-800"
                     placeholder="Ex: Fresh Milk"
                   />
                </div>
             </div>

             <div className="space-y-1.5 relative group">
                <label className="text-sm font-bold tracking-wide uppercase text-slate-500 ml-1">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-800"
                  placeholder="Ex: Amul"
                />
             </div>

             <div className="space-y-1.5 relative group">
                <label className="text-sm font-bold tracking-wide uppercase text-slate-500 ml-1">Image URL</label>
                <div className="relative">
                   <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-primary" />
                   <input
                     type="text"
                     name="image"
                     value={formData.image}
                     onChange={handleChange}
                     className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-800"
                     placeholder="https://"
                   />
                </div>
             </div>

             <div className="space-y-1.5 relative group">
                <label className="text-sm font-bold tracking-wide uppercase text-slate-500 ml-1">Expiry Date</label>
                <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-primary pointer-events-none" />
                   <input
                     type="date"
                     name="expiryDate"
                     required
                     value={formData.expiryDate}
                     onChange={handleChange}
                     className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-800"
                   />
                </div>
             </div>

             <div className="space-y-1.5 relative group">
                <label className="text-sm font-bold tracking-wide uppercase text-slate-500 ml-1">Quantity</label>
                <div className="flex bg-slate-50 rounded-xl overflow-hidden border border-slate-200 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all">
                  <button type="button" onClick={() => setFormData({...formData, quantity: Math.max(1, formData.quantity - 1)})} className="px-5 py-3.5 text-slate-500 font-bold hover:bg-slate-200 hover:text-slate-800 transition-colors">-</button>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full px-2 py-3.5 text-center bg-transparent focus:outline-none font-bold text-slate-800"
                  />
                  <button type="button" onClick={() => setFormData({...formData, quantity: formData.quantity + 1})} className="px-5 py-3.5 text-slate-500 font-bold hover:bg-slate-200 hover:text-slate-800 transition-colors">+</button>
                </div>
             </div>
          </div>

          <div className="pt-6">
             <button
               type="submit"
               disabled={loading}
               className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white font-extrabold py-4 px-6 rounded-[1.25rem] hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1 flex justify-center items-center gap-2 group disabled:opacity-75 disabled:hover:translate-y-0 disabled:shadow-none"
             >
               {loading ? (
                 <>
                  <Loader2 className="animate-spin w-5 h-5" /> Saving...
                 </>
               ) : (
                 <>
                  Set Expiry Record <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                 </>
               )}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
