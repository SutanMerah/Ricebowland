# 🔍 DETAIL: Data Reception & Grouping Process

## 📥 APA DATA YANG DITERIMA DARI BACKEND?

### Raw Response dari `GET /api/orders`

Backend mengirimkan **flat array** dimana **1 baris = 1 item dalam 1 order**:

```javascript
[
  {
    "id": 1,
    "user_id": 5,
    "customer_name": "Budi Santoso",
    "phone_number": "081234567890",
    "metode_pembayaran": "COD",
    "menu_id": 10,
    "qty": 2,
    "notes": "Tidak pedas, banyak acar",
    "status": "pending",
    "order_code": "ORD-2024-05-123",
    "created_at": "2024-06-01T10:30:00Z",
    "updated_at": "2024-06-01T10:30:00Z"
  },
  {
    "id": 2,
    "user_id": 5,
    "customer_name": "Budi Santoso",
    "phone_number": "081234567890",
    "metode_pembayaran": "COD",
    "menu_id": 11,
    "qty": 1,
    "notes": "Tidak pedas, banyak acar",
    "status": "pending",
    "order_code": "ORD-2024-05-123",  // ⚠️ SAMA dengan row sebelumnya!
    "created_at": "2024-06-01T10:30:00Z",
    "updated_at": "2024-06-01T10:30:00Z"
  },
  {
    "id": 3,
    "user_id": 5,
    "customer_name": "Budi Santoso",
    "phone_number": "081234567890",
    "metode_pembayaran": "COD",
    "menu_id": 12,
    "qty": 1,
    "notes": "Tidak pedas, banyak acar",
    "status": "pending",
    "order_code": "ORD-2024-05-123",  // ⚠️ MASIH SAMA!
    "created_at": "2024-06-01T10:30:00Z",
    "updated_at": "2024-06-01T10:30:00Z"
  },
  {
    "id": 4,
    "user_id": 7,
    "customer_name": "Andi Wijaya",
    "phone_number": "082987654321",
    "metode_pembayaran": "QRIS",
    "menu_id": 10,
    "qty": 1,
    "notes": null,
    "status": "completed",
    "order_code": "ORD-2024-05-124",  // ✅ Order berbeda
    "created_at": "2024-05-31T15:00:00Z",
    "updated_at": "2024-05-31T18:00:00Z"
  },
  {
    "id": 5,
    "user_id": 7,
    "customer_name": "Andi Wijaya",
    "phone_number": "082987654321",
    "metode_pembayaran": "QRIS",
    "menu_id": 15,
    "qty": 2,
    "notes": null,
    "status": "completed",
    "order_code": "ORD-2024-05-124",  // ⚠️ SAMA dengan row sebelumnya
    "created_at": "2024-05-31T15:00:00Z",
    "updated_at": "2024-05-31T18:00:00Z"
  }
]
```

---

## 🍽️ CONTOH REAL: Budi Memesan 3 Item

Budi (user_id: 5) membuat 1 order dengan:
- 2x Nasi Goreng (menu_id: 10, harga: Rp 25.000)
- 1x Es Teh (menu_id: 11, harga: Rp 5.000)
- 1x Gorengan (menu_id: 12, harga: Rp 10.000)

Ini tersimpan di database sebagai **3 baris terpisah** dengan `order_code` yang sama:

| id | user_id | customer_name | menu_id | qty | order_code | status |
|----|---------|---------------|---------|-----|------------|--------|
| 1  | 5       | Budi Santoso  | 10      | 2   | ORD-2024-05-123 | pending |
| 2  | 5       | Budi Santoso  | 11      | 1   | ORD-2024-05-123 | pending |
| 3  | 5       | Budi Santoso  | 12      | 1   | ORD-2024-05-123 | pending |

---

## 📥 LANGKAH 1: FETCH ORDERS

```typescript
// File: app/(customer)/dashboard.tsx

const fetchOrdersFromLaravel = async () => {
  // 1. Check apakah user sudah login
  if (!user?.id) return;  // ← user.id = 5 (Budi)
  
  // 2. Fetch dari API
  const result = await apiFetch("/orders");
  
  // 3. Extract array dari response
  const orderList = Array.isArray(result) ? result : (result.data || []);
  
  // ✅ orderList sekarang berisi raw data flat di atas
  console.log("Raw orders dari backend:", orderList);
  // Output:
  // [
  //   { id: 1, user_id: 5, menu_id: 10, qty: 2, order_code: "ORD-2024-05-123", ... },
  //   { id: 2, user_id: 5, menu_id: 11, qty: 1, order_code: "ORD-2024-05-123", ... },
  //   { id: 3, user_id: 5, menu_id: 12, qty: 1, order_code: "ORD-2024-05-123", ... },
  //   { id: 4, user_id: 7, menu_id: 10, qty: 1, order_code: "ORD-2024-05-124", ... },
  //   { id: 5, user_id: 7, menu_id: 15, qty: 2, order_code: "ORD-2024-05-124", ... }
  // ]
};
```

---

## 🔍 LANGKAH 2: FILTER by User ID

```typescript
const fetchOrdersFromLaravel = async () => {
  if (!user?.id) return;
  
  const result = await apiFetch("/orders");
  const orderList = Array.isArray(result) ? result : (result.data || []);
  
  // 👇 FILTER: Ambil hanya orders milik user yang sedang login (user_id: 5)
  const myOrders = orderList.filter((order) => 
    Number(order.user_id) === Number(user.id)  // 5 === 5 ✅
  );
  
  console.log("Orders milik user 5:", myOrders);
  // Output (2 baris dihapus karena user_id: 7):
  // [
  //   { id: 1, user_id: 5, menu_id: 10, qty: 2, order_code: "ORD-2024-05-123", ... },
  //   { id: 2, user_id: 5, menu_id: 11, qty: 1, order_code: "ORD-2024-05-123", ... },
  //   { id: 3, user_id: 5, menu_id: 12, qty: 1, order_code: "ORD-2024-05-123", ... }
  // ]
};
```

---

## 🎯 LANGKAH 3: FILTER by STATUS & DATE RANGE

```typescript
const isWithinLastDays = (dateString, days) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
};

const fetchOrdersFromLaravel = async () => {
  if (!user?.id) return;
  
  const result = await apiFetch("/orders");
  const orderList = Array.isArray(result) ? result : (result.data || []);
  const myOrders = orderList.filter((order) => 
    Number(order.user_id) === Number(user.id)
  );
  
  // 👇 FILTER: Ambil active orders ATAU completed dalam 3 hari terakhir
  const filteredOrders = myOrders.filter((order) => {
    const status = String(order.status || "").toLowerCase();
    
    if (status !== "completed") return true;  // ← Ambil semua status selain completed
    
    // Khusus completed: hanya ambil yang 3 hari terakhir
    return isWithinLastDays(order.created_at, 3);
  });
  
  console.log("Orders setelah filter status:", filteredOrders);
  // Output (tetap 3 baris karena semua status "pending"):
  // [
  //   { id: 1, user_id: 5, status: "pending", order_code: "ORD-2024-05-123", ... },
  //   { id: 2, user_id: 5, status: "pending", order_code: "ORD-2024-05-123", ... },
  //   { id: 3, user_id: 5, status: "pending", order_code: "ORD-2024-05-123", ... }
  // ]
};
```

---

## 📋 LANGKAH 4: LOAD MENU MAPPING

**Kenapa perlu?** Karena orders hanya punya `menu_id`, tapi UI butuh `name` dan `price`.

