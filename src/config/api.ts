  // API Configuration
  export const API_CONFIG = {
    BASE_URL2: import.meta.env.VITE_BASE_URL2, //dashboard-backend
    BASE_URL: import.meta.env.MODE === 'development' ? "http://localhost:3000" : "https://api.glofica.com",
    BASE_URL1: import.meta.env.VITE_BASE_URL1, //glofica
    API_MAIN_URL: import.meta.env.MODE === 'development' ? "http://localhost:3000" : "https://api.glofica.com",
    ENDPOINTS: {
      CUSTOMERS: "/customers",
      BANK_ACCOUNTS: "/bank-accounts",
      QUOTES: "/quotes",
      EXCHANGE_RATE: "/exchange-rates"
    }
  };

  // Helper function to handle API calls with fallback
  export const fetchWithFallback = async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (url.includes('localhost:3000')) {
        const fallbackUrl = url.replace(API_CONFIG.BASE_URL, API_CONFIG.BASE_URL1);
        console.log('Falling back to production URL:', fallbackUrl);
        const fallbackResponse = await fetch(fallbackUrl, options);
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback HTTP error! status: ${fallbackResponse.status}`);
        }
        return await fallbackResponse.json();
      }
      throw error;
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
    return `${API_CONFIG.API_MAIN_URL}${API_CONFIG.ENDPOINTS.CUSTOMERS}/${customerId}${API_CONFIG.ENDPOINTS.BANK_ACCOUNTS}`;
  };

  export const getBankAccountUrl = (customerId: string, kontigoBankAccountId: string) => {
    return `${getBankAccountsUrl(customerId)}/${kontigoBankAccountId}`;
  }; 

  export const getQuotesUrl = (customerId: string) => {
    return `${getCustomerUrl(customerId)}${API_CONFIG.ENDPOINTS.QUOTES}`;
  };

  export const getQuoteCreateUrl = (customerId: string) => {
    return `${API_CONFIG.BASE_URL}/quote/${customerId}/create`;
  };


  export const getQuotePayUrl = (customerId: string, quoteId: string) => {
    return `${API_CONFIG.BASE_URL}/quote/${customerId}/${quoteId}/pay`;
  }

  export const updateCustomerUrl = (customerId: string) => {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMERS}/${customerId}`;
  };

  export const updateCustomer = async (customerId: string, customerData: any) => {
    try {
      return await fetchWithFallback(updateCustomerUrl(customerId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };
 
  export const dmDepositDetails = async (depositDetails) => {
    try {
      return await fetchWithFallback(`https://dashboard-backend.mrbeas.net/api/dm-deposit-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(depositDetails),
      });
    } catch (error) {
      console.error('Error sending deposit details:', error);
      throw error;
    }
  };
 

