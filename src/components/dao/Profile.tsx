import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { db } from "@/libs/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { telegramId, firstName, profilePicture } from "@/libs/telegram";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/stonfi/ui/button";

const Profile: React.FC = () => {
  const { t } = useTranslation();  
  const id = String(telegramId);  
  const [user, setUser] = useState<any>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch all user documents
        const userCollectionRef = collection(db, "users");
        const userSnapshot = await getDocs(userCollectionRef);

        const usersList: User[] = [];
        userSnapshot.forEach((doc) => {
          const data = doc.data();
          usersList.push({
            id: doc.id,
            balance: data.balance || 0,
            realBalance: data.realBalance || 0,  
            firstName: data.firstName,
            lastName: data.lastName,
            userImage: data.userImage,
          });
        });

        // Sort users based on balance in descending order
        const sortedUsers = usersList.sort((a, b) => b.balance - a.balance);

        // Set the total number of users
        setTotalUsers(sortedUsers.length);

        // Find the rank of the current user
        const currentUserIndex = sortedUsers.findIndex((user) => user.id === id);
        const rank = currentUserIndex + 1;  

        // Find the specific user document using telegramId (id)
        const userRef = doc(db, "users", id);  
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          setUser({
            ...userData,  
            id: userSnap.id,
            rank,  
          });
        } else {
          console.log(t("profile.noUser", { id })); 
        }
      } catch (error) {
        console.error(t("profile.errorFetchingData"), error);  
      }
    };

    fetchUserData();
  }, [id, t]);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  return (
    <div className="bg-gray-dark rounded-lg shadow-lg w-full h-[100px] flex items-center px-4">
      {/* User Image */}
      <div className="w-12 h-12 rounded-full overflow-hidden bg-blue flex-shrink-0">
        {profilePicture ? (
          <img
            className="w-full h-full rounded-full"
            src={profilePicture}
            alt={t("profile.altText", { firstName })}
          />
        ) : (
          <div className="text-white text-sm bg-primary w-full h-full flex items-center justify-center">
            {firstName?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* User Name and Details */}
      <div className="ml-4 flex-1">
        <h2 className="text-white text-lg font-semibold">{firstName || t("profile.defaultName")}</h2>
        <p className="text-sm">ID: {id}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyId}
            className="h-6 w-6 p-0 hover:bg-gray-700"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-400" />
            )}
          </Button>
          </p>
      </div>

      {/* Rank and Balance */}
      <div className="text-right text-white text-xs">
        <p>
          {t("profile.rank")}:{" "}
          <span className="font-semibold">
            {user?.rank || t("profile.notAvailable")}/{totalUsers || t("profile.notAvailable")}
          </span>
        </p>
        <p className="font-semibold">{user?.balance || 0} Points</p>
          
      </div>
    </div>
  );
};

export default Profile;