```typescript
const loadMenuMap = async () => {
  const data = await apiFetch("/menus");
  
  // ✅ Backend response:
  // [
  //   { id: 10, name: "Nasi Goreng", price: "25000", ... },
  //   { id: 11, name: "Es Teh", price: "5000", ... },
  //   { id: 12, name: "Gorengan", price: "10000", ... },
  //   { id: 15, name: "Soto Ayam", price: "20000", ... }
  // ]
  
  // Convert ke map untuk O(1) lookup
  const mapping = data.reduce((acc, item) => {
    if (item?.id != null) {
      acc[Number(item.id)] = {
        name: item.name ?? `Menu ID: ${item.id}`,
        price: typeof item.price === "number" 
          ? item.price 
          : Number(item.price) || 0,
      };
    }
    return acc;
  }, {});
  
  console.log("Menu mapping:", mapping);
  // Output:
  // {
  //   10: { name: "Nasi Goreng", price: 25000 },
  //   11: { name: "Es Teh", price: 5000 },
  //   12: { name: "Gorengan", price: 10000 },
  //   15: { name: "Soto Ayam", price: 20000 }
  // }
  
  setMenuMap(mapping);
};
```

---

## 🔗 LANGKAH 5: GROUPING - THE MAGIC!

Ini adalah langkah PALING PENTING untuk mengubah flat array menjadi grouped orders.

### Kode Grouping:

```typescript
const groupLaravelOrders = (rawOrders) => {
  // 1. Buat object kosong untuk menampung groups
  const groups = {};
  
  // 2. Iterasi setiap baris order
  rawOrders.forEach((item) => {
    // 3. Tentukan GROUP KEY menggunakan order_code
    //    Ini adalah PRIMARY KEY untuk grouping
    const groupKey = item.order_code || `order-${item.id}`;
    
    // 4. Cek apakah group sudah ada?
    if (!groups[groupKey]) {
      // Jika BELUM ADA, buat group baru
      groups[groupKey] = {
        order_code: item.order_code,      // Real order code dari DB
        created_at: item.created_at,      // Waktu order dibuat
        status: item.status || "pending", // Status order
        items: [],                        // Array untuk items nanti
        totalPrice: 0                     // Akan dihitung nanti
      };
    }
    
    // 5. Ambil detail menu dari menuMap (lookup table)
    const menuDetail = menuMap[item.menu_id];
    
    // Fallback jika menu tidak ditemukan di map
    if (!menuDetail) {
      console.warn(`Menu ID ${item.menu_id} tidak ditemukan`);
      return;
    }
    
    // 6. Hitung qty dan subtotal item ini
    const itemQty = item.qty || item.quantity || 1;
    const itemSubtotal = menuDetail.price * itemQty;
    
    // 7. Push item ke groups[groupKey].items
    groups[groupKey].items.push({
      menuId: item.menu_id,
      name: menuDetail.name,
      price: menuDetail.price,
      qty: itemQty,
      subtotal: itemSubtotal
    });
    
    // 8. Tambah totalPrice order
    groups[groupKey].totalPrice += itemSubtotal;
  });
  
  // 9. Convert object -> array dan sort (newest first)
  return Object.values(groups).reverse();
};
```

---

## 📊 STEP-BY-STEP VISUAL: Grouping Process

### INPUT: Raw Orders (3 baris dengan order_code sama)

```
┌────┬─────────┬──────────┬─────────┬──────────────────┐
│ id │ user_id │ menu_id  │ qty     │ order_code       │
├────┼─────────┼──────────┼─────────┼──────────────────┤
│ 1  │ 5       │ 10       │ 2       │ ORD-2024-05-123  │
│ 2  │ 5       │ 11       │ 1       │ ORD-2024-05-123  │ ← SAMA KEY!
│ 3  │ 5       │ 12       │ 1       │ ORD-2024-05-123  │ ← SAMA KEY!
└────┴─────────┴──────────┴─────────┴──────────────────┘
```

### ITERASI 1: Process row id=1 (Nasi Goreng)

```javascript
item = { id: 1, menu_id: 10, qty: 2, order_code: "ORD-2024-05-123", ... }
groupKey = "ORD-2024-05-123"

groups = {
  "ORD-2024-05-123": {
    order_code: "ORD-2024-05-123",
    created_at: "2024-06-01T10:30:00Z",
    status: "pending",
    items: [
      {
        menuId: 10,
        name: "Nasi Goreng",           // ← Dari menuMap[10]
        price: 25000,                  // ← Dari menuMap[10]
        qty: 2,
        subtotal: 50000                // 25000 * 2
      }
    ],
    totalPrice: 50000
  }
}
```

