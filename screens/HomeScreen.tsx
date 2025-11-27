import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RootStackParamList } from "../App";
import FAB from "../components/FAB";
import InvoiceItem from "../components/InvoiceItem";
import useInvoiceStore, { loadInvoices } from "../store/invoiceStore";
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

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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

  // Load invoices on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await loadInvoices();
      } catch (error) {
        console.error("Failed to load invoices:", error);
        Alert.alert("Error", "Failed to load invoices");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Pull to refresh function
  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadInvoices();
    } catch (error) {
      console.error("Failed to refresh invoices:", error);
      Alert.alert("Error", "Failed to refresh invoices");
    } finally {
      setIsRefreshing(false);
    }
  };

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
          try {
            setIsLoading(true);
            await deleteInvoice(invoice.id);
          } catch (error) {
            console.error("Failed to delete invoice:", error);
            Alert.alert("Error", "Failed to delete invoice");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  // Loading state
  if (isLoading && invoices.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0b74de" />
        <Text style={styles.loadingText}>Loading Invoices...</Text>
      </View>
    );
  }

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
                color="#333"
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
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.emptyListContent
        ]}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyLoading}>
              <ActivityIndicator size="small" color="#0b74de" />
              <Text style={styles.emptyText}>Loading invoices...</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No invoices match your search/filter.</Text>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#0b74de"]}
            tintColor="#0b74de"
          />
        }
        ListHeaderComponent={
          isLoading && invoices.length > 0 ? (
            <View style={styles.refreshIndicator}>
              <ActivityIndicator size="small" color="#0b74de" />
              <Text style={styles.refreshText}>Updating...</Text>
            </View>
          ) : null
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
    color: "#333",
  },
  searchInput: {
    backgroundColor: "#fff",
    padding: 10,
    marginHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    color: "#333",
  },
  totalWrap: { paddingHorizontal: 12, alignItems: "flex-end", marginBottom: 8 },
  totalLabel: { color: "#666", fontSize: 12 },
  totalValue: { fontWeight: "700", fontSize: 16, color: "#333" },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyText: { 
    textAlign: "center", 
    marginTop: 24, 
    color: "#666",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f4f7",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  emptyLoading: {
    alignItems: "center",
    paddingVertical: 24,
  },
  refreshIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "rgba(11, 116, 222, 0.05)",
    marginHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  refreshText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#0b74de",
    fontWeight: "500",
  },
});

export default HomeScreen;