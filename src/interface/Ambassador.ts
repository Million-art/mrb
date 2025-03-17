
export interface PaymentMethod {
    id: string
    bankName: string
    accountNumber: string
    accountName: string
    swiftCode?: string
  }

export interface Ambassador {
    id: string;
    firstName: string;
    lastName: string;
    tgUsername: string;
    email?: string;
    phone: string;
    address?: string; // Optional field
    idFront?: string; // Optional field (URL or base64 string)
    idBack?: string; // Optional field (URL or base64 string)
    country: string;
    photoUrl?: string; // Optional field (URL or base64 string)
    paymentMethods?: PaymentMethod[]; // Array of payment methods
    createdAt?: Date;
    role: string; //  "ambassador", "admin"
    kyc?: string; // Optional field ( "pending", "approved", "rejected")
  }
  