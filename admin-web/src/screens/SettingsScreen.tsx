import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import {
  api,
  BackupInfo,
  BusinessType,
  DataStatus,
  DemoDataJob,
  DemoSubscriber,
  PlatformCompanySettings,
  SmtpSettings,
} from '../services/api';
import { colors } from '../theme/colors';

type SettingsScreenProps = {
  token: string;
};

type SettingsTab = 'PLATFORM' | 'SMTP' | 'TRUNCATE' | 'BACKUP' | 'RESTORE' | 'DEMO';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'PLATFORM', label: 'Our Company' },
  { id: 'SMTP', label: 'Email (SMTP)' },
  { id: 'TRUNCATE', label: 'Truncate' },
  { id: 'BACKUP', label: 'Backup' },
  { id: 'RESTORE', label: 'Restore' },
  { id: 'DEMO', label: 'Demo Data' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

const TRUNCATE_CONFIRM_PHRASE = 'TRUNCATE TRANSACTIONAL DATA';
const RESTORE_CONFIRM_PHRASE = 'RESTORE DATABASE';

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Never';
  }
  return new Date(value).toLocaleString();
}

function downloadBlob(fileName: string, blob: Blob) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    throw new Error('Download is available on the admin web portal only');
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function pickSqlFile(): Promise<File | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.reject(new Error('File upload is available on the admin web portal only'));
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sql,application/sql,text/plain';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

