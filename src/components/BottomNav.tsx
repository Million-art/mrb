import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Import custom icons
import CoinsIcon from "@/assets/icons/referral.svg";
import HomeIcon from "@/assets/icons/hm.svg";
import WalletIcon from "@/assets/icons/wallet.svg";
import TrophyIcon from "@/assets/icons/trophy.svg";
import UsersIcon from "@/assets/icons/users.svg";

const BottomNav = () => {
  const location = useLocation();
  const [currentScreen, setCurrentScreen] = useState("/");

  useEffect(() => {
    setCurrentScreen(location.pathname);
  }, [location]);

  return (
    <footer className="bottom-0">
      <nav className="fixed z-10 w-full px-5 py-3 left-0 bottom-0 bg-black bg-opacity-70 backdrop-blur-md flex justify-around items-center shadow-md">
        <Btn
          icon={<img src={HomeIcon} alt="Home" />}
          label="Home"
          currentScreen={currentScreen}
          url="/"
        />
        <Btn
          icon={<img src={CoinsIcon} alt="Earn" />}
          label="Earn"
          currentScreen={currentScreen}
          url="/earn"
        />
        <Btn
          icon={<img src={WalletIcon} alt="Wallet" />}
          label="Wallet"
          currentScreen={currentScreen}
          url="/wallet"
        />
        <Btn
          icon={<img src={TrophyIcon} alt="Trophy" />}
          label="DeFi"
          currentScreen={currentScreen}
          url="/defi"
        />
        <Btn
          icon={<img src={UsersIcon} alt="Users" />}
          label="DAO"
          currentScreen={currentScreen}
          url="/referrals"
        />
      </nav>
    </footer>
  );
};

export default BottomNav;

type BtnProps = {
  currentScreen: string;
  url: string;
  icon: React.ReactNode;
  label: string;
};

const Btn = ({ currentScreen, icon, url, label }: BtnProps) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(url)}
      className={`flex flex-col items-center justify-center w-[60px] h-[60px] transition-all duration-300 ${
        currentScreen === url
          ? "text-white font-bold"
          : "text-white opacity-70"
      }`}
    >
      {/* Icon with bold style for active state */}
      <span
        className={`w-[30px] h-[30px] flex items-center justify-center transition-all ${
          currentScreen === url ? "font-bold" : ""
        }`}
      >
        {icon}
      </span>
      {/* Label Text */}
      <span className="text-sm">{label}</span>
    </button>
  );
};
