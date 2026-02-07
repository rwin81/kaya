import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Order, PromoBanner, Menu, Category } from '../types';
import { banners as initialBanners, menus as initialMenus, categories as mockCategories } from '../mockData';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface Props {
  orders: Order[];
  onExit: () => void; // Menambahkan fungsi logout
}

const LOGO_URL = "https://lh3.googleusercontent.com/d/1Aw-CPHKJVjcAASUZJEd7cH5g5sm5y9sa";

export const AdminView: React.FC<Props> = ({ orders, onExit }) => {
  const [banners, setBanners] = useState<PromoBanner[]>(initialBanners);
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  
  const [editingMenu, setEditingMenu] = useState<Partial<Menu> | null>(null);
  const [editingBanner, setEditingBanner] = useState<Partial<PromoBanner> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'CATALOG' | 'PROMO'>('ANALYTICS');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: menuData } = await supabase.from('menus').select('*').order('name');
      if (menuData) setMenus(menuData.map(m => ({
        id: m.id, categoryId: m.category_id, name: m.name, price: m.price,
        description: m.description, image: m.image, badge: m.badge, isAvailable: m.is_available
      })));

      const { data: bannerData } = await supabase.from('promos').select('*');
      if (bannerData) setBanners(bannerData);

      const { data: catData } = await supabase.from('categories').select('*');
      if (catData) setCategories(catData);
    } catch (err) { console.error("Admin Sync Error:", err); }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  
  // LOGIKA ANALITIK KEUANGAN
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const paidOrders = orders.filter(o => o.status === 'PAID');
    const todayOrders = paidOrders.filter(o => o.createdAt.startsWith(today));
    
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + curr.total, 0);
    const todayRevenue = todayOrders.reduce((acc, curr) => acc + curr.total, 0);
    
    // Data untuk Grafik (7 hari terakhir)
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayRevenue = paidOrders
        .filter(o => o.createdAt.startsWith(dateStr))
        .reduce((acc, curr) => acc + curr.total, 0);
      
      return {
        name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        revenue: dayRevenue
      };
    });

    return { totalRevenue, todayRevenue, todayCount: todayOrders.length, chartData, paidOrders };
  }, [orders]);

  const handlePrint = () => {
    // Pastikan kita di tab Analytics agar data yang di-print lengkap
    setActiveTab('ANALYTICS');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleSaveMenu = async () => {
    if (!editingMenu || !editingMenu.name) return;
    const isUpdate = !!editingMenu.id;
    const payload = {
      name: editingMenu.name,
      category_id: editingMenu.categoryId || categories[0].id,
      price: editingMenu.price || 0,
      description: editingMenu.description || '',
      image: editingMenu.image || 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?q=80&w=800',
      is_available: editingMenu.isAvailable ?? true,
      badge: editingMenu.badge || null
    };
    try {
      if (isUpdate) await supabase.from('menus').update(payload).eq('id', editingMenu.id);
      else await supabase.from('menus').insert({ ...payload, id: `m${Date.now()}` });
      setEditingMenu(null); fetchData();
    } catch (err) { alert("Error saving menu."); }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm("Hapus item ini?")) return;
    await supabase.from('menus').delete().eq('id', id); fetchData();
  };

  const handleSaveBanner = async () => {
    if (!editingBanner || !editingBanner.title) return;
    const isUpdate = !!editingBanner.id;
    const payload = { title: editingBanner.title, image: editingBanner.image || '', is_active: editingBanner.isActive ?? true };
    try {
      if (isUpdate) await supabase.from('promos').update(payload).eq('id', editingBanner.id);
      else await supabase.from('promos').insert({ ...payload, id: `b${Date.now()}` });
      setEditingBanner(null); fetchData();
    } catch (err) { alert("Error saving banner."); }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Hapus banner ini?")) return;
    await supabase.from('promos').delete().eq('id', id); fetchData();
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 sm:p-12 font-['Plus_Jakarta_Sans'] text-zinc-100 pb-32">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* Admin Header - Hidden on Print */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-zinc-900 pb-10 print:hidden">
          <div className="flex items-center gap-8">
            <img src={LOGO_URL} className="h-16 w-auto" alt="Logo" />
            <div>
              <p className="text-amber-500 font-black text-[9px] uppercase tracking-[0.5em] italic">Intelligence Console</p>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Dashboard Admin</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-zinc-900/50 p-2 rounded-3xl border border-zinc-800">
              {(['ANALYTICS', 'CATALOG', 'PROMO'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic ${activeTab === tab ? 'bg-amber-600 text-zinc-950' : 'text-zinc-500 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tombol Logout / Keluar (BARU) */}
            <button onClick={onExit} title="Keluar Panel" className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl text-zinc-500 hover:text-red-500 transition-all active:scale-95">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>

        {/* PRINT ONLY HEADER */}
        <div className="hidden print:block text-zinc-950 mb-10 border-b-2 border-zinc-900 pb-8">
           <div className="flex justify-between items-end">
             <div>
               <img src={LOGO_URL} className="h-16 w-auto invert mb-4" alt="Logo" />
               <h1 className="text-4xl font-black uppercase italic tracking-tighter">Financial Report</h1>
               <p className="text-xs font-bold text-zinc-500 uppercase">Fantasteak - Premium Steakhouse Official Records</p>
             </div>
             <div className="text-right">
               <p className="text-[10px] font-black uppercase italic text-zinc-400">Dicetak Pada:</p>
               <p className="text-sm font-black italic uppercase">{new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
             </div>
           </div>
        </div>

        {activeTab === 'ANALYTICS' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* STATS BENTO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] relative overflow-hidden group print:bg-zinc-50 print:border-zinc-200">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform print:hidden">
                  <svg className="w-20 h-20 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 italic print:text-zinc-400">Pendapatan Hari Ini</p>
                <p className="text-4xl font-black italic text-amber-500 tracking-tighter print:text-amber-600">Rp {stats.todayRevenue.toLocaleString()}</p>
                <div className="mt-4 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse print:animate-none"></span>
                   <p className="text-[9px] font-bold text-emerald-500 uppercase italic print:text-emerald-700">{stats.todayCount} Transaksi Berhasil</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] group print:bg-zinc-50 print:border-zinc-200">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 italic print:text-zinc-400">Total Omzet (All-Time)</p>
                <p className="text-4xl font-black italic text-zinc-100 tracking-tighter print:text-zinc-900">Rp {stats.totalRevenue.toLocaleString()}</p>
                <p className="mt-4 text-[9px] font-bold text-zinc-600 uppercase italic print:text-zinc-500">Terakumulasi dari {stats.paidOrders.length} pesanan</p>
              </div>

              <div className="bg-amber-600 p-8 rounded-[40px] flex flex-col justify-between print:hidden">
                <div>
                  <p className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.3em] mb-2 italic">Quick Action</p>
                  <h4 className="text-2xl font-black text-zinc-950 italic tracking-tighter uppercase leading-none">Cetak Laporan<br/>Harian</h4>
                </div>
                <button 
                  onClick={handlePrint} 
                  className="mt-6 bg-zinc-950 text-white py-4 rounded-2xl font-black text-[10px] uppercase italic hover:bg-zinc-900 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Generate PDF
                </button>
              </div>
              
              {/* PRINT ONLY PLACEHOLDER FOR THE ACTION BOX */}
              <div className="hidden print:block bg-zinc-50 border border-zinc-200 p-8 rounded-[40px]">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4 italic">Status Operasional</p>
                <p className="text-2xl font-black italic text-zinc-900 tracking-tighter uppercase">SISTEM AKTIF</p>
                <p className="mt-4 text-[9px] font-bold text-zinc-500 uppercase italic">Sinkronisasi Database: Real-time</p>
              </div>
            </div>

            {/* CHART SECTION */}
            <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[48px] print:bg-white print:border-zinc-200 print:rounded-3xl print:p-8">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter print:text-zinc-900">Tren Penjualan</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase italic mt-1">Performa 7 Hari Terakhir</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black italic text-amber-500 tracking-tighter print:text-amber-600">↑ 12%</p>
                  <p className="text-[8px] text-emerald-500 font-black uppercase">vs Minggu Lalu</p>
                </div>
              </div>
              <div className="h-[350px] w-full print:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" vertical={false} />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tickFormatter={(val) => `Rp${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#f59e0b' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TRANSACTION HISTORY */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[48px] overflow-hidden print:bg-white print:border-zinc-200 print:rounded-3xl">
               <div className="p-8 border-b border-zinc-800 print:border-zinc-100 print:p-6">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter print:text-zinc-900">Laporan Transaksi Terbaru</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-zinc-950 print:bg-zinc-50">
                       <th className="p-6 text-[9px] font-black uppercase text-zinc-500 italic print:p-4">ID Pesanan</th>
                       <th className="p-6 text-[9px] font-black uppercase text-zinc-500 italic print:p-4">Pelanggan</th>
                       <th className="p-6 text-[9px] font-black uppercase text-zinc-500 italic print:p-4">Metode</th>
                       <th className="p-6 text-[9px] font-black uppercase text-zinc-500 italic print:p-4">Tanggal</th>
                       <th className="p-6 text-[9px] font-black uppercase text-zinc-500 italic text-right print:p-4">Total</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-800/50 print:divide-zinc-100">
                     {stats.paidOrders.slice(0, 15).map((order) => (
                       <tr key={order.id} className="hover:bg-white/[0.02] transition-colors print:bg-transparent">
                         <td className="p-6 text-[10px] font-black text-amber-500 print:p-4">#{order.id}</td>
                         <td className="p-6 print:p-4">
                            <p className="text-xs font-black uppercase italic print:text-zinc-900">{order.customerName}</p>
                            <p className="text-[8px] text-zinc-500 font-bold uppercase">{order.orderType}</p>
                         </td>
                         <td className="p-6 print:p-4">
                            <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-[8px] font-black uppercase italic text-zinc-400 print:bg-white print:border-zinc-200 print:text-zinc-700">
                              {order.paymentMethod}
                            </span>
                         </td>
                         <td className="p-6 text-[9px] font-bold text-zinc-500 print:p-4">
                            {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                         </td>
                         <td className="p-6 text-right text-xs font-black italic text-zinc-100 print:text-zinc-900 print:p-4">
                            Rp {order.total.toLocaleString()}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>

            {/* PRINT FOOTER */}
            <div className="hidden print:block mt-12 pt-10 border-t border-zinc-200 text-center">
               <p className="text-[9px] font-black uppercase italic text-zinc-400">Dokumen ini dihasilkan secara otomatis oleh Fantasteak Intelligence System</p>
               <p className="text-[8px] font-bold text-zinc-300 mt-2">© 2024 Fantasteak - Premium Steakhouse Bojonegoro</p>
            </div>
          </div>
        )}

        {/* Catalog & Promo tabs (Sembunyikan saat diprint untuk fokus ke laporan keuangan) */}
        <div className="print:hidden">
          {activeTab === 'CATALOG' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-5">
              <div className="flex justify-between items-center border-l-4 border-amber-600 pl-8">
                <h3 className="text-3xl font-extrabold italic uppercase tracking-tighter">Menu Management</h3>
                <button onClick={() => setEditingMenu({ isAvailable: true })} className="px-8 py-4 bg-amber-600 text-zinc-950 rounded-2xl text-[10px] font-black uppercase italic shadow-xl">Tambah Menu Baru</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {menus.map(menu => (
                  <div key={menu.id} className="bg-zinc-900/40 p-6 rounded-[40px] border border-zinc-900 flex items-center gap-6 group hover:border-zinc-800 transition-all">
                      <img src={menu.image} className="w-20 h-20 object-cover rounded-[24px] shadow-2xl" alt="" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                           <p className="font-extrabold italic uppercase text-lg leading-tight">{menu.name}</p>
                           <p className="text-amber-500 font-black italic ml-4">Rp{(menu.price/1000).toLocaleString()}k</p>
                        </div>
                        <div className="flex gap-6">
                          <button onClick={() => setEditingMenu(menu)} className="text-[9px] font-black uppercase text-cyan-400">Edit</button>
                          <button onClick={() => handleDeleteMenu(menu.id)} className="text-[9px] font-black uppercase text-rose-500">Hapus</button>
                          <span className={`text-[9px] font-black uppercase ${menu.isAvailable ? 'text-emerald-500' : 'text-zinc-700'}`}>{menu.isAvailable ? 'Ready' : 'Sold Out'}</span>
                        </div>
                      </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'PROMO' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-5">
              <div className="flex justify-between items-center border-l-4 border-amber-600 pl-8">
                <h3 className="text-3xl font-extrabold italic uppercase tracking-tighter">Promotion Bar</h3>
                <button onClick={() => setEditingBanner({ isActive: true })} className="px-8 py-4 bg-amber-600 text-zinc-950 rounded-2xl text-[10px] font-black uppercase italic shadow-xl">Tambah Promo</button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {banners.map(banner => (
                  <div key={banner.id} className="bg-zinc-900/40 p-6 rounded-[48px] border border-zinc-900 flex items-center gap-6 group hover:border-zinc-800 transition-all">
                    <img src={banner.image} className="w-32 h-20 object-cover rounded-[24px] shadow-2xl" alt="" />
                    <div className="flex-1">
                      <p className="font-extrabold italic uppercase text-xl mb-2 leading-tight">{banner.title}</p>
                      <div className="flex gap-6">
                        <button onClick={() => setEditingBanner(banner)} className="text-[9px] font-black uppercase text-cyan-400">Ubah</button>
                        <button onClick={() => handleDeleteBanner(banner.id)} className="text-[9px] font-black uppercase text-rose-500">Hapus</button>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${banner.isActive ? 'text-emerald-500' : 'text-zinc-700'}`}>{banner.isActive ? 'TAMPIL' : 'DISEMBUNYIKAN'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {editingMenu && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-zinc-950/98 backdrop-blur-3xl print:hidden">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[56px] p-10 max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 shadow-2xl">
             <h2 className="text-3xl font-black italic uppercase mb-10 tracking-tighter text-center">Konfigurasi Menu</h2>
             <div className="space-y-6">
                <input type="text" placeholder="Nama Menu" value={editingMenu.name || ''} onChange={e => setEditingMenu({...editingMenu, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-5 text-zinc-100 font-bold focus:border-amber-600 outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Harga" value={editingMenu.price || ''} onChange={e => setEditingMenu({...editingMenu, price: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-5 text-zinc-100 font-bold focus:border-amber-600 outline-none" />
                  <select value={editingMenu.categoryId || ''} onChange={e => setEditingMenu({...editingMenu, categoryId: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-5 text-zinc-100 font-bold focus:border-amber-600 outline-none">
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <input type="text" placeholder="Link Gambar" value={editingMenu.image || ''} onChange={e => setEditingMenu({...editingMenu, image: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-5 text-zinc-100 font-bold focus:border-amber-600 outline-none" />
                <textarea placeholder="Deskripsi" value={editingMenu.description || ''} onChange={e => setEditingMenu({...editingMenu, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-5 text-zinc-100 font-bold h-32 focus:border-amber-600 outline-none" />
                <div className="flex items-center gap-4 bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Status Ketersediaan</p>
                    <p className="font-bold">{editingMenu.isAvailable ? 'Menu Ready' : 'Menu Sold Out'}</p>
                  </div>
                  <button onClick={() => setEditingMenu({...editingMenu, isAvailable: !editingMenu.isAvailable})} className={`px-8 py-4 rounded-xl text-[9px] font-black italic ${editingMenu.isAvailable ? 'bg-emerald-600' : 'bg-rose-600'}`}>SWITCH</button>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-6">
                  <button onClick={handleSaveMenu} className="py-6 bg-amber-600 text-zinc-950 rounded-2xl font-black text-[10px] uppercase italic active:scale-95 transition-all">Simpan</button>
                  <button onClick={() => setEditingMenu(null)} className="py-6 bg-zinc-800 text-zinc-100 rounded-2xl font-black text-[10px] uppercase italic active:scale-95 transition-all">Batal</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {editingBanner && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-zinc-950/98 backdrop-blur-3xl print:hidden">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[56px] p-10 max-w-xl w-full animate-in zoom-in-95 shadow-2xl">
             <h2 className="text-3xl font-black italic uppercase mb-10 tracking-tighter text-center">Config Banner</h2>
             <div className="space-y-6">
                <input type="text" placeholder="Judul Banner" value={editingBanner.title || ''} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-5 text-zinc-100 font-bold focus:border-amber-600 outline-none" />
                <input type="text" placeholder="Link Gambar" value={editingBanner.image || ''} onChange={e => setEditingBanner({...editingBanner, image: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-5 text-zinc-100 font-bold focus:border-amber-600 outline-none" />
                <button onClick={() => setEditingBanner({...editingBanner, isActive: !editingBanner.isActive})} className={`w-full py-4 rounded-2xl text-[9px] font-black italic ${editingBanner.isActive ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                   {editingBanner.isActive ? 'BANNER AKTIF' : 'BANNER OFF'}
                </button>
                <div className="grid grid-cols-2 gap-4 pt-6">
                  <button onClick={handleSaveBanner} className="py-6 bg-amber-600 text-zinc-950 rounded-2xl font-black text-[10px] uppercase italic">Pasang</button>
                  <button onClick={() => setEditingBanner(null)} className="py-6 bg-zinc-800 text-zinc-100 rounded-2xl font-black text-[10px] uppercase italic">Batal</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};