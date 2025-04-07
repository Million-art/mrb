// API Configuration
export const API_CONFIG = {
  BASE_URL: "http://localhost:3002",
  ENDPOINTS: {
    CUSTOMERS: "/customers",
    BANK_ACCOUNTS: "/bank-accounts"
  }
};

// Helper functions to generate URLs
export const getCustomerUrl = (customerId?: string) => {
  const base = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMERS}`;
  return customerId ? `${base}/${customerId}` : base;
};

export const getBankAccountsUrl = (customerId: string) => {
  return `${getCustomerUrl(customerId)}${API_CONFIG.ENDPOINTS.BANK_ACCOUNTS}`;
};

export const getBankAccountUrl = (customerId: string, bankAccountId: string) => {
  return `${getBankAccountsUrl(customerId)}/${bankAccountId}`;
}; 