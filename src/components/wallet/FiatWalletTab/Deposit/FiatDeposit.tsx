import { useState } from "react";
import { Input } from "@/components/stonfi/ui/input";
import { ScrollArea } from "@/components/stonfi/ui/scroll-area";
import { Card } from "@/components/stonfi/ui/card";
import { motion } from "framer-motion";
import { Frown, Search } from "lucide-react";
import { Country } from "@/interface/country";
import SendDepositDetails from "./SendDepositDetails";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
 
export const countries: Country[] = [
  { currency: "VES", code: "VES", name: "Venezuela", flag: "https://flagcdn.com/ve.svg" },
  { currency: "MXN", code: "MXN", name: "Mexico", flag: "https://flagcdn.com/mx.svg" },
  { currency: "GTQ", code: "GTQ", name: "Guatemala", flag: "https://flagcdn.com/gt.svg" },
  { currency: "USD", code: "USD", name: "El Salvador", flag: "https://flagcdn.com/sv.svg" },
  { currency: "PAB", code: "PAB", name: "Panama", flag: "https://flagcdn.com/pa.svg" },
  { currency: "COP", code: "COP", name: "Colombia", flag: "https://flagcdn.com/co.svg" },
  { currency: "PEN", code: "PEN", name: "Peru", flag: "https://flagcdn.com/pe.svg" },
  { currency: "CLP", code: "CLP", name: "Chile", flag: "https://flagcdn.com/cl.svg" },
  { currency: "ARS", code: "ARS", name: "Argentina", flag: "https://flagcdn.com/ar.svg" },
  { currency: "GBP", code: "GBP", name: "United Kingdom", flag: "https://flagcdn.com/gb.svg" },
]

export default function FiatDeposit() {
  const [search, setSearch] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate();

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(search.toLowerCase()) ||
      country.currency.toLowerCase().includes(search.toLowerCase()) ||
      country.code.toLowerCase().includes(search.toLowerCase()),
  )

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-xl mb-10 scrollbar-hidden">
              {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)} 
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-white text-center">Recharge Fiat Currency</h2>
        <div className="w-6"></div> 
      </div>

      <Card className="p-6 shadow-lg border-gray-800">
        <p className="text-gray-400 mb-4 text-center">Select your country to see available Recharge methods.</p>

        <div className="relative w-full mb-4">
          <Input
            type="text"
            placeholder="Search country..."
            className="w-full p-2 pl-10 rounded-lg text-white  border border-gray-600 focus:ring focus:ring-blue"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
        </div>

        <ScrollArea className="h-80 overflow-y-auto rounded-lg border border-gray-700 p-2 ">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country, index) => (
              <div key={country.code}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center w-full p-3 transition-colors"
                  onClick={() => handleCountrySelect(country)}
                >
                  <img
                    src={country.flag || "/placeholder.svg"}
                    alt={`${country.name} flag`}
                    className="w-10 h-10 rounded-full object-cover mr-4"
                  />
                  <div className="text-left flex-grow">
                    <p className="font-medium text-white text-lg">{country.name}</p>
                    <p className="text-sm text-gray-400">
                      {country.currency} ({country.code})
                    </p>
                  </div>
                </motion.button>
                {index < filteredCountries.length - 1 && <hr className="border-gray-600 my-2" />}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10">
              <Frown className="w-16 h-16 text-gray-500 mb-4" />
              <p className="text-gray-400 text-lg font-medium">No countries found</p>
              <p className="text-gray-500 text-sm mt-2 text-center">Try adjusting your search or check for typos</p>
            </div>
          )}
        </ScrollArea>
      </Card>

      {showModal && selectedCountry && (
      <SendDepositDetails onClose={handleCloseModal} country={selectedCountry} />
      )}
    </div>
  )
}

