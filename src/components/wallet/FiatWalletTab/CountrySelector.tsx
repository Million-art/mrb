import { Country } from "@/interface/country";
import { X } from "lucide-react";



type CountrySelectorProps = {
  onSelect: (country: Country) => void;
  onClose: () => void;
};

const CountrySelector = ({ onSelect, onClose }: CountrySelectorProps) => {
  const countries: Country[] = [
    { currency: "Venezuelan Bolivar", code: "VES", name: "Venezuela", flag: "https://flagcdn.com/ve.svg" },
    { currency: "Colombian Peso", code: "COP", name: "Colombia", flag: "https://flagcdn.com/co.svg" },
    { currency: "Argentine Peso", code: "ARS", name: "Argentina", flag: "https://flagcdn.com/ar.svg" },
    { currency: "Mexican Peso", code: "MXN", name: "Mexico", flag: "https://flagcdn.com/mx.svg" },
    { currency: "Brazilian Real", code: "BRL", name: "Brazil", flag: "https://flagcdn.com/br.svg" },
    { currency: "Chilean Peso", code: "CLP", name: "Chile", flag: "https://flagcdn.com/cl.svg" },
    { currency: "Guatemalan Quetzal", code: "GTQ", name: "Guatemala", flag: "https://flagcdn.com/gt.svg" },
    { currency: "Euro", code: "EUR", name: "European Union", flag: "https://flagcdn.com/eu.svg" },
    { currency: "Panamanian Balboa", code: "PAB", name: "Panama", flag: "https://flagcdn.com/pa.svg" },
    { currency: "British Pound", code: "GBP", name: "United Kingdom", flag: "https://flagcdn.com/gb.svg" },
    { currency: "Tether (USDT)", code: "USDT", name: "Tether stablecoin", flag: "https://cryptologos.cc/logos/tether-usdt-logo.png" },
    { currency: "USD Coin (USDC)", code: "USDC", name: "Circle Stablecoin", flag: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png" },
  ];
  
  
  
  

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-[#1E1E1E] text-white w-full max-w-md rounded-xl overflow-hidden flex flex-col h-auto max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold">Choose payment currency</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-2 p-4 overflow-y-auto">
          {countries.map((country) => (
            <button
              key={country.code}
              onClick={() => onSelect(country)}
              className="flex items-center w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <img 
                src={country.flag} 
                alt={`${country.name} flag`} 
                className="w-8 h-8 rounded-full object-cover mr-3"
              />
              <div className="text-left">
                <p className="font-medium">{country.name}</p>
                <p className="text-sm text-gray-400">{country.code}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountrySelector;