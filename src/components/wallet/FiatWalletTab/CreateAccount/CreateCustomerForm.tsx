import type React from "react"
import { useState } from "react"
import { format } from "date-fns"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/stonfi/ui/button"
import { Input } from "@/components/stonfi/ui/input"
import { Label } from "@/components/stonfi/ui/label"
import type { FormData } from "@/interface/CreateCustomer"
import { countries } from "./countries"

export default function CreateAccountForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    email: "",
    phone_number: "",
    first_name: "",
    last_name: "",
    dateOfBirth: "",
    ipAddress: "",
    address: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      stateProvinceRegion: "",
      country: "VE",
      postalCode: "",
    },
    identityDocument: {
      idDocCountry: "VE",
      idDocType: "national_id",
      idDocNumber: "",
      idDocFrontFile: null,
      idDocBackFile: null,
      idDocFrontPreview: "",
      idDocBackPreview: "",
    },
    taxId: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
  
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      
      // Type-safe nested update
      setFormData((prev) => {
        if (parent === "address") {
          return {
            ...prev,
            address: {
              ...prev.address,
              [child]: value,
            },
          };
        } else if (parent === "identityDocument") {
          return {
            ...prev,
            identityDocument: {
              ...prev.identityDocument,
              [child]: value,
            },
          };
        }
        return prev;  
      });
    } else {
      // Simple update for top-level fields
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

 

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0] || null

    if (file) {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file)

      setFormData((prev) => ({
        ...prev,
        identityDocument: {
          ...prev.identityDocument,
          [side === "front" ? "idDocFrontFile" : "idDocBackFile"]: file,
          [side === "front" ? "idDocFrontPreview" : "idDocBackPreview"]: previewUrl,
        },
      }))
    }
  }

  const nextStep = () => {
    setStep((prev) => prev + 1)
  }

  const prevStep = () => {
    setStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    if (!formData.identityDocument.idDocFrontFile || !formData.identityDocument.idDocBackFile) {
      setError("Please upload both front and back of your identity document")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formDataToSend = new FormData()
      
      // Append all form data
      formDataToSend.append('email', formData.email)
      formDataToSend.append('phone_number', formData.phone_number)
      formDataToSend.append('first_name', formData.first_name)
      formDataToSend.append('last_name', formData.last_name)
      formDataToSend.append('dateOfBirth', formData.dateOfBirth)
      formDataToSend.append('ipAddress', formData.ipAddress)
      formDataToSend.append('taxId', formData.taxId || '')
      
      // Append address
      formDataToSend.append('address[addressLine1]', formData.address.addressLine1)
      formDataToSend.append('address[addressLine2]', formData.address.addressLine2 || '')
      formDataToSend.append('address[city]', formData.address.city)
      formDataToSend.append('address[stateProvinceRegion]', formData.address.stateProvinceRegion)
      formDataToSend.append('address[country]', formData.address.country)
      formDataToSend.append('address[postalCode]', formData.address.postalCode)
      
      // Append identity document
      formDataToSend.append('identityDocument[idDocCountry]', formData.identityDocument.idDocCountry)
      formDataToSend.append('identityDocument[idDocType]', formData.identityDocument.idDocType)
      formDataToSend.append('identityDocument[idDocNumber]', formData.identityDocument.idDocNumber)
      
      // Append files
      if (formData.identityDocument.idDocFrontFile) {
        formDataToSend.append('idDocFront', formData.identityDocument.idDocFrontFile)
      }
      if (formData.identityDocument.idDocBackFile) {
        formDataToSend.append('idDocBack', formData.identityDocument.idDocBackFile)
      }

      const response = await fetch('https://firebase-function-url/createCustomer', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      const result = await response.json()
      console.log('Success:', result)
      // Handle success (redirect, show success message, etc.)
    } catch (err:any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to submit form')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="w-full max-w-md mx-auto p-6 bg-black rounded-lg text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Create New Account</h1>

      {/* Progress indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                step === stepNumber ? "bg-blue" : step > stepNumber ? "bg-green-500" : "bg-gray-700"
              }`}
            >
              {step > stepNumber ? "✓" : stepNumber}
            </div>
            <span className="text-xs mt-1">
              {stepNumber === 1 && "Basic"}
              {stepNumber === 2 && "Address"}
              {stepNumber === 3 && "Identity"}
              {stepNumber === 4 && "Review"}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500 text-white rounded-md">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Basic Information</h2>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              placeholder="example@email.com"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="bg-black border border-gray-600 text-white text-left"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              placeholder="+58 123 456 7890"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              className="bg-black border border-gray-600 text-white text-left"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                placeholder="John"
                id="firstName"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="bg-black border border-gray-600 text-white text-left"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                placeholder="Doe"
                id="lastName"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="bg-black border border-gray-600 text-white text-left"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <DatePicker
              selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  setFormData(prev => ({
                    ...prev,
                    dateOfBirth: date.toISOString().split('T')[0]
                  }))
                }
              }}
              maxDate={new Date()}
              placeholderText="Select date"
              className="flex h-10 w-full rounded-md border border-gray-600 bg-black px-3 py-2 text-white text-left"
              required
              showYearDropdown
              dropdownMode="select"
              dateFormat="yyyy-MM-dd"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={nextStep} className="bg-blue hover:bg-blue-light text-white">
              Next
            </Button>
          </div>
        </div>
      )}


      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Address</h2>

          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1 *</Label>
            <Input
              placeholder="Avenida Libertador,"
              id="addressLine1"
              name="address.addressLine1"
              value={formData.address.addressLine1}
              onChange={handleChange}
              className="bg-black border border-gray-600 text-white text-left"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
            placeholder="Piso 3,Apartamento 12B"
              id="addressLine2"
              name="address.addressLine2"
              value={formData.address.addressLine2}
              onChange={handleChange}
              className="bg-black border border-gray-600 text-white text-left"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="Caracas"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                className="bg-black border border-gray-600 text-white text-left"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province *</Label>
              <Input
                placeholder="Distrito Capital"
                id="state"
                name="address.stateProvinceRegion"
                value={formData.address.stateProvinceRegion}
                onChange={handleChange}
                className="bg-black border border-gray-600 text-white text-left"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <select
                id="country"
                name="address.country"
                value={formData.address.country}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    address: {
                      ...prev.address,
                      country: e.target.value,
                    },
                  }))
                }}
                className="w-full h-10 px-3 py-2 bg-black border border-gray-600 rounded-md text-white text-left"
                required
              >
                {
                  countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))
                }
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code *</Label>
              <Input
                id="postalCode"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleChange}
                placeholder="1010"
                className="bg-black border border-gray-600 text-white text-left"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <Button
              onClick={prevStep}
              variant="outline"
              className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
            >
              Back
            </Button>
            <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white">
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Identity</h2>

          <div className="space-y-2">
            <Label htmlFor="idDocCountry">Document Country *</Label>
            <select
              id="idDocCountry"
              name="identityDocument.idDocCountry"
              value={formData.identityDocument.idDocCountry}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  identityDocument: {
                    ...prev.identityDocument,
                    idDocCountry: e.target.value,
                  },
                }))
              }}
              className="w-full h-10 px-3 py-2 bg-black border border-gray-600 rounded-md text-white text-left"
              required
            >
             {
              countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))
   
             }
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idDocType">Document Type *</Label>
            <select
              id="idDocType"
              name="identityDocument.idDocType"
              value={formData.identityDocument.idDocType}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  identityDocument: {
                    ...prev.identityDocument,
                    idDocType: e.target.value,
                  },
                }))
              }}
              className="w-full h-10 px-3 py-2 bg-black border border-gray-600 rounded-md text-white text-left"
              required
            >
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="driver_license">Driver's License</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idDocNumber">Document Number *</Label>
            <Input
              placeholder="1234567890"
              id="idDocNumber"
              name="identityDocument.idDocNumber"
              value={formData.identityDocument.idDocNumber}
              onChange={handleChange}
              className="bg-black border border-gray-600 text-white text-left"
              required
            />
          </div>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="idDocFront">Front of Document *</Label>
              <div className="mt-2">
                <input
                  type="file"
                  id="idDocFront"
                  onChange={(e) => handleFileChange(e, "front")}
                  className="hidden"
                  accept="image/*"
                />
                <div
                  onClick={() => document.getElementById("idDocFront")?.click()}
                  className="flex justify-end items-center h-10 px-3 py-2 bg-black border border-gray-600 rounded-md text-white cursor-pointer"
                >
                  {formData.identityDocument.idDocFrontFile
                    ? formData.identityDocument.idDocFrontFile.name
                    : "Click to upload"}
                </div>
 
              </div>
            </div>

            <div>
              <Label htmlFor="idDocBack">Back of Document *</Label>
              <div className="mt-2">
                <input
                  type="file"
                  id="idDocBack"
                  onChange={(e) => handleFileChange(e, "back")}
                  className="hidden"
                  accept="image/*"
                />
                <div
                  onClick={() => document.getElementById("idDocBack")?.click()}
                  className="flex justify-end items-center h-10 px-3 py-2 bg-black border border-gray-600 rounded-md text-white cursor-pointer"
                >
                  {formData.identityDocument.idDocBackFile
                    ? formData.identityDocument.idDocBackFile.name
                    : "Click to upload"}
                </div>
         
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <Button
              onClick={prevStep}
              variant="outline"
              className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
            >
              Back
            </Button>
            <Button onClick={nextStep} className="bg-blue hover:bg-blue text-white">
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Review</h2>

          <div className="space-y-4  p-4 rounded-md">
            <h3 className="font-medium">Review Your Information</h3>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="font-semibold">Name:</span>
                <span>
                  {formData.first_name} {formData.last_name}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold">Email:</span>
                <span>{formData.email}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold">Phone:</span>
                <span>{formData.phone_number}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold">Date of Birth:</span>
                <span>{formData.dateOfBirth ? format(formData.dateOfBirth, "MM/dd/yyyy") : "Not provided"}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold">Address:</span>
                <span>{formData.address.addressLine1 || "Not provided"}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold">Document Type:</span>
                <span>{formData.identityDocument.idDocType}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold">Document Number:</span>
                <span>{formData.identityDocument.idDocNumber || "Not provided"}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold">IP Address:</span>
                <span>{formData.ipAddress || "Not provided"}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID (Optional)</Label>
            <Input
              id="taxId"
              name="taxId"
              value={formData.taxId || ""}
              onChange={handleChange}
              className="bg-black border border-gray-600 text-white text-left"
            />
          </div>

          <div className="pt-4 flex justify-between">
            <Button
              onClick={prevStep}
              variant="outline"
              className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
            >
              Back
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="bg-blue hover:bg-blue text-white"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

