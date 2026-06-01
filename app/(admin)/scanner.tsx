import React, { useState } from 'react';
import { Text, View, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { apiFetch } from '@/lib/fetch'; // Pastikan path ini sesuai
import { useRouter } from 'expo-router';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Meminta izin kamera
  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          Kami butuh akses kamera untuk memindai Struk QR
        </Text>
        <Button onPress={requestPermission} title="Izinkan Kamera" />
      </View>
    );
  }

  // Fungsi saat QR berhasil terdeteksi kamera
  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setLoading(true);

    try {
      // Ingat pelajaran kita: JANGAN PAKAI /api/ lagi di depan path
      const response = await apiFetch('/orders/scan-qr', {
        method: 'POST',
        body: JSON.stringify({ qr_token: data }), // 'data' berisi teks dari QR Code
      });

      if (response.success) {
        Alert.alert(
          "Berhasil! ✅", 
          "Pesanan selesai & Struk tersimpan ke Arsip.",
          [
            { text: "Kembali ke Dashboard", onPress: () => router.push('/(admin)') },
            { text: "Scan Lagi", onPress: () => setScanned(false) }
          ]
        );
      } else {
        Alert.alert("Gagal", response.message || "QR tidak valid.");
        setScanned(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menghubungi server.");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'], // Hanya deteksi QR Code
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      {/* Overlay UI */}
      <View style={styles.overlay}>
        <Text style={styles.title}>Scan QR Pelanggan</Text>
        {loading && <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />}
      </View>

      {scanned && !loading && (
        <Button title={'Ketuk untuk Scan Ulang'} onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  overlay: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  }
});