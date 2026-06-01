# 📊 Analisis Data Orders Flow: Dari Database ke UI

## 🎯 Overview
Dokumentasi ini menjelaskan bagaimana data orders dari backend Laravel diproses dan ditampilkan sebagai order cards di empat halaman utama:
1. **Customer Dashboard** → Status pesanan terkini (3 hari terakhir)
2. **MyOrders** → Riwayat pesanan yang sudah selesai
3. **Admin Dashboard** → Ringkasan transaksi hari ini
4. **Admin Transactions** → Manajemen pesanan detail dengan tab pembayaran

---

## 🔄 ALUR DATA LENGKAP

```
DATABASE (Laravel/MySQL)
    ↓
API Endpoints (/orders, /menus, /invoices)
    ↓
apiFetch() → Fetch dengan Token
    ↓
useAuth() → Dapatkan user ID yang login
    ↓
Filter & Grouping Orders
    ↓
Render Order Cards di UI
```

---

## 1️⃣ LAYER DATABASE & API (Backend Laravel)

### Data yang Tersimpan di Database:

**Table `orders`** (flat structure):
```sql
id, 
user_id,              -- ID customer yang membuat order
customer_name,        -- Nama pelanggan
phone_number,         -- No telp untuk delivery
metode_pembayaran,    -- COD / QRIS / etc
menu_id,              -- Foreign key ke menu yang dipesan
qty (atau quantity),  -- Jumlah item
notes,                -- Catatan khusus order
status,               -- pending / processing / completed / cancelled
order_code,           -- ✅ Kode unik order (misal: ORD-2024-001-123)
created_at,           -- Timestamp pemesanan
updated_at,           -- Last update
```

**Table `menus`**:
```sql
id, name, price, description, ...
```

**Table `invoices`** (untuk payment verification):
```sql
id,
invoice_code,
user_id,
customer_name,
phone_number,
cart_data,            -- JSON array of items
subtotal,
status,               -- pending / approved / cancelled
payment_proof,        -- URL bukti bayar
created_at,
...
```

### API Endpoints yang Digunakan:

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/orders` | GET | Ambil semua orders |
| `/api/orders/{id}` | PATCH | Update status order |
| `/api/orders/{id}/cancel` | POST | Cancel order dengan alasan |
| `/api/menus` | GET | Ambil daftar menu + harga |
| `/api/invoices/pending` | GET | Ambil invoice pending untuk approval |
| `/api/invoices/{id}/approve` | POST | Approve invoice QRIS |
| `/api/invoices/{id}/cancel` | POST | Cancel invoice |

---

## 2️⃣ AUTHENTICATION LAYER (AuthContext)

### File: [`components/system/AuthContext.tsx`](components/system/AuthContext.tsx)

**Cara Kerja:**
```typescript
// 1. Saat login, simpan user info ke AsyncStorage
const userData: UserSession = {
  id: userId,              // ✅ ID dari MySQL database
  email: email,
  role: selectedRole,      // 'customer' atau 'admin'
  name: name,
  token: token,            // Bearer token untuk API requests
};

