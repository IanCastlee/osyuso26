import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import CustomerHomePage from "./customer_components/pages/CustomerHomePage";
import VendorHomePage from "./vendor_components/pages/VendorHomePage";
import AboutVendor from "./vendor_components/pages/AboutVendor";
import AboutCostumer from "./customer_components/pages/AboutCostumer";
import CustomerHeader from "./customer_components/organisms/CustomerHeader";
import CustomerFooter from "./customer_components/organisms/CustomerFooter";
import Categories from "./customer_components/pages/Categories";
import Market from "./customer_components/pages/Market";
import ReserveDetails from "./customer_components/pages/ReserveDetails";
import Cart from "./customer_components/pages/Cart";
import Notifcation from "./customer_components/pages/Notifcation";
import FAQ from "./customer_components/pages/FAQ";
import SignIn from "./auth_pages/SignIn";
import SignUp from "./auth_pages/SignUp";
import SignUpSeller from "./auth_pages/SignUpSeller";

const CustomerLayout = () => {
  const location = useLocation();

  const hideLayout = [
    "/signin",
    "/signup",
    "/faq",
    "/signup-seller",
    "/about",
  ].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {/* HEADER */}
      {!hideLayout && <CustomerHeader />}

      {/* MAIN CONTENT */}
      <main className="flex-1">
        <Routes>
          <Route index element={<CustomerHomePage />} />
          <Route path="categories" element={<Categories />} />
          <Route path="market" element={<Market />} />
          <Route path="reserve" element={<ReserveDetails />} />
          <Route path="cart" element={<Cart />} />
          <Route path="notification" element={<Notifcation />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="about" element={<AboutCostumer />} />

          {/* auths */}
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="signup-seller" element={<SignUpSeller />} />
        </Routes>
      </main>

      {/* FOOTER */}
      {!hideLayout && <CustomerFooter />}
    </div>
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
