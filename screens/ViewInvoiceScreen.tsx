import {
    NavigationProp // Add this import
    ,
    RouteProp,
    useNavigation,
    useRoute
} from "@react-navigation/native";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RootStackParamList } from "../App";
import useInvoiceStore from "../store/invoiceStore";
import { formatCurrency, formatDate } from "../utils/format";

type Props = RouteProp<RootStackParamList, "View">;

const ViewInvoiceScreen: React.FC = () => {
  const route = useRoute<Props>();
  // Add proper typing for navigation
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const invoice = useInvoiceStore((s) => s.invoices.find((i) => i.id === route.params.invoiceId));

  if (!invoice) {
    return (
      <View style={styles.container}>
        <Text>Invoice not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 12 }}>
      <View style={styles.row}>
        <Text style={styles.title}>Invoice: {invoice.id}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("CreateEdit", { invoiceId: invoice.id })}>
          <Text style={{ color: "#0b74de" }}>Edit</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.meta}>Client: {invoice.clientName}</Text>
      <Text style={styles.meta}>Date: {formatDate(invoice.date)}</Text>
      <Text style={styles.meta}>Status: {invoice.status}</Text>

      <View style={{ height: 12 }} />

      {invoice.items.map((it) => (
        <View key={it.id} style={styles.item}>
          <Text style={{ fontWeight: "600" }}>{it.description}</Text>
          <Text>
            {it.qty} x {it.unitPrice.toFixed(2)} = {formatCurrency(it.total)}
          </Text>
        </View>
      ))}

      <View style={{ height: 16 }} />
      <Text style={styles.total}>Grand Total: {formatCurrency(invoice.grandTotal)}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "700" },
  meta: { fontSize: 14, marginTop: 6, color: "#333" },
  item: { padding: 10, borderRadius: 8, backgroundColor: "#f7f7f7", marginVertical: 6 },
  total: { fontSize: 18, fontWeight: "800", textAlign: "right", marginRight: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});

export default ViewInvoiceScreen;