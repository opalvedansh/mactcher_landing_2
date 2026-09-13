import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BrandsDetailPage from "./src/screens/BrandsDetailPage";
const Stack = createNativeStackNavigator();
const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen key={"BrandsDetailPage"} name={"BrandsDetailPage"} component={BrandsDetailPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
export default App;