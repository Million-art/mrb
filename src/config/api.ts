  // API Configuration
  export const API_CONFIG = {
    BASE_URL2: "dashboard-backend.mrbeas.net",
    BASE_URL: "api.glofica.com",
    ENDPOINTS: {
      CUSTOMERS: "/customers",
      BANK_ACCOUNTS: "/bank-accounts",
      QUOTES: "/quotes",
      EXCHANGE_RATE: "/exchange-rates"
    }
  };

  export const EXCHANGE_RATE_URL = (source_currency: string, destination_currency: string) => {
    const base = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EXCHANGE_RATE}`;
    return `${base}?source_currency=${encodeURIComponent(source_currency)}&destination_currency=${encodeURIComponent(destination_currency)}`;
  };
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

  export const getQuotesUrl = (customerId: string) => {
    return `${getCustomerUrl(customerId)}${API_CONFIG.ENDPOINTS.QUOTES}`;
  };

  export const getQuoteCreateUrl = (customerId: string) => {
    return `${API_CONFIG.BASE_URL}/quote/${customerId}/create`;
  };


  export const getQuotePayUrl = (customerId: string, quoteId: string, amount:number) => {
    return `${API_CONFIG.BASE_URL}/quote/${customerId}/${quoteId}/pay/${amount}`;
  }
 
  export const dmDepositDetails = async (depositDetails) => {
    try {
      const response = await fetch(`https://dashboard-backend.mrbeas.net/api/dm-deposit-details
`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(depositDetails),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send deposit details');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error sending deposit details:', error);
      throw error;
    }
  };

 