export function SettingsScreen({ token }: SettingsScreenProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('TRUNCATE');
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [truncatePhrase, setTruncatePhrase] = useState('');
  const [showTruncateConfirm, setShowTruncateConfirm] = useState(false);
  const [truncating, setTruncating] = useState(false);

  const [creatingBackup, setCreatingBackup] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePhrase, setRestorePhrase] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [businessTypeId, setBusinessTypeId] = useState('');
  const [companyTarget, setCompanyTarget] = useState('all');
  const [companyName, setCompanyName] = useState('');
  const [fromDate, setFromDate] = useState(monthStartIso());
  const [toDate, setToDate] = useState(todayIso());
  const [demoJob, setDemoJob] = useState<DemoDataJob | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [demoSubscribers, setDemoSubscribers] = useState<DemoSubscriber[]>([]);
  const [loadingDemoSubscribers, setLoadingDemoSubscribers] = useState(false);

  const [platformLoading, setPlatformLoading] = useState(false);
  const [platformSaving, setPlatformSaving] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [platformCompanyName, setPlatformCompanyName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [platformMobile, setPlatformMobile] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [smtpEnabled, setSmtpEnabled] = useState('false');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');
  const [smtpUseTls, setSmtpUseTls] = useState('true');
  const [smtpUseSsl, setSmtpUseSsl] = useState('false');
  const [smtpPasswordConfigured, setSmtpPasswordConfigured] = useState(false);

  const businessTypeOptions = useMemo(
    () => businessTypes.map((type) => ({ label: type.name, value: String(type.id) })),
    [businessTypes],
  );

  const selectedBusinessType = useMemo(
    () => businessTypes.find((type) => String(type.id) === businessTypeId),
    [businessTypes, businessTypeId],
  );

  const demoSubscriberForType = useMemo(
    () => demoSubscribers.find((subscriber) => subscriber.businessTypeId === Number(businessTypeId)),
    [demoSubscribers, businessTypeId],
  );

  const companyOptions = useMemo(() => {
    const options = [{ label: 'All demo companies (5)', value: 'all' }];
    for (const company of demoSubscriberForType?.companies ?? []) {
      options.push({
        label: `${company.name} ·${company.alias}`,
        value: String(company.id),
      });
    }
    options.push({ label: 'Create new company', value: 'new' });
    return options;
  }, [demoSubscriberForType]);

  const defaultCompanyName = selectedBusinessType
    ? `Demo - ${selectedBusinessType.name} - Branch`
    : 'Demo - Branch';

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getDataStatus(token);
      setStatus(data);
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadBusinessTypes = useCallback(async () => {
    try {
      const types = await api.getActiveBusinessTypes(token);
      setBusinessTypes(types);
      setBusinessTypeId((current) => current || (types.length > 0 ? String(types[0].id) : ''));
    } catch {
      // Optional filter data for demo generation.
    }
  }, [token]);

  const loadDemoSubscribers = useCallback(async () => {
    setLoadingDemoSubscribers(true);
    try {
      const subscribers = await api.listDemoSubscribers(token);
      setDemoSubscribers(subscribers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load demo subscribers');
    } finally {
      setLoadingDemoSubscribers(false);
    }
  }, [token]);

  const applyCompanySettings = (settings: PlatformCompanySettings) => {
    setPlatformCompanyName(settings.companyName ?? '');
    setSupportEmail(settings.supportEmail ?? '');
    setContactEmail(settings.contactEmail ?? '');
    setPlatformMobile(settings.mobileNumber ?? '');
    setWebsiteUrl(settings.websiteUrl ?? '');
    setAddressLine1(settings.addressLine1 ?? '');
    setAddressLine2(settings.addressLine2 ?? '');
    setCity(settings.city ?? '');
    setStateName(settings.state ?? '');
    setCountry(settings.country ?? '');
    setPostalCode(settings.postalCode ?? '');
  };

  const applySmtpSettings = (settings: SmtpSettings) => {
    setSmtpEnabled(settings.enabled ? 'true' : 'false');
    setSmtpHost(settings.host ?? '');
    setSmtpPort(settings.port != null ? String(settings.port) : '587');
    setSmtpUsername(settings.username ?? '');
    setSmtpPassword('');
    setSmtpFromEmail(settings.fromEmail ?? '');
    setSmtpFromName(settings.fromName ?? '');
    setSmtpUseTls(settings.useTls ? 'true' : 'false');
    setSmtpUseSsl(settings.useSsl ? 'true' : 'false');
    setSmtpPasswordConfigured(settings.passwordConfigured);
  };

  const loadPlatformSettings = useCallback(async () => {
    setPlatformLoading(true);
    setError('');
    try {
      const settings = await api.getPlatformSettings(token);
      applyCompanySettings(settings.company);
      applySmtpSettings(settings.smtp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform settings');
    } finally {
      setPlatformLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStatus();
    loadBusinessTypes();
    loadDemoSubscribers();
    loadPlatformSettings();
  }, [loadStatus, loadBusinessTypes, loadDemoSubscribers, loadPlatformSettings]);

  useEffect(() => {
    setCompanyTarget('all');
    setCompanyName('');
  }, [businessTypeId]);

  useEffect(() => {
    if (!activeJobId) {
      return undefined;
    }

    let cancelled = false;
    const poll = async () => {
      try {
        const job = await api.getDemoDataJob(token, activeJobId);
        if (cancelled) {
          return;
        }
        setDemoJob(job);
        if (job.status === 'COMPLETED') {
          setActiveJobId(null);
          setGeneratingDemo(false);
          setSuccess(
            job.result?.companiesSeeded && job.result.companiesSeeded > 1
              ? `Demo data ready for ${job.result.companiesSeeded} companies (${job.result.companiesSummary ?? ''}): phone ${job.result?.phone}, PIN ${job.result?.loginPin}`
              : `Demo data ready for ${job.result?.companyName ?? job.result?.businessTypeName ?? 'company'} ·${job.result?.companyAlias ?? ''}: phone ${job.result?.phone}, PIN ${job.result?.loginPin}`,
          );
          await loadDemoSubscribers();
        } else if (job.status === 'FAILED') {
          setActiveJobId(null);
          setGeneratingDemo(false);
          setError(job.error ?? 'Demo data generation failed');
        }
      } catch (err) {
        if (!cancelled) {
          setActiveJobId(null);
          setGeneratingDemo(false);
          setError(err instanceof Error ? err.message : 'Failed to track demo data job');
        }
      }
    };

    poll();
    const interval = setInterval(poll, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeJobId, token, loadDemoSubscribers]);

  const handleSaveCompanySettings = async () => {
    setPlatformSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.updatePlatformCompanySettings(token, {
        companyName: platformCompanyName,
        supportEmail,
        contactEmail,
        mobileNumber: platformMobile,
        websiteUrl,
        addressLine1,
        addressLine2,
        city,
        state: stateName,
        country,
        postalCode,
      });
      applyCompanySettings(result);
      setSuccess('Company details saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save company details');
    } finally {
      setPlatformSaving(false);
    }
  };

  const handleSaveSmtpSettings = async () => {
    setSmtpSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.updateSmtpSettings(token, {
        enabled: smtpEnabled === 'true',
        host: smtpHost,
        port: smtpPort.trim() ? Number(smtpPort) : undefined,
        username: smtpUsername,
        password: smtpPassword.trim() || undefined,
        fromEmail: smtpFromEmail,
        fromName: smtpFromName,
        useTls: smtpUseTls === 'true',
        useSsl: smtpUseSsl === 'true',
      });
      applySmtpSettings(result);
      setSuccess('SMTP settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save SMTP settings');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleTruncate = async () => {
    setTruncating(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.truncateTransactionalData(token, truncatePhrase.trim());
      setSuccess(result.message);
      setTruncatePhrase('');
      setShowTruncateConfirm(false);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Truncate failed');
    } finally {
      setTruncating(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    setError('');
    setSuccess('');
    try {
      const backup = await api.createDatabaseBackup(token);
      setSuccess(`Backup created: ${backup.fileName}`);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup failed');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (backup: BackupInfo) => {
    setDownloadingFile(backup.fileName);
    setError('');
    try {
      const blob = await api.downloadDatabaseBackup(token, backup.fileName);
      downloadBlob(backup.fileName, blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingFile(null);
    }
  };

  const handlePickRestoreFile = async () => {
    setError('');
    try {
      const file = await pickSqlFile();
      setRestoreFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not pick file');
    }
  };

  const handleGenerateDemoData = async () => {
    if (!businessTypeId) {
      setError('Select a business type');
      return;
    }

    setGeneratingDemo(true);
    setError('');
    setSuccess('');
    setDemoJob(null);
    try {
      const payload: {
        businessTypeId: number;
        fromDate: string;
        toDate: string;
        companyId?: number;
        companyName?: string;
      } = {
        businessTypeId: Number(businessTypeId),
        fromDate,
        toDate,
      };

      if (companyTarget === 'new') {
        const trimmedName = companyName.trim();
        if (trimmedName) {
          payload.companyName = trimmedName;
        }
      } else if (companyTarget !== 'all') {
        payload.companyId = Number(companyTarget);
      }

      const job = await api.startDemoDataGeneration(token, payload);
      setDemoJob(job);
      setActiveJobId(job.jobId);
    } catch (err) {
      setGeneratingDemo(false);
      setError(err instanceof Error ? err.message : 'Failed to start demo data generation');
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      setError('Select a .sql backup file first');
      return;
    }

    setRestoring(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.restoreDatabaseBackup(token, restoreFile, restorePhrase.trim());
      setSuccess(result.message);
      setRestoreFile(null);
      setRestorePhrase('');
      setShowRestoreConfirm(false);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const renderTransactionalTable = () => {
    if (!status?.transactionalTables?.length) {
      return <Text style={styles.muted}>No transactional table data available.</Text>;
    }

    return (
      <View style={styles.table}>
        {status.transactionalTables.map((table) => (
          <View key={table.tableName} style={styles.tableRow}>
            <Text style={styles.tableLabel}>{table.label}</Text>
            <Text style={styles.tableValue}>{table.rowCount.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderBackupList = (backups: BackupInfo[]) => {
    if (!backups.length) {
      return <Text style={styles.muted}>No backups yet. Create one to get started.</Text>;
    }

    return (
      <View style={styles.backupList}>
        {backups.map((backup) => (
          <View key={backup.fileName} style={styles.backupRow}>
            <View style={styles.backupMeta}>
              <Text style={styles.backupName}>{backup.fileName}</Text>
              <Text style={styles.muted}>
                {formatBytes(backup.sizeBytes)} · {formatDateTime(backup.createdAt)}
              </Text>
            </View>
            <Button
              title="Download"
              variant="secondary"
              onPress={() => handleDownloadBackup(backup)}
              loading={downloadingFile === backup.fileName}
            />
          </View>
        ))}
      </View>
    );
  };

  const renderPlatformTab = () => (
    <Card>
      <Text style={styles.sectionTitle}>Our company details</Text>
      <Text style={styles.muted}>
        These details represent your platform business. They can be used in emails, invoices, and support
        communications in the future.
      </Text>

      {platformLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <View style={styles.formGrid}>
            <View style={styles.formField}>
              <Input label="Company Name" value={platformCompanyName} onChangeText={setPlatformCompanyName} />
            </View>
            <View style={styles.formField}>
              <Input label="Support Email" value={supportEmail} onChangeText={setSupportEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.formField}>
              <Input label="Contact Email" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.formField}>
              <Input label="Mobile Number" value={platformMobile} onChangeText={setPlatformMobile} keyboardType="phone-pad" />
            </View>
            <View style={styles.formField}>
              <Input label="Website" value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" placeholder="https://example.com" />
            </View>
            <View style={styles.formField}>
              <Input label="Address Line 1" value={addressLine1} onChangeText={setAddressLine1} />
            </View>
            <View style={styles.formField}>
              <Input label="Address Line 2" value={addressLine2} onChangeText={setAddressLine2} />
            </View>
            <View style={styles.formField}>
              <Input label="City" value={city} onChangeText={setCity} />
            </View>
            <View style={styles.formField}>
              <Input label="State / Province" value={stateName} onChangeText={setStateName} />
            </View>
            <View style={styles.formField}>
              <Input label="Country" value={country} onChangeText={setCountry} />
            </View>
            <View style={styles.formField}>
              <Input label="Postal Code" value={postalCode} onChangeText={setPostalCode} />
            </View>
          </View>
          <Button title="Save company details" onPress={handleSaveCompanySettings} loading={platformSaving} />
        </>
      )}
    </Card>
  );

  const renderSmtpTab = () => (
    <Card>
      <Text style={styles.sectionTitle}>SMTP email settings</Text>
      <Text style={styles.muted}>
        Configure outbound email for future notifications such as payment reminders and subscription alerts.
        Sending is not enabled yet — settings are stored for when email delivery is added.
      </Text>

      {platformLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Select
            label="Email sending"
            value={smtpEnabled}
            options={[
              { label: 'Disabled', value: 'false' },
              { label: 'Enabled', value: 'true' },
            ]}
            onChange={setSmtpEnabled}
          />
          <View style={styles.formGrid}>
            <View style={styles.formField}>
              <Input label="SMTP Host" value={smtpHost} onChangeText={setSmtpHost} autoCapitalize="none" placeholder="smtp.example.com" />
            </View>
            <View style={styles.formField}>
              <Input label="SMTP Port" value={smtpPort} onChangeText={setSmtpPort} keyboardType="number-pad" />
            </View>
            <View style={styles.formField}>
              <Input label="Username" value={smtpUsername} onChangeText={setSmtpUsername} autoCapitalize="none" />
            </View>
            <View style={styles.formField}>
              <Input
                label={smtpPasswordConfigured ? 'Password (leave blank to keep current)' : 'Password'}
                value={smtpPassword}
                onChangeText={setSmtpPassword}
                autoCapitalize="none"
                secureTextEntry
              />
            </View>
            <View style={styles.formField}>
              <Input label="From Email" value={smtpFromEmail} onChangeText={setSmtpFromEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.formField}>
              <Input label="From Name" value={smtpFromName} onChangeText={setSmtpFromName} />
            </View>
          </View>
          <View style={styles.smtpOptionsRow}>
            <Select
              label="Use TLS"
              value={smtpUseTls}
              compact
              options={[
                { label: 'Yes', value: 'true' },
                { label: 'No', value: 'false' },
              ]}
              onChange={setSmtpUseTls}
            />
            <Select
              label="Use SSL"
              value={smtpUseSsl}
              compact
              options={[
                { label: 'Yes', value: 'true' },
                { label: 'No', value: 'false' },
              ]}
              onChange={setSmtpUseSsl}
            />
          </View>
          <Button title="Save SMTP settings" onPress={handleSaveSmtpSettings} loading={smtpSaving} />
        </>
      )}
    </Card>
  );

  const renderTruncateTab = () => (
    <Card>
      <Text style={styles.sectionTitle}>Truncate transactional data</Text>
      <Text style={styles.warningText}>
        This permanently deletes sales, purchases, payments, products, customers, vendors, subscription
        billing history, audit logs, and uploaded payment proof files. Subscribers, plans, taxes, and
        discounts are kept.
      </Text>

      {renderTransactionalTable()}

      <Input
        label="Confirmation phrase"
        value={truncatePhrase}
        onChangeText={setTruncatePhrase}
        placeholder={TRUNCATE_CONFIRM_PHRASE}
        autoCapitalize="characters"
      />

      {showTruncateConfirm ? (
        <ConfirmDialog
          title="Confirm truncate"
          message="This action cannot be undone. All transactional records listed above will be removed."
          confirmLabel="Truncate now"
          onConfirm={handleTruncate}
          onCancel={() => setShowTruncateConfirm(false)}
          loading={truncating}
        />
      ) : (
        <Button
          title="Truncate transactional data"
          onPress={() => setShowTruncateConfirm(true)}
          disabled={truncatePhrase.trim() !== TRUNCATE_CONFIRM_PHRASE}
        />
      )}
    </Card>
  );

  const renderBackupTab = () => (
    <Card>
      <Text style={styles.sectionTitle}>Backup database</Text>
      <Text style={styles.muted}>
        Creates a full PostgreSQL SQL dump of the entire database, including platform configuration and
        subscriber master data.
      </Text>
      <Text style={styles.metaLine}>Last backup: {formatDateTime(status?.lastBackupAt)}</Text>
      <Button title="Create backup now" onPress={handleCreateBackup} loading={creatingBackup} />
      <Text style={[styles.sectionTitle, styles.listTitle]}>Available backups</Text>
      {renderBackupList(status?.backups ?? [])}
    </Card>
  );

  const renderDemoSubscribersTable = () => {
    const companyRows = demoSubscribers.flatMap((subscriber) =>
      (subscriber.companies?.length ? subscriber.companies : []).map((company) => ({
        key: `${subscriber.id}-${company.id}`,
        businessTypeName: subscriber.businessTypeName,
        companyName: company.name,
        companyAlias: company.alias,
        phone: subscriber.phone,
        loginPin: subscriber.loginPin,
        company,
      })),
    );

    return (
    <Card>
      <Text style={[styles.sectionTitle, styles.listTitle]}>Demo subscribers for testing</Text>
      <Text style={styles.muted}>
        One demo account is maintained per business type. Each company row shows isolated data. Names use a
        compact suffix tag, e.g. Customer 1 - Retail ·N.
      </Text>
      {loadingDemoSubscribers ? (
        <ActivityIndicator color={colors.primary} />
      ) : companyRows.length === 0 ? (
        <Text style={styles.muted}>No demo companies yet.</Text>
      ) : (
        <View style={styles.demoTable}>
          <View style={styles.demoHeaderRow}>
            <Text style={[styles.demoHeaderCell, styles.demoColType]}>Business Type</Text>
            <Text style={[styles.demoHeaderCell, styles.demoColCompany]}>Company</Text>
            <Text style={[styles.demoHeaderCell, styles.demoColPhone]}>Phone</Text>
            <Text style={[styles.demoHeaderCell, styles.demoColPin]}>PIN</Text>
            <Text style={[styles.demoHeaderCell, styles.demoColStats]}>Data</Text>
          </View>
          {companyRows.map((row) => (
            <View key={row.key} style={styles.demoDataRow}>
              <Text style={[styles.demoDataCell, styles.demoColType]}>{row.businessTypeName ?? '—'}</Text>
              <Text style={[styles.demoDataCell, styles.demoColCompany]}>
                {row.companyName} ·{row.companyAlias}
              </Text>
              <Text style={[styles.demoDataCell, styles.demoColPhone]}>{row.phone}</Text>
              <Text style={[styles.demoDataCell, styles.demoColPin]}>{row.loginPin}</Text>
              <Text style={[styles.demoDataCell, styles.demoColStats]}>
                {row.company.customerCount} customers · {row.company.vendorCount} vendors · {row.company.productCount}{' '}
                products · {row.company.purchaseCount} POs · {row.company.saleCount} SOs
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
    );
  };

  const renderDemoTab = () => (
    <>
      <Card>
        <Text style={styles.sectionTitle}>Generate demo data</Text>
        <Text style={styles.muted}>
          Creates or reuses a demo subscriber, ensures five branch companies (Main, North, South, East, West), and
          seeds each with customers, vendors, products, and orders. Pick one company to seed only that branch, or
          create a custom company by name.
        </Text>

        <View style={[styles.demoFiltersRow, styles.demoFiltersRowPrimary]}>
          <View style={[styles.demoFilterField, styles.demoFilterFieldSelect]}>
            <Select
              label="Business Type"
              value={businessTypeId}
              options={businessTypeOptions}
              onChange={setBusinessTypeId}
            />
          </View>
          <View style={[styles.demoFilterField, styles.demoFilterFieldSelect]}>
            <Select
              label="Target Company"
              value={companyTarget}
              options={companyOptions}
              onChange={setCompanyTarget}
            />
          </View>
        </View>

        {companyTarget === 'new' ? (
          <View style={styles.demoFiltersRow}>
            <View style={[styles.demoFilterField, styles.demoFilterFieldWide]}>
              <Input
                label="New Company Name"
                value={companyName}
                onChangeText={setCompanyName}
                placeholder={defaultCompanyName}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.demoFiltersRow}>
          <View style={styles.demoFilterField}>
            <Input label="From Date" value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" />
          </View>
          <View style={styles.demoFilterField}>
            <Input label="To Date" value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" />
          </View>
        </View>

        <View style={styles.demoFormActions}>
          <Button
            title="Generate demo data"
            onPress={handleGenerateDemoData}
            loading={generatingDemo}
            disabled={!businessTypeId || generatingDemo}
          />
        </View>

        {demoJob ? (
          <View style={[styles.progressBlock, styles.demoFormBelow]}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressStep}>{demoJob.currentStep}</Text>
              <Text style={styles.progressPercent}>{demoJob.progressPercent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, demoJob.progressPercent))}%` }]} />
            </View>
            <Text style={styles.muted}>{demoJob.message}</Text>
            {demoJob.status === 'COMPLETED' && demoJob.result ? (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>Generation complete</Text>
                {demoJob.result.companiesSeeded > 1 ? (
                  <>
                    <Text style={styles.resultLine}>Companies: {demoJob.result.companiesSeeded}</Text>
                    <Text style={styles.resultLine}>{demoJob.result.companiesSummary}</Text>
                  </>
                ) : (
                  <Text style={styles.resultLine}>
                    Company: {demoJob.result.companyName} ·{demoJob.result.companyAlias}
                  </Text>
                )}
                <Text style={styles.resultLine}>Business: {demoJob.result.businessName}</Text>
                <Text style={styles.resultLine}>Phone: {demoJob.result.phone}</Text>
                <Text style={styles.resultLine}>PIN: {demoJob.result.loginPin}</Text>
                <Text style={[styles.resultLine, styles.resultSectionLabel]}>Added this run</Text>
                <View style={styles.statsGrid}>
                  <Text style={styles.statItem}>+{demoJob.result.customersCreated} customers</Text>
                  <Text style={styles.statItem}>+{demoJob.result.vendorsCreated} vendors</Text>
                  <Text style={styles.statItem}>+{demoJob.result.productsCreated} products</Text>
                  <Text style={styles.statItem}>+{demoJob.result.purchasesCreated} POs</Text>
                  <Text style={styles.statItem}>+{demoJob.result.salesCreated} SOs</Text>
                </View>
                <Text style={[styles.resultLine, styles.resultSectionLabel]}>Totals now</Text>
                <View style={styles.statsGrid}>
                  <Text style={styles.statItem}>{demoJob.result.totalCustomers} customers</Text>
                  <Text style={styles.statItem}>{demoJob.result.totalVendors} vendors</Text>
                  <Text style={styles.statItem}>{demoJob.result.totalProducts} products</Text>
                  <Text style={styles.statItem}>{demoJob.result.totalPurchases} POs</Text>
                  <Text style={styles.statItem}>{demoJob.result.totalSales} SOs</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </Card>

      {renderDemoSubscribersTable()}
    </>
  );

  const renderRestoreTab = () => (
    <Card>
      <Text style={styles.sectionTitle}>Restore database</Text>
      <Text style={styles.warningText}>
        Restoring replaces the current database contents with the uploaded backup. Create a fresh backup
        before proceeding.
      </Text>

      <View style={styles.restoreFileRow}>
        <View style={styles.restoreFileMeta}>
          <Text style={styles.metaLabel}>Backup file</Text>
          <Text style={styles.metaValue}>{restoreFile?.name ?? 'No file selected'}</Text>
        </View>
        <Button title="Choose .sql file" variant="secondary" onPress={handlePickRestoreFile} />
      </View>

      <Input
        label="Confirmation phrase"
        value={restorePhrase}
        onChangeText={setRestorePhrase}
        placeholder={RESTORE_CONFIRM_PHRASE}
        autoCapitalize="characters"
      />

      {showRestoreConfirm ? (
        <ConfirmDialog
          title="Confirm restore"
          message={`The database will be overwritten using "${restoreFile?.name ?? 'selected backup'}".`}
          confirmLabel="Restore now"
          onConfirm={handleRestore}
          onCancel={() => setShowRestoreConfirm(false)}
          loading={restoring}
        />
      ) : (
        <Button
          title="Restore database"
          onPress={() => setShowRestoreConfirm(true)}
          disabled={!restoreFile || restorePhrase.trim() !== RESTORE_CONFIRM_PHRASE}
        />
      )}
    </Card>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PageHeader
        title="Settings"
        subtitle="Platform company profile, email delivery, database maintenance, and demo data."
        action={
          <Button
            title="Refresh"
            variant="secondary"
            onPress={() => {
              loadStatus();
              loadDemoSubscribers();
              loadPlatformSettings();
            }}
            loading={loading || platformLoading}
          />
        }
      />

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab.id);
              setError('');
              setSuccess('');
              setShowTruncateConfirm(false);
              setShowRestoreConfirm(false);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {loading && !status && activeTab !== 'DEMO' && activeTab !== 'PLATFORM' && activeTab !== 'SMTP' ? (
        <Card>
          <ActivityIndicator color={colors.primary} />
        </Card>
      ) : (
        <>
          {activeTab === 'PLATFORM' ? renderPlatformTab() : null}
          {activeTab === 'SMTP' ? renderSmtpTab() : null}
          {activeTab === 'TRUNCATE' ? renderTruncateTab() : null}
          {activeTab === 'BACKUP' ? renderBackupTab() : null}
          {activeTab === 'RESTORE' ? renderRestoreTab() : null}
          {activeTab === 'DEMO' ? renderDemoTab() : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  listTitle: {
    marginTop: 24,
  },
  warningText: {
    color: colors.warning,
    lineHeight: 22,
    marginBottom: 16,
  },
  muted: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  metaLine: {
    color: colors.textSecondary,
    marginBottom: 16,
  },
  table: {
    marginBottom: 8,
    gap: 8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableLabel: {
    color: colors.text,
    fontSize: 15,
  },
  tableValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  backupList: {
    gap: 12,
  },
  backupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
  },
  backupMeta: {
    flex: 1,
    minWidth: 220,
  },
  backupName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  restoreFileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  restoreFileMeta: {
    flex: 1,
    minWidth: 220,
  },
  metaLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  metaValue: {
    color: colors.text,
    fontSize: 15,
  },
  error: {
    color: colors.error,
    marginBottom: 16,
  },
  success: {
    color: colors.success,
    marginBottom: 16,
  },
  demoFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
    position: 'relative',
    overflow: 'visible',
  },
  demoFiltersRowPrimary: {
    zIndex: 4,
  },
  demoFilterField: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 200,
    overflow: 'visible',
  },
  demoFilterFieldSelect: {
    position: 'relative',
    zIndex: 10,
  },
  demoFilterFieldWide: {
    flexBasis: '100%',
    minWidth: 280,
  },
  demoFormActions: {
    position: 'relative',
    zIndex: 1,
    marginTop: 4,
  },
  demoFormBelow: {
    position: 'relative',
    zIndex: 1,
  },
  progressBlock: {
    marginTop: 20,
    gap: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStep: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  progressPercent: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  resultBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultLine: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  demoTable: {
    gap: 0,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
    marginBottom: 4,
  },
  demoDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  demoHeaderCell: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  demoDataCell: {
    color: colors.text,
    fontSize: 14,
  },
  demoColType: {
    width: '18%',
    minWidth: 120,
  },
  demoColCompany: {
    width: '24%',
    minWidth: 160,
  },
  demoColBusiness: {
    width: '28%',
    minWidth: 160,
  },
  demoColPhone: {
    width: '22%',
    minWidth: 120,
  },
  demoColPin: {
    width: '10%',
    minWidth: 70,
  },
  demoColStats: {
    width: '28%',
    minWidth: 220,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  statItem: {
    color: colors.text,
    fontSize: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resultSectionLabel: {
    marginTop: 8,
    fontWeight: '600',
    color: colors.text,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  formField: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 220,
  },
  smtpOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
});
