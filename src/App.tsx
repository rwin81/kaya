import React, { useState, useEffect, useCallback } from 'react';
import { CustomerView } from './pages/CustomerView';
import { CashierView } from './pages/CashierView';
import { AdminView } from './pages/AdminView';
import { Order, CartItem, PaymentMethod, OrderType } from './types';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const [view, setView] = useState<'customer' | 'cashier' | 'admin'>('customer');
  const [orders, setOrders] = useState<Order[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingView, setPendingView] = useState<'customer' | 'cashier' | 'admin' | null>(null);
  const [password, setPassword] = useState('');

  const PASSWORDS = {
    cashier: 'kasirqu',
    admin: 'adminqu'
  };

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Fetch Error:", error);
        return;
      }

      if (data) {
        const mappedOrders: Order[] = data.map((o: any) => ({
          id: o.id,
          customerName: o.customer_name || 'Pelanggan',
          orderType: (o.order_type as OrderType) || 'DINE_IN',
          tableNumber: o.table_number,
          eventDate: o.event_date,
          status: o.status || 'PENDING',
          paymentMethod: (o.payment_method as PaymentMethod) || 'CASH',
          total: Number(o.total || 0),
          createdAt: o.created_at,
          items: (o.order_items || []).map((i: any) => ({
            id: i.menu_id,
            name: i.name_at_time || 'Item',
            price: Number(i.price_at_time || 0),
            quantity: i.quantity || 1,
            notes: i.notes || '',
            categoryId: '',
            description: '',
            image: '',
            isAvailable: true
          }))
        }));
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error("Critical System Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const subscription = supabase
      .channel('db-all-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchOrders]);

  const handleNewOrder = async (items: CartItem[], name: string, type: OrderType, payment: PaymentMethod, table?: string, eventDate?: string) => {
    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const orderId = `FT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 99)}`;

    try {
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          customer_name: name,
          order_type: type,
          table_number: table || null,
          event_date: eventDate || null,
          status: 'PENDING',
          payment_method: payment,
          total: total
        });

      if (orderError) throw orderError;

      const orderItemsPayload = items.map(item => ({
        order_id: orderId,
        menu_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
        name_at_time: item.name,
        notes: item.notes || ''
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsPayload);

      if (itemsError) throw itemsError;

      await fetchOrders();
    } catch (err) {
      console.error("Transaction Failed:", err);
      alert("Gagal mengirim pesanan. Pastikan tabel database sudah sesuai schema.");
    }
  };

  const handleUpdateOrder = async (orderId: string, status: Order['status']) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    fetchOrders();
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingView && password === PASSWORDS[pendingView as keyof typeof PASSWORDS]) {
      setView(pendingView);
      setIsAuthModalOpen(false);
      setPassword('');
    } else {
      alert("Password Salah!");
    }
  };

  const logout = () => {
    setView('customer');
    setShowMenu(false);
    setIsAuthModalOpen(false);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      
      {/* CATATAN: 
          Tombol Logout global yang besar SUDAH DIHAPUS di sini.
          Sekarang kita mengoper fungsi 'logout' ke dalam prop 'onExit' 
          di CashierView dan AdminView di bawah ini.
      */}

      {view === 'customer' ? (
        <CustomerView onSubmitOrder={handleNewOrder} />
      ) : view === 'cashier' ? (
        // Menambahkan prop onExit={logout}
        <CashierView 
          orders={orders} 
          onUpdateOrder={handleUpdateOrder} 
          onRefresh={fetchOrders} 
          onExit={logout} 
        />
      ) : (
        // Menambahkan prop onExit={logout}
        <AdminView 
          orders={orders} 
          onExit={logout} 
        />
      )}

      {/* Switcher Menu (Hanya muncul di tampilan customer) */}
      {view === 'customer' && !isAuthModalOpen && (
        <div className="fixed bottom-8 right-8 z-[100] print:hidden">
            {showMenu && (
              <div className="absolute bottom-20 right-0 bg-zinc-900 border border-zinc-800 p-3 rounded-[32px] shadow-2xl min-w-[200px] animate-in slide-in-from-bottom-5">
                <button onClick={() => { setView('customer'); setShowMenu(false); }} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${(view as string) === 'customer' ? 'bg-amber-600 text-zinc-950 italic' : 'text-zinc-500 hover:bg-zinc-800'}`}>📱 Menu Tamu</button>
                <button onClick={() => { setPendingView('cashier'); setIsAuthModalOpen(true); setShowMenu(false); }} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${(view as string) === 'cashier' ? 'bg-amber-600 text-zinc-950 italic' : 'text-zinc-500 hover:bg-zinc-800'}`}>🖥️ Kasir POS</button>
                <button onClick={() => { setPendingView('admin'); setIsAuthModalOpen(true); setShowMenu(false); }} className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${(view as string) === 'admin' ? 'bg-amber-600 text-zinc-950 italic' : 'text-zinc-500 hover:bg-zinc-800'}`}>📊 Panel Admin</button>
              </div>
            )}
            <button onClick={() => setShowMenu(!showMenu)} className="w-14 h-14 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-amber-500 shadow-2xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </button>
        </div>
      )}

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-zinc-950/95 backdrop-blur-3xl">
          <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-[48px] p-10 shadow-2xl">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-zinc-100 text-center flex-1">Keamanan</h2>
                <button onClick={logout} className="text-zinc-600 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             <form onSubmit={handleAuthSubmit} className="space-y-6">
                <input 
                  autoFocus 
                  type="password" 
                  placeholder="••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-600 rounded-2xl px-6 py-5 outline-none text-zinc-100 text-center tracking-[1em] text-lg font-black" 
                />
                <button type="submit" className="w-full py-5 bg-amber-600 text-zinc-950 rounded-[24px] font-black text-[10px] uppercase italic shadow-xl shadow-amber-600/10 active:scale-95 transition-all">Masuk</button>
                <button type="button" onClick={logout} className="w-full py-4 bg-transparent text-zinc-500 rounded-[20px] font-bold text-[9px] uppercase italic hover:text-white transition-colors">Batalkan</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
