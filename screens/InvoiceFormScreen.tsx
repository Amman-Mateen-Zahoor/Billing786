// // Fix for uuid in React Native
// import 'react-native-get-random-values';
// import { v4 as uuidv4 } from 'uuid';

// import DateTimePicker from "@react-native-community/datetimepicker";
// import { Picker } from "@react-native-picker/picker";
// import {
//   NavigationProp,
//   RouteProp,
//   useNavigation,
//   useRoute,
// } from "@react-navigation/native";
// import * as Print from "expo-print";
// import * as Sharing from "expo-sharing";
// import React, { useMemo, useState } from "react";
// import {
//   Alert,
//   Button,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";

// import { RootStackParamList } from "../App";
// import useInvoiceStore from "../store/invoiceStore";
// import { Invoice, LineItem } from "../types";
// import { formatCurrency } from "../utils/format";

// type RouteProps = RouteProp<RootStackParamList, "CreateEdit">;

// const InvoiceFormScreen: React.FC = () => {
//   // Add proper typing for navigation
//   const nav = useNavigation<NavigationProp<RootStackParamList>>();
//   const route = useRoute<RouteProps>();
//   const invoiceId = route.params?.invoiceId;
//   const invoices = useInvoiceStore((s) => s.invoices);
//   const addInvoice = useInvoiceStore((s) => s.addInvoice);
//   const updateInvoice = useInvoiceStore((s) => s.updateInvoice);

//   const editing = Boolean(invoiceId);
//   const existing = invoices.find((i) => i.id === invoiceId);

//   const [clientName, setClientName] = useState(existing?.clientName ?? "");
//   const [date, setDate] = useState<Date>(existing ? new Date(existing.date) : new Date());
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [id, setId] = useState(existing?.id ?? genId());
//   const [items, setItems] = useState<LineItem[]>(
//     existing?.items ?? [{ id: uuidv4(), description: "", qty: 1, unitPrice: 0, total: 0 }]
//   );
//   const [status, setStatus] = useState<Invoice["status"]>(existing?.status ?? "Pending");

//   // useEffect(() => {
//   //   recalcItemsTotals();
//   // }, [items]);

//   const grandTotal = useMemo(() => items.reduce((s, it) => s + (it.total || 0), 0), [items]);

//   function genId() {
//     return "INV-" + Date.now().toString(36).toUpperCase();
//   }

//   const recalcItemsTotals = () => {
//     setItems((prev) =>
//       prev.map((it) => ({ ...it, total: round2((it.qty || 0) * (it.unitPrice || 0)) }))
//     );
//   };

//   function round2(n: number) {
//     return Math.round(n * 100) / 100;
//   }

//   const addLine = () => {
//     setItems((s) => [...s, { id: uuidv4(), description: "", qty: 1, unitPrice: 0, total: 0 }]);
//   };

//   const removeLine = (id: string) => {
//     setItems((s) => s.filter((it) => it.id !== id));
//   };

//   const updateLine = (id: string, patch: Partial<LineItem>) => {
//     setItems((s) => s.map((it) => (it.id === id ? { ...it, ...patch, total: round2((patch.qty ?? it.qty) * (patch.unitPrice ?? it.unitPrice)) } : it)));
//   };

//   const onSave = async () => {
//     if (!clientName.trim()) {
//       Alert.alert("Validation", "Client name is required");
//       return;
//     }
//     if (!id.trim()) {
//       Alert.alert("Validation", "Invoice ID is required");
//       return;
//     }
//     // unique check if creating or if editing and changed id to one that already exists
//     const duplicate = invoices.find((inv) => inv.id === id && inv.id !== (existing?.id ?? ""));
//     if (duplicate) {
//       Alert.alert("Validation", "Invoice ID already exists. Please enter a unique one.");
//       return;
//     }
//     const invoice: Invoice = {
//       id,
//       clientName,
//       date: date.toISOString(),
//       items,
//       grandTotal,
//       status,
//       createdAt: existing?.createdAt ?? new Date().toISOString(),
//     };

//     if (editing) {
//       const res = await updateInvoice(invoice);
//       if (!res.ok) {
//         Alert.alert("Error", res.error ?? "Failed to update");
//         return;
//       }
//     } else {
//       const res = await addInvoice(invoice);
//       if (!res.ok) {
//         Alert.alert("Error", res.error ?? "Failed to save");
//         return;
//       }
//     }
//     nav.navigate("Home"); // This should now work without errors
//   };

