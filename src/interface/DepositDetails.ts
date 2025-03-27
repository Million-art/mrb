export interface Ambassador {
    id: string;
    name: string;
    username: string;
  }
  
  export interface Payment {
    bank: string;
    account: string;
    type: string;
  }
  
  export interface ReceiptData {
    ambassador: Ambassador;
    payment: Payment;
    timestamp: number;
  }
  
  export interface ReceiptState {
    data: ReceiptData | null;
    loading: boolean;
    error: string | null;
    uploadProgress: number;
    uploadSuccess: boolean;
    isInitialized: boolean;
  }