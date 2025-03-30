export interface QuoteResponse {
  id: string;
  source_amount: number;
  quoted_amount: number;
  exchange_rate: number;
  source: {
    currency: string;
    payment_rail: string;
  };
  destination: {
    currency: string;
    account_id: string;
  };
  status: string;
  created_at: string;
  expires_at: string;
  total_fees: number;
}

export interface ExchangeRateResponse {
    rate: number;
  }