import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { registerAlertHandler, type AlertButton, type AlertOptions } from '../utils/appAlert';
import { colors } from '../theme/colors';

type AlertContextValue = {
  showAlert: (options: AlertOptions) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((next: AlertOptions) => {
    setOptions(next);
    setVisible(true);
  }, []);

  useEffect(() => {
    registerAlertHandler(showAlert);
    return () => registerAlertHandler(null);
  }, [showAlert]);

  const close = () => {
    setVisible(false);
    setOptions(null);
  };

  const handlePress = async (button: AlertButton) => {
    close();
    await button.onPress?.();
  };

  const buttons = options?.buttons?.length ? options.buttons : [{ text: 'OK' }];

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>{options?.title}</Text>
            {options?.message ? <Text style={styles.message}>{options.message}</Text> : null}
            <View style={[styles.actions, buttons.length > 2 && styles.actionsStacked]}>
              {buttons.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';
                return (
                  <Pressable
                    key={`${button.text}-${index}`}
                    style={[
                      styles.actionButton,
                      buttons.length <= 2 && styles.actionButtonFlex,
                      isCancel && styles.actionCancel,
                      isDestructive && styles.actionDestructive,
                      !isCancel && !isDestructive && styles.actionPrimary,
                    ]}
                    onPress={() => handlePress(button)}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        isCancel && styles.actionTextCancel,
                        isDestructive && styles.actionTextDestructive,
                        !isCancel && !isDestructive && styles.actionTextPrimary,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  actionsStacked: {
    flexDirection: 'column',
  },
  actionButton: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 88,
  },
  actionButtonFlex: {
    flex: 1,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionCancel: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.error,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionTextPrimary: {
    color: colors.text,
  },
  actionTextCancel: {
    color: colors.textSecondary,
  },
  actionTextDestructive: {
    color: colors.error,
  },
});
