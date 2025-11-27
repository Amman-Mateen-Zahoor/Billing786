import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RootStackParamList } from "../App";
import FAB from "../components/FAB";
import InvoiceItem from "../components/InvoiceItem";
import useInvoiceStore from "../store/invoiceStore";
import { formatCurrency } from "../utils/format";

type HomeNavProp = StackNavigationProp<RootStackParamList, "Home">;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavProp>();
  const invoices = useInvoiceStore((s) => s.invoices);
  const deleteInvoice = useInvoiceStore((s) => s.deleteInvoice);

  // Filters
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchText, setSearchText] = useState<string>("");

  // Month options
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      const d = new Date(inv.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      set.add(key);
    });
    return ["All", ...Array.from(set).sort((a, b) => (a < b ? 1 : -1))];
  }, [invoices]);

  // Filtered invoices
  const filtered = useMemo(() => {
    let data = invoices;

    // Filter by month
    if (selectedMonthYear !== "All") {
      const [yearStr, monthStr] = selectedMonthYear.split("-");
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;
      data = data.filter((inv) => {
        const d = new Date(inv.date);
        return d.getFullYear() === y && d.getMonth() === m;
      });
    }

    // Filter by status
    if (statusFilter !== "All") {
      data = data.filter((inv) => inv.status === statusFilter);
    }

    // Search by client name or invoice ID
    if (searchText.trim()) {
      const text = searchText.toLowerCase();
      data = data.filter(
        (inv) =>
          inv.clientName.toLowerCase().includes(text) ||
          inv.id.toLowerCase().includes(text)
      );
    }

    return data;
  }, [invoices, selectedMonthYear, statusFilter, searchText]);

  const total = filtered.reduce((s, i) => s + (i.grandTotal || 0), 0);

  const onItemPress = (invoice: any) => {
    Alert.alert(invoice.clientName, "Choose action", [
      { text: "Open", onPress: () => navigation.navigate("View", { invoiceId: invoice.id }) },
      { text: "Edit", onPress: () => navigation.navigate("CreateEdit", { invoiceId: invoice.id }) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const onItemLong = (invoice: any) => {
    Alert.alert("Delete Invoice", "Are you sure you want to delete this invoice?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteInvoice(invoice.id);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header Filters */}
      <View style={styles.header}>
        {/* Month picker */}
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={selectedMonthYear}
            onValueChange={(v) => setSelectedMonthYear(String(v))}
            mode="dropdown"
            style={styles.picker}
            dropdownIconColor="#333"
          >
            {monthOptions.map((m) => (
              <Picker.Item
                label={m === "All" ? "All Months" : humanizeMonth(m)}
                value={m}
                key={m}
              />
            ))}
          </Picker>
        </View>

        {/* Status picker */}
        <View style={[styles.pickerWrap, { marginRight: 0 }]}>
          <Picker
            selectedValue={statusFilter}
            onValueChange={(v) => setStatusFilter(String(v))}
            mode="dropdown"
            style={styles.picker}
            dropdownIconColor="#333"
          >
            <Picker.Item label="All Status" value="All" color="#333" />
            <Picker.Item label="Received" value="Received" color="#333" />
            <Picker.Item label="Pending" value="Pending" color="#333" />
          </Picker>
        </View>
      </View>

      {/* Search input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by client name or invoice ID"
        value={searchText}
        onChangeText={setSearchText}
        placeholderTextColor="#999"
      />

      {/* Total */}
      <View style={styles.totalWrap}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>

      {/* Invoice list */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <InvoiceItem invoice={item} onPress={onItemPress} onLongPress={onItemLong} />
        )}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No invoices match your search/filter.</Text>
        }
      />

      <FAB onPress={() => navigation.navigate("CreateEdit")} />
    </View>
  );
};

function humanizeMonth(raw: string) {
  if (raw === "All") return "All";
  const [year, month] = raw.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return `${d.toLocaleString(undefined, { month: "long" })} ${year}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f4f7" },
  header: { flexDirection: "row", padding: 12, alignItems: "center" },
  pickerWrap: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginRight: 8,
    overflow: "hidden",
  },
  picker: {
    color: "#333", // Text color for the selected value
  },
  searchInput: {
    backgroundColor: "#fff",
    padding: 10,
    marginHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    color: "#333", // Text color for search input
  },
  totalWrap: { paddingHorizontal: 12, alignItems: "flex-end", marginBottom: 8 },
  totalLabel: { color: "#666", fontSize: 12 },
  totalValue: { fontWeight: "700", fontSize: 16, color: "#333" },
  empty: { textAlign: "center", marginTop: 24, color: "#666" },
});

export default HomeScreen;