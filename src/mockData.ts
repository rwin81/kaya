
import { Category, Menu, PromoBanner } from './types';

export const categories: Category[] = [
  { id: '1', name: 'Signature Steak' },
  { id: '2', name: 'Premium Cut' },
  { id: '3', name: 'Minuman' },
  { id: '4', name: 'Pencuci Mulut' }
];

export const menus: Menu[] = [
  {
    id: 'm1',
    categoryId: '1',
    name: 'Wagyu Ribeye MB9+',
    price: 450000,
    description: 'Bistik Wagyu premium dengan marbling sempurna, disajikan dengan truffle fries.',
    image: 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?auto=format&fit=crop&w=800&q=80',
    badge: 'Paling Laris',
    isAvailable: true
  },
  {
    id: 'm2',
    categoryId: '1',
    name: 'Sirloin Black Angus',
    price: 275000,
    description: 'Steak Sirloin 200g dari sapi Black Angus pilihan.',
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80',
    badge: 'Favorit',
    isAvailable: true
  },
  {
    id: 'm3',
    categoryId: '2',
    name: 'Tenderloin Local Heritage',
    price: 185000,
    description: 'Daging khas dalam lokal berkualitas dengan tekstur lembut.',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
    isAvailable: true
  },
  {
    id: 'm4',
    categoryId: '3',
    name: 'Iced Lychee Tea',
    price: 35000,
    description: 'Teh segar dengan buah leci asli.',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    badge: 'Paket Promo',
    isAvailable: true
  }
];

export const banners: PromoBanner[] = [
  {
    id: 'b1',
    title: 'Diskon 20% Member Baru',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    isActive: true
  }
];
