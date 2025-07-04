import axios from 'axios';
import { getBankAccountUrl } from '@/config/api';

export interface BankAccountData {
  id: string;
  kontigoBankAccountId: string;
  customer_id?: string;
  bank_code?: string;
  id_doc_number?: string;
  account_type?: string;
  account_number?: string;
  phone_number?: string | null;
  createdAt?: string;
}

export interface DeleteBankAccountOptions {
  customerId: string;
  bankAccountData: BankAccountData;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  setLoading?: (loading: boolean) => void;
  dispatch?: any;
  t?: any;
}

/**
 * Shared function to delete a bank account
 * Eliminates code duplication between different components
 */
export const deleteBankAccount = async ({
  customerId,
  bankAccountData,
  onSuccess,
  onError,
  setLoading,
  dispatch,
  t
}: DeleteBankAccountOptions): Promise<boolean> => {
  if (!bankAccountData) {
    console.error('No bank account data provided');
    return false;
  }

  // Debug logging to help identify the issue
  console.log('Bank account data object:', bankAccountData);
  console.log('Kontigo Bank Account ID:', bankAccountData.kontigoBankAccountId);

  // Validate that we have a valid Kontigo bank account ID
  if (!bankAccountData.kontigoBankAccountId || 
      bankAccountData.kontigoBankAccountId === 'undefined' || 
      bankAccountData.kontigoBankAccountId.trim() === '') {
    console.error('Invalid Kontigo bank account ID:', bankAccountData.kontigoBankAccountId);
    
    if (dispatch && t) {
      dispatch({
        type: 'message/setShowMessage',
        payload: {
          message: 'Invalid bank account ID. Please refresh the page and try again.',
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
    console.log('Deleting bank account with Kontigo ID:', bankAccountData.kontigoBankAccountId);
    await axios.delete(getBankAccountUrl(customerId, bankAccountData.kontigoBankAccountId));
    
    console.log('Bank account deleted successfully');
    
    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting bank account:', error);
    
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
 * Utility function to validate bank account data
 */
export const validateBankAccountData = (bankAccountData: BankAccountData): boolean => {
  if (!bankAccountData) {
    console.error('No bank account data provided');
    return false;
  }

  if (!bankAccountData.kontigoBankAccountId || 
      bankAccountData.kontigoBankAccountId === 'undefined' || 
      bankAccountData.kontigoBankAccountId.trim() === '') {
    console.error('Invalid Kontigo bank account ID:', bankAccountData.kontigoBankAccountId);
    return false;
  }

  return true;
}; 