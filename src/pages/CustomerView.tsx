
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { banners as mockBanners, categories as mockCategories, menus as mockMenus } from '../mockData';
import { CartItem, Menu, PaymentMethod, OrderType, Category, PromoBanner } from '../types';

interface Props {
  onSubmitOrder: (items: CartItem[], name: string, type: OrderType, payment: PaymentMethod, table?: string, eventDate?: string) => void;
}

const LOGO_URL = "https://lh3.googleusercontent.com/d/1Aw-CPHKJVjcAASUZJEd7cH5g5sm5y9sa";
const QRIS_IMAGE_URL = "https://lh3.googleusercontent.com/d/1Edj4Qi67mQEzzUHIpGApKnKYbulRyosu";

export const CustomerView: React.FC<Props> = ({ onSubmitOrder }) => {
  const [activeCategory, setActiveCategory] = useState('SEMUA');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showQRIS, setShowQRIS] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedMenuDetail, setSelectedMenuDetail] = useState<Menu | null>(null);
  
  const [menus, setMenus] = useState<Menu[]>(mockMenus);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [banners, setBanners] = useState<PromoBanner[]>(mockBanners);

  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [eventDate, setEventDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: menuData } = await supabase.from('menus').select('*').order('name');
        if (menuData) setMenus(menuData.map(m => ({
          id: m.id, categoryId: m.category_id, name: m.name, price: m.price,
          description: m.description, image: m.image, badge: m.badge, isAvailable: m.is_available
        })));

        const { data: bannerData } = await supabase.from('promos').select('*').eq('is_active', true);
        if (bannerData && bannerData.length > 0) setBanners(bannerData);

        const { data: catData } = await supabase.from('categories').select('*');
        if (catData) setCategories(catData);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const addToCart = (menu: Menu) => {
    if (!menu.isAvailable) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === menu.id);
      if (existing) return prev.map(item => item.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...menu, quantity: 1, notes: '' }];
    });
  };

  const removeFromCart = (menuId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === menuId);
      if (existing && existing.quantity > 1) return prev.map(item => item.id === menuId ? { ...item, quantity: item.quantity - 1 } : item);
      return prev.filter(item => item.id !== menuId);
    });
  };

  const updateNotes = (menuId: string, notes: string) => {
    setCart(prev => prev.map(item => item.id === menuId ? { ...item, notes: notes } : item));
  };

  const handleFinalCheckout = (method: PaymentMethod) => {
    if (!customerName.trim()) return alert("Nama wajib diisi!");
    if (orderType === 'PRE_ORDER' && !eventDate) return alert("Harap tentukan tanggal untuk Pre-Order!");
    
    onSubmitOrder([...cart], customerName, orderType, method, tableNumber, eventDate);
    
    if (method === 'QRIS') {
      const waMessage = `*KONFIRMASI PEMBAYARAN QRIS* 🥩✨
------------------------------------------
Halo Admin *Fantasteak*, saya *${customerName}*.
Saya ingin mengonfirmasi pembayaran pesanan saya melalui QRIS.

*Detail Pesanan:*
- Total Bayar: *Rp ${total.toLocaleString()}*
- Tipe Pesanan: *${orderType.replace('_', ' ')}*
${tableNumber ? `- Nomor Meja: *${tableNumber}*\n` : ''}${eventDate ? `- Tanggal Acara: *${new Date(eventDate).toLocaleDateString('id-ID')}*\n` : ''}
*Mohon tunggu sebentar, berikut saya lampirkan Bukti Screenshot (SS) pembayarannya di bawah ini:*
------------------------------------------`;

      window.open(`https://wa.me/6285854203343?text=${encodeURIComponent(waMessage)}`, '_blank');
    }
    
    setCart([]); 
    setShowCheckout(false); 
    setShowQRIS(false); 
    setShowSuccess(true);
  };

  const filteredMenus = useMemo(() => activeCategory === 'SEMUA' ? menus : menus.filter(m => m.categoryId === activeCategory), [activeCategory, menus]);

  return (
    <div className="w-full bg-zinc-950 min-h-screen pb-48 font-['Plus_Jakarta_Sans']">
      <div className="max-w-2xl mx-auto">
        <header className="px-6 py-6 flex justify-between items-center sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900/50 mb-6">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} className="h-10 sm:h-14 w-auto" alt="Logo" />
            <div>
              <h1 className="font-black text-white uppercase italic text-sm sm:text-lg leading-none tracking-tighter">FANTASTEAK</h1>
              <p className="text-[6px] sm:text-[8px] text-amber-500 uppercase font-black mt-1 tracking-widest italic">Petualangan Rasa, Teman Bercerita</p>
            </div>
          </div>
        </header>

        {banners.length > 0 && (
          <div className="w-full mb-10 overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              {banners.map(banner => (
                <div key={banner.id} className="min-w-full px-4 sm:px-6 snap-center">
                  <div className="w-full aspect-video sm:aspect-[21/9] bg-zinc-900 rounded-[32px] sm:rounded-[48px] overflow-hidden relative border border-zinc-800 shadow-2xl">
                    <img src={banner.image} className="w-full h-full object-cover opacity-60" alt={banner.title} />
                    <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-end bg-gradient-to-t from-zinc-950/90 via-zinc-950/10 to-transparent">
                      <p className="text-white font-black italic text-xl sm:text-4xl uppercase leading-tight tracking-tighter">{banner.title}</p>
                      <div className="w-12 h-1 bg-amber-600 mt-4 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 flex gap-2 overflow-x-auto scrollbar-hide mb-8 sticky top-24 z-30">
          {[{ id: 'SEMUA', name: 'SEMUA' }, ...categories].map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all italic border whitespace-nowrap ${activeCategory === cat.id ? 'bg-amber-600 border-amber-500 text-zinc-950' : 'bg-zinc-900/80 backdrop-blur-md border-zinc-800 text-zinc-500'}`}>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="px-6 grid grid-cols-1 gap-6">
          {filteredMenus.map(menu => {
            const itemInCart = cart.find(i => i.id === menu.id);
            return (
              <div key={menu.id} className={`group p-4 sm:p-6 bg-zinc-900/30 rounded-[40px] border border-zinc-900/50 flex flex-col gap-6 transition-all hover:border-amber-600/30 ${!menu.isAvailable ? 'grayscale opacity-50' : ''}`}>
                <div 
                  className="relative w-full aspect-video rounded-[32px] overflow-hidden bg-zinc-800 cursor-zoom-in"
                  onClick={() => setSelectedMenuDetail(menu)}
                >
                  <img src={menu.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={menu.name} />
                  {menu.badge && <div className="absolute top-4 left-4 bg-amber-600 text-zinc-950 text-[7px] sm:text-[9px] font-black px-4 py-2 rounded-full uppercase italic z-10 shadow-lg">{menu.badge}</div>}
                  {!menu.isAvailable && <div className="absolute inset-0 bg-black/80 flex items-center justify-center font-black italic text-white uppercase text-2xl">Sold Out</div>}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-zinc-950/80 p-3 rounded-full border border-zinc-800">
                      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-black text-zinc-100 text-xl sm:text-2xl uppercase italic tracking-tighter leading-tight">{menu.name}</h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-2 italic leading-relaxed">{menu.description}</p>
                    </div>
                    <span className="font-black text-amber-500 text-xl sm:text-2xl italic tracking-tighter ml-4">Rp{(menu.price/1000).toLocaleString()}k</span>
                  </div>
                  
                  {itemInCart ? (
                    <div className="flex flex-col gap-4 pt-4 border-t border-zinc-800/50">
                      <input 
                        type="text" 
                        placeholder="Tambahkan catatan (contoh: pedas, tanpa bawang)..." 
                        value={itemInCart.notes || ''} 
                        onChange={(e) => updateNotes(menu.id, e.target.value)}
                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] text-zinc-300 italic focus:border-amber-600 outline-none transition-all"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-zinc-950 rounded-full p-1 border border-zinc-800">
                          <button onClick={() => removeFromCart(menu.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400">-</button>
                          <span className="text-sm font-black px-6 text-zinc-100 italic">{itemInCart.quantity}</span>
                          <button onClick={() => addToCart(menu)} className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-600 text-zinc-950 shadow-lg">+</button>
                        </div>
                        <p className="text-[10px] font-black italic text-amber-500 uppercase">Total: Rp{(itemInCart.price * itemInCart.quantity / 1000).toLocaleString()}k</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button onClick={() => addToCart(menu)} disabled={!menu.isAvailable} className="px-10 py-4 bg-zinc-950 border border-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-amber-600 hover:text-zinc-950 italic transition-all">Pilih Menu</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-[32px] p-6 flex justify-between items-center text-zinc-100 shadow-2xl z-40">
          <div>
            <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest italic">{cart.reduce((a, b) => a + b.quantity, 0)} Item</p>
            <p className="text-2xl font-black italic tracking-tighter">Rp {(total/1000).toLocaleString()}k</p>
          </div>
          <button onClick={() => setShowCheckout(true)} className="bg-amber-600 text-zinc-950 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest italic active:scale-95 transition-all">Pesan Sekarang</button>
        </div>
      )}

      {selectedMenuDetail && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-zinc-950/98 backdrop-blur-2xl" onClick={() => setSelectedMenuDetail(null)} />
          <div className="relative w-full max-w-2xl bg-zinc-900 rounded-[56px] overflow-hidden border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedMenuDetail(null)}
              className="absolute top-6 right-6 z-50 w-12 h-12 bg-zinc-950/80 border border-zinc-800 text-zinc-400 rounded-full flex items-center justify-center hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="overflow-y-auto scrollbar-hide flex-1">
              <div className="relative w-full aspect-video sm:aspect-[16/10]">
                <img src={selectedMenuDetail.image} className="w-full h-full object-cover" alt={selectedMenuDetail.name} />
                {selectedMenuDetail.badge && <div className="absolute top-6 left-6 bg-amber-600 text-zinc-950 text-[10px] font-black px-5 py-2 rounded-full uppercase italic z-10">{selectedMenuDetail.badge}</div>}
              </div>

              <div className="p-8 sm:p-12 space-y-8">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase tracking-tighter leading-none">{selectedMenuDetail.name}</h2>
                    <p className="text-xs sm:text-sm text-zinc-400 italic mt-4 leading-relaxed">{selectedMenuDetail.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl sm:text-3xl font-black text-amber-500 italic tracking-tighter">Rp {(selectedMenuDetail.price/1000).toLocaleString()}k</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-zinc-800/50">
                  {(() => {
                    const itemInCart = cart.find(i => i.id === selectedMenuDetail.id);
                    return itemInCart ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black uppercase text-amber-500 italic">Catatan Khusus:</p>
                           <input 
                            type="text" 
                            placeholder="Contoh: Sangat pedas, tanpa telur..." 
                            value={itemInCart.notes || ''} 
                            onChange={(e) => updateNotes(selectedMenuDetail.id, e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-zinc-100 italic focus:border-amber-600 outline-none"
                          />
                        </div>
                        <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-3xl border border-zinc-800">
                           <div className="flex items-center gap-6">
                              <button onClick={() => removeFromCart(selectedMenuDetail.id)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors">-</button>
                              <span className="text-xl font-black text-white italic">{itemInCart.quantity}</span>
                              <button onClick={() => addToCart(selectedMenuDetail)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-amber-600 text-zinc-950 shadow-lg transition-transform active:scale-95">+</button>
                           </div>
                           <p className="text-sm font-black italic text-zinc-500 uppercase">Sub: Rp {(itemInCart.price * itemInCart.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(selectedMenuDetail)}
                        disabled={!selectedMenuDetail.isAvailable}
                        className="w-full py-6 bg-amber-600 text-zinc-950 rounded-3xl font-black text-[12px] uppercase italic tracking-widest shadow-xl shadow-amber-600/10 active:scale-[0.98] transition-all disabled:grayscale disabled:opacity-50"
                      >
                        {selectedMenuDetail.isAvailable ? 'Tambahkan ke Pesanan' : 'Habis Terjual'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-zinc-950/98 backdrop-blur-3xl" onClick={() => setShowCheckout(false)} />
          <div className="relative w-full max-w-xl bg-zinc-900 rounded-[56px] p-8 sm:p-12 border border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <h2 className="text-2xl sm:text-3xl font-black italic text-zinc-100 mb-10 uppercase text-center border-b border-zinc-800 pb-8 tracking-tighter">Ringkasan Pesanan</h2>
            <div className="space-y-6">
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama Lengkap" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-6 text-zinc-100 text-sm font-bold focus:border-amber-600 outline-none" />
              <div className="grid grid-cols-3 gap-2">
                {(['DINE_IN', 'TAKEAWAY', 'PRE_ORDER'] as OrderType[]).map(type => (
                  <button key={type} onClick={() => setOrderType(type)} className={`py-5 rounded-2xl text-[8px] font-black uppercase border transition-all ${orderType === type ? 'bg-amber-600 border-amber-500 text-zinc-950 italic' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}>{type.replace('_',' ')}</button>
                ))}
              </div>
              
              {orderType === 'DINE_IN' && (
                <input 
                  type="text" 
                  value={tableNumber} 
                  onChange={(e) => setTableNumber(e.target.value)} 
                  placeholder="Nomor Meja" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-6 text-zinc-100 text-sm font-bold animate-in fade-in" 
                />
              )}
              {orderType === 'PRE_ORDER' && (
                <div className="space-y-2 animate-in fade-in">
                  <p className="text-[10px] font-black uppercase text-amber-600 italic px-2">Pilih Tanggal Acara:</p>
                  <input 
                    type="date" 
                    value={eventDate} 
                    onChange={(e) => setEventDate(e.target.value)} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-6 text-zinc-100 text-sm font-bold focus:border-amber-600 outline-none" 
                  />
                </div>
              )}
              
              <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                {cart.map(item => (
                  <div key={item.id} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-zinc-100 text-xs font-bold italic uppercase tracking-tighter">
                      <span>{item.quantity}x {item.name}</span>
                      <span>Rp{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                    {item.notes && <p className="text-[10px] text-amber-500 italic ml-4">Catatan: {item.notes}</p>}
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase italic">Total Akhir</span>
                <span className="text-3xl font-black text-amber-500 italic tracking-tighter">Rp {total.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => setShowQRIS(true)} className="bg-white text-zinc-950 py-6 rounded-2xl font-black text-[10px] uppercase italic">Pake QRIS</button>
                <button onClick={() => handleFinalCheckout('CASH')} className="bg-zinc-800 text-zinc-100 py-6 rounded-2xl font-black text-[10px] uppercase italic border border-zinc-700">Bayar Kasir</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQRIS && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-zinc-950/98 backdrop-blur-3xl">
          <div className="relative w-full max-w-sm bg-white rounded-[56px] p-10 flex flex-col items-center animate-in zoom-in-95">
            <img src={LOGO_URL} className="h-10 w-auto mb-8 invert" alt="Logo" />
            <div className="bg-zinc-100 p-4 rounded-[32px] mb-8 border border-zinc-200">
              <img src={QRIS_IMAGE_URL} className="w-full h-auto rounded-2xl shadow-xl" alt="QRIS" />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase italic mb-6 text-center">Silakan Scan & Bayar, lalu klik konfirmasi di bawah.</p>
            <button onClick={() => handleFinalCheckout('QRIS')} className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase italic shadow-xl">Konfirmasi Sudah Bayar</button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-zinc-950/98 backdrop-blur-3xl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[56px] p-12 text-center max-w-sm w-full animate-in zoom-in-90">
            <h2 className="text-3xl font-black italic text-zinc-100 uppercase mb-4 tracking-tighter">SUKSES!</h2>
            <p className="text-[11px] text-zinc-400 italic mb-10 leading-relaxed">Pesanan Anda telah diterima sistem. Silakan duduk manis, tim kami akan segera memproses menu favorit Anda.</p>
            <button onClick={() => setShowSuccess(false)} className="w-full py-6 bg-zinc-100 text-zinc-950 rounded-2xl font-black text-[10px] uppercase italic">Pesan Lagi</button>
          </div>
        </div>
      )}
    </div>
  );
};
