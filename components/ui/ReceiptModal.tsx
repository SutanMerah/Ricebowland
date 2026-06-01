import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';

type ReceiptMenuItem = { 
  name: string; 
  price: number; 
  qty?: number; 
  subtotal?: number; 
  pivot?: { quantity?: number } 
};

type ReceiptOrder = { 
  order_code?: string; 
  id?: number | string;
  created_at?: string; 
  status?: string; 
  items?: ReceiptMenuItem[]; // Dari frontend grouping
  menu?: ReceiptMenuItem[];  // Dari backend langsung
  qr_token?: string; 
  totalPrice?: number;       // Dari frontend grouping
  total_price?: number | string; // Dari backend langsung
};

interface ReceiptModalProps { 
  visible: boolean; 
  onClose: () => void; 
  order?: ReceiptOrder | null 
}

export default function ReceiptModal({ visible, onClose, order }: ReceiptModalProps) {
  if (!order) return null;

  // 🚀 Deteksi data secara cerdas (apakah dari frontend grouping atau backend raw)
  const orderItems = order.items && order.items.length > 0 ? order.items : (order.menu || []);
  const finalTotal = order.totalPrice || Number(order.total_price) || 0;
  const orderCode = order.order_code || `ORD-${order.id}`;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.receiptContainer}>
          
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close-circle" size={30} color="#333" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.receiptScroll}>
            <Text style={styles.brandName}>RICEBOWLAND</Text>
            <Text style={styles.divider}>- - - - - - - - - - - - - - - - - - - - -</Text>

            <View style={styles.row}>
              <Text style={styles.textLeft}>No. Order:</Text>
              <Text style={styles.textRight}>{orderCode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.textLeft}>Tanggal:</Text>
              <Text style={styles.textRight}>{order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID') : '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.textLeft}>Status:</Text>
              <Text style={styles.textRight}>{(order.status ?? 'PENDING').toUpperCase()}</Text>
            </View>

            <Text style={styles.divider}>- - - - - - - - - - - - - - - - - - - - -</Text>

            {/* 🚀 Render Daftar Menu */}
            {orderItems.length > 0 ? (
              orderItems.map((item, index) => {
                // Ambil qty dari grouping (qty) atau backend (pivot)
                const itemQty = item.qty || item.pivot?.quantity || 1;
                const itemSubtotal = item.subtotal || (item.price * itemQty);
                
                return (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemName}>{itemQty}x {item.name}</Text>
                    <Text style={styles.itemPrice}>Rp {itemSubtotal.toLocaleString('id-ID')}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.textCenter}>Detail item tidak tersedia</Text>
            )}

            <Text style={styles.divider}>- - - - - - - - - - - - - - - - - - - - -</Text>

            <View style={styles.totalRow}>
              <Text style={styles.totalText}>TOTAL</Text>
              <Text style={styles.totalText}>Rp {finalTotal.toLocaleString('id-ID')}</Text>
            </View>

            {/* QR Code */}
            {order.qr_token && ((order.status ?? '') === 'pending' || (order.status ?? '') === 'paid') && (
              <View style={styles.qrContainer}>
                <Text style={styles.qrInstruction}>Tunjukkan QR ini saat pengambilan</Text>
                <View style={styles.qrWrapper}>
                  <QRCode value={order.qr_token} size={160} color="black" backgroundColor="white" />
                </View>
                <Text style={styles.qrTokenText}>{order.qr_token}</Text>
              </View>
            )}

            {(order.status ?? '') === 'completed' && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>PESANAN SELESAI</Text>
              </View>
            )}

            <Text style={styles.footerText}>Terima kasih atas pesanan Anda!</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptContainer: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 360,
    borderRadius: 10,
    padding: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: -15,
    right: -15,
    backgroundColor: '#fff',
    borderRadius: 20,
    zIndex: 10,
  },
  receiptScroll: {
    paddingBottom: 20,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 10,
  },
  address: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  divider: {
    color: '#ccc',
    textAlign: 'center',
    marginVertical: 10,
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  textLeft: {
    fontSize: 14,
    color: '#555',
  },
  textRight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  itemName: {
    fontSize: 14,
    flex: 1,
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  textCenter: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  qrInstruction: {
    fontSize: 12,
    color: '#555',
    marginBottom: 10,
    fontWeight: '600',
  },
  qrWrapper: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  qrTokenText: {
    marginTop: 8,
    fontSize: 10,
    color: '#999',
    letterSpacing: 1,
  },
  completedBadge: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#d4edda',
    borderRadius: 5,
    alignItems: 'center',
  },
  completedText: {
    color: '#155724',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginTop: 30,
    fontStyle: 'italic',
  }
});