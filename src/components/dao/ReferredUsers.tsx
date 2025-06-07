import { useTranslation } from "react-i18next";
import { FaLink, FaTelegramPlane, FaShareAlt } from "react-icons/fa";
import { useState, useEffect } from "react";
import { telegramId } from "@/libs/telegram";
import { db } from "@/libs/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firstName } from "@/libs/telegram";
import { Loader2 } from "lucide-react";  

const ReferredUsers = () => {
  const [referrals, setReferrals] = useState<User[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [visibleReferrals, setVisibleReferrals] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [referralCount, setReferralCount] = useState(0);

  const id = String(telegramId);
  const invitationLink = `https://t.me/mrbeasapp_bot?start=ref_${id}`;
  const { t } = useTranslation();

  useEffect(() => {
    const fetchReferrals = async () => {
      setStatus("loading");
      try {
        const q = query(collection(db, "users"), where("referredBy", "==", id));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setReferrals([]);
          setReferralCount(0);  
        } else {
          const referredUsers: User[] = [];
          querySnapshot.forEach((doc) => {
            referredUsers.push({ ...doc.data(), id: doc.id } as User);
          });
          setReferrals(referredUsers);
          setReferralCount(referredUsers.length);
        }
        setStatus("success"); 
      } catch (error) {
        console.error("Error fetching referrals: ", error);
        setStatus("error"); 
      }
    };

    fetchReferrals();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const loadMoreReferrals = () => {
    if (loadingMore) return;
    setLoadingMore(true);

    setTimeout(() => {
      setVisibleReferrals((prev) => prev + 7);
      setLoadingMore(false);
    }, 500);
  };

  return (
    <section className="bg-gray-dark mt-6 rounded-lg p-4">
      <h1 className="text-white font-semibold text-xl text-center">{t("referral.subTitle")}</h1>

      <div className="flex justify-center mb-6">
        <p className="bg-gray-dark text-white rounded-lg p-4 break-words w-full max-w-md text-center">
          {invitationLink}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-evenly items-center mb-8">
        <div className="text-center flex flex-col">
          <button
            className="bg-gray-medium hover:bg-gray-dark rounded p-3 flex items-center justify-center transition duration-300"
            onClick={copyToClipboard}
          >
            <FaLink className="text-white text-xl" />
          </button>
          <h2 className="mt-2 text-sm text-white">
            {isCopied ? t("referral.copySuccess") : t("referral.copy")}
          </h2>
        </div>

        <div className="text-center flex flex-col">
          <button
            className="bg-gray-medium text-white py-2 px-4 rounded-lg flex items-center justify-center"
            onClick={() => {
              window.open(
                `https://t.me/share/url?url=${encodeURIComponent(invitationLink)}&text=${encodeURIComponent(
                  `${t("referral.shareMessage")} ${firstName}` 
                )}`,
                "_blank"
              );
            }}
          >
            <FaTelegramPlane className="text-white text-xl" />
          </button>
          <h2 className="mt-2 text-sm text-white">{t("referral.send")}</h2>
        </div>

        <div className="text-center flex flex-col">
          <button
            className="bg-gray-medium hover:bg-gray-dark rounded p-3 flex items-center justify-center transition duration-300"
            onClick={() => {
              const shareData = {
                title: t("referral.shareTitle"),
                text: `${t("referral.shareMessage")} ${firstName}`,
                url: invitationLink,
              };

              if (navigator.share) {
                navigator
                  .share(shareData)
                  .catch((error) => console.error("Error sharing content:", error));
              } else {
                const encodedMessage = encodeURIComponent(`${shareData.text} ${shareData.url}`);
                const fallbackURL = `https://wa.me/?text=${encodedMessage}`;
                window.open(fallbackURL, "_blank");
              }
            }}
          >
            <FaShareAlt className="text-white text-xl" />
          </button>
          <h2 className="mt-2 text-sm text-white">{t("referral.share")}</h2>
        </div>
      </div>

      {/* Referral List */}
      <div className="h-full overflow-y-auto mt-3 hide-scrollbar pb-12">
      <h1 className="text-white font-semibold text-xl text-center">{t("referral.referrals")+" "+(referralCount)}</h1>

        {status === "loading" ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-white w-6 h-6" />
          </div>
        ) : status === "error" ? (
          <p className="text-center text-red-500">{t("referral.error")}</p>
        ) : (
          <>
            {referrals.length === 0 ? (
              <p className="text-white text-center">{t("referral.noReferrals")}</p>
            ) : (
              referrals.slice(0, visibleReferrals).map(({ balance, firstName, lastName }, idx) => (
                <div key={idx} className="px-4 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-300 font-normal">
                      {idx + 1}. {firstName} {lastName}
                    </p>
                    <p className="text-gray-300 font-light flex items-center">
                       {balance} <small className="text-sm">pts</small>
                    </p>
                  </div>
                  {idx < visibleReferrals - 1 && <hr className="border-gray-700 my-2 opacity-50" />}
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Load More Button */}
      {referrals.length > visibleReferrals && (
        <div className="flex justify-center mt-4 pb-4">
          <button
            onClick={loadMoreReferrals}
            className="bg-blue text-white px-4 py-2 rounded-lg flex items-center transition-all duration-200 hover:bg-opacity-80 disabled:opacity-50"
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 mr-2" /> {t("leaderboard.loadingMore")}
              </>
            ) : (
              t("leaderboard.loadMore")
            )}
          </button>
        </div>
      )}
    </section>
  );
};

export default ReferredUsers;
