import { create } from 'zustand';

/**
 * Sidebar state store
 * Controls sidebar open/closed state for mobile responsiveness
 */
export const useSidebarStore = create((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
  open: () => set({ isOpen: true }),
}));
