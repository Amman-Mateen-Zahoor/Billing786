// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { create } from "zustand";
// import { Invoice } from "../types";

// const STORAGE_KEY = "IMS_INVOICES_v1";

// interface InvoiceState {
//   invoices: Invoice[];
//   addInvoice: (invoice: Invoice) => Promise<{ ok: boolean; error?: string }>;
//   updateInvoice: (invoice: Invoice) => Promise<{ ok: boolean; error?: string }>;
//   deleteInvoice: (id: string) => Promise<void>;
//   loadInvoices: () => Promise<void>;
//   clearAll: () => Promise<void>;
// }

// const useInvoiceStore = create<InvoiceState>((set :any, get:any) => ({
//   invoices: [],

//   addInvoice: async (invoice:any) => {
//     const invoices = get().invoices;
//     if (invoices.find((i : any) => i.id === invoice.id)) {
//       return { ok: false, error: "Invoice ID must be unique." };
//     }
//     const newInvoices = [invoice, ...invoices];
//     set({ invoices: newInvoices });
//     try {
//       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newInvoices));
//       return { ok: true };
//     } catch (e) {
//       console.warn("Failed to persist invoices", e);
//       return { ok: false, error: "Failed to save invoice." };
//     }
//   },

//   updateInvoice: async (invoice : any) => {
//     const invoices = get().invoices;
//     const idx = invoices.findIndex((i:any) => i.id === invoice.id);
//     if (idx === -1) return { ok: false, error: "Invoice not found." };
//     // ensure no other invoice uses same id - but since id is key we assume it's same
//     const newInvoices = [...invoices];
//     newInvoices[idx] = invoice;
//     set({ invoices: newInvoices });
//     try {
//       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newInvoices));
//       return { ok: true };
//     } catch (e) {
//       console.warn("Failed to persist invoices", e);
//       return { ok: false, error: "Failed to update invoice." };
//     }
//   },

//   deleteInvoice: async (id:any) => {
//     const newInvoices = get().invoices.filter((i:any) => i.id !== id);
//     set({ invoices: newInvoices });
//     try {
//       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newInvoices));
//     } catch (e) {
//       console.warn("Failed to persist invoices", e);
//     }
//   },

//   loadInvoices: async () => {
//     try {
//       const raw = await AsyncStorage.getItem(STORAGE_KEY);
//       if (!raw) {
//         set({ invoices: [] });
//         return;
//       }
//       const parsed: Invoice[] = JSON.parse(raw) || [];
//       set({ invoices: parsed });
//     } catch (e) {
//       console.warn("Failed to load invoices", e);
//       set({ invoices: [] });
//     }
//   },

//   clearAll: async () => {
//     set({ invoices: [] });
//     await AsyncStorage.removeItem(STORAGE_KEY);
//   },
// }));

// // helper to call loadInvoices outside react components
// export const loadInvoices = async () => {
//   // temporary store instance to call loadInvoices
//   const s = useInvoiceStore.getState();
//   await s.loadInvoices();
// };

// export default useInvoiceStore;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Invoice, PreviousItem } from '../types';

interface InvoiceStore {
  invoices: Invoice[];
  previousItems: PreviousItem[];
  addInvoice: (invoice: Invoice) => Promise<{ ok: boolean; error?: string }>;
  updateInvoice: (invoice: Invoice) => Promise<{ ok: boolean; error?: string }>;
  deleteInvoice: (id: string) => void;
  getSuggestions: (searchText: string) => PreviousItem[];
  loadInvoices: () => Promise<void>;
  // Add function to manually add to previous items if needed
  addToPreviousItems: (description: string, unitPrice: number) => void;
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: [],
      previousItems: [],

      loadInvoices: async () => {
        // This is a no-op since persist handles loading automatically
        console.log('Store loaded from persistence');
        return Promise.resolve();
      },

      addInvoice: async (invoice: Invoice) => {
        try {
          set((state) => {
            // Add items to previous items
            const newPreviousItems = [...state.previousItems];
            
            invoice.items.forEach((item) => {
              if (item.description.trim()) {
                const existingIndex = newPreviousItems.findIndex(
                  (prev) => prev.description.toLowerCase() === item.description.toLowerCase()
                );
                
                if (existingIndex >= 0) {
                  // Update existing item
                  newPreviousItems[existingIndex] = {
                    ...newPreviousItems[existingIndex],
                    unitPrice: item.unitPrice,
                    lastUsed: new Date().toISOString(),
                  };
                } else {
                  // Add new item
                  newPreviousItems.push({
                    id: `prev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    description: item.description,
                    unitPrice: item.unitPrice,
                    lastUsed: new Date().toISOString(),
                  });
                }
              }
            });

            return {
              invoices: [...state.invoices, invoice],
              previousItems: newPreviousItems,
            };
          });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: String(error) };
        }
      },

      updateInvoice: async (invoice: Invoice) => {
        try {
          set((state) => {
            // Update items in previous items
            const newPreviousItems = [...state.previousItems];
            invoice.items.forEach((item) => {
              if (item.description.trim()) {
                const existingIndex = newPreviousItems.findIndex(
                  (prev) => prev.description.toLowerCase() === item.description.toLowerCase()
                );
                
                if (existingIndex >= 0) {
                  // Update existing item
                  newPreviousItems[existingIndex] = {
                    ...newPreviousItems[existingIndex],
                    unitPrice: item.unitPrice,
                    lastUsed: new Date().toISOString(),
                  };
                } else {
                  // Add new item
                  newPreviousItems.push({
                    id: `prev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    description: item.description,
                    unitPrice: item.unitPrice,
                    lastUsed: new Date().toISOString(),
                  });
                }
              }
            });

            return {
              invoices: state.invoices.map((inv) =>
                inv.id === invoice.id ? invoice : inv
              ),
              previousItems: newPreviousItems,
            };
          });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: String(error) };
        }
      },

      deleteInvoice: (id: string) => {
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        }));
      },

      getSuggestions: (searchText: string) => {
        const { previousItems } = get();
        if (!searchText.trim()) {
          return previousItems
            .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
            .slice(0, 5);
        }

        return previousItems
          .filter((item) =>
            item.description.toLowerCase().includes(searchText.toLowerCase())
          )
          .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
          .slice(0, 5);
      },

      addToPreviousItems: (description: string, unitPrice: number) => {
        if (!description.trim()) return;
        
        set((state) => {
          const existingIndex = state.previousItems.findIndex(
            (prev) => prev.description.toLowerCase() === description.toLowerCase()
          );

          if (existingIndex >= 0) {
            // Update existing
            const updated = [...state.previousItems];
            updated[existingIndex] = {
              ...updated[existingIndex],
              unitPrice: unitPrice,
              lastUsed: new Date().toISOString(),
            };
            return { previousItems: updated };
          } else {
            // Add new
            const newItem: PreviousItem = {
              id: `prev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              description: description,
              unitPrice: unitPrice,
              lastUsed: new Date().toISOString(),
            };
            return { previousItems: [...state.previousItems, newItem] };
          }
        });
      },
    }),
    {
      name: 'invoice-storage',
    }
  )
);

// Export loadInvoices for use in App.tsx
export const loadInvoices = () => {
  const store = useInvoiceStore.getState();
  return store.loadInvoices();
};

export default useInvoiceStore;