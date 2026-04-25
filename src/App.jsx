import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CustomerHomePage from "./customer_components/pages/CustomerHomePage";
import VendorHomePage from "./vendor_components/pages/VendorHomePage";
import AboutVendor from "./vendor_components/pages/AboutVendor";
import AboutCostumer from "./customer_components/pages/AboutCostumer";
import CustomerHeader from "./customer_components/organisms/CustomerHeader";
import CustomerFooter from "./customer_components/organisms/CustomerFooter";

const CustomerLayout = () => {
  return (
    <>
      <CustomerHeader />
      <Routes>
        <Route index element={<CustomerHomePage />} />
        <Route path="about" element={<AboutCostumer />} />
      </Routes>
      <CustomerFooter />
    </>
  );
};

const VendorLayout = () => {
  return (
    <Routes>
      <Route index element={<VendorHomePage />} />
      <Route path="about" element={<AboutVendor />} />
    </Routes>
  );
};

const AdminLayout = () => {
  return <div>AdminLayout</div>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<CustomerLayout />} />
        <Route path="/vendor/*" element={<VendorLayout />} />
        <Route path="/admin/*" element={<AdminLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
