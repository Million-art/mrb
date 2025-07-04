import axios from 'axios';
import { getCustomerUrl } from '@/config/api';

export interface CustomerData {
  id: string;
  kontigoCustomerId: string;
  telegram_id?: string;
  email?: string;
  legal_name?: string;
  type?: string;
  phone_number?: string;
  country?: string;
  bankAccountId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeleteCustomerOptions {
  customerId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  setLoading?: (loading: boolean) => void;
  dispatch?: any;
  t?: any;
}

/**
 * Shared function to delete a customer
 * Eliminates code duplication between different components
 */
export const deleteCustomer = async ({
  customerId,
  onSuccess,
  onError,
  setLoading,
  dispatch,
  t
}: DeleteCustomerOptions): Promise<boolean> => {
  if (!customerId || customerId === 'undefined' || customerId.trim() === '') {
    console.error('Invalid customer ID:', customerId);
    if (dispatch && t) {
      dispatch({
        type: 'message/setShowMessage',
        payload: {
          message: 'Invalid customer ID. Please provide a valid customer ID.',
          color: "red"
        }
      });
    }
    return false;
  }

  if (setLoading) {
    setLoading(true);
  }

  try {
    console.log('Deleting customer with Kontigo ID:', customerId);
    await axios.delete(getCustomerUrl(customerId));
    
    console.log('Customer deleted successfully');
    
    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting customer:', error);
    
    if (onError) {
      onError(error);
    }
    
    return false;
  } finally {
    if (setLoading) {
      setLoading(false);
    }
  }
};

/**
 * Utility function to validate customer data
 */
export const validateCustomerData = (customerData: CustomerData): boolean => {
  if (!customerData) {
    console.error('No customer data provided');
    return false;
  }

  if (!customerData.kontigoCustomerId || 
      customerData.kontigoCustomerId === 'undefined' || 
      customerData.kontigoCustomerId.trim() === '') {
    console.error('Invalid Kontigo customer ID:', customerData.kontigoCustomerId);
    return false;
  }

  return true;
}; 