// 2. Di component manapun, dapatkan user yang login dengan:
const { user } = useAuth();
console.log(user.id);  // Untuk filter orders sesuai user
```

### Penyimpanan:
- **AsyncStorage**: Persist session saat app ditutup/dibuka ulang
- **State**: `user` object tersedia di semua komponen via context

---

## 3️⃣ FETCHING LAYER (apiFetch)

### File: [`lib/fetch.ts`](lib/fetch.ts)

**Proses:**
```typescript
export async function apiFetch(path: string, options: RequestInit = {}) {
  // 1. Buat full URL
  const url = `${API_BASE_URL}${path}`;  // https://backend-ricebowland.fly.dev/api/orders

  // 2. Ambil session & token dari AsyncStorage
  const session = await getSession();
  const token = session?.token;

  // 3. Tambahkan Authorization header (jika bukan login/register)
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token && !isPublicRoute && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // 4. Fetch dengan headers + body
  const res = await fetch(url, { ...options, headers });

  // 5. Parse response & throw error jika tidak 200
  const body = await res.json();
  if (!res.ok) throw new Error(body.message);
  
  return body;  // Return data orders
}
```

**Hasil:**
```javascript
const result = await apiFetch("/orders");
// Response struktur:
{
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "customer_name": "Budi",
      "menu_id": 10,
      "qty": 2,
      "status": "pending",
      "order_code": "ORD-2024-05-123",
      "created_at": "2024-06-01T10:30:00Z",
      "menu": { "id": 10, "name": "Nasi Goreng", "price": "25000" }
    },
    { ... }
  ]
}
```

---

## 4️⃣ PROCESSING LAYER (Grouping & Filtering)

### 📌 Problem yang Diselesaikan:
Database menyimpan **flat structure** (satu item per row):
```
Row 1: Order ORD-001, Nasi Goreng (qty: 2), user_id: 5
Row 2: Order ORD-001, Es Teh (qty: 1), user_id: 5    ← SAMA ORDER CODE!
```

**Solution:** Group by `order_code` agar jadi satu order card dengan multiple items.

---

## A. CUSTOMER DASHBOARD → [`app/(customer)/dashboard.tsx`](app/(customer)/dashboard.tsx)

### 🔍 Proses:

**Step 1: Load Menu Mapping**
```typescript
const loadMenuMap = async () => {
  const data = await apiFetch("/menus");  // ✅ GET semua menu
  const mapping = data.reduce((acc, item) => {
    acc[item.id] = { name: item.name, price: item.price };
    return acc;
  }, {});
  setMenuMap(mapping);  // Store di state untuk quick lookup
};
```
**Tujuan:** Agar bisa convert `menu_id → menu_name + price` saat render.

**Step 2: Fetch Orders dengan Filter**
```typescript
const fetchOrdersFromLaravel = async () => {
  if (!user?.id) return;  // ✅ Pastikan user sudah login
  
  const result = await apiFetch("/orders");
  const orderList = Array.isArray(result) ? result : (result.data || []);
  
  // FILTER 1: Ambil hanya orders milik user ini
  const myOrders = orderList.filter((order) => Number(order.user_id) === Number(user.id));
  
  // FILTER 2: Exclude completed orders kecuali dalam 3 hari terakhir
  const filteredOrders = myOrders.filter((order) => {
    const status = String(order.status).toLowerCase();
    if (status !== "completed") return true;  // Keep active orders
    return isWithinLastDays(order.created_at, 3);  // Keep recent completed
  });
  
  const dynamicGrouped = groupLaravelOrders(filteredOrders);
  setGroupedOrders(dynamicGrouped);
};
```

**Step 3: Group Orders by order_code**
```typescript
const groupLaravelOrders = (rawOrders) => {
  const groups = {};
  
  rawOrders.forEach((item) => {
    // 🚀 GROUP KEY = order_code dari backend (bukan timestamp)
    const groupKey = item.order_code || `order-${item.id}`;
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        order_code: item.order_code,      // Real order code
        created_at: item.created_at,
        status: item.status,
        items: [],
        totalPrice: 0
      };
    }
    
    // Lookup nama & harga dari menuMap
    const menuDetail = menuMap[item.menu_id];  // ✅ O(1) lookup
    const qty = item.qty || 1;
    const subtotal = menuDetail.price * qty;
    
    // Add ke items array
    groups[groupKey].items.push({
      menuId: item.menu_id,
      name: menuDetail.name,
      price: menuDetail.price,
      qty: qty,
      subtotal: subtotal
    });
    
    groups[groupKey].totalPrice += subtotal;
  });
  
  return Object.values(groups).reverse();  // Newest first
};
```

### 📊 Output Struktur:
```typescript
[
  {
    order_code: "ORD-2024-05-123",
    created_at: "2024-06-01T10:30:00Z",
    status: "processing",
    items: [
      { menuId: 10, name: "Nasi Goreng", price: 25000, qty: 2, subtotal: 50000 },
      { menuId: 11, name: "Es Teh", price: 5000, qty: 1, subtotal: 5000 }
    ],
    totalPrice: 55000
  }
]
```

### 🎨 Render di UI:
```typescript
{groupedOrders.map((order) => (
  <Card key={order.order_code}>
    {/* ORDER HEADER */}
    <View style={styles.orderHeader}>
      <Text style={styles.orderId}>Order #{order.order_code}</Text>
      <View style={[styles.statusBase, getStatusStyle(order.status)]}>
        <Text>{order.status}</Text>
      </View>
    </View>

    {/* ORDER DATE */}
    <Text>{formatFigmaDate(order.created_at)}</Text>

    {/* ITEMS LIST */}
    {order.items.map((item) => (
      <View style={styles.itemRow}>
        <Text>{item.name}</Text>
        <Text>Rp {item.price.toLocaleString()} × {item.qty}</Text>
        <Text>Rp {item.subtotal.toLocaleString()}</Text>
      </View>
    ))}

    {/* TOTAL */}
    <View style={styles.totalRow}>
      <Text>Total: Rp {order.totalPrice.toLocaleString()}</Text>
    </View>

    {/* BUTTONS */}
    <Button title="Pesan Lagi" />
    <Button title="Lihat Struk" />
    <Button title="Refresh Status" onPress={fetchOrdersFromLaravel} />
  </Card>
))}
```

### ⏰ Update Otomatis:
```typescript
useEffect(() => {
  fetchOrdersFromLaravel();
  
  // Poll setiap 30 detik
  const interval = setInterval(() => {
    fetchOrdersFromLaravel(false);  // false = tanpa spinner
  }, 30000);
  
  return () => clearInterval(interval);
}, [user?.id, menuMap]);
```

---

## B. MYORDERS → [`app/(customer)/myorder.tsx`](app/(customer)/myorder.tsx)

### 🔍 Proses (Mirip Dashboard, Tapi Lebih Ketat):

**Step 1: Fetch & Filter (Hanya Completed)**
```typescript
const fetchCompletedOrders = async () => {
  const result = await apiFetch("/orders");
  const orderList = result.data || [];
  
  // ✅ FILTER KETAT: Hanya status="completed"
  const completedOrders = orderList.filter((order) => {
    return Number(order.user_id) === Number(user.id) 
      && String(order.status).toLowerCase() === "completed";
  });
  
  setOrders(groupOrders(completedOrders));
};
```

**Step 2: Group Sama Seperti Dashboard**
```typescript
const groupOrders = (rawOrders) => {
  const groups = {};
  
  rawOrders.forEach((order) => {
    const groupKey = order.order_code || `order-${order.id}`;
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        order_code: order.order_code,
        created_at: order.created_at,
        status: "completed",  // Already filtered
        items: [],
        totalPrice: 0,
      };
    }
    
    // ✅ Bisa dari order.menu (nested object) atau fallback
    const price = Number(order.menu?.price || order.price || 0);
    const qty = order.qty || 1;
    
    groups[groupKey].items.push({
      name: order.menu?.name || `Menu ID: ${order.menu_id}`,
      qty,
      price,
      subtotal: price * qty,
    });
    
    groups[groupKey].totalPrice += price * qty;
  });
  
  return Object.values(groups).reverse();
};
```

### 📊 Output Sama:
```typescript
[
  {
    order_code: "ORD-2024-05-100",
    created_at: "2024-05-28T14:00:00Z",
    status: "completed",
    items: [{ name: "Nasi Kuning", qty: 1, price: 30000, subtotal: 30000 }],
    totalPrice: 30000
  }
]
```

### 🎨 Render di UI:
```typescript
{orders.length === 0 ? (
  <EmptyCard title="Belum ada pesanan selesai" />
) : (
  orders.map((order) => (
    <Card key={order.order_code}>
      <View style={styles.orderHeader}>
        <Text>{order.order_code}</Text>
        <View style={styles.statusBadge}>
          <Text>✓ {order.status}</Text>
        </View>
      </View>

      <Text>{formatDate(order.created_at)}</Text>

      {order.items.map((item) => (
        <View style={styles.itemRow}>
          <Text>{item.name}</Text>
          <Text>Rp {item.price} × {item.qty}</Text>
          <Text>Rp {item.subtotal}</Text>
        </View>
      ))}

      <Text>Total: Rp {order.totalPrice}</Text>
    </Card>
  ))
)}
```

---

## C. ADMIN DASHBOARD → [`app/(admin)/dashboard.tsx`](app/(admin)/dashboard.tsx)

### 🔍 Proses:

**Step 1: Parallel Load Semua Data**
```typescript
const fetchDashboardData = async () => {
  const [ordersData, menusData, invoicesData] = await Promise.all([
    apiFetch("/orders"),              // ✅ Semua orders, semua user
    apiFetch("/menus"),               // ✅ Menu list (untuk lookup)
    apiFetch("/invoices/pending")     // ✅ Pending QRIS payments
  ]);

  setOrders(ordersData.data);
  setMenus(menusData.data);
  setInvoices(invoicesData.data);
};
```

**Step 2: Group & Aggregate (untuk Summary Cards)**
```typescript
const getGroupedTransactions = () => {
  const groups = {};
  
  orders.forEach((item) => {
    const groupKey = item.order_code || `order-${item.id}`;
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        order_code: item.order_code,
        created_at: item.created_at,
        status: item.status,
        subItems: [],
        totalPrice: 0
      };
    }
    
    const menuDetail = menus.find(m => m.id === item.menu_id);
    const qty = item.qty || 1;
    const cleanPrice = typeof menuDetail.price === 'string' 
      ? parseFloat(menuDetail.price) 
      : (menuDetail.price || 0);
    const subtotal = cleanPrice * qty;
    
    groups[groupKey].subItems.push({
      name: menuDetail.name,
      qty: qty
    });
    
    groups[groupKey].totalPrice += subtotal;
    
    if (item.status !== "pending") {
      groups[groupKey].status = item.status;
    }
  });
  
  return Object.values(groups).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
};
```

**Step 3: Calculate Summary Stats**
```typescript
const groupedTransactions = getGroupedTransactions();

