export type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
};

export type AlertOptions = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

let alertHandler: ((options: AlertOptions) => void) | null = null;

export function registerAlertHandler(handler: ((options: AlertOptions) => void) | null) {
  alertHandler = handler;
}

export function appAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (!alertHandler) {
    console.warn('AlertProvider is not mounted:', title, message);
    return;
  }

  alertHandler({
    title,
    message,
    buttons: buttons?.length ? buttons : [{ text: 'OK' }],
  });
}
