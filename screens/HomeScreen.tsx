import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    View
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

  // Filter by month & year
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("All");

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      const d = new Date(inv.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      set.add(key);
    });
    return ["All", ...Array.from(set).sort((a, b) => (a < b ? 1 : -1))];
  }, [invoices]);

  const filtered = useMemo(() => {
    if (selectedMonthYear === "All") return invoices;
    const [yearStr, monthStr] = selectedMonthYear.split("-");
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10) - 1;
    return invoices.filter((inv) => {
      const d = new Date(inv.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [invoices, selectedMonthYear]);

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
      <View style={styles.header}>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={selectedMonthYear}
            onValueChange={(v) => setSelectedMonthYear(String(v))}
            mode="dropdown"
          >
            {monthOptions.map((m) => (
              <Picker.Item label={m === "All" ? "All" : humanizeMonth(m)} value={m} key={m} />
            ))}
          </Picker>
        </View>
        <View style={styles.totalWrap}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <InvoiceItem invoice={item} onPress={onItemPress} onLongPress={onItemLong} />
        )}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={<Text style={styles.empty}>No invoices yet. Create one!</Text>}
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
  pickerWrap: { flex: 1, backgroundColor: "#fff", borderRadius: 8, marginRight: 8, overflow: "hidden" },
  totalWrap: { width: 140, alignItems: "flex-end" },
  totalLabel: { color: "#666", fontSize: 12 },
  totalValue: { fontWeight: "700", fontSize: 16 },
  empty: { textAlign: "center", marginTop: 24, color: "#666" },
});

export default HomeScreen;
