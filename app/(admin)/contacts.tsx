import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  TouchableOpacity,
  Platform,
  Pressable,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { theme } from "@/constants/theme";
import { spacing, radius, typography } from "@/components/system";
import { apiFetch } from "@/lib/fetch";

interface Contact {
  id: number;
  name: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminContacts() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Custom alert states
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [users, setUsers] = useState<UserRole[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [openRoleDropdown, setOpenRoleDropdown] = useState<number | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    userId: number;
    name: string;
    email: string;
    currentRole: string;
    nextRole: string;
  } | null>(null);
  const [isRoleUpdating, setIsRoleUpdating] = useState(false);

  // Load contacts and user roles
  useEffect(() => {
    loadContacts();
    loadUsers();
  }, []);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch("/admin/contacts");
      setContacts(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Gagal memuat kontak:", error);
      setCustomAlertMessage("Kesalahan\n\nGagal memuat daftar kontak");
      setCustomAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsUsersLoading(true);
      const data = await apiFetch("/admin/users");
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Gagal memuat pengguna:", error);
      setCustomAlertMessage("Kesalahan\n\nGagal memuat daftar pengguna");
      setCustomAlertVisible(true);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const toggleRoleDropdown = (id: number) => {
    setOpenRoleDropdown((prev) => (prev === id ? null : id));
  };

  const requestRoleChange = (user: UserRole, newRole: string) => {
    if (newRole === user.role) {
      setOpenRoleDropdown(null);
      return;
    }

    setRoleChangeTarget({
      userId: user.id,
      name: user.name,
      email: user.email,
      currentRole: user.role,
      nextRole: newRole,
    });
    setOpenRoleDropdown(null);
  };

  const confirmRoleChange = async () => {
    if (!roleChangeTarget) return;

    setIsRoleUpdating(true);
    try {
      await apiFetch(`/admin/users/${roleChangeTarget.userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleChangeTarget.nextRole }),
      });

      setCustomAlertMessage("Sukses\n\nRole pengguna berhasil diperbarui.");
      setCustomAlertVisible(true);
      await loadUsers();
    } catch (error) {
      console.error("Gagal memperbarui role pengguna:", error);
      setCustomAlertMessage("Kesalahan\n\nGagal memperbarui role pengguna");
      setCustomAlertVisible(true);
    } finally {
      setIsRoleUpdating(false);
      setRoleChangeTarget(null);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Keep only digits
    return value.replace(/[^0-9]/g, "");
  };

  const validateForm = () => {
    if (!name.trim()) {
      setFormError("Nama kontak wajib diisi");
      return false;
    }
    if (!phoneNumber.trim()) {
      setFormError("Nomor telepon wajib diisi");
      return false;
    }
    if (phoneNumber.length < 10 || phoneNumber.length > 15) {
      setFormError("Nomor telepon harus 10-15 digit");
      return false;
    }
    setFormError(null);
    return true;
  };

  const resetForm = () => {
    setName("");
    setPhoneNumber("");
    setFormError(null);
    setEditingId(null);
  };

  const handleAddOrUpdate = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        phone_number: phoneNumber,
      };

      if (editingId) {
        // Update existing contact
        await apiFetch(`/admin/contacts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setCustomAlertMessage("Sukses\n\nKontak berhasil diperbarui");
        setCustomAlertVisible(true);
      } else {
        // Add new contact
        await apiFetch("/admin/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setCustomAlertMessage("Sukses\n\nKontak berhasil ditambahkan");
        setCustomAlertVisible(true);
      }

      resetForm();
      setShowModal(false);
      await loadContacts();
    } catch (error: any) {
      const message = error?.message || "Gagal menyimpan kontak";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await apiFetch(`/admin/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      await loadContacts();
    } catch (error) {
      setCustomAlertMessage("Kesalahan\n\nGagal mengubah status kontak");
      setCustomAlertVisible(true);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (id: number) => {
    try {
      await apiFetch(`/admin/contacts/${id}`, { method: "DELETE" });
      setCustomAlertMessage("Sukses\n\nKontak berhasil dihapus");
      setCustomAlertVisible(true);
      await loadContacts();
    } catch (error) {
      setCustomAlertMessage("Kesalahan\n\nGagal menghapus kontak");
      setCustomAlertVisible(true);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingId(contact.id);
    setName(contact.name);
    setPhoneNumber(contact.phone_number);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: isDesktop ? spacing.xl : spacing.lg }]}>
        <Text style={styles.title}>Kelola CS</Text>
        <Text style={styles.subtitle}>Atur daftar customer service</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
          <View style={[styles.mainContent, { paddingHorizontal: isDesktop ? spacing.xl : spacing.lg }]}>
            {isDesktop ? (
              // Desktop: Left Form + Right List (2 column)
              <View style={styles.desktopLayout}>
                {/* LEFT: Form */}
                <View style={styles.desktopLeft}>
                  <Card style={styles.formCard}>
                    <CardHeader>
                      <CardTitle>{editingId ? "Edit Kontak" : "Tambah Kontak Baru"}</CardTitle>
                    </CardHeader>
                    <CardContent style={styles.formContent}>
                      <View>
                        <Text style={styles.label}>Nama Kontak</Text>
                        <Input
                          placeholder="Contoh: Sinta Wardani"
                          value={name}
                          onChangeText={setName}
                          style={styles.input}
                        />
                      </View>

                      <View>
                        <Text style={styles.label}>Nomor Telepon</Text>
                        <Input
                          placeholder="628xxxxxxxxx"
                          value={phoneNumber}
                          onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                          keyboardType="phone-pad"
                          style={styles.input}
                        />
                      </View>

                      {formError && <Text style={styles.errorText}>{formError}</Text>}

                      <View style={styles.formActions}>
                        <Button
                          title={editingId ? "Perbarui" : "Tambah"}
                          onPress={handleAddOrUpdate}
                          disabled={isSubmitting}
                        />
                        {editingId && (
                          <Button
                            title="Batal"
                            variant="outline"
                            onPress={resetForm}
                            disabled={isSubmitting}
                          />
                        )}
                      </View>
                    </CardContent>
                  </Card>
                </View>

                {/* RIGHT: Contact List */}
                <View style={styles.desktopRight}>
                  {contacts.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Icon name="help-circle-outline" size={48} color={theme.colors.mutedForeground} />
                      <Text style={styles.emptyTitle}>Belum ada kontak</Text>
                      <Text style={styles.emptyDesc}>Tambahkan kontak baru untuk memulai</Text>
                    </View>
                  ) : (
                    <View style={styles.contactList}>
                      {contacts.map((contact) => (
                        <ContactCard
                          key={contact.id}
                          contact={contact}
                          onToggle={handleToggleActive}
                          onEdit={handleEditContact}
                          onDelete={handleDelete}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ) : (
              // Mobile: Stack Form + List vertically
              <View style={styles.mobileLayout}>
                <Button title="✚ Tambah Kontak" onPress={handleOpenAddModal} />

                <View style={{ height: spacing.lg }} />

                {contacts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Icon name="help-circle-outline" size={48} color={theme.colors.mutedForeground} />
                    <Text style={styles.emptyTitle}>Belum ada kontak</Text>
                    <Text style={styles.emptyDesc}>Tambahkan kontak baru untuk memulai</Text>
                  </View>
                ) : (
                  <View style={styles.contactList}>
                    {contacts.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        onToggle={handleToggleActive}
                        onEdit={handleEditContact}
                        onDelete={handleDelete}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.userSection}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Kelola Hak Akses Pengguna</Text>
                <Text style={styles.sectionSubtitle}>Ubah role pengguna dengan konfirmasi sebelum perubahan diterapkan.</Text>
              </View>

              {isUsersLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.emptyDesc}>Memuat daftar pengguna...</Text>
                </View>
              ) : users.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="help-circle-outline" size={48} color={theme.colors.mutedForeground} />
                  <Text style={styles.emptyTitle}>Tidak ada pengguna</Text>
                  <Text style={styles.emptyDesc}>Daftar pengguna belum tersedia untuk saat ini.</Text>
                </View>
              ) : isDesktop ? (
                <View style={styles.usersDesktopTable}>
                  <View style={styles.usersTableHeader}>
                    <Text style={[styles.usersTableCell, styles.tableHeaderText]}>Nama</Text>
                    <Text style={[styles.usersTableCell, styles.tableHeaderText]}>Email</Text>
                    <Text style={[styles.usersTableCell, styles.tableHeaderText]}>Role</Text>
                    <Text style={[styles.usersTableCell, styles.tableHeaderText, { flex: 0.8 }]}>Aksi</Text>
                  </View>
                  {users.map((user, index) => (
                    <View key={user.id} style={[
                        styles.usersTableRow, 
                        // 👇 Suntikkan zIndex dan elevation yang semakin mengecil ke bawah
                        { zIndex: users.length - index, elevation: users.length - index }
                      ]}>
                      <Text style={styles.usersTableCell}>{user.name}</Text>
                      <Text style={styles.usersTableCell}>{user.email}</Text>
                      <View style={styles.usersTableCell}>
                        <View style={styles.userRoleBadge}>
                          <Text style={styles.userRoleText}>{user.role === "admin" ? "Admin" : "Customer"}</Text>
                        </View>
                      </View>
                      <View style={[styles.usersTableCell, { flex: 0.8 }]}> 
                        <View style={styles.roleDropdownWrapper}>
                          <Pressable style={styles.roleDropdownButton} onPress={() => toggleRoleDropdown(user.id)}>
                            <Text style={styles.roleDropdownLabel}>{user.role === "admin" ? "Admin" : "Customer"}</Text>
                            <Icon name={openRoleDropdown === user.id ? "chevron-up" : "chevron-down"} size={18} color={theme.colors.mutedForeground} />
                          </Pressable>
                          {openRoleDropdown === user.id && (
                            <View style={styles.roleDropdownList}>
                              {[
                                { label: "Customer", value: "customer" },
                                { label: "Admin", value: "admin" },
                              ].map((option) => (
                                <Pressable
                                  key={option.value}
                                  style={styles.roleDropdownItem}
                                  onPress={() => requestRoleChange(user, option.value)}
                                >
                                  <Text style={styles.roleDropdownItemText}>{option.label}</Text>
                                </Pressable>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.userCardList}>
                  {users.map((user, index) => (
                    <Card key={user.id} style={[
                        styles.userCard, 
                        // 👇 Berlakukan trik yang sama untuk Card mobile
                        { zIndex: users.length - index, elevation: users.length - index }
                      ]}>
                      <CardContent>
                        <Text style={styles.userCardName}>{user.name}</Text>
                        <Text style={styles.userCardEmail}>{user.email}</Text>
                        <View style={styles.userCardFooter}>
                          <View style={styles.userRoleBadge}>
                            <Text style={styles.userRoleText}>{user.role === "admin" ? "Admin" : "Customer"}</Text>
                          </View>
                          <View style={styles.roleDropdownWrapperMobile}>
                            <Pressable style={styles.roleDropdownButton} onPress={() => toggleRoleDropdown(user.id)}>
                              <Text style={styles.roleDropdownLabel}>{user.role === "admin" ? "Admin" : "Customer"}</Text>
                              <Icon name={openRoleDropdown === user.id ? "chevron-up" : "chevron-down"} size={18} color={theme.colors.mutedForeground} />
                            </Pressable>
                            {openRoleDropdown === user.id && (
                              <View style={styles.roleDropdownListMobile}>
                                {[
                                  { label: "Customer", value: "customer" },
                                  { label: "Admin", value: "admin" },
                                ].map((option) => (
                                  <Pressable
                                    key={option.value}
                                    style={styles.roleDropdownItem}
                                    onPress={() => requestRoleChange(user, option.value)}
                                  >
                                    <Text style={styles.roleDropdownItemText}>{option.label}</Text>
                                  </Pressable>
                                ))}
                              </View>
                            )}
                          </View>
                        </View>
                      </CardContent>
                    </Card>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Modal for Add/Edit on Mobile */}
      <Modal visible={showModal && !isDesktop} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? "Edit Kontak" : "Tambah Kontak Baru"}</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Icon name="close" size={24} color={theme.colors.foreground} />
              </Pressable>
            </View>

            {/* Form */}
            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalForm}>
                <View>
                  <Text style={styles.label}>Nama Kontak</Text>
                  <Input
                    placeholder="Contoh: Sinta Wardani"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                  />
                </View>

                <View>
                  <Text style={styles.label}>Nomor Telepon</Text>
                  <Input
                    placeholder="628xxxxxxxxx"
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                </View>

                {formError && <Text style={styles.errorText}>{formError}</Text>}

                <View style={styles.modalActions}>
                  <Button
                    title={editingId ? "Perbarui" : "Tambah"}
                    onPress={handleAddOrUpdate}
                    disabled={isSubmitting}
                  />
                  <Button
                    title="Batal"
                    variant="outline"
                    onPress={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteConfirmId !== null} animationType="fade" transparent>
        <Pressable
          style={styles.confirmOverlay}
          onPress={() => setDeleteConfirmId(null)}
        >
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Hapus Kontak?</Text>
            <Text style={styles.confirmMessage}>
              Apakah Anda yakin ingin menghapus kontak ini? Tindakan ini tidak dapat dibatalkan.
            </Text>
            <View style={styles.confirmActions}>
              <Button
                title="Batal"
                variant="outline"
                onPress={() => setDeleteConfirmId(null)}
              />
              <Button
                title="Hapus"
                onPress={() => {
                  if (deleteConfirmId !== null) {
                    confirmDelete(deleteConfirmId);
                  }
                }}
                style={{ backgroundColor: theme.colors.destructive }}
              />
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={roleChangeTarget !== null} animationType="fade" transparent>
        <Pressable
          style={styles.confirmOverlay}
          onPress={() => setRoleChangeTarget(null)}
        >
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Ubah Role Pengguna?</Text>
            <Text style={styles.confirmMessage}>
              {roleChangeTarget
                ? `Apakah Anda yakin ingin mengubah role ${roleChangeTarget.name} menjadi ${roleChangeTarget.nextRole === "admin" ? "admin" : "customer"}?`
                : "Apakah Anda yakin ingin mengubah role pengguna ini?"}
            </Text>
            <View style={styles.confirmActions}>
              <Button
                title="Batal"
                variant="outline"
                onPress={() => setRoleChangeTarget(null)}
              />
              <Button
                title={isRoleUpdating ? "..." : "Konfirmasi"}
                onPress={confirmRoleChange}
                disabled={isRoleUpdating}
              />
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={customAlertVisible}
        onRequestClose={() => setCustomAlertVisible(false)}
      >
        <Pressable
          style={styles.customAlertOverlay}
          onPress={() => setCustomAlertVisible(false)}
        >
          <View style={styles.customAlertBox}>
            <Text style={styles.customAlertText}>{customAlertMessage}</Text>
            <Button
              title="OK"
              onPress={() => setCustomAlertVisible(false)}
              style={styles.customAlertButton}
              variant="default"
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============ CONTACT CARD COMPONENT ============
interface ContactCardProps {
  contact: Contact;
  onToggle: (id: number, currentStatus: boolean) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: number) => void;
}

function ContactCard({ contact, onToggle, onEdit, onDelete }: ContactCardProps) {
  return (
    <Card style={styles.contactCard}>
      <CardContent>
        {/* Header Row: Name + Status */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardInfo}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <View style={getStatusBadgeStyle(contact.is_active)}>
              <View style={getStatusDotStyle(contact.is_active)} />
              <Text style={styles.statusText}>{contact.is_active ? "Aktif" : "Tidak Aktif"}</Text>
            </View>
          </View>

          {/* Toggle Switch */}
          <Pressable
            style={[styles.toggleSwitch, { backgroundColor: contact.is_active ? theme.colors.success : theme.colors.mutedForeground }]}
            onPress={() => onToggle(contact.id, contact.is_active)}
          >
            <View
              style={[
                styles.toggleThumb,
                contact.is_active ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
              ]}
            />
          </Pressable>
        </View>

        {/* Phone Number */}
        <View style={styles.phoneRow}>
          <Icon name="call" size={16} color={theme.colors.primary} />
          <Text style={styles.phoneNumber}>{contact.phone_number}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable style={styles.actionBtn} onPress={() => onEdit(contact)}>
            <Icon name="create" size={16} color={theme.colors.primary} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => onDelete(contact.id)}>
            <Icon name="trash" size={16} color={theme.colors.destructive} />
            <Text style={[styles.actionBtnText, { color: theme.colors.destructive }]}>Hapus</Text>
          </Pressable>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingVertical: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: theme.colors.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: theme.colors.mutedForeground,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  mainContent: {
    maxWidth: 1280,
    alignSelf: "center",
    width: "100%",
  },
  desktopLayout: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  desktopLeft: {
    flex: 0,
    minWidth: 350,
  },
  desktopRight: {
    flex: 1,
    minWidth: 350,
  },
  formCard: {
    backgroundColor: theme.colors.card,
  },
  formContent: {
    gap: spacing.md,
  },
  label: {
    ...typography.body,
    fontWeight: "600",
    color: theme.colors.foreground,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    fontSize: 14,
    color: theme.colors.foreground,
  },
  errorText: {
    ...typography.small,
    color: theme.colors.destructive,
    marginTop: spacing.xs,
  },
  formActions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  mobileLayout: {
    gap: spacing.lg,
  },
  contactList: {
    gap: spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: theme.colors.foreground,
  },
  emptyDesc: {
    ...typography.body,
    color: theme.colors.mutedForeground,
  },

  // ===== USER ROLE MANAGEMENT =====
  userSection: {
    marginTop: spacing.xxxl,
    gap: spacing.lg,
  },
  sectionHeading: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: theme.colors.foreground,
  },
  sectionSubtitle: {
    ...typography.body,
    color: theme.colors.mutedForeground,
  },
  usersDesktopTable: {
    width: "100%",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: theme.colors.card,
  },
  usersTableHeader: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  usersTableRow: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  usersTableCell: {
    flex: 1,
    color: theme.colors.foreground,
    fontSize: 14,
  },
  tableHeaderText: {
    fontWeight: "700",
    color: theme.colors.mutedForeground,
  },
  userRoleBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.md,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  userRoleText: {
    ...typography.small,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  userCardList: {
    gap: spacing.lg,
  },
  userCard: {
    backgroundColor: theme.colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: spacing.lg,
  },
  userCardName: {
    ...typography.body,
    fontWeight: "700",
    color: theme.colors.foreground,
    marginBottom: spacing.xs,
  },
  userCardEmail: {
    ...typography.body,
    color: theme.colors.mutedForeground,
    marginBottom: spacing.md,
  },
  userCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  roleDropdownWrapper: {
    position: "relative",
    minWidth: 170,
  },
  roleDropdownWrapperMobile: {
    position: "relative",
    width: "100%",
  },
  roleDropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.inputBackground,
  },
  roleDropdownLabel: {
    ...typography.body,
    color: theme.colors.foreground,
  },
  roleDropdownList: {
    position: "absolute",
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.lg,
    marginTop: spacing.xs,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  roleDropdownListMobile: {
    position: "absolute",
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.lg,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  roleDropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  roleDropdownItemText: {
    ...typography.body,
    color: theme.colors.foreground,
  },

  // ===== CONTACT CARD =====
  contactCard: {
    backgroundColor: theme.colors.card,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cardInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  contactName: {
    ...typography.body,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  statusText: {
    ...typography.small,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: radius.full,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: "#ffffff",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  phoneNumber: {
    ...typography.body,
    color: theme.colors.foreground,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.md,
    backgroundColor: theme.colors.muted,
  },
  actionBtnText: {
    ...typography.small,
    fontWeight: "600",
    color: theme.colors.primary,
  },

  // ===== MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: theme.colors.foreground,
  },
  modalScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  modalForm: {
    gap: spacing.lg,
  },
  modalActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  // ===== DELETE CONFIRMATION MODAL =====
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBox: {
    backgroundColor: theme.colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: "85%",
    maxWidth: 350,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  confirmTitle: {
    ...typography.h3,
    color: theme.colors.foreground,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  confirmMessage: {
    ...typography.body,
    color: theme.colors.mutedForeground,
    marginBottom: spacing.lg,
    textAlign: "center",
    lineHeight: 20,
  },
  confirmActions: {
    gap: spacing.md,
    flexDirection: "row",
  },

  // ===== CUSTOM ALERT =====
  customAlertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  customAlertBox: {
    backgroundColor: theme.colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  customAlertText: {
    ...typography.body,
    color: theme.colors.foreground,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  customAlertButton: {
    minWidth: 100,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
});

// Helper functions for dynamic styles
const getStatusBadgeStyle = (isActive: boolean) => ({
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: spacing.xs,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  backgroundColor: isActive ? "rgba(22, 163, 74, 0.1)" : "rgba(120, 113, 108, 0.1)",
  borderRadius: radius.md,
  alignSelf: "flex-start" as const,
});

const getStatusDotStyle = (isActive: boolean) => ({
  width: 6,
  height: 6,
  borderRadius: radius.full,
  backgroundColor: isActive ? theme.colors.success : theme.colors.mutedForeground,
});