// 📊 SUMMARY CARDS DATA:
const totalSalesToday = groupedTransactions
  .filter(t => ["completed", "success", "ready"].includes(t.status.toLowerCase()))
  .reduce((sum, t) => sum + t.totalPrice, 0);

const totalTransactions = groupedTransactions.length;

const pendingOrdersCount = groupedTransactions.filter(
  t => ["pending", "processing"].includes(t.status.toLowerCase())
).length;

const bestSellMenu = // Item dengan qty paling banyak terjual
```

### 📊 Output untuk Summary Cards:
```typescript
{
  totalSalesToday: 250000,        // Rp 250.000
  totalTransactions: 8,            // 8 order
  pendingOrdersCount: 2,           // 2 order pending/processing
  bestSellMenu: "Nasi Goreng",     // Menu terlaris
  pendingQRISCount: 3              // 3 invoice pending
}
```

### 🎨 Render Summary Cards:
```typescript
<Card>
  <View style={styles.iconCircle}>
    <Icon name="cash" />
  </View>
  <Text>Hari Ini</Text>
  <Text>Rp {totalSalesToday.toLocaleString()}</Text>
  <Text>Total Penjualan</Text>
</Card>

<Card>
  <Text>{totalTransactions}</Text>
  <Text>Total Nota</Text>
