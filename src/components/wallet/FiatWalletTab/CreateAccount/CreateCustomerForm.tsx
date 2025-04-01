import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreateCustomerForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    phone_number: "",
    first_name: "",
    last_name: "",
  });
  const [idDocFront, setIdDocFront] = useState<File | null>(null);
  const [idDocBack, setIdDocBack] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "front" | "back") => {
    if (e.target.files && e.target.files[0]) {
      if (type === "front") {
        setIdDocFront(e.target.files[0]);
      } else {
        setIdDocBack(e.target.files[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email && !formData.phone_number) {
      setError("Email or phone number is required");
      setLoading(false);
      return;
    }

    if (!formData.first_name || !formData.last_name) {
      setError("First and last name are required");
      setLoading(false);
      return;
    }

    if (!idDocFront || !idDocBack) {
      setError("Both ID front and back images are required");
      setLoading(false);
      return;
    }

    const formPayload = new FormData();
    formPayload.append("email", formData.email);
    formPayload.append("phone_number", formData.phone_number);
    formPayload.append("first_name", formData.first_name);
    formPayload.append("last_name", formData.last_name);
    formPayload.append("type", "individual");
    formPayload.append("kyc_type", "standard");
    formPayload.append("id_doc_front_file", idDocFront);
    formPayload.append("id_doc_back_file", idDocBack);

    try {
      const response = await axios.post(
        "https://your-firebase-project.cloudfunctions.net/createCustomer",
        formPayload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(`Customer created! ID: ${response.data.id}`);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 text-white min-h-screen">


      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 rounded bg-transparentborder border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full p-2 rounded bg-transparentborder border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full p-2 rounded bg-transparentborder border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full p-2 rounded bg-transparentborder border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              ID Document (Front) *
            </label>
            <input
              type="file"
              onChange={(e) => handleFileChange(e, "front")}
              accept="image/*"
              required
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              ID Document (Back) *
            </label>
            <input
              type="file"
              onChange={(e) => handleFileChange(e, "back")}
              accept="image/*"
              required
              className="w-full text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm p-2 bg-red-900 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue hover:bg-blue-light rounded text-white mt-6"
        >
          {loading ? "Creating..." : "Create Customer"}
        </button>
      </form>
    </div>
  );
};

export default CreateCustomerForm;