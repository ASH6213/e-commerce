export type UserOrderDTO = {
  customerId: number;
  shippingAddress: string;
  totalPrice: number;
  deliveryDate?: number;
  paymentType: string;
  deliveryType?: string;
  sendEmail?: boolean;
  branchId?: number;
  products: Array<{
    id: number;
    quantity: number;
  }>;
};

export type UserOrderResponseDTO = {
  success: boolean;
  data: {
    orderNumber: string;
    customerId: number;
    shippingAddress: string;
    totalPrice: number;
    deliveryDate: string;
    paymentType: string;
    deliveryType: string;
    orderDate: string;
  };
};
