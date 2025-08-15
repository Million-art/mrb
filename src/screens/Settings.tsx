import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/stonfi/ui/select";
import { Label } from "@/components/stonfi/ui/label";
import { Button } from "@/components/stonfi/ui/button";
import { Settings, ArrowLeft } from "lucide-react";
import Profile from "@/components/wallet/FiatWalletTab/settings/Profile";
import { selectUser, updateUserLanguage } from "@/store/slice/userSlice";
import { updateUserLanguage as updateUserLanguageInFirestore } from "@/libs/firestore";
import { toast } from "react-toastify";

const MyAccount: React.FC = () => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const changeLanguage = async (lang: string) => {
    try {
      // Update Redux store first
      dispatch(updateUserLanguage(lang));
      
      // Update Firestore if user is logged in
      if (user?.uid) {
        await updateUserLanguageInFirestore(user.uid, lang);
        toast.success(t('settings.languageUpdated'));
      }
      
      // Change the i18n language immediately
      i18n.changeLanguage(lang);
      
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error(t('settings.languageUpdateError'));
    }
  };

  const navigateToAccountSettings = () => {
    navigate("/account-settings");
  };

  const navigateToPrivacyPolicy = () => {
    navigate("/privacy-policy");
  };



  const navigateBack = () => {
    navigate(-1);
  };

  // Get current language from user state or i18n
  const currentLanguage = user?.languageCode || i18n.language;

  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateBack}
            className="text-gray-400 hover:text-white"
            aria-label={t('settings.backButton')}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-400" />
            <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
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

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div>
                    <Label htmlFor="account-settings" className="text-lg font-medium">{t('settings.accountSettingsTitle')}</Label>
                    <p className="text-sm text-gray-400 mt-1">{t('settings.accountSettingsDescription')}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={navigateToAccountSettings}
                    className="px-6 bg-gray-800/50 border-gray-700 hover:bg-gray-700"
                  >
                    {t('settings.openButton')}
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <Label htmlFor="language" className="text-lg font-medium mb-2 block">{t('settings.languageTitle')}</Label>
                  <Select onValueChange={changeLanguage} value={currentLanguage}>
                    <SelectTrigger id="language" className="w-full bg-gray-800/50 border-gray-700">
                      <SelectValue placeholder={t('settings.languagePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t('settings.languages.en')}</SelectItem>
                      <SelectItem value="zh">{t('settings.languages.zh')}</SelectItem>
                      <SelectItem value="es">{t('settings.languages.es')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div>
                    <Label htmlFor="privacy-policy" className="text-lg font-medium">{t('settings.privacyPolicyTitle')}</Label>
                    <p className="text-sm text-gray-400 mt-1">{t('settings.privacyPolicyDescription')}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={navigateToPrivacyPolicy}
                    className="px-6 bg-gray-800/50 border-gray-700 hover:bg-gray-700"
                  >
                    {t('settings.openButton')}
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