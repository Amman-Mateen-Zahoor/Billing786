export interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  clientName: string;
  date: string;
  items: LineItem[];
  grandTotal: number;
  status: string;
  createdAt: string;
}