### ITERASI 2: Process row id=2 (Es Teh)

```javascript
item = { id: 2, menu_id: 11, qty: 1, order_code: "ORD-2024-05-123", ... }
groupKey = "ORD-2024-05-123"

// ✅ Group sudah ada! Jadi tidak membuat yang baru, langsung push item

groups = {
  "ORD-2024-05-123": {
    order_code: "ORD-2024-05-123",
    created_at: "2024-06-01T10:30:00Z",
    status: "pending",
    items: [
      {
        menuId: 10,
        name: "Nasi Goreng",
        price: 25000,
        qty: 2,
        subtotal: 50000
      },
      {
        menuId: 11,
        name: "Es Teh",                // ← Item baru ditambah
        price: 5000,
        qty: 1,
        subtotal: 5000
      }
    ],
    totalPrice: 55000                  // 50000 + 5000
  }
}
```

### ITERASI 3: Process row id=3 (Gorengan)

```javascript
item = { id: 3, menu_id: 12, qty: 1, order_code: "ORD-2024-05-123", ... }
groupKey = "ORD-2024-05-123"

// ✅ Group MASIH ada! Push item ketiga

groups = {
  "ORD-2024-05-123": {
    order_code: "ORD-2024-05-123",
    created_at: "2024-06-01T10:30:00Z",
    status: "pending",
    items: [
      {
        menuId: 10,
        name: "Nasi Goreng",
        price: 25000,
        qty: 2,
        subtotal: 50000
      },
      {
        menuId: 11,
        name: "Es Teh",
        price: 5000,
        qty: 1,
        subtotal: 5000
      },
      {
        menuId: 12,
        name: "Gorengan",               // ← Item ketiga ditambah
        price: 10000,
        qty: 1,
        subtotal: 10000
      }
    ],
    totalPrice: 65000                  // 50000 + 5000 + 10000
  }
}
```

### OUTPUT: Grouped Orders (1 order card dengan 3 items)

```javascript
[
  {
    order_code: "ORD-2024-05-123",
    created_at: "2024-06-01T10:30:00Z",
    status: "pending",
    items: [
      { menuId: 10, name: "Nasi Goreng", price: 25000, qty: 2, subtotal: 50000 },
      { menuId: 11, name: "Es Teh", price: 5000, qty: 1, subtotal: 5000 },
      { menuId: 12, name: "Gorengan", price: 10000, qty: 1, subtotal: 10000 }
    ],
    totalPrice: 65000
  }
]
```

---

## 🎨 LANGKAH 6: RENDER DI UI

Sekarang data sudah siap, tinggal di-render:

```typescript
{groupedOrders.map((order) => (
  <Card key={order.order_code}>
    {/* HEADER */}
    <View>
      <Text>Order #{order.order_code}</Text>
      <Text>{formatFigmaDate(order.created_at)}</Text>
      <Badge status={order.status}>pending</Badge>
    </View>

    {/* ITEMS LIST - RENDER SETIAP ITEM DALAM order.items */}
    <View>
      <Text>Daftar Pesanan</Text>
      
      {order.items.map((item, idx) => (
        <View key={idx}>
          {/* Item 1: Nasi Goreng */}
          <Text>{item.name}</Text>                                    
          <Text>Rp {item.price.toLocaleString()} × {item.qty}</Text>
          <Text>Rp {item.subtotal.toLocaleString()}</Text>
          
          {/* Item 2: Es Teh */}
          {/* Item 3: Gorengan */}
        </View>
      ))}
    </View>

    {/* TOTAL */}
    <View>
      <Text>Total</Text>
      <Text>Rp {order.totalPrice.toLocaleString()}</Text>
      {/* Rp 65.000 */}
    </View>

    {/* BUTTONS */}
    <Button title="Pesan Lagi" />
    <Button title="Lihat Struk" />
  </Card>
))}
```

