import { Platform, Share } from 'react-native';

type LoginDetails = {
  businessName: string;
  ownerName: string;
  phone: string;
  loginPin?: string;
};

export function formatLoginMessage(details: LoginDetails): string {
  const pinLine = details.loginPin
    ? `Login PIN: ${details.loginPin}`
    : 'Login PIN: Use the PIN that was shared when your account was created. Contact admin if you forgot it.';

  return (
    `Quick Books — Login Details\n\n` +
    `Business: ${details.businessName}\n` +
    `Owner: ${details.ownerName}\n` +
    `Mobile Number: ${details.phone}\n` +
    `${pinLine}\n\n` +
    `Download the Quick Books app and sign in with your mobile number and PIN.`
  );
}

export async function shareLoginDetails(details: LoginDetails): Promise<'shared' | 'clipboard'> {
  const message = formatLoginMessage(details);

  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: 'Quick Books Login Details', text: message });
      return 'shared';
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      return 'clipboard';
    }
    throw new Error('Sharing is not supported in this browser');
  }

  await Share.share({ message });
  return 'shared';
}
