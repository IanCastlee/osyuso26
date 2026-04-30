import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import CustomerHomePage from "./customer_components/pages/CustomerHomePage";
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
import AllCategories from "./customer_components/pages/AllCategories";
import AllMarkets from "./customer_components/pages/AllMarkets";
import SidebarVendor from "./vendor_components/organisms/SidebarVendor";
import DashboardVendor from "./vendor_components/pages/DashboardVendor";
import ProductsVendor from "./vendor_components/pages/ProductsVendor";
import DashboardAdmin from "./admin_components/pages/DashboardAdmin";
import SidebarAdmin from "./admin_components/organisms/SidebarAdmin";
import ActiveVendor from "./admin_components/pages/ActiveVendor";

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
          <Route path="all-categories" element={<AllCategories />} />
          <Route path="market" element={<Market />} />
          <Route path="all-markets" element={<AllMarkets />} />
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
    <div className="w-full h-screen flex overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-[260px] h-full bg-secondary text-white flex flex-col">
        <SidebarVendor />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 h-full overflow-y-auto bg-gray-100">
        <Routes>
          <Route index element={<DashboardVendor />} />
          <Route path="/vendor-products" element={<ProductsVendor />} />
          <Route path="about" element={<AboutVendor />} />
        </Routes>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  return (
    <div className="w-full h-screen flex overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-[260px] h-full bg-secondary text-white flex flex-col">
        <SidebarAdmin />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 h-full overflow-y-auto bg-gray-100">
        <Routes>
          <Route index element={<DashboardAdmin />} />

          {/* USERS */}
          <Route path="active-vendors" element={<ActiveVendor />} />
        </Routes>
      </div>
    </div>
  );
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
