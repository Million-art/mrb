import { retrieveLaunchParams } from '@telegram-apps/sdk';
//  intializing user  to fetch the user data
const { initData } = retrieveLaunchParams();
export const telegramId = initData?.user?.id;
export const userName = initData?.user?.username;
export const firstName = initData?.user?.firstName;
export const lastName = initData?.user?.lastName;
export const referredBy = initData?.startParam;
export const languageCode = initData?.user?.languageCode;
export const profilePicture = initData?.user?.photoUrl
export const startParam = initData?.startParam