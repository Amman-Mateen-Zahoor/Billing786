// import { NavigationContainer } from "@react-navigation/native";
// import { createStackNavigator } from "@react-navigation/stack";
// import React, { useEffect } from "react";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import { loadInvoices } from "././store/invoiceStore";
// import HomeScreen from "./screens/HomeScreen";
// import InvoiceFormScreen from "./screens/InvoiceFormScreen";
// import ViewInvoiceScreen from "./screens/ViewInvoiceScreen";
// export type RootStackParamList = {
//   Home: undefined;
//   CreateEdit: { invoiceId?: string } | undefined;
//   View: { invoiceId: string };
// };

// const Stack = createStackNavigator<RootStackParamList>();

// export default function App() {
//   useEffect(() => {
//     // hydrate store from AsyncStorage on app start
//     loadInvoices();
//   }, []);

//   return (
//     <SafeAreaProvider>
//       <NavigationContainer>
//         <Stack.Navigator initialRouteName="Home">
//           <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Invoices" }} />
//           <Stack.Screen
//             name="CreateEdit"
//             component={InvoiceFormScreen}
//             options={({ route }) => ({ title: route?.params?.invoiceId ? "Edit Invoice" : "Create Invoice" })}
//           />
//           <Stack.Screen name="View" component={ViewInvoiceScreen} options={{ title: "View Invoice" }} />
//         </Stack.Navigator>
//       </NavigationContainer>
//     </SafeAreaProvider>
//   );
// }

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "./screens/HomeScreen";
import InvoiceFormScreen from "./screens/InvoiceFormScreen";
import ViewInvoiceScreen from "./screens/ViewInvoiceScreen";
import { loadInvoices } from "./store/invoiceStore"; // Import the named export

export type RootStackParamList = {
  Home: undefined;
  CreateEdit: { invoiceId?: string } | undefined;
  View: { invoiceId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // Load invoices on app start
    loadInvoices();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Invoices" }} />
          <Stack.Screen
            name="CreateEdit"
            component={InvoiceFormScreen}
            options={({ route }) => ({ title: route?.params?.invoiceId ? "Edit Invoice" : "Create Invoice" })}
          />
          <Stack.Screen name="View" component={ViewInvoiceScreen} options={{ title: "View Invoice" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}