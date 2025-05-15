export interface PaymentRequest {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
    buyerEmail?: string; // Thêm trường để lưu employerId
  }
  
  export interface PaymentResponse {
    checkoutUrl: string;
  }
  
  export interface WebhookData {
    orderCode: number;
    amount: number;
    status: string;
    buyerEmail?: string;
  }