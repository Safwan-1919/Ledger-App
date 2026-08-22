import React, { useEffect, useState } from 'react';
import { View, Alert, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { T, Card, Button, Divider } from '@/components/ui';
import { colors, spacing, layout } from '@/theme/tokens';
import { SkeletonList } from '@/components/Shimmer';
import {
  fetchStoredReports,
  generateMissingReports,
  deleteStoredReport,
  type StoredReport,
} from '@/lib/reports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function HistoryScreen() {
  const qc = useQueryClient();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const reports = useQuery({
    queryKey: ['reports'],
    queryFn: fetchStoredReports,
    staleTime: 30_000,
  });

  const generateAll = useMutation({
    mutationFn: generateMissingReports,
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      if (count > 0) Alert.alert('Done', `Generated ${count} new report(s).`);
      else Alert.alert('Up to date', 'All reports already generated.');
    },
    onError: (e) => Alert.alert('Error', (e as Error).message),
  });

  const downloadReport = useMutation({
    mutationFn: async (report: StoredReport) => {
      const file = new File(Paths.cache, 'reports', `${report.id}.pdf`);
      file.create({ intermediates: true, overwrite: true });
      const binary = atob(report.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      file.write(bytes);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: report.label,
        });
      }
    },
    onError: (e) => Alert.alert('Download failed', (e as Error).message),
  });

  const removeReport = useMutation({
    mutationFn: deleteStoredReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
    onError: (e) => Alert.alert('Delete failed', (e as Error).message),
  });

  if (initialLoading) {
    return (
      <View style={{ gap: spacing.lg }}>
        <SkeletonList rows={4} />
      </View>
    );
  }

  const monthly = reports.data?.filter((r) => r.type === 'monthly') ?? [];
  const yearly = reports.data?.filter((r) => r.type === 'yearly') ?? [];

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <Button
          label={generateAll.isPending ? 'Generating...' : 'Generate all reports'}
          variant="outline"
          fullWidth
          loading={generateAll.isPending}
          onPress={() => generateAll.mutate()}
          icon={<Feather name="file-text" size={16} color={colors.black} />}
        />
      </Card>

      {reports.data && reports.data.length === 0 && !generateAll.isPending && (
        <Card>
          <T variant="small" style={{ textAlign: 'center' }}>
            No reports yet. Tap "Generate all reports" above.
          </T>
        </Card>
      )}

      {monthly.length > 0 && (
        <View>
          <T variant="h3" style={{ marginBottom: spacing.md, paddingLeft: spacing.md }}>Monthly Reports</T>
          {monthly.map((r) => (
            <Card key={r.id} style={{ marginBottom: spacing.sm }}>
              <View style={reportRow}>
                <View style={{ flex: 1 }}>
                  <T variant="body" style={{ fontWeight: '700' }}>{r.label}</T>
                  <T variant="micro">
                    {new Date(r.generatedAt).toLocaleDateString()}
                  </T>
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Feather
                    name="download"
                    size={20}
                    color={colors.black}
                    onPress={() => downloadReport.mutate(r)}
                  />
                  <Feather
                    name="trash-2"
                    size={20}
                    color={colors.black}
                    onPress={() => {
                      Alert.alert('Delete', `Delete ${r.label}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => removeReport.mutate(r.id) },
                      ]);
                    }}
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {yearly.length > 0 && (
        <View>
          <T variant="h3" style={{ marginBottom: spacing.md, paddingLeft: spacing.md }}>Yearly Reports</T>
          {yearly.map((r) => (
            <Card key={r.id} style={{ marginBottom: spacing.sm }}>
              <View style={reportRow}>
                <View style={{ flex: 1 }}>
                  <T variant="body" style={{ fontWeight: '700' }}>{r.label}</T>
                  <T variant="micro">
                    {new Date(r.generatedAt).toLocaleDateString()}
                  </T>
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Feather
                    name="download"
                    size={20}
                    color={colors.black}
                    onPress={() => downloadReport.mutate(r)}
                  />
                  <Feather
                    name="trash-2"
                    size={20}
                    color={colors.black}
                    onPress={() => {
                      Alert.alert('Delete', `Delete ${r.label}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => removeReport.mutate(r.id) },
                      ]);
                    }}
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

const reportRow: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.md,
};
