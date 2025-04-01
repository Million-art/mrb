import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const a = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    phone_number: "",
    kyc_type: "standard",
    address_line_1: "",
    city: "",
    country: "VE",
    stateProvinceRegion: "",
    postalCode: "",
    ipAddress: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    idDocCountry: "",
    idDocType: "",
    idDocNumber: "",
    idDocFrontFile: "",
    taxId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        "https://createbankaccount-3bfnrbjopq-uc.a.run.app",
        formData
      );
      alert("Account created successfully: " + response.data.id);
      navigate("/dashboard");
    } catch (err:any) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      title: "Personal Information",
      fields: [
        { name: "firstName", label: "First Name", type: "text", required: true },
        { name: "lastName", label: "Last Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone_number", label: "Phone Number", type: "tel", required: true },
        { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
        { name: "taxId", label: "Tax ID", type: "text", required: true },
      ]
    },
    {
      title: "Address Information",
      fields: [
        { name: "address_line_1", label: "Street Address", type: "text", required: true },
        { name: "city", label: "City", type: "text", required: true },
        { name: "stateProvinceRegion", label: "State/Region", type: "text", required: true },
        { name: "postalCode", label: "Postal Code", type: "text", required: true },
        { name: "country", label: "Country", type: "text", required: true },
        { name: "ipAddress", label: "IP Address", type: "text", required: true },
      ]
    },
    {
      title: "Identity Verification",
      fields: [
        { name: "idDocCountry", label: "ID Document Country", type: "text", required: true },
        { name: "idDocType", label: "ID Document Type", type: "text", required: true },
        { name: "idDocNumber", label: "ID Document Number", type: "text", required: true },
        { name: "idDocFrontFile", label: "ID Document (Front)", type: "file", accept: "image/*", required: true },
      ]
    }
  ];

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  return (
    <div className="text-white w-full h-screen max-w-md mx-auto flex flex-col">
      {/* Fixed header */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Create Account</h1>
          <div className="w-6" />
        </div>

        <div className="flex justify-center mb-4">
          {sections.map((_, index) => (
            <div key={index} className="flex items-center">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center 
                  ${currentSection >= index ? 'bg-blue' : 'bg-gray-600'}`}
              >
                {index + 1}
              </div>
              {index < sections.length - 1 && (
                <div className={`w-8 h-1 ${currentSection > index ? 'bg-blue-light' : 'bg-gray-600'}`} />
              )}
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-4">{sections[currentSection].title}</h2>
      </div>

      {/* Scrollable form content */}
      <div className="flex-grow overflow-y-auto px-4 pb-4 ">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {sections[currentSection].fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === "file" ? (
                  <input
                    type="file"
                    name={field.name}
                    onChange={handleFileChange}
                    accept={field.accept}
                    required={field.required}
                    className="w-full p-2 rounded bg-transparent border border-gray-700 text-white text-sm"
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                    className="w-full p-2 rounded bg-transparent border border-gray-700 text-white"
                  />
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>

      {/* Fixed footer with navigation buttons */}
      <div className="flex-shrink-0 p-4 mb-20">
        <div className="flex justify-between">
          {currentSection > 0 ? (
            <button
              type="button"
              onClick={prevSection}
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          {currentSection < sections.length - 1 ? (
            <button
              type="button"
              onClick={nextSection}
              className="px-4 py-2 rounded bg-blue hover:bg-blue-light text-white"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue hover:bg-blue-light text-white"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Creating..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default a;