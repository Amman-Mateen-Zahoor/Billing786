import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { Invoice } from "../types";

const STORAGE_KEY = "IMS_INVOICES_v1";

interface InvoiceState {
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => Promise<{ ok: boolean; error?: string }>;
  updateInvoice: (invoice: Invoice) => Promise<{ ok: boolean; error?: string }>;
  deleteInvoice: (id: string) => Promise<void>;
  loadInvoices: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const useInvoiceStore = create<InvoiceState>((set :any, get:any) => ({
  invoices: [],

  addInvoice: async (invoice:any) => {
    const invoices = get().invoices;
    if (invoices.find((i : any) => i.id === invoice.id)) {
      return { ok: false, error: "Invoice ID must be unique." };
    }
    const newInvoices = [invoice, ...invoices];
    set({ invoices: newInvoices });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newInvoices));
      return { ok: true };
    } catch (e) {
      console.warn("Failed to persist invoices", e);
      return { ok: false, error: "Failed to save invoice." };
    }
  },

  updateInvoice: async (invoice : any) => {
    const invoices = get().invoices;
    const idx = invoices.findIndex((i:any) => i.id === invoice.id);
    if (idx === -1) return { ok: false, error: "Invoice not found." };
    // ensure no other invoice uses same id - but since id is key we assume it's same
    const newInvoices = [...invoices];
    newInvoices[idx] = invoice;
    set({ invoices: newInvoices });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newInvoices));
      return { ok: true };
    } catch (e) {
      console.warn("Failed to persist invoices", e);
      return { ok: false, error: "Failed to update invoice." };
    }
  },

  deleteInvoice: async (id:any) => {
    const newInvoices = get().invoices.filter((i:any) => i.id !== id);
    set({ invoices: newInvoices });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newInvoices));
    } catch (e) {
      console.warn("Failed to persist invoices", e);
    }
  },

  loadInvoices: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ invoices: [] });
        return;
      }
      const parsed: Invoice[] = JSON.parse(raw) || [];
      set({ invoices: parsed });
    } catch (e) {
      console.warn("Failed to load invoices", e);
      set({ invoices: [] });
    }
  },

  clearAll: async () => {
    set({ invoices: [] });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));

// helper to call loadInvoices outside react components
export const loadInvoices = async () => {
  // temporary store instance to call loadInvoices
  const s = useInvoiceStore.getState();
  await s.loadInvoices();
};

export default useInvoiceStore;
