import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/stonfi/ui/button";
import { Card, CardContent } from "@/components/stonfi/ui/card";

interface ProfileIdsProps {
  userId: string;
  customerData?: {
    bankAccountId: string;
    legal_name: string;
  } | null;
}

const ProfileIds: React.FC<ProfileIdsProps> = ({ userId, customerData }) => {
  const [copiedField, setCopiedField] = useState<'id' | 'bankAccount' | null>(null);

  const handleCopy = async (field: 'id' | 'bankAccount', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* User ID Section */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white">User ID</h3>
              <p className="text-sm text-gray-400 mt-1">Use this Id to receive internal USDC transfers</p>
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-400">{userId}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy('id', userId)}
                className="h-6 w-6 p-0 hover:bg-gray-700"
              >
                {copiedField === 'id' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {/* Bank Account ID Section - Only render if customerData exists
          {customerData?.bankAccountId && (
            <>
              <div className="pt-4 border-t border-gray-800" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Account ID</h3>
                  <p className="text-sm text-gray-400 mt-1">Use this ID to receive international remittances</p>
                </div>
                <div className="flex items-center space-x-2">

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy('bankAccount', customerData.bankAccountId)}
                    className="h-6 w-6 p-0 hover:bg-gray-700"
                  >
                    {copiedField === 'bankAccount' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )} */}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileIds; 