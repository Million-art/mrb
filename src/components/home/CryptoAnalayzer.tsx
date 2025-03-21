import React, { useState, useEffect } from "react";
import TradingViewWidget from "./TradingView";
import BuyToken from "./BuyToken";
import { sethasMRBToken, setLoading } from "@/store/slice/PremiumSlice";
import { useDispatch } from "react-redux";
import { FiMaximize } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const CryptoAnalyzer: React.FC = () => {
  const dispatch = useDispatch();

  const [symbol, setSymbol] = useState<string>("BTCUSDT");
  const [timeframe, setTimeframe] = useState<string>("1 Hour");

  const [tempSymbol, setTempSymbol] = useState<string>("BTCUSDT");
  const [tempTimeframe, setTempTimeframe] = useState<string>("1 Hour");

  const [showBuyTokenPopup, setShowBuyTokenPopup] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [userHasToken, setUserHasToken] = useState<boolean>(false);
  const { t } = useTranslation("global");

  useEffect(() => {
    const MRB_CONTRACT_ADDRESS_RAW =
      "0:b5f322c4e4077bd559ed708c1a32afcfc005b5a36fb4082a07fec4df71d45cee";
  
    const checkIfUserHoldsMRBToken = () => {
      try {
        dispatch(setLoading(true));
  
        // Retrieve jettons from localStorage
        const jettons = localStorage.getItem("jettons");
  
        if (jettons) {
          // Parse the JSON string into an array or object
          const parsedJettons = JSON.parse(jettons);
  
          // Ensure it's an array before checking for the contract address
          const hasToken = Array.isArray(parsedJettons)
            ? parsedJettons.some(
                (jetton) => jetton.address === MRB_CONTRACT_ADDRESS_RAW
              )
            : parsedJettons[MRB_CONTRACT_ADDRESS_RAW] !== undefined;
           dispatch(sethasMRBToken(hasToken));
          setUserHasToken(hasToken);
        } else {
          dispatch(sethasMRBToken(false));
          setUserHasToken(false);
        }
      } catch (error) {
        console.error("Error checking user status: ", error);
        setUserHasToken(false);
      } finally {
        dispatch(setLoading(false));
      }
    };
  
    checkIfUserHoldsMRBToken();
  }, [dispatch]);
  

  const handleAnalyze = (event: React.FormEvent) => {
    event.preventDefault();

    if (tempSymbol.trim()) {
      setSymbol(tempSymbol);
      setTimeframe(tempTimeframe);

      if (userHasToken) {
        setShowBuyTokenPopup(false);
      } else {
        setShowBuyTokenPopup(true);
      }
    } else {
      alert(t("cryptoAnalyzer.form.alert"));
    }
  };

  const closeBuyTokenPopup = () => {
    setShowBuyTokenPopup(false);
  };

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => {
      document.body.style.overflow = prev ? "auto" : "hidden";
      return !prev;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        toggleFullScreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto"; // Reset overflow on unmount
    };
  }, [isFullScreen]);

  return (
    <section className="  p-4 pb-20">
      <form
        onSubmit={handleAnalyze}
        className="shadow-lg rounded-lg p-4 w-full  bg-gray-dark backdrop-blur-sm space-y-4"
      >
        <h2 className="text-xl text-white font-bold text-center">
          {t("cryptoAnalyzer.title")}
        </h2>

        {/* Chart Section */}
        <div className="relative w-full ">
          {!userHasToken && (
            <div className="absolute mt-28 inset-0 z-10 flex items-center justify-center bg-black bg-opacity-10">
              <div className="w-full h-full">
                 <button
                  className="rounded-md"
                  onClick={() => setShowBuyTokenPopup(true)}
                >
                 </button>
              </div>
            </div>
          )}

          <div
            className={`flex justify-between px-4 py-2 bg-gray-dark text-white ${
              !userHasToken ? "pointer-events-none" : ""
            }`}
          >
            <h3 className="text-lg font-semibold">
              {symbol.toUpperCase()} {t("cryptoAnalyzer.chart.tokenpair")}
            </h3>
            <button
              type="button"
              onClick={toggleFullScreen}
              className="text-white hover:text-gray-400 focus:outline-none"
            >
              <FiMaximize size={20} />
            </button>
          </div>

          <div
            className={`h-[225px] ${
              !userHasToken ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <TradingViewWidget symbol={symbol.toUpperCase()} interval={timeframe} />
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-4">
            {/* Symbol Input */}
            <div className="flex-1">
              <label htmlFor="symbol" className="text-sm text-white block mb-1">
                {t("cryptoAnalyzer.form.symbol")}
              </label>
              <input
                type="text"
                id="symbol"
                value={tempSymbol}
                onChange={(e) => setTempSymbol(e.target.value)}
                placeholder="e.g., MRBUSDT"
                className="px-3 py-2 w-full border rounded-md focus:ring bg-transparent text-gray-300 focus:ring-blue focus:outline-none"
              />
            </div>

           {/* Timeframe Dropdown */}
            <div className="flex-1">
              <label htmlFor="timeframe" className="text-sm text-white block mb-1">
                {t("cryptoAnalyzer.form.selectoption.title")}
              </label>
              <select
                id="timeframe"
                value={tempTimeframe}
                onChange={(e) => setTempTimeframe(e.target.value)}
                className="px-3 py-2 w-full bg-gray-dark text-gray-300 border rounded-md focus:ring text-primary focus:ring-yellow focus:outline-none"
              >
                <option value="1 Hour">
                  {t("cryptoAnalyzer.form.selectoption.hour", { count: 1 })}
                </option>
                <option value="4 Hours">
                  {t("cryptoAnalyzer.form.selectoption.hour", { count: 4 })}
                </option>
                <option value="1 Day">
                  {t("cryptoAnalyzer.form.selectoption.day", { count: 1 })}
                </option>
                <option value="1 Week">
                  {t("cryptoAnalyzer.form.selectoption.week", { count: 1 })}
                </option>
              </select>
            </div>

          </div>

          {/* Analyze Button */}
          <button
            type="submit"
            className="w-full px-5 bg-gradient-to-r from-blue-light to-blue-medium font-bold text-white py-2 rounded-md hover:bg-yellow-light transition duration-300"
          >
            {t("cryptoAnalyzer.form.button")}
          </button>
        </div>
      </form>

      {isFullScreen && (
        <div className="fixed backdrop-blur-sm inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="relative w-full h-[95%]">
            <button
              onClick={toggleFullScreen}
              className="absolute top-2 right-4 text-white text-2xl focus:outline-none"
            >
              <FiMaximize size={24} />
            </button>
            <TradingViewWidget symbol={symbol.toUpperCase()} interval={timeframe} />
          </div>
        </div>
      )}

      {showBuyTokenPopup && <BuyToken onClose={closeBuyTokenPopup} />}
    </section>
  );
};

export default CryptoAnalyzer;