//   const onPrint = async () => {
//     const html = invoiceToHTML({
//       id,
//       clientName,
//       date: date.toISOString(),
//       items,
//       grandTotal,
//       status,
//     });
//     try {
//       const { uri } = await Print.printToFileAsync({ html });
//       // share
//       if (Platform.OS === "ios" || Platform.OS === "android") {
//         await Sharing.shareAsync(uri);
//       } else {
//         Alert.alert("Printed", `PDF generated at ${uri}`);
//       }
//     } catch (e) {
//       console.warn(e);
//       Alert.alert("Error", "Failed to generate PDF");
//     }
//   };

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={{ padding: 12 }}>
//       <Text style={styles.label}>Client Name</Text>
//       <TextInput style={styles.input} placeholderTextColor="black" placeholder='Enter Client Name' value={clientName} onChangeText={setClientName} />

//       <Text style={styles.label}>Date</Text>
//       <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
//         <Text>{date.toDateString()}</Text>
//       </TouchableOpacity>
//       {showDatePicker && (
//         <DateTimePicker
//           value={date}
//           mode="date"
//           display="default"
//           onChange={(_, d) => {
//             setShowDatePicker(false);
//             if (d) setDate(d);
//           }}
//         />
//       )}

//       <Text style={styles.label}>Invoice ID</Text>
//       <TextInput style={styles.input} value={id} onChangeText={setId} />

//       <Text style={[styles.label, { marginTop: 12 }]}>Items</Text>

//       {items.map((it, idx) => (
//         <View key={it.id} style={styles.line}>
//           <TextInput
//             placeholder="Description"
//             placeholderTextColor="black" 
//             style={[styles.input, { flex: 1 }]}
//             value={it.description}
//             onChangeText={(t) => updateLine(it.id, { description: t })}
//           />
//           <TextInput
//             placeholder="Qty"
//             keyboardType="numeric"
//             style={[styles.input, { width: 70, marginLeft: 8 }]}
//             value={String(it.qty)}
//             onChangeText={(t) => updateLine(it.id, { qty: parseFloat(t) || 0 })}
//           />
//           <TextInput
//             placeholder="Unit"
//             keyboardType="numeric"
//             style={[styles.input, { width: 100, marginLeft: 8 }]}
//             value={String(it.unitPrice)}
//             onChangeText={(t) => updateLine(it.id, { unitPrice: parseFloat(t) || 0 })}
//           />
//           <View style={{ justifyContent: "center", marginLeft: 8 }}>
//             <Text style={{ fontWeight: "700" }}>{formatCurrency(it.total)}</Text>
//             <TouchableOpacity onPress={() => removeLine(it.id)}>
//               <Text style={{ color: "red", marginTop: 2 }}>Remove</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       ))}

//       <TouchableOpacity style={styles.addBtn} onPress={addLine}>
//         <Text style={{ color: "#0b74de" }}>+ Add Item</Text>
//       </TouchableOpacity>

//       <Text style={[styles.label, { marginTop: 12 }]}>Status</Text>
//       <View style={styles.pickerWrap}>
//         <Picker selectedValue={status} onValueChange={(v) => setStatus(v as any)}>
//           <Picker.Item color='black' label="Received" value="Received" />
//           <Picker.Item color='black' label="Pending" value="Pending" />
//         </Picker>
//       </View>

//       <View style={styles.row}>
//         <Text style={styles.grandLabel}>Grand Total</Text>
//         <Text style={styles.grandValue}>{formatCurrency(grandTotal)}</Text>
//       </View>

//       <View style={{ height: 12 }} />

//       <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
//         <Button title="Cancel" onPress={() => nav.navigate("Home")} color="#999" />
//         <Button title="Print Invoice" onPress={onPrint} />
//         <Button title={editing ? "Update" : "Save"} onPress={onSave} />
//       </View>

//       <View style={{ height: 60 }} />
//     </ScrollView>
//   );
// };

