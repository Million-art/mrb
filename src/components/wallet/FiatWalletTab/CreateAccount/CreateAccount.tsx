import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateCustomerForm from "./CreateCustomerForm";

const CreateAccount = () => {
  const navigate = useNavigate();

  return (
    <div className="text-white w-full min-h-screen p-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Create Account</h1>
        <div className="w-6" />
      </div>
        <CreateCustomerForm />
    </div>
  );
};

export default CreateAccount;
