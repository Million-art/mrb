// services/v1/src/components/wallet/FiatWalletTab/settings/Profile.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { db } from "@/libs/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { telegramId, firstName, profilePicture } from "@/libs/telegram";
import { Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { setShowMessage } from "@/store/slice/messageSlice";
import ProfileIds from "./ProfileIds";

interface User {
  id: string;
  balance: number;
  realBalance: number;
  firstName?: string;
  lastName?: string;
  userImage?: string;
  rank?: number;
}

interface Customer {
  bankAccountId: string;
  legal_name: string;
}

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const id = String(telegramId);
  
  const [user, setUser] = useState<User | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<Customer | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch users and customer data in parallel
        const [userSnapshot, customerQuery] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(query(collection(db, "customers"), where("telegram_id", "==", id)))
        ]);

        // Process users list
        const usersList: User[] = userSnapshot.docs.map(doc => ({
          id: doc.id,
          balance: doc.data().balance || 0,
          realBalance: doc.data().realBalance || 0,
          firstName: doc.data().firstName,
          lastName: doc.data().lastName,
          userImage: doc.data().userImage,
        }));

        // Sort and calculate rank
        const sortedUsers = usersList.sort((a, b) => b.balance - a.balance);
        setTotalUsers(sortedUsers.length);
        
        const currentUserIndex = sortedUsers.findIndex(user => user.id === id);
        const rank = currentUserIndex + 1;

        // Get current user data
        const currentUser = usersList.find(user => user.id === id);
        if (currentUser) {
          setUser({ ...currentUser, rank });
        } else {
          setError(t("profile.noUser", { id }));
          dispatch(setShowMessage({
            message: t("profile.noUser", { id }),
            color: "red"
          }));
        }

        // Set customer data if exists
        if (!customerQuery.empty) {
          const customerDoc = customerQuery.docs[0];
          setCustomerData({
            bankAccountId: customerDoc.data().bankAccountId,
            legal_name: customerDoc.data().legal_name
          });
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setError(t("profile.errorFetchingData"));
        dispatch(setShowMessage({
          message: t("profile.errorFetchingData"),
          color: "red"
        }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [id, t, dispatch]);

  if (isLoading) {
    return (
      <div className="bg-gray-dark rounded-lg shadow-lg w-full h-[100px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-light" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-dark rounded-lg shadow-lg w-full h-[100px] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-gray-dark rounded-lg shadow-lg w-full p-4">
        <div className="flex items-center space-x-4">
          {/* User Image */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-blue flex-shrink-0">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={t("profile.altText", { firstName })}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-white text-sm">
                {firstName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-white text-lg font-semibold">
              {firstName || t("profile.defaultName")}
            </h2>
          </div>

          {/* Rank and Balance */}
          <div className="text-right">
            <p className="text-sm text-gray-400">
              {t("profile.rank")}:{" "}
              <span className="text-white font-semibold">
                {user?.rank || t("profile.notAvailable")}/{totalUsers}
              </span>
            </p>
            <p className="text-white font-semibold">
              {user?.balance || 0} Points
            </p>
          </div>
        </div>
      </div>

      {/* IDs Section */}
      <ProfileIds userId={id} customerData={customerData} />
    </div>
  );
};

export default Profile;