import type React from "react"
import { useState } from "react"
import { Button } from "@/components/stonfi/ui/button"
import { Input } from "@/components/stonfi/ui/input"
import { Label } from "@/components/stonfi/ui/label"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import './phone-input-dark.css'
import axios from "axios"
import { useDispatch } from "react-redux"
import { setShowMessage } from "@/store/slice/messageSlice"
import { telegramId } from "@/libs/telegram"
import { useNavigate } from "react-router-dom"
import { getCustomerUrl } from "@/config/api"

interface FormData {
  legal_name: string;
  email: string;
  phone_number: string;
  type: "individual" | "business";
  telegram_id: string;
}

export default function CreateCustomerForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    legal_name: "",
    email: "",
    phone_number: "",
    type: "individual",
    telegram_id: String(telegramId)
  })

  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.legal_name || !formData.email || !formData.phone_number || !formData.type) {
      dispatch(setShowMessage({
        message: "All fields are required",
        color: "red"
      }));
      return;
    }

    // Validate phone number format
    if (!formData.phone_number.startsWith("+58")) {
      dispatch(setShowMessage({
        message: "Phone number must start with +58 for Venezuela",
        color: "red"
      }));
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        getCustomerUrl(),
        formData
      );

      // Show success message
      dispatch(setShowMessage({
        message: "Customer account created successfully!",
        color: "green"
      }));

      // Navigate to bank account creation with customer data
      navigate("/create-bank-account");

    } catch (err: any) {
      console.error('Error:', err);
      // Get the specific error message from the API response
      const errorMessage = err.response?.data?.message || err.response?.data?.details?.message || 'Failed to create customer account';
      dispatch(setShowMessage({
        message: errorMessage,
        color: "red"
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-black rounded-lg text-white">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="legal_name">Legal Name *</Label>
          <Input
            placeholder="Enter legal name"
            name="legal_name"
            value={formData.legal_name}
            onChange={handleChange}
            className="bg-black border border-gray-600 text-white text-left [&:not(:placeholder-shown)]:bg-black"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            placeholder="example@email.com"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="bg-black border border-gray-600 text-white text-left [&:not(:placeholder-shown)]:bg-black"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <PhoneInput
            international
            defaultCountry="VE"
            value={formData.phone_number}
            onChange={(value) => {
              setFormData(prev => ({
                ...prev,
                phone_number: value || ""
              }))
            }}
            className="bg-black border border-gray-600 rounded-md h-10 text-white"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Account Type *</Label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full h-10 px-3 py-2 bg-black border border-gray-600 rounded-md text-white text-left [&:not(:placeholder-shown)]:bg-black"
            required
          >
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-blue hover:bg-blue-light text-white"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Create Account"}
          </Button>
        </div>
      </div>
    </div>
  )
}