---

## 📊 TABEL KOMPARASI: Sebelum vs Sesudah Grouping

### SEBELUM GROUPING (Raw Data)

| ID | Customer | Menu | Qty | Order Code | Total |
|----|----------|------|-----|-----------|--------|
| 1  | Budi | Nasi Goreng | 2 | ORD-2024-05-123 | ? |
| 2  | Budi | Es Teh | 1 | ORD-2024-05-123 | ? |
| 3  | Budi | Gorengan | 1 | ORD-2024-05-123 | ? |

**Problem:** 
- Tidak jelas totalnya brapa
- Terlihat seperti 3 order terpisah padahal 1 order dengan 3 items
- Susah di-render sebagai 1 card

### SESUDAH GROUPING (Grouped Data)

| Order Code | Customer | Items | Total |
|-----------|----------|-------|-------|
| ORD-2024-05-123 | Budi | 2x Nasi Goreng (Rp50k) + 1x Es Teh (Rp5k) + 1x Gorengan (Rp10k) | Rp 65.000 |

**Benefits:**
- ✅ 1 order = 1 card (jelas!)
- ✅ Total sudah dihitung
- ✅ Items di-group dengan rapi
- ✅ Mudah di-render

---

## 🔑 KEY POINTS

### 1️⃣ Group Key = order_code (bukan timestamp!)

❌ **SALAH** (kalau pakai timestamp):
```javascript
const groupKey = order.created_at;  // "2024-06-01T10:30:00Z"
// Masalah: 2 orders berbeda dengan waktu sama akan merge!
```

✅ **BENAR** (pakai order_code):
```javascript
const groupKey = order.order_code;  // "ORD-2024-05-123"
// Keuntungan: Unique per order dari database
```

---

### 2️⃣ Menu Mapping Penting

❌ **SALAH** (tanpa mapping):
```typescript
groups[groupKey].items.push({
  menuId: 10,
  name: ???,        // Mana datanya?
  price: ???,       // Mana datanya?
  qty: item.qty
});
```

✅ **BENAR** (dengan mapping):
```typescript
const menuDetail = menuMap[item.menu_id];  // Lookup dari cache
groups[groupKey].items.push({
  menuId: item.menu_id,
  name: menuDetail.name,      // "Nasi Goreng" 🎯
  price: menuDetail.price,    // 25000 🎯
  qty: item.qty
});
```

---

### 3️⃣ State Management

Setelah grouping, data disimpan di state:

```typescript
const [groupedOrders, setGroupedOrders] = useState<GroupedOrder[]>([]);

// Setelah fetch + filter + grouping:
setGroupedOrders(dynamicGrouped);  // ← State update trigger re-render

// Component akan re-render dengan data yang sudah grouped
```

---

