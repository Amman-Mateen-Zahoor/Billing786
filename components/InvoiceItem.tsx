import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import useInvoiceStore from "../store/invoiceStore";
import { Invoice } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

interface Props {
  invoice: Invoice;
  onPress: (invoice: Invoice) => void;
  onLongPress?: (invoice: Invoice) => void;
}

const InvoiceItem: React.FC<Props> = ({ invoice, onPress, onLongPress }) => {

  const statusStyle = invoice.status === "Received" ? styles.received : styles.pending;

 const updateInvoice = useInvoiceStore((s) => s.updateInvoice);

const toggleStatus = () => {
  const newStatus = invoice.status === "Received" ? "Pending" : "Received";
  Alert.alert(
    "Change Status",
    `Do you want to change status to "${newStatus}"?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: () =>
          updateInvoice({
            ...invoice,
            status: newStatus,
          }),
      },
    ]
  );
};
  return (
    <TouchableOpacity onPress={() => onPress(invoice)} onLongPress={() => onLongPress?.(invoice)}>
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.date}>{formatDate(invoice.date)}</Text>
          <Text style={styles.total}>{formatCurrency(invoice.grandTotal)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.client}>{invoice.clientName}</Text>
          <TouchableOpacity style={[styles.status, statusStyle]} onPress={toggleStatus}>
            <Text style={styles.statusText}>{invoice.status}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.invId}>{invoice.id}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 12,
    elevation: 1,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  date: { fontSize: 12, color: "#555" },
  total: { fontSize: 14, fontWeight: "700" },
  client: { fontSize: 16, fontWeight: "600", color: "#111" },
  invId: { fontSize: 12, color: "#777", marginTop: 6 },
  status: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  received: { backgroundColor: "green" },
  pending: { backgroundColor: "red" },
});

export default InvoiceItem;
