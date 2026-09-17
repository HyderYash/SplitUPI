export type PaymentStatus = "pending" | "paid" | "cancelled";

export interface Payment {
  id: string;
  amountPaise: number;
  status: PaymentStatus;
  paidAt?: string;
  openedAt?: string;
}

export interface PaymentSession {
  id: string;
  merchantName: string;
  vpa: string;
  invoice: string;
  totalPaise: number;
  payments: Payment[];
  createdAt: string;
  isDemo: boolean;
  parallel: boolean;
  status: "active" | "cancelled";
}
