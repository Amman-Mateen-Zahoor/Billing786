export type InvoiceStatus = "Received" | "Pending";

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string; // InvId (unique string)
  clientName: string;
  date: string; // ISO date string
  items: LineItem[];
  grandTotal: number;
  status: InvoiceStatus;
  createdAt?: string;
}
