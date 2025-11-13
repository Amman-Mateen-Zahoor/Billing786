// Fix for uuid in React Native
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

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
import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

  const editing = Boolean(invoiceId);
  const existing = invoices.find((i) => i.id === invoiceId);

  const [clientName, setClientName] = useState(existing?.clientName ?? "");
  const [date, setDate] = useState<Date>(existing ? new Date(existing.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [id, setId] = useState(existing?.id ?? genId());
  const [items, setItems] = useState<LineItem[]>(
    existing?.items ?? [{ id: uuidv4(), description: "", qty: 1, unitPrice: 0, total: 0 }]
  );
  const [status, setStatus] = useState<Invoice["status"]>(existing?.status ?? "Pending");

  const [modalVisible, setModalVisible] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
 
  const suggestions = getItemSuggestions();

  const grandTotal = useMemo(() => items.reduce((s, it) => s + (it.total || 0), 0), [items]);

  function genId() {
    return "INV-" + Date.now().toString(36).toUpperCase();
  }

  function round2(n: number) {
    return Math.round(n * 100) / 100;
  }

  const addLine = () => {
    setItems((s) => [...s, { id: uuidv4(), description: "", qty: 1, unitPrice: 0, total: 0 }]);
  };

  const removeLine = (id: string) => {
    setItems((s) => s.filter((it) => it.id !== id));
  };

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

  const onSelectSuggestion = (desc: string, price: number) => {
    if (activeItemId) {
      updateLine(activeItemId, { description: desc, unitPrice: price });
      setActiveItemId(null);
      setModalVisible(false);
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

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 12 }}>
        <Text style={styles.label}>Client Name</Text>
        <TextInput style={styles.input} value={clientName} onChangeText={setClientName} />

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
              }}
            >
              <Text>{it.description || "Select / Type description"}</Text>
            </TouchableOpacity>
            <TextInput
              placeholder="Qty"
              keyboardType="numeric"
              style={[styles.input, { width: 70, marginLeft: 8 }]}
              value={String(it.qty)}
              onChangeText={(t) => updateLine(it.id, { qty: parseFloat(t) || 0 })}
            />
            <TextInput
              placeholder="Unit"
              keyboardType="numeric"
              style={[styles.input, { width: 100, marginLeft: 8 }]}
              value={String(it.unitPrice)}
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
          <Picker selectedValue={status} onValueChange={(v) => setStatus(v as any)}>
            <Picker.Item label="Received" value="Received" />
            <Picker.Item label="Pending" value="Pending" />
          </Picker>
        </View>

        <View style={styles.row}>
          <Text style={styles.grandLabel}>Grand Total</Text>
          <Text style={styles.grandValue}>{formatCurrency(grandTotal)}</Text>
        </View>

        <View style={{ height: 12 }} />

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Button title="Cancel" onPress={() => nav.navigate("Home")} color="#999" />
          <Button title="Print Invoice" onPress={onPrint} />
          <Button title={editing ? "Update" : "Save"} onPress={onSave} />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Suggestion Modal */}
      {/* Suggestion Modal */}
<Modal visible={modalVisible} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <Text style={styles.modalTitle}>Select Item</Text>

      {/* Search input */}
      <TextInput
        style={[styles.input, { marginBottom: 8 }]}
        placeholder="Search or type new item"
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Filtered list */}
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
            <Text style={{ fontWeight: "600" }}>{item.description}</Text>
            <Text style={{ color: "#555" }}>{formatCurrency(item.unitPrice)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <TouchableOpacity
            style={[styles.modalItem, { justifyContent: "center" }]}
            onPress={() => {
              // Add new item if it doesn't exist
              if (activeItemId) {
                updateLine(activeItemId, { description: searchText, unitPrice: 0 });
                setActiveItemId(null);
                setModalVisible(false);
                setSearchText("");
              }
            }}
          >
            <Text style={{ textAlign: "center", color: "#999" }}>
              {searchText ? `Add "${searchText}"` : "No items found"}
            </Text>
          </TouchableOpacity>
        }
      />

      <Button
        title="Close"
        onPress={() => {
          setModalVisible(false);
          setSearchText("");
        }}
      />
    </View>
  </View>
</Modal>

    </View>
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
  container: { flex: 1, backgroundColor: "#fff" },
  label: { fontSize: 13, color: "#222", marginBottom: 6 },
  input: {
    backgroundColor: "#f7f7f8",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  line: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  addBtn: { padding: 10, alignItems: "center", marginVertical: 8, backgroundColor: "#fff" },
  pickerWrap: { backgroundColor: "#f7f7f8", borderRadius: 8, overflow: "hidden", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  grandLabel: { fontSize: 16, fontWeight: "600" },
  grandValue: { fontSize: 16, fontWeight: "700" },

  // ✅ Add these to fix the missing style errors
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    width: "85%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  itemRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
    modalItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

});

export default InvoiceFormScreen;