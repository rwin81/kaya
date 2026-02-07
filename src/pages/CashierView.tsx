import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import EscPosEncoder from 'esc-pos-encoder';

interface Props {
  orders: Order[];
  onUpdateOrder: (id: string, status: OrderStatus) => void;
  onRefresh?: () => void;
  onExit: () => void;
}

const LOGO_URL = "https://lh3.googleusercontent.com/d/1Aw-CPHKJVjcAASUZJEd7cH5g5sm5y9sa";

export const CashierView: React.FC<Props> = ({ orders, onUpdateOrder, onRefresh, onExit }) => {
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Hanya tampilkan pesanan yang belum selesai (PAID)
  const activeOrders = orders.filter(o => o.status !== 'PAID');

  // FUNGSI UTAMA: CETAK BLUETOOTH DIRECT
  const handleDirectPrint = async (order: Order) => {
    setIsPrinting(true);
    try {
      const encoder = new EscPosEncoder();
      
      // Susun Bahasa Printer (ESC/POS)
      const result = encoder
        .initialize()
        .align('center')
        .line('FANTASTEAK')
        .line('Premium Steakhouse')
        .line('Bojonegoro, Jawa Timur')
        .line('WA: 0858-5420-3343')
        .line('--------------------------------')
        .align('left')
        .line(`Pelanggan: ${order.customerName}`)
        .line(`Order ID: #${order.id}`)
        .line(`Meja: ${order.tableNumber || '-'}`)
        .line(`Tipe: ${order.orderType}`)
        .line('--------------------------------');

      // Loop Item Pesanan
      order.items.forEach(item => {
        result
          .line(`${item.quantity}x ${item.name.toUpperCase()}`)
          .align('right')
          .line(`Rp ${(item.price * item.quantity).toLocaleString()}`)
          .align('left');
        if (item.notes) result.line(`* ${item.notes}`);
      });

      const finalData = result
        .line('--------------------------------')
        .align('right')
        .bold(true)
        .line(`GRAND TOTAL: Rp ${order.total.toLocaleString()}`)
        .bold(false)
        .line(' ')
        .align('center')
        .line('Terima kasih atas')
        .line('kunjungan Anda!')
        .line(' ')
        .cut()
        .encode();

      // Request Bluetooth Device
      // Note: UUID ini adalah standar untuk printer thermal Bluetooth (Generic)
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      // Kirim Data Biner ke Printer
      await characteristic.writeValue(finalData);
      
    } catch (error) {
      console.error("Print Error:", error);
      alert("Gagal menyambungkan ke printer. Pastikan Bluetooth aktif dan Printer menyala.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-['Plus_Jakarta_Sans'] p-6 sm:p-10 print:p-0 print:bg-white">
      <div className="max-w-[1900px] mx-auto print:hidden">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-zinc-900 pb-12 gap-10">
          <div className="flex items-center gap-8">
            <img src={LOGO_URL} className="h-16 sm:h-24 w-auto" alt="Logo" />
            <div className="space-y-4">
              <p className="text-amber-600 font-black text-[10px] uppercase tracking-[0.6em] italic leading-none">Management Console</p>
              <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter uppercase text-white leading-none">Antrean<br/>Dapur</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onRefresh} title="Refresh Data" className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-amber-500 transition-all active:rotate-180">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button onClick={onExit} title="Keluar Panel" className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-red-500 transition-all active:scale-95">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
            <div className="w-20 h-20 ml-2 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center text-amber-500 text-4xl font-black italic shadow-2xl">
               {activeOrders.length}
            </div>
          </div>
        </header>

        {/* KONTEN UTAMA (ORDER CARDS) */}
        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-zinc-900 rounded-[64px] opacity-30">
             <p className="font-black italic uppercase tracking-widest text-sm">Menunggu Pesanan Baru...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-zinc-900/40 border border-zinc-900 rounded-[48px] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-5">
                <div className="p-8 border-b border-zinc-900/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-zinc-500 uppercase px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg">{order.id}</span>
                    <p className="text-2xl font-black italic text-zinc-100 tracking-tighter">Rp{(order.total/1000).toLocaleString()}k</p>
                  </div>
                  <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase truncate">{order.customerName}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest italic px-3 py-1 bg-amber-600/5 border border-amber-600/10 rounded-full w-fit">
                      {order.orderType} {order.tableNumber ? `(Mj ${order.tableNumber})` : ''}
                    </span>
                    {order.eventDate && (
                       <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest italic px-3 py-1 bg-cyan-400/5 border border-cyan-400/10 rounded-full w-fit">
                        📅 {new Date(order.eventDate).toLocaleDateString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-8 space-y-4 max-h-[350px] overflow-y-auto scrollbar-hide">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="bg-zinc-950/60 p-5 rounded-[28px] border border-zinc-900/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-sm uppercase italic text-zinc-100">{item.quantity}x {item.name}</span>
                        <span className="text-[10px] font-bold text-zinc-500 italic">Rp{(item.price * item.quantity / 1000).toLocaleString()}k</span>
                      </div>
                      {item.notes && (
                        <p className="text-[10px] text-amber-500 italic font-black uppercase mt-2 border-l-2 border-amber-500/30 pl-2">
                          REQ: {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-8 bg-zinc-950/80 border-t border-zinc-900 flex gap-4">
                  {order.status === 'PENDING' ? (
                    <button onClick={() => onUpdateOrder(order.id, 'CONFIRMED')} className="flex-1 py-6 bg-amber-600 text-zinc-950 rounded-[24px] font-black text-[10px] uppercase italic shadow-xl">PROSES</button>
                  ) : (
                    <button onClick={() => { onUpdateOrder(order.id, 'PAID'); setSelectedReceipt(order); }} className="flex-1 py-6 bg-emerald-600 text-zinc-950 rounded-[24px] font-black text-[10px] uppercase italic shadow-xl">SELESAI</button>
                  )}
                  <button onClick={() => setSelectedReceipt(order)} className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-all active:scale-95">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL STRUK DIGITAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 print:p-0">
          <div className="absolute inset-0 bg-zinc-950/98 backdrop-blur-3xl print:hidden" onClick={() => setSelectedReceipt(null)} />
          <div className="relative w-full max-w-[420px] bg-white text-zinc-950 rounded-[64px] p-12 shadow-2xl flex flex-col items-center animate-in zoom-in-95 print:shadow-none print:rounded-none">
            
            <img src={LOGO_URL} className="h-16 w-auto mb-2 invert" alt="Logo" />
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-1">FANTASTEAK</h2>
            <p className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4 italic text-center">Petualangan Rasa, Teman Bercerita</p>
            
            <div className="w-full text-center border-y border-zinc-200 py-4 mb-6 space-y-1 text-zinc-800">
              <p className="text-[8px] font-black uppercase italic leading-tight">
                Depan Gedung Pusyan Gatra Kencana, Bojonegoro
              </p>
              <p className="text-[8px] font-bold text-zinc-400 mt-1 italic">WA: 0858-5420-3343</p>
            </div>

            <div className="w-full space-y-3 mb-6">
              <div className="flex justify-between text-[11px] font-black uppercase italic">
                <span>Pelanggan: {selectedReceipt.customerName}</span>
                <span className="text-zinc-400">#{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between text-[9px] font-bold text-zinc-400 uppercase italic">
                <span>Pesan: {new Date(selectedReceipt.createdAt).toLocaleDateString('id-ID', { hour:'2-digit', minute:'2-digit' })}</span>
                <span>{selectedReceipt.tableNumber ? `Meja: ${selectedReceipt.tableNumber}` : ''}</span>
              </div>
            </div>

            <div className="w-full border-t border-zinc-200 border-dashed pt-4 mb-4 space-y-4">
              {selectedReceipt.items.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1 border-b border-zinc-50 pb-2">
                  <div className="flex justify-between text-[11px] font-bold italic uppercase tracking-tight">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-mono text-xs">Rp{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full border-t-2 border-zinc-950 pt-5 mb-10 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase italic tracking-widest text-zinc-400">Total</span>
                <span className="text-3xl font-black italic tracking-tighter">Rp{selectedReceipt.total.toLocaleString()}</span>
            </div>

            {/* BUTTONS */}
            <div className="print:hidden w-full grid grid-cols-1 gap-4">
               <button 
                onClick={() => handleDirectPrint(selectedReceipt)} 
                disabled={isPrinting}
                className={`py-5 text-white rounded-[24px] font-black text-[10px] uppercase italic shadow-xl transition-all ${isPrinting ? 'bg-zinc-600' : 'bg-emerald-600 active:scale-95'}`}
               >
                 {isPrinting ? 'Mencetak...' : 'CETAK STRUK (BLUETOOTH)'}
               </button>
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => window.print()} className="py-4 bg-zinc-950 text-white rounded-[20px] font-black text-[9px] uppercase italic">Browser Print</button>
                  <button onClick={() => setSelectedReceipt(null)} className="py-4 bg-zinc-100 text-zinc-950 rounded-[20px] font-black text-[9px] uppercase italic border border-zinc-200">Tutup</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