// const invoiceToHTML = (inv: {
//   id: string;
//   clientName: string;
//   date: string;
//   items: LineItem[];
//   grandTotal: number;
//   status: string;
// }) => {
//   const rows = inv.items
//     .map(
//       (it) => `<tr>
//     <td style="padding:6px;border:1px solid #ddd">${it.description}</td>
//     <td style="padding:6px;border:1px solid #ddd;text-align:center">${it.qty}</td>
//     <td style="padding:6px;border:1px solid #ddd;text-align:right">${it.unitPrice.toFixed(2)}</td>
//     <td style="padding:6px;border:1px solid #ddd;text-align:right">${it.total.toFixed(2)}</td>
//   </tr>`
//     )
//     .join("");
//   return `<!doctype html>
//   <html>
//   <head><meta charset="utf-8"><title>Invoice ${inv.id}</title></head>
//   <body style="font-family: Arial, Helvetica, sans-serif; padding:20px;">
//     <h2>Invoice ${inv.id}</h2>
//     <div><strong>Client:</strong> ${inv.clientName}</div>
//     <div><strong>Date:</strong> ${new Date(inv.date).toDateString()}</div>
//     <div><strong>Status:</strong> ${inv.status}</div>
//     <br/>
//     <table style="border-collapse: collapse; width: 100%;">
//       <thead>
//         <tr>
//           <th style="padding:6px;border:1px solid #ddd;text-align:left">Description</th>
//           <th style="padding:6px;border:1px solid #ddd">Qty</th>
//           <th style="padding:6px;border:1px solid #ddd;text-align:right">Unit</th>
//           <th style="padding:6px;border:1px solid #ddd;text-align:right">Total</th>
//         </tr>
//       </thead>
//       <tbody>
//         ${rows}
//       </tbody>
//     </table>
//     <h3 style="text-align:right">Grand Total: ${inv.grandTotal.toFixed(2)}</h3>
//   </body>
//   </html>`;
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   label: { fontSize: 13, color: "#222", marginBottom: 6 },
//   input: {
//     backgroundColor: "#f7f7f8",
//     borderRadius: 8,
//     padding: 10,
//     fontSize: 14,
//     marginBottom: 8,
//   },
//   line: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
//   addBtn: { padding: 10, alignItems: "center", marginVertical: 8, backgroundColor: "#fff" },
//   pickerWrap: { backgroundColor: "#f7f7f8", borderRadius: 8, overflow: "hidden", marginBottom: 8 },
//   row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
//   grandLabel: { fontSize: 16, fontWeight: "600" },
//   grandValue: { fontSize: 16, fontWeight: "700" },
// });

// export default InvoiceFormScreen;

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

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
import { Invoice, LineItem, PreviousItem } from "../types";
import { formatCurrency } from "../utils/format";

type RouteProps = RouteProp<RootStackParamList, "CreateEdit">;

