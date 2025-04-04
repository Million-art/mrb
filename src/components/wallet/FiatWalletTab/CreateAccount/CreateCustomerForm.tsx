import type React from "react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/stonfi/ui/button"
import { Input } from "@/components/stonfi/ui/input"
import { Label } from "@/components/stonfi/ui/label"
import type { FormData } from "@/interface/CreateCustomer"
import { countries } from "./countries"
import { addDoc, collection, updateDoc, query, where, getDocs, doc } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { toast } from "react-toastify"
import { telegramId } from "@/libs/telegram"
import { db, storage } from "@/libs/firebase"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import './phone-input-dark.css'

export default function CreateAccountForm() {
  const [step, setStep] = useState(1)
  const [isExistingCustomer, setIsExistingCustomer] = useState(false)
  const [existingCustomerId, setExistingCustomerId] = useState<string | null>(null)
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
      idDocFrontUploaded: false,
      idDocBackUploaded: false,
    },
    taxId: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [responseData, setResponseData] = useState<any>(null)

  // Check for existing customer when component mounts
  useEffect(() => {
    const checkExistingCustomer = async () => {
      try {
        if (!telegramId) {
          return;
        }
        
        const q = query(
          collection(db, "customers"),
          where("telegramId", "==", String(telegramId))
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const customerDoc = querySnapshot.docs[0];
          const customerData = customerDoc.data();
          const customerId = customerDoc.id;
          
          setIsExistingCustomer(true);
          setExistingCustomerId(customerId);
          
          // Pre-fill form with existing data, including document URLs if they exist
          setFormData(prev => ({
            ...prev,
            email: customerData.email || "",
            phone_number: customerData.phone_number || "",
            first_name: customerData.first_name || "",
            last_name: customerData.last_name || "",
            dateOfBirth: customerData.dateOfBirth || "",
            taxId: customerData.taxId || "",
            address: {
              addressLine1: customerData.address?.addressLine1 || "",
              addressLine2: customerData.address?.addressLine2 || "",
              city: customerData.address?.city || "",
              stateProvinceRegion: customerData.address?.stateProvinceRegion || "",
              country: customerData.address?.country || "VE",
              postalCode: customerData.address?.postalCode || "",
            },
            identityDocument: {
              ...prev.identityDocument,
              idDocCountry: customerData.identityDocument?.idDocCountry || "VE",
              idDocType: customerData.identityDocument?.idDocType || "national_id",
              idDocNumber: customerData.identityDocument?.idDocNumber || "",
              idDocFrontPreview: customerData.identityDocument?.idDocFrontUrl || "",
              idDocBackPreview: customerData.identityDocument?.idDocBackUrl || "",
              idDocFrontUploaded: !!customerData.identityDocument?.idDocFrontUrl,
              idDocBackUploaded: !!customerData.identityDocument?.idDocBackUrl,
            }
          }));
        }
      } catch (err) {
        console.error("Error checking existing customer:", err);
      }
    };

    // Fetch IP address
    const fetchIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          ipAddress: data.ip
        }));
      } catch (error) {
        console.error('Error fetching IP:', error);
        // Fallback to a different IP service if the first one fails
        try {
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            ipAddress: data.ip
          }));
        } catch (fallbackError) {
          console.error('Error fetching IP from fallback service:', fallbackError);
        }
      }
    };

    fetchIP();
    checkExistingCustomer();
  }, []);

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
    // For new customers, require both identity documents
    if (!isExistingCustomer && (!formData.identityDocument.idDocFrontFile || !formData.identityDocument.idDocBackFile)) {
      setError("Please upload both front and back of your identity document");
      return;
    }
    
    // For existing customers, don't require ID documents if they were previously uploaded
    if (isExistingCustomer && !existingCustomerId) {
      setError("Cannot update account: Customer ID is missing");
      return;
    }

    setLoading(true);
    setError("");
    setResponseData(null); // Reset response data

    try {
      let customerRef;
      let customerData: any = {};
      
      if (isExistingCustomer && existingCustomerId) {
        // Update existing customer
        customerRef = doc(db, "customers", existingCustomerId);
        
        // Prepare the data to update
        customerData = {
          email: formData.email,
          phone_number: formData.phone_number,
          first_name: formData.first_name,
          last_name: formData.last_name,
          dateOfBirth: formData.dateOfBirth,
          ipAddress: formData.ipAddress,
          taxId: formData.taxId || '',
          address: {
            addressLine1: formData.address.addressLine1,
            addressLine2: formData.address.addressLine2 || '',
            city: formData.address.city,
            stateProvinceRegion: formData.address.stateProvinceRegion,
            country: formData.address.country,
            postalCode: formData.address.postalCode,
          },
          identityDocument: {
            idDocCountry: formData.identityDocument.idDocCountry,
            idDocType: formData.identityDocument.idDocType,
            idDocNumber: formData.identityDocument.idDocNumber,
          },
          updatedAt: new Date().toISOString(),
          status: "pending"
        };
        
        // Update Firestore
        await updateDoc(customerRef, customerData);
        
        // Add ID to the data object
        customerData.id = existingCustomerId;
        
        // Check if the user wants to re-upload either document
        const shouldUploadFront = !!formData.identityDocument.idDocFrontFile;
        const shouldUploadBack = !!formData.identityDocument.idDocBackFile;
        
        if (shouldUploadFront || shouldUploadBack) {
          const updates: Record<string, string> = {};
          
          if (shouldUploadFront) {
            const frontStorageRef = ref(storage, `identity_docs/${existingCustomerId}/front_${Date.now()}`);
            const frontUploadTask = await uploadBytesResumable(frontStorageRef, formData.identityDocument.idDocFrontFile!);
            const frontDownloadURL = await getDownloadURL(frontUploadTask.ref);
            updates['identityDocument.idDocFrontUrl'] = frontDownloadURL;
            
            // Update the customer data object
            if (!customerData.identityDocument) customerData.identityDocument = {};
            customerData.identityDocument.idDocFrontUrl = frontDownloadURL;
          }
          
          if (shouldUploadBack) {
            const backStorageRef = ref(storage, `identity_docs/${existingCustomerId}/back_${Date.now()}`);
            const backUploadTask = await uploadBytesResumable(backStorageRef, formData.identityDocument.idDocBackFile!);
            const backDownloadURL = await getDownloadURL(backUploadTask.ref);
            updates['identityDocument.idDocBackUrl'] = backDownloadURL;
            
            // Update the customer data object
            if (!customerData.identityDocument) customerData.identityDocument = {};
            customerData.identityDocument.idDocBackUrl = backDownloadURL;
          }
          
          // Only update if there are files to update
          if (Object.keys(updates).length > 0) {
            await updateDoc(customerRef, updates);
          }
        }
        
        // Get the latest document data to ensure we have all fields
        const updatedDocSnap = await getDocs(query(collection(db, "customers"), where("telegramId", "==", String(telegramId))));
        if (!updatedDocSnap.empty) {
          const updatedDoc = updatedDocSnap.docs[0];
          customerData = { id: updatedDoc.id, ...updatedDoc.data() };
        }
        
      } else {
        // Create new customer
        customerData = {
          email: formData.email,
          phone_number: formData.phone_number,
          first_name: formData.first_name,
          last_name: formData.last_name,
          dateOfBirth: formData.dateOfBirth,
          ipAddress: formData.ipAddress,
          taxId: formData.taxId || '',
          address: {
            addressLine1: formData.address.addressLine1,
            addressLine2: formData.address.addressLine2 || '',
            city: formData.address.city,
            stateProvinceRegion: formData.address.stateProvinceRegion,
            country: formData.address.country,
            postalCode: formData.address.postalCode,
          },
          identityDocument: {
            idDocCountry: formData.identityDocument.idDocCountry,
            idDocType: formData.identityDocument.idDocType,
            idDocNumber: formData.identityDocument.idDocNumber,
          },
          createdAt: new Date().toISOString(),
          status: "pending",
          telegramId: String(telegramId)
        };

        customerRef = await addDoc(collection(db, "customers"), customerData);
        
        // Add ID to the data object
        customerData.id = customerRef.id;

        // For new customers, always upload both files
        const frontStorageRef = ref(storage, `identity_docs/${customerRef.id}/front_${Date.now()}`);
        const backStorageRef = ref(storage, `identity_docs/${customerRef.id}/back_${Date.now()}`);

        const [frontUploadTask, backUploadTask] = await Promise.all([
          uploadBytesResumable(frontStorageRef, formData.identityDocument.idDocFrontFile!),
          uploadBytesResumable(backStorageRef, formData.identityDocument.idDocBackFile!)
        ]);

        const [frontDownloadURL, backDownloadURL] = await Promise.all([
          getDownloadURL(frontUploadTask.ref),
          getDownloadURL(backUploadTask.ref)
        ]);

        // Update the customer document with the file URLs
        const updates = {
          'identityDocument.idDocFrontUrl': frontDownloadURL,
          'identityDocument.idDocBackUrl': backDownloadURL
        };
        
        await updateDoc(customerRef, updates);
        
        // Update the customer data object
        if (!customerData.identityDocument) customerData.identityDocument = {};
        customerData.identityDocument.idDocFrontUrl = frontDownloadURL;
        customerData.identityDocument.idDocBackUrl = backDownloadURL;
      }

      // Set the response data to display to the user
      setResponseData(customerData);
      toast.success(isExistingCustomer ? "Customer information updated successfully!" : "Customer account created successfully!");
      
      // Reset form
      setFormData({
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
          idDocFrontUploaded: false,
          idDocBackUploaded: false,
        },
        taxId: "",
      });
      setStep(1);

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to process customer information');
      toast.error(err.message || 'Failed to process customer information');
    } finally {
      setLoading(false);
    }
  }

  // Add a new component to display the response data
  const ResponseDataDisplay = ({ data }: { data: any }) => {
    if (!data) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Customer Data</h2>
            <button 
              onClick={() => setResponseData(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <pre className="text-xs font-mono bg-gray-900 p-4 rounded overflow-auto max-h-[60vh] whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                toast.success("JSON copied to clipboard");
              }}
              className="px-4 py-2 bg-blue hover:bg-blue-light text-white rounded"
            >
              Copy JSON
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-black rounded-lg text-white">
      <h1 className="text-xl font-bold mb-4 text-center">
        {isExistingCustomer ? "Update Customer Information" : ""}
      </h1>

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
        <div className="space-y-4 mb-[80px]">
          <h2 className="text-xl  font-bold">Basic Information</h2>

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
        <div className="space-y-4  mb-[80px]">
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
            <Button onClick={nextStep} className="bg-blue hover:bg-blue-light text-white">
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4  mb-[80px]">
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
              <Label htmlFor="idDocFront">
                Front of Document {!formData.identityDocument.idDocFrontUploaded && "*"}
                {formData.identityDocument.idDocFrontUploaded && <span className="text-xs ml-2 text-gray-400">(Optional - Already uploaded)</span>}
              </Label>
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
                  className="flex justify-between items-center h-10 px-3 py-2 bg-black border border-gray-600 rounded-md text-white cursor-pointer"
                >
                  <span className="truncate">
                    {formData.identityDocument.idDocFrontUploaded && !formData.identityDocument.idDocFrontFile
                      ? "Document already uploaded - Click to replace"
                      : formData.identityDocument.idDocFrontFile
                        ? formData.identityDocument.idDocFrontFile.name
                        : "Click to upload"}
                  </span>
                  {formData.identityDocument.idDocFrontUploaded && (
                    <span className="text-xs text-gray-400 ml-2">Optional</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="idDocBack">
                Back of Document {!formData.identityDocument.idDocBackUploaded && "*"}
                {formData.identityDocument.idDocBackUploaded && <span className="text-xs ml-2 text-gray-400">(Optional - Already uploaded)</span>}
              </Label>
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
                  className="flex justify-between items-center h-10 px-3 py-2 bg-black border border-gray-600 rounded-md text-white cursor-pointer"
                >
                  <span className="truncate">
                    {formData.identityDocument.idDocBackUploaded && !formData.identityDocument.idDocBackFile
                      ? "Document already uploaded - Click to replace"
                      : formData.identityDocument.idDocBackFile
                        ? formData.identityDocument.idDocBackFile.name
                        : "Click to upload"}
                  </span>
                  {formData.identityDocument.idDocBackUploaded && (
                    <span className="text-xs text-gray-400 ml-2">Optional</span>
                  )}
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
        <div className="space-y-4  mb-[80px]">
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

      {/* Response data modal */}
      {responseData && <ResponseDataDisplay data={responseData} />}
    </div>
  )
}

