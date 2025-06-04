import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Loader2, Wallet, ExternalLink, Unlink, Settings, Edit2, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import SendReciveFiat from "./Buttons";
import { telegramId, userName } from "@/libs/telegram";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchRealBalance } from "@/store/slice/fiatBalanceSlice";
import DepositTransactions from "./Transactions/DepositTransactions";
import TransferTransactions from "./Transactions/TransferTransactions";
import { Button } from "@/components/stonfi/ui/button";
import LinkWallet from "./LinkWallet";
import { doc, getDoc, updateDoc, deleteField, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import CreateBankAccount from "./CreateAccount/CreateBankAccount";
import Onboarding from "./CreateAccount/Onboarding";
import { updateCustomer } from "@/config/api";
import { setShowMessage } from "@/store/slice/messageSlice";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const checkCustomerAccount = async () => {
    try {
      setIsCheckingCustomer(true);
      if (!telegramId) {
        console.log('No telegram ID available for customer check');
        setHasCustomerAccount(false);
        return;
      }

      console.log('Checking customer account for telegramId:', telegramId);
      
      const customersRef = collection(db, 'customers');
      const customerQuery = query(
        customersRef,
        where('telegram_id', '==', String(telegramId))
      );
      
      const customerSnapshot = await getDocs(customerQuery);
      
      if (!customerSnapshot.empty) {
        const customerData = customerSnapshot.docs[0].data();
        console.log('Customer found in customers collection:', customerData);
        
        setCustomerData(customerData);
        setHasCustomerAccount(true);

        if (customerData.country === 'VENEZUELA') {
          console.log('Customer is from Venezuela, checking bank account...');
          
          const bankAccountsRef = collection(db, 'bank_accounts');
          const bankAccountQuery = query(
            bankAccountsRef,
            where('customer_id', '==', customerData.kontigoCustomerId)
          );
          
          const bankAccountSnapshot = await getDocs(bankAccountQuery);
          
          if (!bankAccountSnapshot.empty) {
            console.log('Bank account found for Venezuelan customer');
            setHasBankAccount(true);
          } else {
            console.log('No bank account found for Venezuelan customer');
            setHasBankAccount(false);
          }
        } else {
          console.log('Customer is not from Venezuela, bank account not required');
          setHasBankAccount(true);
        }
      } else {
        console.log('No customer found with telegram_id:', telegramId);
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

  const handleEdit = () => {
    setEditedData({ ...customerData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (!telegramId || !customerData?.kontigoCustomerId) {
        dispatch(setShowMessage({
          message: 'Unable to update customer information. Please try again.',
          color: 'red'
        }));
        return;
      }

      setIsSaving(true);

      // First update in Kontigo API with only the required fields
      const kontigoResponse = await updateCustomer(customerData.kontigoCustomerId, {
        legal_name: editedData.legal_name,
        email: editedData.email,
        phone_number: editedData.phone_number,
        type: editedData.type
      });

      // Only proceed with Firebase update if Kontigo update was successful
      if (kontigoResponse) {
        // Update in Firestore with the same fields
        const customersRef = collection(db, 'customers');
        const customerQuery = query(
          customersRef,
          where('telegram_id', '==', String(telegramId))
        );
        
        const customerSnapshot = await getDocs(customerQuery);
        
        if (!customerSnapshot.empty) {
          const customerDoc = customerSnapshot.docs[0];
          await updateDoc(customerDoc.ref, {
            legal_name: editedData.legal_name,
            email: editedData.email,
            phone_number: editedData.phone_number,
            type: editedData.type,
            updatedAt: new Date().toISOString()
          });

          setCustomerData(editedData);
          setIsEditing(false);
          dispatch(setShowMessage({
            message: 'Customer information updated successfully',
            color: 'green'
          }));
        }
      }
    } catch (error) {
      console.error('Error updating customer data:', error);
      dispatch(setShowMessage({
        message: 'Failed to update customer information. Please try again.',
        color: 'red'
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
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

  if (isStaff) {
    return (
      <div className="min-h-screen w-full text-white scrollbar-hidden">
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
          </div>
          <SendReciveFiat />
        </Card>

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

  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      {!hasCustomerAccount ? (
        <Onboarding onComplete={() => {
          setHasCustomerAccount(true);
          checkCustomerAccount();
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
            </div>
            <SendReciveFiat />
          </Card>

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

          <div className="mt-8 mb-24">
            <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
            <Tabs defaultValue="customer" className="w-full">
              <TabsList className="w-full flex gap-3 border-b border-gray-800">
                <TabsTrigger
                  value="customer"
                  className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
                >
                  Customer Account
                </TabsTrigger>
                {customerData?.country === 'VENEZUELA' && (
                  <TabsTrigger
                    value="bank"
                    className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
                  >
                    Bank Account
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="customer">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-medium">Customer Information</h3>
                        </div>
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEdit}
                            className="text-blue hover:text-blue/90"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        )}
                      </div>
                      {customerData && (
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-400">Legal Name</p>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editedData.legal_name}
                                onChange={(e) => setEditedData({ ...editedData, legal_name: e.target.value })}
                                className="w-full bg-gray-800/50 rounded-lg p-2 text-white mt-1"
                              />
                            ) : (
                              <p className="text-white">{customerData.legal_name}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Email</p>
                            {isEditing ? (
                              <input
                                type="email"
                                value={editedData.email}
                                onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                                className="w-full bg-gray-800/50 rounded-lg p-2 text-white mt-1"
                              />
                            ) : (
                              <p className="text-white">{customerData.email}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Phone Number</p>
                            {isEditing ? (
                              <input
                                type="tel"
                                value={editedData.phone_number}
                                onChange={(e) => setEditedData({ ...editedData, phone_number: e.target.value })}
                                className="w-full bg-gray-800/50 rounded-lg p-2 text-white mt-1"
                              />
                            ) : (
                              <p className="text-white">{customerData.phone_number}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Type</p>
                            {isEditing ? (
                              <select
                                value={editedData.type}
                                onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
                                className="w-full bg-gray-800/50 rounded-lg p-2 text-white mt-1"
                              >
                                <option value="individual">Individual</option>
                                <option value="business">Business</option>
                              </select>
                            ) : (
                              <p className="text-white capitalize">{customerData.type}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Country</p>
                            <p className="text-white">{customerData.country}</p>
                          </div>
                          {isEditing && (
                            <div className="flex justify-end gap-2 mt-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                className="text-gray-400 hover:text-gray-300"
                                disabled={isSaving}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSave}
                                className="text-blue hover:text-blue/90"
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Save
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {customerData?.country === 'VENEZUELA' && (
                <TabsContent value="bank">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-medium">Bank Account Information</h3>
                        </div>
                        <CreateBankAccount 
                          customerId={customerData.kontigoCustomerId}
                          showLoader={false}
                          customerPhone={customerData.phone_number}
                          onComplete={() => {
                            setHasBankAccount(true);
                            checkCustomerAccount();
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

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