const InvoiceFormScreen: React.FC = () => {
  const nav = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProps>();
  const invoiceId = route.params?.invoiceId;
  
  const invoices = useInvoiceStore((s) => s.invoices);
  const addInvoice = useInvoiceStore((s) => s.addInvoice);
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice);
  const getSuggestions = useInvoiceStore((s) => s.getSuggestions);
  const addToPreviousItems = useInvoiceStore((s) => s.addToPreviousItems);

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
  
  // Suggestions state
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [currentFocusedInput, setCurrentFocusedInput] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PreviousItem[]>([]);
  const [searchText, setSearchText] = useState("");

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
    setItems((s) => s.map((it) => (it.id === id ? { ...it, ...patch, total: round2((patch.qty ?? it.qty) * (patch.unitPrice ?? it.unitPrice)) } : it)));
  };

  // Handle description input focus - show suggestions
  const handleDescriptionFocus = (itemId: string, currentDescription: string) => {
    setCurrentFocusedInput(itemId);
    setSearchText(currentDescription);
    setSuggestions(getSuggestions(currentDescription));
    setSuggestionsVisible(true);
  };

  // Handle description input change - update suggestions
  const handleDescriptionChange = (itemId: string, text: string) => {
    updateLine(itemId, { description: text });
    setSearchText(text);
    setSuggestions(getSuggestions(text));
    setSuggestionsVisible(true);
  };

  // Select a suggestion and autofill the fields
  const selectSuggestion = (suggestion: PreviousItem) => {
    if (currentFocusedInput) {
      updateLine(currentFocusedInput, {
        description: suggestion.description,
        unitPrice: suggestion.unitPrice,
      });
    }
    setSuggestionsVisible(false);
    setCurrentFocusedInput(null);
    setSearchText("");
  };

  // Manually add item to previous items
  const handleAddItemToSuggestions = () => {
    if (currentFocusedInput && searchText.trim()) {
      const currentItem = items.find(item => item.id === currentFocusedInput);
      if (currentItem) {
        addToPreviousItems(searchText, currentItem.unitPrice || 0);
        setSuggestions(getSuggestions(searchText));
      }
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

    if (editing) {
      const res = await updateInvoice(invoice);
      if (!res.ok) {
        Alert.alert("Error", res.error ?? "Failed to update");
        return;
      }
    } else {
      const res = await addInvoice(invoice);
      if (!res.ok) {
        Alert.alert("Error", res.error ?? "Failed to save");
        return;
      }
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

  const renderSuggestionItem = ({ item }: { item: PreviousItem }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => selectSuggestion(item)}
    >
      <Text style={styles.suggestionText}>{item.description}</Text>
      <Text style={styles.suggestionPrice}>{formatCurrency(item.unitPrice)}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 12 }}>
      <Text style={styles.label}>Client Name</Text>
      <TextInput 
        style={styles.input} 
        placeholderTextColor="#666" 
        placeholder='Enter Client Name' 
        value={clientName} 
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
          <View style={{ flex: 1 }}>
            <TextInput
              placeholder="Description"
              placeholderTextColor="#666" 
              style={[styles.input, { flex: 1 }]}
              value={it.description}
              onChangeText={(t) => handleDescriptionChange(it.id, t)}
              onFocus={() => handleDescriptionFocus(it.id, it.description)}
            />
          </View>
          <TextInput
            placeholder="Qty"
            placeholderTextColor="#666"
            keyboardType="numeric"
            style={[styles.input, { width: 70, marginLeft: 8 }]}
            value={String(it.qty)}
            onChangeText={(t) => updateLine(it.id, { qty: parseFloat(t) || 0 })}
          />
          <TextInput
            placeholder="Unit Price"
            placeholderTextColor="#666"
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
          <Picker.Item color='black' label="Received" value="Received" />
          <Picker.Item color='black' label="Pending" value="Pending" />
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

      {/* Suggestions Modal */}
      <Modal
        visible={suggestionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSuggestionsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.suggestionsTitle}>Select Item</Text>
              <TouchableOpacity onPress={() => setSuggestionsVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            
            {/* Search input in modal */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                placeholderTextColor="#666"
                value={searchText}
                onChangeText={(text) => {
                  setSearchText(text);
                  setSuggestions(getSuggestions(text));
                }}
              />
            </View>

            <FlatList
              data={suggestions}
              renderItem={renderSuggestionItem}
              keyExtractor={(item) => item.id}
              style={styles.suggestionsList}
              ListEmptyComponent={
                <View style={styles.emptySuggestions}>
                  <Text style={styles.emptyText}>No items found</Text>
                  {searchText.trim() && (
                    <TouchableOpacity 
                      style={styles.addSuggestionButton}
                      onPress={handleAddItemToSuggestions}
                    >
                      <Text style={styles.addSuggestionText}>Add "{searchText}" as new item</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <View style={{ height: 60 }} />
    </ScrollView>
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
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  line: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  addBtn: { 
    padding: 10, 
    alignItems: "center", 
    marginVertical: 8, 
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0b74de",
    borderStyle: 'dashed',
  },
  pickerWrap: { 
    backgroundColor: "#f7f7f8", 
    borderRadius: 8, 
    overflow: "hidden", 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  grandLabel: { fontSize: 16, fontWeight: "600" },
  grandValue: { fontSize: 16, fontWeight: "700" },
  // Suggestions styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '60%',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    color: '#0b74de',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    backgroundColor: '#f7f7f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 16,
    flex: 1,
  },
  suggestionPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0b74de',
    marginLeft: 8,
  },
  emptySuggestions: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 12,
  },
  addSuggestionButton: {
    backgroundColor: '#0b74de',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addSuggestionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InvoiceFormScreen;