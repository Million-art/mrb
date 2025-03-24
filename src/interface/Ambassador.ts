

export interface PaymentMethod {
  type: string;
  details: Record<string, any>;
}

export interface Ambassador {
  id: string;
  firstName: string;
  lastName: string;
  tgUsername: string;
  email: string;
  phone: string;
  address?: string;
  idFront?: string;
  idBack?: string;
  country: string;
  photoUrl?: string;
  paymentMethods: PaymentMethod[];
  createdAt: Date;
  role: string;
  kyc?: string;
}