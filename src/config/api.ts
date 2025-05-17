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
/*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Sends deposit details to the dashboard backend, to be used in the
   * deposit confirmation DM flow.
   *
   * @param {Object} depositDetails - Deposit details to be sent to the
   * backend. The object should contain the following properties:
   *
   * - `amount`: The amount of the deposit (in the destination currency).
   * - `currency`: The destination currency of the deposit.
   * - `paymentMethod`: The payment method used for the deposit (e.g.
   * "bank_transfer", "card", etc.).
   * - `reference`: A reference for the deposit (e.g. the transaction ID
   * from the payment provider).
   * - `sender`: The sender's Telegram username.
   *
   * @throws {Error} If the request to the backend fails, or if the
   * response from the backend is not a 200 OK.
   *
   * @returns {Promise<Object>} A promise that resolves to the response
   * from the backend, which should be an object with a `status` property
   * set to "ok" if the request was successful.
   */
/*******  68f115dd-76c0-4483-bbc4-4da685732fc7  *******/
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

 

