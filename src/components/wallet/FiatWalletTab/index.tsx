import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Loader2, Wallet, ExternalLink, Unlink, UserPlus, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import SendReciveFiat from "./Buttons";
import { telegramId, userName } from "@/libs/telegram";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchRealBalance } from "@/store/slice/fiatBalanceSlice";
import DepositTransactions from "./Transactions/DepositTransactions";
import TransferTransactions from "./Transactions/TransferTransactions";
import { Button } from "@/components/stonfi/ui/button";
import { Input } from "@/components/stonfi/ui/input";
import LinkWallet from "./LinkWallet";
import { doc, getDoc, updateDoc, deleteField, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { API_CONFIG } from '@/config/api';
import { countries } from "./CreateAccount/countries";
import CreateBankAccount from "./CreateAccount/CreateBankAccount";

interface CustomerFormData {
  legal_name: string;
  email: string;
  phone_number: string;
  type: 'individual';
  country: string;
}

interface ValidationError {
  field: string;
  message: string;
}

// New component for customer account creation
const CreateCustomerAccount = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [formData, setFormData] = useState<CustomerFormData>({
    legal_name: '',
    email: '',
    phone_number: '',
    type: 'individual',
    country: ''
  });
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string, country: string): boolean => {
    // Remove any spaces or special characters
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    
    // Basic validation for different countries
    switch (country) {
      case 'Venezuela':
        return /^\+58[0-9]{10}$/.test(cleanPhone);
      case 'Colombia':
        return /^\+57[0-9]{10}$/.test(cleanPhone);
      case 'Mexico':
        return /^\+52[0-9]{10}$/.test(cleanPhone);
      case 'Brazil':
        return /^\+55[0-9]{11}$/.test(cleanPhone);
      case 'Argentina':
        return /^\+54[0-9]{10}$/.test(cleanPhone);
      case 'Chile':
        return /^\+56[0-9]{9}$/.test(cleanPhone);
      case 'Guatemala':
        return /^\+502[0-9]{8}$/.test(cleanPhone);
      case 'Panama':
        return /^\+507[0-9]{8}$/.test(cleanPhone);
      case 'United Kingdom':
        return /^\+44[0-9]{10}$/.test(cleanPhone);
      case 'European Union':
        return /^\+[0-9]{10,12}$/.test(cleanPhone);
      default:
        return /^\+[0-9]{8,15}$/.test(cleanPhone);
    }
  };

  const getPhoneExample = (country: string): string => {
    switch (country) {
      case 'Venezuela':
        return '+584123456789';
      case 'Colombia':
        return '+573001234567';
      case 'Mexico':
        return '+525512345678';
      case 'Brazil':
        return '+5511987654321';
      case 'Argentina':
        return '+5491123456789';
      case 'Chile':
        return '+56912345678';
      case 'Guatemala':
        return '+50212345678';
      case 'Panama':
        return '+50761234567';
      case 'United Kingdom':
        return '+447911123456';
      case 'European Union':
        return '+491234567890';
      default:
        return '+1234567890';
    }
  };

  const getPhoneErrorMessage = (country: string): string => {
    return `Please enter a valid phone number for ${country} (e.g., ${getPhoneExample(country)})`;
  };

  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];

    // Validate legal name
    if (!formData.legal_name.trim()) {
      errors.push({ field: 'legal_name', message: 'Legal name is required' });
    } else if (formData.legal_name.length < 2) {
      errors.push({ field: 'legal_name', message: 'Legal name must be at least 2 characters' });
    } else if (formData.legal_name.length > 100) {
      errors.push({ field: 'legal_name', message: 'Legal name must be less than 100 characters' });
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!validateEmail(formData.email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    // Validate phone number
    if (!formData.phone_number.trim()) {
      errors.push({ field: 'phone_number', message: 'Phone number is required' });
    } else if (!validatePhoneNumber(formData.phone_number, formData.country)) {
      errors.push({ 
        field: 'phone_number', 
        message: getPhoneErrorMessage(formData.country)
      });
    }

    // Validate country
    if (!formData.country) {
      errors.push({ field: 'country', message: 'Please select your country' });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCreateAccount = async () => {
    try {
      if (!validateForm()) {
        setError('Please fix the errors in the form');
        return;
      }

      setIsLoading(true);
      setError(null);
      
      // Create customer in Firestore first
      const customerData = {
        createdAt: new Date().toISOString(),
        email: formData.email,
        legal_name: formData.legal_name,
        phone_number: formData.phone_number,
        telegram_id: String(telegramId),
        type: formData.type,
        country: formData.country
      };

      // Add to customers collection
      const customersRef = collection(db, 'customers');
      const newCustomerRef = await addDoc(customersRef, customerData);

      // Create customer account in your backend
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...customerData,
          kontigoCustomerId: `cus_${Math.random().toString(36).substring(2, 15)}`,
        }),
      });

      if (!response.ok) {
        // If backend creation fails, delete the Firestore document
        await deleteDoc(newCustomerRef);
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create customer account');
      }

      const backendResponse = await response.json();

      // Update the customer document with the kontigoCustomerId
      await updateDoc(newCustomerRef, {
        kontigoCustomerId: backendResponse.kontigoCustomerId
      });

      // Update user document
      const userRef = doc(db, 'users', String(telegramId));
      await updateDoc(userRef, {
        hasCustomerAccount: true,
        customerAccountCreatedAt: new Date().toISOString(),
        kontigoCustomerId: backendResponse.kontigoCustomerId,
        bankAccountId: backendResponse.bankAccountId,
        customerData: {
          ...customerData,
          kontigoCustomerId: backendResponse.kontigoCustomerId
        }
      });

      onComplete();
    } catch (error:any) {
      console.error('Error creating customer account:', error);
      setError(error.message || 'Failed to create customer account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (field: string): string | null => {
    const error = validationErrors.find(err => err.field === field);
    return error ? error.message : null;
  };

  return (
    <div className="text-center max-w-md mx-auto">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 mb-4">
        <UserPlus className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Create Your Customer Account</h2>
      <p className="text-gray-400 mb-8">
        To use our fiat wallet services, you need to create a customer account first.
      </p>

      <div className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Legal Name</label>
          <Input
            type="text"
            value={formData.legal_name}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, legal_name: e.target.value }));
              setValidationErrors(prev => prev.filter(err => err.field !== 'legal_name'));
            }}
            placeholder="Enter your full legal name"
            className={`bg-gray-800/50 border-gray-700 text-left ${getFieldError('legal_name') ? 'border-red-500' : ''}`}
            dir="ltr"
          />
          {getFieldError('legal_name') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('legal_name')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, email: e.target.value }));
              setValidationErrors(prev => prev.filter(err => err.field !== 'email'));
            }}
            placeholder="Enter your email address"
            className={`bg-gray-800/50 border-gray-700 text-left ${getFieldError('email') ? 'border-red-500' : ''}`}
            dir="ltr"
          />
          {getFieldError('email') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('email')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
          <Input
            type="tel"
            value={formData.phone_number}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, phone_number: e.target.value }));
              setValidationErrors(prev => prev.filter(err => err.field !== 'phone_number'));
            }}
            placeholder={getPhoneExample(formData.country || 'Venezuela')}
            className={`bg-gray-800/50 border-gray-700 text-left ${getFieldError('phone_number') ? 'border-red-500' : ''}`}
            dir="ltr"
          />
          {getFieldError('phone_number') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('phone_number')}</p>
          )}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-400 mb-1">Country</label>
          <button
            type="button"
            onClick={() => setIsCountryOpen(!isCountryOpen)}
            className={`w-full flex items-center justify-between p-2 bg-gray-800/50 border rounded-md text-left ${
              getFieldError('country') ? 'border-red-500' : 'border-gray-700'
            }`}
          >
            {formData.country ? (
              <div className="flex items-center gap-2">
                <img 
                  src={countries.find(c => c.name === formData.country)?.flag} 
                  alt={formData.country}
                  className="w-6 h-6 rounded-full"
                />
                <span>{formData.country}</span>
              </div>
            ) : (
              <span className="text-gray-400">Select your country</span>
            )}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {getFieldError('country') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('country')}</p>
          )}

          {isCountryOpen && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, country: country.name }));
                    setValidationErrors(prev => prev.filter(err => err.field !== 'country'));
                    setIsCountryOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 hover:bg-gray-700 text-left"
                >
                  <img 
                    src={country.flag} 
                    alt={country.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span>{country.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-red-500 mt-4">{error}</p>
      )}

      <Button
        onClick={handleCreateAccount}
        disabled={isLoading}
        className="w-full mt-6 flex items-center justify-center gap-2 bg-blue hover:bg-blue/90"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {isLoading ? 'Creating Account...' : 'Create Customer Account'}
      </Button>
    </div>
  );
};

const FiatWalletTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.fiatBalance);
  const [externalwalletAddress, setexternalWalletAddress] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isStaff, setIsStaff] = useState<boolean | null>(null);
  const [isCheckingStaff, setIsCheckingStaff] = useState(true);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [hasCustomerAccount, setHasCustomerAccount] = useState<boolean | null>(null);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(true);
  const [customerData, setCustomerData] = useState<any>(null);
  const [hasBankAccount, setHasBankAccount] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      console.log('FiatWalletTab mounted with telegramId:', telegramId);
      await Promise.all([
        checkStaffStatus(),
        checkCustomerAccount(),
        fetchexternalWalletAddress()
      ]);
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (externalwalletAddress) {
      console.log('Fetching real balance for telegramId:', telegramId);
      dispatch(fetchRealBalance(String(telegramId)));
    }
  }, [dispatch, externalwalletAddress]);

  const checkStaffStatus = async () => {
    try {
      setIsCheckingStaff(true);
      if (!userName) {
        console.log('No username available for staff check');
        setIsStaff(false);
        return;
      }

      // Remove @ if present for comparison
      const cleanUsername = userName.startsWith('@') ? userName.slice(1) : userName;
      console.log('Checking staff status for username:', cleanUsername);
      
      const staffsRef = collection(db, 'staffs');
      const q = query(
        staffsRef,
        where('tgUsername', 'in', [cleanUsername, `@${cleanUsername}`])
      );
      
      const querySnapshot = await getDocs(q);
      const isStaffUser = !querySnapshot.empty;
      console.log('Staff status check result:', isStaffUser);
      setIsStaff(isStaffUser);
    } catch (error) {
      console.error('Error checking staff status:', error);
      setIsStaff(false);
    } finally {
      setIsCheckingStaff(false);
    }
  };

  const checkBankAccount = async (): Promise<boolean> => {
    try {
      console.log('Checking bank account for telegramId:', telegramId);
      
      // First, get the customer ID from customers table
      const customersRef = collection(db, 'customers');
      const customerQuery = query(
        customersRef,
        where('telegram_id', '==', String(telegramId))
      );
      
      const customerSnapshot = await getDocs(customerQuery);
      
      if (customerSnapshot.empty) {
        console.log('No customer found for telegramId:', telegramId);
        return false;
      }

      const customerData = customerSnapshot.docs[0].data();
      const customerId = customerData.kontigoCustomerId;
      console.log('Found customer ID:', customerId);
      
      // Now check bank_accounts collection using the customer ID
      const bankAccountsRef = collection(db, 'bank_accounts');
      const bankAccountQuery = query(
        bankAccountsRef,
        where('customer_id', '==', customerId)
      );
      
      const bankAccountSnapshot = await getDocs(bankAccountQuery);
      
      if (!bankAccountSnapshot.empty) {
        const bankAccountData = bankAccountSnapshot.docs[0].data();
        console.log('Bank account found:', bankAccountData);
        
        // Update user document with bank account info
        const userRef = doc(db, 'users', String(telegramId));
        await updateDoc(userRef, {
          hasBankAccount: true,
          bankAccountData: bankAccountData
        });
        
        return true;
      } else {
        console.log('No bank account found for customer:', customerId);
        
        // Update user document to reflect no bank account
        const userRef = doc(db, 'users', String(telegramId));
        await updateDoc(userRef, {
          hasBankAccount: false,
          bankAccountData: deleteField()
        });
        
        return false;
      }
    } catch (error) {
      console.error('Error checking bank account:', error);
      
      // Update user document to reflect error state
      const userRef = doc(db, 'users', String(telegramId));
      await updateDoc(userRef, {
        hasBankAccount: false,
        bankAccountData: deleteField()
      });
      
      return false;
    }
  };

  const checkCustomerAccount = async () => {
    try {
      setIsCheckingCustomer(true);
      if (!telegramId) {
        console.log('No telegram ID available for customer check');
        setHasCustomerAccount(false);
        return;
      }

      console.log('Checking customer account for telegramId:', telegramId);
      
      // Check customers collection for the user's telegram_id
      const customersRef = collection(db, 'customers');
      const customerQuery = query(
        customersRef,
        where('telegram_id', '==', String(telegramId))
      );
      
      const customerSnapshot = await getDocs(customerQuery);
      
      if (!customerSnapshot.empty) {
        const customerData = customerSnapshot.docs[0].data();
        console.log('Customer found in customers collection:', customerData);
        
        // Update user document to reflect customer status
        const userRef = doc(db, 'users', String(telegramId));
        await updateDoc(userRef, {
          hasCustomerAccount: true,
          customerAccountCreatedAt: customerData.createdAt,
          kontigoCustomerId: customerData.kontigoCustomerId,
          customerData: customerData
        });
        
        setCustomerData(customerData);
        setHasCustomerAccount(true);

        // Check if user needs to create bank account (Venezuelan citizens)
        if (customerData.country === 'VENEZUELA') {
          console.log('Customer is from Venezuela, checking bank account...');
          
          // Check bank_accounts collection using the customer's kontigoCustomerId
          const bankAccountsRef = collection(db, 'bank_accounts');
          const bankAccountQuery = query(
            bankAccountsRef,
            where('customer_id', '==', customerData.kontigoCustomerId)
          );
          
          const bankAccountSnapshot = await getDocs(bankAccountQuery);
          
          if (!bankAccountSnapshot.empty) {
            const bankAccountData = bankAccountSnapshot.docs[0].data();
            console.log('Bank account found:', bankAccountData);
            
            // Update user document with bank account info
            await updateDoc(userRef, {
              hasBankAccount: true,
              bankAccountData: bankAccountData
            });
            
            setHasBankAccount(true);
          } else {
            console.log('No bank account found for Venezuelan customer');
            
            // Update user document to reflect no bank account
            await updateDoc(userRef, {
              hasBankAccount: false,
              bankAccountData: deleteField()
            });
            
            setHasBankAccount(false);
          }
        } else {
          console.log('Customer is not from Venezuela, bank account not required');
          setHasBankAccount(true); // Non-Venezuelan citizens don't need bank account
        }
      } else {
        console.log('No customer found with telegram_id:', telegramId);
        
        // Update user document to reflect no customer status
        const userRef = doc(db, 'users', String(telegramId));
        await updateDoc(userRef, {
          hasCustomerAccount: false
        });
        
        setHasCustomerAccount(false);
        setHasBankAccount(null);
      }
    } catch (error) {
      console.error('Error checking customer account:', error);
      setHasCustomerAccount(false);
      setHasBankAccount(null);
    } finally {
      setIsCheckingCustomer(false);
    }
  };

  const fetchexternalWalletAddress = async () => {
    try {
      if (!telegramId) {
        console.error('No telegram ID available for wallet address fetch');
        return;
      }

      console.log('Fetching wallet address for telegramId:', telegramId);
      const userRef = doc(db, 'users', String(telegramId));
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User document data:', userData);
        const externalwalletAddress = userData.usdcexternalWalletAddress;
        // Set the real balance from Firestore
        setUserBalance(userData.realBalance || 0);
        if (externalwalletAddress) {
          console.log('Wallet address found:', externalwalletAddress);
          setexternalWalletAddress(externalwalletAddress);
        } else {
          console.log('No wallet address found for user');
          setexternalWalletAddress(null);
        }
      } else {
        console.log('User document not found in Firestore');
        setexternalWalletAddress(null);
      }
    } catch (error) {
      console.error('Error fetching wallet address:', error);
      setexternalWalletAddress(null);
    }
  };

  const handleUnlinkWallet = async () => {
    try {
      setIsUnlinking(true);
      const userRef = doc(db, 'users', String(telegramId));
      await updateDoc(userRef, {
        usdcexternalWalletAddress: deleteField()
      });
      setexternalWalletAddress(null);
    } catch (error) {
      console.error('Error unlinking wallet:', error);
    } finally {
      setIsUnlinking(false);
    }
  };

  if (loading || isCheckingStaff || isCheckingCustomer) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-white w-6 h-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // If user is staff, show full wallet UI without connection prompt
  if (isStaff) {
    return (
      <div className="min-h-screen w-full text-white scrollbar-hidden">
        {/* Balance Card */}
        <Card className="rounded-lg shadow-md min-w-full scrollbar-hidden">
          <div className="mb-2">
            <div>
              <p className="text-gray-300">Your Balance</p>
              <h1 className="text-3xl font-bold">{userBalance.toFixed(2)} USDC</h1>
              {userBalance === 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  Your balance will be updated when you receive deposits or transfers
                </p>
              )}
            </div>
            <div className="inline-block rounded-md">
              <p className="font-bold"></p>
            </div>
          </div>
          <SendReciveFiat />
        </Card>

        {/* Transactions Section */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Transactions</h2>
        </div>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="w-full flex gap-3 border-b border-gray-800">
            <TabsTrigger
              value="deposit"
              className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
            >
              Deposit
            </TabsTrigger>
            <TabsTrigger
              value="transfer"
              className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
            >
              Transfer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit">
            <Card>
              <CardContent className="p-4">
                <DepositTransactions />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="transfer">
            <Card>
              <CardContent className="p-4">
                <TransferTransactions />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // For regular users, show the appropriate content based on customer account status
  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      {!hasCustomerAccount ? (
        <CreateCustomerAccount onComplete={() => {
          setHasCustomerAccount(true);
          checkCustomerAccount(); // Refresh customer status
        }} />
      ) : customerData?.country === 'VENEZUELA' && hasBankAccount === false ? (
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Create Your Bank Account</h2>
            <p className="text-gray-400">
              As a Venezuelan citizen, you need to create a bank account to use our fiat wallet services.
            </p>
          </div>
          <CreateBankAccount 
            customerId={customerData.kontigoCustomerId}
            showLoader={false}
            customerPhone={customerData.phone_number}
          />
        </div>
      ) : !externalwalletAddress ? (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 mb-4">
            <Wallet className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Connect Your USDC Wallet</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Connect your external USDC wallet to get referral commission and access fiat wallet
          </p>
          <LinkWallet 
            walletAddress={externalwalletAddress}
            onWalletUpdate={setexternalWalletAddress}
          />
        </div>
      ) : (
        <>
          {/* Balance Card */}
          <Card className="rounded-lg shadow-md min-w-full scrollbar-hidden">
            <div className="mb-2">
              <div>
                <p className="text-gray-300">Your Balance</p>
                <h1 className="text-3xl font-bold">{userBalance.toFixed(2)} USDC</h1>
                {userBalance === 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    Your balance will be updated when you receive deposits or transfers
                  </p>
                )}
              </div>
              <div className="inline-block rounded-md">
                <p className="font-bold"></p>
              </div>
            </div>
            <SendReciveFiat />
          </Card>

          {/* Transactions Section */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Transactions</h2>
          </div>

          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="w-full flex gap-3 border-b border-gray-800">
              <TabsTrigger
                value="deposit"
                className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
              >
                Deposit
              </TabsTrigger>
              <TabsTrigger
                value="transfer"
                className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
              >
                Transfer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit">
              <Card>
                <CardContent className="p-4">
                  <DepositTransactions />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="transfer">
              <Card>
                <CardContent className="p-4">
                  <TransferTransactions />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Connected Wallet Section */}
          <div className="mt-8 mb-24">
            <h2 className="text-lg font-semibold mb-2">Connected USDC Wallet Address</h2>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    {externalwalletAddress ? (
                      <p className="text-sm break-all bg-gray-800/50 p-2 rounded-lg text-left" dir="ltr">
                        {externalwalletAddress}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">No wallet address found</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {externalwalletAddress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(externalwalletAddress)}
                      className="text-blue hover:text-blue/90"
                    >
                      Copy
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnlinkWallet}
                    disabled={isUnlinking}
                    className="text-red-500 hover:text-red-400"
                  >
                    {isUnlinking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default FiatWalletTab;

