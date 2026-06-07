import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { createPortal } from 'react-dom';
import { colors } from '../theme/colors';

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  compact?: boolean;
  onChange: (value: string) => void;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

function WebPortalDropdown({
  position,
  options,
  value,
  onSelect,
  dropdownRef,
}: {
  position: DropdownPosition;
  options: SelectOption[];
  value: string;
  onSelect: (value: string) => void;
  dropdownRef: RefObject<HTMLDivElement | null>;
}) {
  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 9999,
        maxHeight: 280,
        overflowY: 'auto',
        backgroundColor: colors.surfaceElevated,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
      }}
    >
      {options.length === 0 ? (
        <div style={{ color: colors.textSecondary, padding: 14, fontSize: 14 }}>No options available</div>
      ) : (
        options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(option.value);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                border: 'none',
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: selected ? 'rgba(59, 130, 246, 0.15)' : colors.surfaceElevated,
                color: selected ? colors.primary : colors.text,
                fontWeight: selected ? 600 : 400,
                fontSize: 15,
                padding: '12px 14px',
                cursor: 'pointer',
              }}
            >
              {option.label}
            </button>
          );
        })
      )}
    </div>,
    document.body,
  );
}

export function Select({ label, value, options, placeholder = 'Select...', compact, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [portalPosition, setPortalPosition] = useState<DropdownPosition | null>(null);
  const triggerRef = useRef<View>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((opt) => opt.value === value);
  const usePortal = Platform.OS === 'web';

  const updatePortalPosition = () => {
    if (!usePortal || !triggerRef.current) {
      return;
    }

    const node = triggerRef.current as unknown as HTMLElement;
    const rect = node.getBoundingClientRect();
    setPortalPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  useLayoutEffect(() => {
    if (!open || !usePortal) {
      setPortalPosition(null);
      return;
    }
    updatePortalPosition();
  }, [open, usePortal, options.length]);

  useEffect(() => {
    if (!open || !usePortal) {
      return undefined;
    }

    const handleReposition = () => updatePortalPosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, usePortal]);

  useEffect(() => {
    if (!open || !usePortal) {
      return undefined;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const triggerNode = triggerRef.current as unknown as HTMLElement | null;
      const dropdownNode = dropdownRef.current;
      if (triggerNode?.contains(target) || dropdownNode?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open, usePortal]);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  const dropdown = open ? (
    <View style={styles.dropdown}>
      {options.length === 0 ? (
        <Text style={styles.emptyOption}>No options available</Text>
      ) : (
        options.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.option, value === option.value && styles.optionSelected]}
            onPress={() => handleSelect(option.value)}
          >
            <Text style={[styles.optionText, value === option.value && styles.optionTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))
      )}
    </View>
  ) : null;

  return (
    <View style={[styles.container, compact && styles.compact, open && styles.containerOpen]}>
      <Text style={styles.label}>{label}</Text>
      <View ref={triggerRef} collapsable={false}>
        <Pressable style={styles.trigger} onPress={() => setOpen((current) => !current)}>
          <Text style={[styles.triggerText, !selected && styles.placeholder]}>
            {selected?.label ?? placeholder}
          </Text>
          <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
        </Pressable>
      </View>
      {!usePortal ? dropdown : null}
      {usePortal && open && portalPosition ? (
        <WebPortalDropdown
          position={portalPosition}
          options={options}
          value={value}
          onSelect={handleSelect}
          dropdownRef={dropdownRef}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  containerOpen: {
    zIndex: 50,
  },
  compact: {
    marginBottom: 0,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 6,
    fontSize: 14,
  },
  trigger: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  triggerText: {
    color: colors.text,
    fontSize: 16,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 51,
    elevation: 8,
    maxHeight: 280,
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)' } : {}),
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.primary + '22',
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyOption: {
    color: colors.textSecondary,
    padding: 14,
    fontSize: 14,
  },
});