</Card>

<Card>
  <Text>{pendingOrdersCount}</Text>
  <Text>Tertunda</Text>
</Card>

<Card>
  <Text>{bestSellMenu}</Text>
  <Text>Terlaris</Text>
</Card>
```

---

## D. ADMIN TRANSACTIONS (Orders Tab) → [`app/(admin)/transactions.tsx`](app/(admin)/transactions.tsx)

### 🔍 Proses Paling Detail:

**Step 1: Load Raw Orders**
```typescript
async function loadOrders(showSpinner = true) {
  const data = await apiFetch("/orders", { mode: 'cors' });
  const orderList = Array.isArray(data) ? data : data.data || [];
  setRawOrders(orderList);
}
```

**Step 2: Group dengan useMemo (Performance Optimization)**
```typescript
const groupedOrders = useMemo(() => {
  const groups = {};
  
  rawOrders.forEach((item) => {
    const groupKey = item.order_code || `order-${item.id}`;
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        id: item.id,
        user_id: item.user_id,
        customer_name: item.customer_name || item.user?.name || "Customer",
        phone_number: item.phone_number || null,
        metode_pembayaran: item.metode_pembayaran || null,
        notes: item.notes,
        status: item.status || "pending",
        created_at: item.created_at,
        account_name: item.user?.name || `User ID: ${item.user_id}`,
        order_code: item.order_code,  // ✅ Real order code
        raw_ids: [],      // Track semua raw row IDs untuk bulk update
        items: []
      };
    }
    
    const menuPrice = Number(item.menu?.price || 0);
    const itemQty = item.qty || 1;
    const menuName = item.menu?.name || `Custom Item (ID: ${item.menu_id})`;
    
    groups[groupKey].items.push({
      menu_id: item.menu_id,
      name: menuName,
      qty: itemQty,
      price: menuPrice
    });
    
    groups[groupKey].raw_ids.push(item.id);  // ✅ Simpan untuk update
    
    if (item.status !== "pending") {
      groups[groupKey].status = item.status;
    }
  });
  
  return Object.values(groups).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}, [rawOrders]);
