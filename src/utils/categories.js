export const CATEGORIES = [
  { id: 'All', name: 'All', icon: 'silverware-fork-knife', color: '#333' },
  { id: 'Burger', name: 'Burger', icon: 'hamburger', color: '#FF5722' },
  { id: 'Coffee', name: 'Coffee', icon: 'coffee', color: '#795548' },
  { id: 'Pizza', name: 'Pizza', icon: 'pizza', color: '#E91E63' },
  { id: 'Healthy', name: 'Healthy', icon: 'leaf', color: '#4CAF50' },
  { id: 'Dessert', name: 'Dessert', icon: 'ice-cream', color: '#E91E63' },
];

export const getCategoryIcon = (category) => {
  const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  return { icon: cat.icon, color: cat.color };
};