import { X } from "lucide-react";

export interface Country {
  name: string;
  code: string;
  flag: string;
}

type CountrySelectorProps = {
  onSelect: (country: Country) => void;
  onClose: () => void;
};

const CountrySelector = ({ onSelect, onClose }: CountrySelectorProps) => {
  const countries: Country[] = [
    { name: "Venezuelan Bolivar", code: "VES", flag: "https://flagcdn.com/ve.svg" },
    { name: "Colombian Peso", code: "COP", flag: "https://flagcdn.com/co.svg" },
    { name: "Argentina Peso", code: "ARS", flag: "https://flagcdn.com/ar.svg" },
    { name: "Mexican Peso", code: "MXN", flag: "https://flagcdn.com/mx.svg" },
    { name: "Brazilian Real", code: "BRL", flag: "https://flagcdn.com/br.svg" },
    { name: "Chilean Peso", code: "CLP", flag: "https://flagcdn.com/cl.svg" },
    { name: "Guatemalan Quetzal", code: "GTQ", flag: "https://flagcdn.com/gt.svg" },
    { name: "Euro", code: "EUR", flag: "https://flagcdn.com/eu.svg" },
    { name: "Panamanian Balboa", code: "PAB", flag: "https://flagcdn.com/pa.svg" },
    { name: "British Pound", code: "GBP", flag: "https://flagcdn.com/gb.svg" },
    { name: "Tether (USDT)", code: "USDT", flag: "https://cryptologos.cc/logos/tether-usdt-logo.png" },
    { name: "USD Coin (USDC)", code: "USDC", flag: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png" },
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