import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ScanLine, PlusCircle } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/scan', label: 'Scan', icon: ScanLine },
    { path: '/add', label: 'Manual Add', icon: PlusCircle },
  ];

  return (
    <>
      {/* Desktop Header */}
      <nav className="hidden md:flex fixed top-0 w-full z-50 glass px-8 py-4 items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <ScanLine className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-primary">
            FreshTrack
          </h1>
        </div>
        
        <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-white/40">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive 
                    ? 'bg-white text-primary shadow-sm shadow-slate-200/50 scale-105' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile Top Header (Just for branding on mobile) */}
      <div className="md:hidden fixed top-0 w-full z-40 glass px-5 py-4 flex items-center justify-center border-b border-white/20">
         <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-primary flex items-center gap-2">
            <ScanLine className="text-primary w-5 h-5" /> FreshTrack
         </h1>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 glass pb-safe border-t border-slate-200/60 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center p-2 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-300 ${
                  isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`transition-all duration-300 ${isActive ? 'bg-primary/10 p-3 rounded-[1rem] -translate-y-2 relative' : 'p-2'}`}>
                   {isActive && <div className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10 animate-pulse"></div>}
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                </div>
                <span className={`text-[10px] sm:text-xs font-bold transition-all duration-300 ${isActive ? 'opacity-100 -translate-y-1' : 'opacity-0 h-0'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
