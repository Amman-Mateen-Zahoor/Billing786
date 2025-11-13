import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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

  // Toggle invoice status
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

  // Share invoice as PDF
  const sharePDF = async () => {
    const html = invoiceToHTML(invoice);
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Failed to generate or share PDF");
    }
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

          <TouchableOpacity style={styles.shareBadge} onPress={sharePDF}>
            <Text style={styles.shareText}>Share PDF</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.invId}>{invoice.id}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Convert invoice data to HTML for PDF
const invoiceToHTML = (inv: Invoice) => {
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
        <tbody>${rows}</tbody>
      </table>
      <h3 style="text-align:right">Grand Total: ${inv.grandTotal.toFixed(2)}</h3>
    </body>
    </html>`;
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
  status: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  received: { backgroundColor: "green" },
  pending: { backgroundColor: "red" },
  shareBadge: {
    backgroundColor: "#0b74de",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shareText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});

export default InvoiceItem;
