import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import "react-native-get-random-values";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { v4 as uuidv4 } from "uuid";

import { RootStackParamList } from "../App";
import useInvoiceStore from "../store/invoiceStore";
import { Invoice, LineItem } from "../types";
import { formatCurrency } from "../utils/format";

type RouteProps = RouteProp<RootStackParamList, "CreateEdit">;

const InvoiceFormScreen: React.FC = () => {
  const nav = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProps>();
  const invoiceId = route.params?.invoiceId;
  const invoices = useInvoiceStore((s) => s.invoices);
  const addInvoice = useInvoiceStore((s) => s.addInvoice);
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice);
  const getItemSuggestions = useInvoiceStore((s) => s.getItemSuggestions);
  const addItemSuggestion = useInvoiceStore((s) => s.addItemSuggestion);

  const editing = Boolean(invoiceId);
  const existing = invoices.find((i) => i.id === invoiceId);

  const [clientName, setClientName] = useState(existing?.clientName ?? "786 Traders");
  const [date, setDate] = useState<Date>(
    existing ? new Date(existing.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [id, setId] = useState(existing?.id ?? genId());
  const [items, setItems] = useState<LineItem[]>(
    existing?.items ?? [{ id: uuidv4(), description: "", qty: 0, unitPrice: 0, total: 0 }]
  );
  const [status, setStatus] = useState<Invoice["status"]>(existing?.status ?? "Pending");

  const [modalVisible, setModalVisible] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [newItemPrice, setNewItemPrice] = useState(""); // For new item price input

  const [isDirty, setIsDirty] = useState(false);

  const suggestions = getItemSuggestions();

  const grandTotal = useMemo(
    () => items.reduce((s, it) => s + (it.total || 0), 0),
    [items]
  );

  function genId() {
    return "INV-" + Date.now().toString(36).toUpperCase();
  }

  function round2(n: number) {
    return Math.round(n * 100) / 100;
  }

  // Update line item locally (no auto-save)
  const updateLine = (id: string, patch: Partial<LineItem>) => {
    setItems((s) =>
      s.map((it) =>
        it.id === id
          ? {
              ...it,
              ...patch,
              total: round2((patch.qty ?? it.qty) * (patch.unitPrice ?? it.unitPrice)),
            }
          : it
      )
    );
  };

  const addLine = () => {
    setItems((s) => [...s, { id: uuidv4(), description: "", qty: 0, unitPrice: 0, total: 0 }]);
  };

  const removeLine = (id: string) => {
    setItems((s) => s.filter((it) => it.id !== id));
  };

  const onSelectSuggestion = async (desc: string, price: number) => {
    if (activeItemId) {
      updateLine(activeItemId, { description: desc, unitPrice: price, qty: 1 });
      // Save this item as a suggestion for future use
      await addItemSuggestion({ description: desc, unitPrice: price });
      setActiveItemId(null);
      setModalVisible(false);
      setSearchText("");
      setNewItemPrice("");
    }
  };

  const onSaveNewItem = async () => {
    if (activeItemId && searchText.trim()) {
      const price = parseFloat(newItemPrice) || 0;
      const newItem = { 
        description: searchText.trim(), 
        unitPrice: price, 
        qty: 1 
      };
      updateLine(activeItemId, newItem);
      // Save as suggestion for future use
      await addItemSuggestion({ description: newItem.description, unitPrice: newItem.unitPrice });
      setActiveItemId(null);
      setModalVisible(false);
      setSearchText("");
      setNewItemPrice("");
    }
  };

  const onSave = async () => {
    if (!clientName.trim()) {
      Alert.alert("Validation", "Client name is required");
      return;
    }
    if (!id.trim()) {
      Alert.alert("Validation", "Invoice ID is required");
      return;
    }

    const duplicate = invoices.find((inv) => inv.id === id && inv.id !== (existing?.id ?? ""));
    if (duplicate) {
      Alert.alert("Validation", "Invoice ID already exists. Please enter a unique one.");
      return;
    }

    const invoice: Invoice = {
      id,
      clientName,
      date: date.toISOString(),
      items,
      grandTotal,
      status,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    const res = editing ? await updateInvoice(invoice) : await addInvoice(invoice);
    if (!res.ok) {
      Alert.alert("Error", res.error ?? "Failed to save invoice");
      return;
    }

    nav.navigate("Home");
  };

  const onPrint = async () => {
    const html = invoiceToHTML({
      id,
      clientName,
      date: date.toISOString(),
      items,
      grandTotal,
      status,
    });
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === "ios" || Platform.OS === "android") {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Printed", `PDF generated at ${uri}`);
      }
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", "Failed to generate PDF");
    }
  };

  // Track unsaved changes
  useEffect(() => {
    if (
      clientName !== existing?.clientName ||
      date.toISOString() !== existing?.date ||
      id !== existing?.id ||
      JSON.stringify(items) !== JSON.stringify(existing?.items) ||
      status !== existing?.status
    ) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [clientName, date, id, items, status, existing]);

  // Confirm back navigation
  useEffect(() => {
    const unsubscribe = nav.addListener("beforeRemove", (e) => {
      if (!isDirty) return;
      e.preventDefault();

      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. If you go back, your data will be lost.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => nav.dispatch(e.data.action) },
        ]
      );
    });
    return unsubscribe;
  }, [nav, isDirty]);

  // Reset new item price when search text changes
  useEffect(() => {
    if (searchText.trim() && !suggestions.some(s => 
      s.description.toLowerCase().includes(searchText.toLowerCase())
    )) {
      // Keep the existing price if user is still typing the same item
      // Only reset if it's a completely new search
      if (!newItemPrice) {
        setNewItemPrice("");
      }
    }
  }, [searchText]);
 
 const {bottom} = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={[ 'left', 'right']}>
      <TouchableWithoutFeedback
        onPress={() => {
          setModalVisible(false);
          Keyboard.dismiss();
        }}
      >
        <View 
        style={{ flex: 1 ,padding:5 }}
        >
          <ScrollView 
            // style={styles.container} 
            contentContainerStyle={[styles.scrollContent,{paddingBottom: 12 + bottom}]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Client Name</Text>
            <TextInput
              style={styles.input}
              value={clientName}
              placeholder="786 Traders"
              placeholderTextColor={"#999"}
              onChangeText={setClientName}
            />

            <Text style={styles.label}>Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text>{date.toDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(_, d) => {
                  setShowDatePicker(false);
                  if (d) setDate(d);
                }}
              />
            )}

            <Text style={styles.label}>Invoice ID</Text>
            <TextInput style={styles.input} value={id} onChangeText={setId} />

            <Text style={[styles.label, { marginTop: 12 }]}>Items</Text>
            {items.map((it) => (
              <View key={it.id} style={styles.line}>
                <TouchableOpacity
                  style={[styles.input, { flex: 1, justifyContent: "center" }]}
                  onPress={() => {
                    setActiveItemId(it.id);
                    setModalVisible(true);
                    setSearchText("");
                    setNewItemPrice("");
                  }}
                >
                  <Text style={{ color: it.description ? "#000" : "#999" }}>
                    {it.description || "Enter Item"}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  placeholder="Qty"
                  placeholderTextColor={"#999"}
                  keyboardType="numeric"
                  style={[styles.input, { width: 70, marginLeft: 8 }]}
                  value={it.qty ? String(it.qty) : ""}
                  onChangeText={(t) => updateLine(it.id, { qty: parseFloat(t) || 0 })}
                />

                <TextInput
                  placeholder="Price"
                  keyboardType="numeric"
                  placeholderTextColor={"#999"}
                  style={[styles.input, { width: 100, marginLeft: 8 }]}
                  value={it.unitPrice ? String(it.unitPrice) : ""}
                  onChangeText={(t) => updateLine(it.id, { unitPrice: parseFloat(t) || 0 })}
                />

                <View style={{ justifyContent: "center", marginLeft: 8 }}>
                  <Text style={{ fontWeight: "700" }}>{formatCurrency(it.total)}</Text>
                  <TouchableOpacity onPress={() => removeLine(it.id)}>
                    <Text style={{ color: "red", marginTop: 2 }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={addLine}>
              <Text style={{ color: "#0b74de" }}>+ Add Item</Text>
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: 12 }]}>Status</Text>
            <View style={styles.pickerWrap}>
              <Picker 
                selectedValue={status} 
                onValueChange={(v) => setStatus(v as any)}
                style={styles.picker}
                dropdownIconColor="#333"
              >
                <Picker.Item label="Received" value="Received" color="#333" />
                <Picker.Item label="Pending" value="Pending" color="#333" />
              </Picker>
            </View>

            <View style={styles.row}>
              <Text style={styles.grandLabel}>Grand Total</Text>
              <Text style={styles.grandValue}>{formatCurrency(grandTotal)}</Text>
            </View>

            <View style={{ height: 12 }} />

            <View style={styles.buttonContainer}>
              <Button
                title="CANCEL"
                onPress={() => {
                  if (isDirty) {
                    Alert.alert(
                      "Discard changes?",
                      "You have unsaved changes. If you go back, your data will be lost.",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Discard", style: "destructive", onPress: () => nav.navigate("Home") },
                      ]
                    );
                  } else {
                    nav.navigate("Home");
                  }
                }}
                color="#999"
              />
              <Button title="PRINT INVOICE" onPress={onPrint} />
              <Button title={editing ? "UPDATE" : "SAVE"} onPress={onSave} />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Suggestion Modal */}
          <Modal visible={modalVisible} transparent animationType="fade">
            <KeyboardAvoidingView 
              style={styles.modalOverlay}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <TouchableWithoutFeedback
                onPress={() => {
                  // Don't close on overlay tap to prevent accidental closes
                }}
              >
                <View style={styles.modalBox}>
                  <Text style={styles.modalTitle}>Select Item</Text>

                  <TextInput
                    style={[styles.input, { marginBottom: 8 }]}
                    placeholder="Search or type new item"
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholderTextColor="#999"
                    autoFocus
                  />

                  {/* New Item Price Input - Show only when searching for new items */}
                  {searchText.trim() && !suggestions.some(s => 
                    s.description.toLowerCase() === searchText.toLowerCase()
                  ) && (
                    <View style={styles.newItemSection}>
                      <Text style={styles.newItemLabel}>Set Price for "{searchText}"</Text>
                      <TextInput
                        style={[styles.input, { marginBottom: 8 }]}
                        placeholder="Enter price"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={newItemPrice}
                        onChangeText={setNewItemPrice}
                        returnKeyType="done"
                        onSubmitEditing={onSaveNewItem}
                      />
                      <TouchableOpacity
                        style={[styles.addButton, !newItemPrice.trim() && styles.addButtonDisabled]}
                        onPress={onSaveNewItem}
                        disabled={!newItemPrice.trim()}
                      >
                        <Text style={styles.addButtonText}>
                          ADD ITEM {newItemPrice.trim() ? `- ${formatCurrency(parseFloat(newItemPrice) || 0)}` : ''}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <FlatList
                    data={suggestions.filter((s) =>
                      s.description.toLowerCase().includes(searchText.toLowerCase())
                    )}
                    keyExtractor={(item) => item.description}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => onSelectSuggestion(item.description, item.unitPrice)}
                      >
                        <Text style={{ fontWeight: "600", color: "#333" }}>{item.description}</Text>
                        <Text style={{ color: "#555" }}>{formatCurrency(item.unitPrice)}</Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      !searchText.trim()
                        ? <Text style={styles.noItemsText}>No items found. Start typing to add a new item.</Text>
                        : null
                    }
                    style={styles.flatList}
                    keyboardShouldPersistTaps="handled"
                  />

                  <Button
                    title="CLOSE"
                    onPress={() => {
                      setModalVisible(false);
                      setSearchText("");
                      setNewItemPrice("");
                    }}
                  />
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const invoiceToHTML = (inv: {
  id: string;
  clientName: string;
  date: string;
  items: LineItem[];
  grandTotal: number;
  status: string;
}) => {
  const rows = inv.items
    .map(
      (it) => `<tr>
    <td style="padding:6px;border:1px solid #ddd">${it.description}</td>
    <td style="padding:6px;border:1px solid #ddd;text-align:center">${it.qty}</td>
    <td style="padding:6px;border:1px solid #ddd;text-align:right">${it.unitPrice.toFixed(2)}</td>
    <td style="padding:6px;border:1px solid #ddd;text-align:right">${it.total.toFixed(2)}</td>
  </tr>`
    )
    .join("");
  return `<!doctype html>
  <html>
  <head><meta charset="utf-8"><title>Invoice ${inv.id}</title></head>
  <body style="font-family: Arial, Helvetica, sans-serif; padding:20px;">
    <h2>Invoice ${inv.id}</h2>
    <div><strong>Client:</strong> ${inv.clientName}</div>
    <div><strong>Date:</strong> ${new Date(inv.date).toDateString()}</div>
    <div><strong>Status:</strong> ${inv.status}</div>
    <br/>
    <table style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr>
          <th style="padding:6px;border:1px solid #ddd;text-align:left">Description</th>
          <th style="padding:6px;border:1px solid #ddd">Qty</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:right">Unit</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <h3 style="text-align:right">Grand Total: ${inv.grandTotal.toFixed(2)}</h3>
  </body>
  </html>`;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor: "green",
  },
  container: { 
    flex: 1, 
  },
  scrollContent: { 
    padding: 12,
  },
  label: { fontSize: 13, color: "#222", marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: "#f7f7f8",
    borderRadius: 8,
    paddingVertical: 10,
    paddingBottom: 12,
    fontSize: 14,
    marginBottom: 8,
    color: "#333",
  },
  line: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  addBtn: { padding: 10, alignItems: "center", marginVertical: 8, backgroundColor: "#fff" },
  pickerWrap: { 
    backgroundColor: "#f7f7f8", 
    borderRadius: 8, 
    overflow: "hidden", 
    marginBottom: 8 
  },
  picker: {
    color: "#333",
  },
  row: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginTop: 12 
  },
  grandLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
  grandValue: { fontSize: 16, fontWeight: "700", color: "#333" },
  buttonContainer: {
    flexDirection: "row", 
    justifyContent: "space-between",
    marginBottom: 10, // Extra margin for bottom buttons
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  modalBox: { 
    backgroundColor: "#fff", 
    padding: 16, 
    borderRadius: 10, 
    width: "85%", 
    maxHeight: "80%", // Increased to accommodate keyboard
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "600", 
    marginBottom: 12, 
    textAlign: "center",
    color: "#333"
  },
  modalItem: { 
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: "#eee" 
  },
  newItemSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  newItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  noItemsText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 8,
    padding: 16,
  },
  addButton: {
    backgroundColor: "#0b74de",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  flatList: {
    flexGrow: 0,
    maxHeight: 200, // Limit height to prevent keyboard issues
  },
});

export default InvoiceFormScreen;