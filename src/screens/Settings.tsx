import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/stonfi/ui/select";
import { Label } from "@/components/stonfi/ui/label";
import { Button } from "@/components/stonfi/ui/button";
import { Settings, ArrowLeft } from "lucide-react";
import Profile from "@/components/wallet/FiatWalletTab/settings/Profile";

const MyAccount: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const navigateToAccountSettings = () => {
    navigate("/account-settings");
  };

  const navigateToPrivacyPolicy = () => {
    navigate("/privacy-policy");
  };

  const navigateToExternalUsdcAddress = () => {
    navigate("/external-usdc-address");
  };

  const navigateBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-400" />
            <h1 className="text-2xl font-semibold">Settings</h1>
          </div>
        </div>

        {/* Profile Component */}
        <div className="mb-6">
          <Profile />
        </div>

        {/* Settings Cards */}
        <div className="space-y-6 mb-[100px]">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* External USDC Address Section */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="external-usdc" className="text-lg font-medium">External USDC Address</Label>
                    <p className="text-sm text-gray-400 mt-1">Link USDC to receive referral commission</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={navigateToExternalUsdcAddress}
                    className="px-6 bg-gray-800/50 border-gray-700 hover:bg-gray-700"
                  >
                    Open
                  </Button>
                </div>

                

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div>
                    <Label htmlFor="account-settings" className="text-lg font-medium">Account Settings</Label>
                    <p className="text-sm text-gray-400 mt-1">Manage your account preferences and information</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={navigateToAccountSettings}
                    className="px-6 bg-gray-800/50 border-gray-700 hover:bg-gray-700"
                  >
                    Open
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <Label htmlFor="language" className="text-lg font-medium mb-2 block">Language</Label>
                  <Select onValueChange={changeLanguage} defaultValue={i18n.language}>
                    <SelectTrigger id="language" className="w-full bg-gray-800/50 border-gray-700">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div>
                    <Label htmlFor="privacy-policy" className="text-lg font-medium">Privacy Policy</Label>
                    <p className="text-sm text-gray-400 mt-1">Read our privacy policy and terms of service</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={navigateToPrivacyPolicy}
                    className="px-6 bg-gray-800/50 border-gray-700 hover:bg-gray-700"
                  >
                    Open
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyAccount; 