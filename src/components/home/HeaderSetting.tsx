import { useNavigate } from "react-router-dom";
import { Info, Settings } from "lucide-react";

const HeaderSetting = () => {
  const navigate = useNavigate();

  return (
    <section className="flex items-center justify-between space-x-4 p-5">
      <button
        className="text-gray-400 transition-colors duration-200 hover:text-white"
        aria-label="Information"
      >
        <Info className="w-6 h-6" />
      </button>
      <button
        className="text-gray-400 transition-colors duration-200 hover:text-white"
        aria-label="Settings"
        onClick={() => navigate("/settings")}
      >
        <Settings className="w-6 h-6" />
      </button>
    </section>
  );
};

export default HeaderSetting;