```

### 📊 Output GroupedOrder:
```typescript
{
  id: 1,
  user_id: 5,
  customer_name: "Budi",
  phone_number: "081234567890",
  metode_pembayaran: "COD",
  account_name: "Budi Santoso",
  order_code: "ORD-2024-05-123",
  status: "pending",
  created_at: "2024-06-01T10:30:00Z",
  notes: "Tidak pedas, banyak acar",
  raw_ids: [1, 2],  // ✅ Order ID 1 & 2 (karena 2 items)
  items: [
    { menu_id: 10, name: "Nasi Goreng", qty: 2, price: 25000 },
    { menu_id: 11, name: "Es Teh", qty: 1, price: 5000 }
  ]
}
```

### 🎨 Render di UI:
```typescript
{groupedOrders.map((order) => (
  <Card key={order.id}>
    {/* ORDER HEADER */}
    <View style={styles.orderHeaderRow}>
      <View>
        <Text>Order #{getDisplayOrderCode(order.order_code, order.id)}</Text>
        <Text>{formatDate(order.created_at)}</Text>
      </View>
      <View style={[styles.statusBadge, getStatusStyle(order.status)]}>
        <Text>{order.status}</Text>
      </View>
    </View>

    {/* CUSTOMER INFO */}
    <View style={styles.customerInfoBlock}>
      <InfoRow icon="person-circle" label="Pemilik Akun" value={order.account_name} />
      <InfoRow icon="person" label="Nama Pelanggan" value={order.customer_name} />
      <InfoRow icon="call" label="Nomor Telepon" value={order.phone_number} />
      <InfoRow icon="card" label="Metode Pembayaran" value={order.metode_pembayaran} />
    </View>

    {/* ITEMS */}
    <View>
      <Text>Item yang Dipesan:</Text>
      <Text>{order.items.map(i => `${i.qty}x ${i.name}`).join(", ")}</Text>
    </View>

    {/* NOTES */}
    <View style={styles.notesContainer}>
      <Text>Catatan: {order.notes || "Tidak ada"}</Text>
    </View>

    {/* TOTAL & STATUS UPDATE */}
    <View style={styles.orderDetailRow}>
      <View>
        <Text>Total Transaksi</Text>
        <Text>Rp {calculateTotal(order.items).toLocaleString()}</Text>
      </View>
      
      <Select
        value={selectedStatus[order.id] || order.status}
        onValueChange={(value) => {
          setSelectedStatus(prev => ({ ...prev, [order.id]: value }));
        }}
        items={orderStatusOptions}  // pending, processing, completed, cancelled
      />
      
      <Button 
        title="Simpan"
        onPress={() => updateStatus(order)}
      />
    </View>
  </Card>
))}
```

**Step 3: Update Status (Bulk)**
```typescript
const updateStatus = async (orderGroup) => {
  const newStatus = selectedStatus[orderGroup.id];
  
  // ✅ Update SEMUA raw_ids (rows) ke status baru
  for (const rawId of orderGroup.raw_ids) {
    await apiFetch(`/orders/${rawId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
  }
  
  // Update local state
  setRawOrders(current =>
    current.map(order =>
      orderGroup.raw_ids.includes(order.id)
        ? { ...order, status: newStatus }
        : order
    )
  );
};
```

---

## 5️⃣ RINGKASAN TRANSFORMATION PER HALAMAN

| Halaman | Data Source | Filter | Group By | Display |
|---------|-------------|--------|----------|---------|
| **Customer Dashboard** | `/orders` | user_id + status (active/3hari completed) | order_code | Order card dengan status badge |
| **MyOrders** | `/orders` | user_id + status="completed" | order_code | Order card dengan tanggal |
| **Admin Dashboard** | `/orders` + `/menus` | NONE (all users) | order_code | Summary stats + grouped cards |
| **Admin Transactions** | `/orders` + `/menus` | NONE (all users) | order_code | Detail card + status dropdown + bulk actions |

---

## 🚀 FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│          DATABASE (Laravel/MySQL)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Orders      │  │  Menus       │  │  Invoices      │ │
│  │ (flat)       │  │ (lookup)     │  │ (payments)     │ │
│  └──────────────┘  └──────────────┘  └────────────────┘ │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│     API Endpoints                                        │
│  GET /orders  →  Raw flat array (multiple items/order)  │
│  GET /menus   →  Menu details (name, price)             │
│  GET /invoices/pending  →  Payment verification         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│     Fetch Layer (lib/fetch.ts)                           │
│  • Add Bearer token                                      │
│  • Handle CORS                                           │
│  • Parse JSON response                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│     Auth Layer (AuthContext.tsx)                         │
│  • Get current user.id                                   │
│  • Filter orders: user_id = current user                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│     Processing Layer (Component Logic)                   │
│  1. Load menu map (menu_id → name, price)               │
│  2. Fetch orders (GET /orders)                          │
│  3. Filter by user_id, status, date range               │
│  4. Group by order_code (combine multiple items)        │
│  5. Calculate totals per order                          │
│  6. Map menu details from menuMap                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│     React State (useState / useMemo)                     │
│  groupedOrders = [                                       │
│    {                                                     │
│      order_code: "ORD-2024-05-123",                     │
│      items: [...],                                      │
│      totalPrice: 55000,                                 │
│      status: "pending"                                  │
│    }                                                    │
│  ]                                                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│     UI Rendering                                         │
│  groupedOrders.map(order => (                           │
│    <Card>                                               │
│      <Text>Order #{order.order_code}</Text>            │
│      {order.items.map(item => (                         │
│        <ItemRow name={item.name} qty={item.qty} />     │
│      ))}                                                │
│      <Text>Total: {order.totalPrice}</Text>            │
│      <StatusBadge status={order.status} />             │
│    </Card>                                              │
│  ))                                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 KEY TECHNICAL POINTS

### ✅ Grouping Strategy (order_code)
- **Kenapa?** Database flat structure: 1 baris = 1 item, multiple items = multiple rows
- **Solusi:** Group by `order_code` (unique identifier dari backend)
- **Benefit:** 
  - Satu order card untuk multiple items
  - Real order ID dari database, bukan generated
  - Consistent across all pages

### ✅ Menu Mapping (Lookup Table)
```typescript
menuMap = {
  10: { name: "Nasi Goreng", price: 25000 },
  11: { name: "Es Teh", price: 5000 },
  ...
}
```
- **Kenapa?** Orders hanya punya `menu_id`, perlu nama & harga
- **Solusi:** Cache menu data di state, O(1) lookup by ID
- **Benefit:** Render cepat, tidak perlu nested query di UI

### ✅ User Filtering (Isolation)
```typescript
// Customer hanya lihat orders mereka
const myOrders = orderList.filter(order => 
  Number(order.user_id) === Number(user.id)
);

// Admin lihat semua (no filter)
```
- **Security:** Backend harus validate token + user_id di PATCH endpoint
- **UX:** Customer tidak bingung dengan order orang lain

### ✅ Status Filtering
```typescript
// Dashboard: active + recent completed (3 hari)
// MyOrders: completed only
// Admin Dashboard: all
// Admin Transactions: all + with status editor
```

### ✅ Bulk Update Pattern (Admin)
```typescript
// Ketika update 1 order dengan 2 items (raw_ids=[1,2])
for (const rawId of orderGroup.raw_ids) {
  await PATCH /orders/{rawId}  // Update each item row
}
// Hasilnya: order_code ORD-001 semua item punya status baru
```

### ✅ Real-time Updates
```typescript
// Poll setiap 30 detik tanpa block UI
const interval = setInterval(() => {
  fetchOrdersFromLaravel(false);  // false = no spinner
}, 30000);
```

---

## 🔧 DEBUGGING CHECKLIST

Jika order card tidak muncul, cek:

1. **Token valid?**
   ```typescript
   // Check di browser console:
   const session = await getSession();
   console.log(session.token);
   ```

2. **API response OK?**
   ```typescript
   // Check network tab atau:
   const data = await apiFetch("/orders");
   console.log(data);  // Should be array
   ```

3. **User filter correct?**
   ```typescript
   const { user } = useAuth();
   console.log("Current user ID:", user?.id);
   
   // Pastikan ada orders dengan user_id = user.id
   ```

4. **Menu mapping complete?**
   ```typescript
   console.log("menuMap:", menuMap);
   // Jika ada menu_id di order tapi tidak ada di menuMap, 
   // akan show "Menu ID: 999" fallback
   ```

5. **Grouping logic working?**
   ```typescript
   console.log("Raw orders:", rawOrders);
   console.log("Grouped:", groupedOrders);
   // Pastikan items dengan order_code sama sudah dikombine
   ```

6. **Status filtering working?**
   ```typescript
   // Dashboard: hanya pending + processing + completed (recent)
   // MyOrders: hanya completed
   ```

---

## 📚 FILE REFERENCES

| File | Purpose |
|------|---------|
| [lib/api.ts](lib/api.ts) | API base URL constant |
| [lib/fetch.ts](lib/fetch.ts) | apiFetch() implementation + token handling |
| [lib/auth.ts](lib/auth.ts) | Session storage (AsyncStorage wrapper) |
| [components/system/AuthContext.tsx](components/system/AuthContext.tsx) | useAuth() hook + user state |
| [app/(customer)/dashboard.tsx](app/(customer)/dashboard.tsx) | Customer order status display |
| [app/(customer)/myorder.tsx](app/(customer)/myorder.tsx) | Customer completed orders |
| [app/(admin)/dashboard.tsx](app/(admin)/dashboard.tsx) | Admin summary stats |
| [app/(admin)/transactions.tsx](app/(admin)/transactions.tsx) | Admin order management |

---

## 🎯 KESIMPULAN

**Data Flow singkat:**
1. **Fetch** `/orders` dari API (dengan user_id filter via token)
2. **Load** `/menus` untuk mapping nama & harga
3. **Filter** berdasarkan user_id, status, date range (tergantung halaman)
4. **Group** orders dengan `order_code` yang sama (combine multiple items)
5. **Calculate** total per order dari items
6. **Render** grouped orders sebagai Card component dengan UI sesuai halaman

**Key insight:** 
- Database = flat (1 baris per item)
- UI = grouped (1 card per order dengan multiple items)
- Grouping key = `order_code` dari backend (real, persistent)
