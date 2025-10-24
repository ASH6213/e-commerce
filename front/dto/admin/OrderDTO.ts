export type AdminOrderSummaryDTO = {
  id: number;
  orderNumber: string;
  customer?: string;
  email?: string;
  total: number;
  status: string;
  date: string;
  items: number;
};

export type AdminOrderDetailDTO = {
  id: number;
  orderNumber: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string | null;
    shippingAddress?: string;
  };
  items: Array<{ 
    id: number; 
    productName: string; 
    quantity: number; 
    price: number; 
    total: number 
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  date: string;
};