## 🔄 FULL FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FETCH RAW DATA                                               │
│    GET /api/orders                                              │
│    Response: [                                                  │
│      { id: 1, menu_id: 10, order_code: "ORD-001", ... },      │
│      { id: 2, menu_id: 11, order_code: "ORD-001", ... },  ← SAME!
│      { id: 3, menu_id: 10, order_code: "ORD-002", ... }       │
│    ]                                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FILTER by user_id                                            │
│    const myOrders = orderList.filter(o =>                       │
│      o.user_id === user.id                                      │
│    )                                                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. FILTER by status & date                                      │
│    const filtered = myOrders.filter(o => {                      │
│      if (o.status !== "completed") return true;                 │
│      return isWithinLastDays(o.created_at, 3);                  │
│    })                                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. LOAD MENU MAP (for name & price lookup)                      │
│    GET /api/menus                                               │
│    Convert to: {                                                │
│      10: { name: "Nasi Goreng", price: 25000 },                │
│      11: { name: "Es Teh", price: 5000 },                      │
│      ...                                                        │
│    }                                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. GROUP by order_code                                          │
│    groups = {}                                                  │
│    filtered.forEach(item => {                                   │
│      groupKey = item.order_code                                 │
│      if (!groups[groupKey]) groups[groupKey] = {...}           │
│      groups[groupKey].items.push({...})                        │
│      groups[groupKey].totalPrice += ...                        │
│    })                                                           │
│    Result: {                                                    │
│      "ORD-001": {                                               │
│        items: [                                                 │
│          { name: "Nasi Goreng", qty: 2, subtotal: 50000 },    │
│          { name: "Es Teh", qty: 1, subtotal: 5000 }           │
│        ],                                                       │
│        totalPrice: 55000                                        │
│      },                                                         │
│      "ORD-002": { ... }                                         │
│    }                                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. CONVERT OBJECT → ARRAY                                       │
│    Object.values(groups).reverse()                              │
│    Result: [                                                    │
│      {                                                          │
│        order_code: "ORD-001",                                   │
│        items: [...],                                            │
│        totalPrice: 55000                                        │
│      }                                                          │
│    ]                                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. RENDER IN UI                                                 │
│    groupedOrders.map(order => (                                 │
│      <Card>                                                      │
│        <Text>Order #{order.order_code}</Text>                  │
│        {order.items.map(item => (                               │
│          <ItemRow name={item.name} ... />                      │
│        ))}                                                      │
│        <Text>Total: Rp {order.totalPrice}</Text>               │
│      </Card>                                                    │
│    ))                                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💾 DATA DI MEMORY (State)

Setelah semua proses, ini yang disimpan di React state:

```typescript
groupedOrders = [
  {
    order_code: "ORD-2024-05-123",
    created_at: "2024-06-01T10:30:00Z",
    status: "pending",
    items: [
      {
        menuId: 10,
        name: "Nasi Goreng",
        price: 25000,
        qty: 2,
        subtotal: 50000
      },
      {
        menuId: 11,
        name: "Es Teh",
        price: 5000,
        qty: 1,
        subtotal: 5000
      },
      {
        menuId: 12,
        name: "Gorengan",
        price: 10000,
        qty: 1,
        subtotal: 10000
      }
    ],
    totalPrice: 65000
  }
]
```

---

## 🐛 DEBUGGING TIPS

### Cek raw data dari backend:

```typescript
const result = await apiFetch("/orders");
console.log("Raw backend response:", result);
```

### Cek setelah filter:

```typescript
const filtered = myOrders.filter(...);
console.log("After filter:", filtered);
```

### Cek menu map:

```typescript
console.log("Menu map:", menuMap);
// Pastikan semua menu_id dari orders ada di map!
```

### Cek grouping result:

```typescript
const grouped = groupLaravelOrders(filtered);
console.log("Grouped orders:", grouped);
```

### Trace di UI jika tidak muncul:

```typescript
{groupedOrders.length === 0 ? (
  <Text>No orders (grouped.length = 0)</Text>
) : (
  groupedOrders.map(...)
)}
```

---

## 📚 KESIMPULAN

**3 konsep utama:**

1. **Raw Data** = Flat array dari backend (1 baris = 1 item)
2. **Grouping** = Combine multiple items dengan order_code sama → 1 order
3. **Menu Mapping** = Convert menu_id → name & price untuk rendering

**Analogi dunia nyata:**

```
Raw Data:
┌─────────────────┐
│ Toko Kelontong  │
├─────────────────┤
│ - Peci (Rp 25k) │  ← Barang 1
│ - Teh (Rp 5k)   │  ← Barang 2
│ - Goreng (Rp 10k)│ ← Barang 3
│                 │
│ (Belum dikasih   │
│  ke pembeli)    │
└─────────────────┘

Grouping:
┌──────────────────┐
│ Tas Belanja      │
├──────────────────┤
│ Peci (2x) Rp 50k │
│ Teh (1x)  Rp 5k  │
│ Goreng (1x) Rp 10k
│                  │
│ TOTAL: Rp 65.000 │
│                  │
│ (Siap untuk      │
│  di-display)     │
└──────────────────┘
```

Grouping mengubah raw items menjadi 1 paket order yang siap di-render!
