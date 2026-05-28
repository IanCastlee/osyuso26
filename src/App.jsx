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
import Reserved from "./vendor_components/pages/Reserved";
import ReservationHistory from "./vendor_components/pages/ReservationHistory";

import Products from "./admin_components/pages/Products";
import AllSpecialOffer from "./customer_components/pages/AllSpecialOffer";
import MarketSetting from "./vendor_components/pages/MarketSetting";
import ForgotPassword from "./auth_pages/ForgotPassword";
import ResetPassword from "./auth_pages/ResetPassword";
import VerifyEmailSent from "./auth_pages/VerifyEmailSent";
import FeaturedPromotion from "./vendor_components/pages/FeaturedPromotion";
import FeaturedPromotionLogs from "./vendor_components/pages/FeaturedPromotionLogs";
import CheckoutSummary from "./customer_components/pages/CheckoutSummary";
import PaymentSuccess from "./customer_components/pages/PaymentSuccess";
import PaymentFailed from "./customer_components/pages/PaymentFailed";
import Orders from "./customer_components/pages/Orders";
import Search from "./customer_components/pages/Search";
import PendingReservation from "./vendor_components/pages/PendingReservation";
import ArchiveVendorProducts from "./vendor_components/pages/ArchiveVendorProducts";
import VendorPayout from "./vendor_components/pages/VendorPayout";
import PayoutRequest from "./admin_components/pages/PayoutRequest";
import PayoutHistoryAdmin from "./admin_components/pages/PayoutHistoryAdmin";
import Vendors from "./admin_components/pages/Vendors";
import RegisteredCustomer from "./admin_components/pages/RegisteredCustomer";
import UnregisteredCustomer from "./admin_components/pages/UnregisteredCustomer";
import Contact from "./customer_components/pages/Contact";
import AllVendorNotifcation from "./vendor_components/pages/AllVendorNotifcation";
import AdminSetting from "./admin_components/pages/AdminSetting";
import AdminLegalPages from "./admin_components/pages/AdminLegalPages";
import TermsAndConditions from "./customer_components/pages/TermsAndConditions";
import PrivacyPolicy from "./customer_components/pages/PrivacyPolicy";
import AdminPromotionApprovals from "./admin_components/pages/AdminPromotionApprovals";
import FeaturedPromotions from "./customer_components/pages/FeaturedPromotions";
import PromotionPaymentSuccess from "./vendor_components/organisms/PromotionPaymentSuccess";
import PromotionPaymentFailed from "./vendor_components/organisms/PromotionPaymentFailed";
import HomeRedirect from "./HomeRedirect";
import OrdersFromVendor from "./admin_components/pages/OrdersFromVendor";
import MyAccount from "./customer_components/pages/MyAccount ";
import VendorPersonalAccount from "./vendor_components/pages/VendorPersonalAccount";
import AdminPersonalAccount from "./admin_components/pages/AdminPersonalAccount";

const CustomerLayout = () => {
  const location = useLocation();

  const hideLayout = [
    "/signin",
    "/signup",
    "/faq",
    "/signup-seller",
    "/about",
    "/verify-email-sent",
    "/forgot-password",
    "/reset-password",
    "/checkout",
    "/payment-success",
    "/payment-failed",
    "/search",
    "/contact",
    "/terms-and-conditions",
    "/privacy-policy",
  ].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {/* HEADER */}
      {!hideLayout && <CustomerHeader />}

      {/* MAIN CONTENT */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="categories/:categoryId" element={<Categories />} />{" "}
          <Route path="all-categories" element={<AllCategories />} />
          <Route path="market/:id" element={<Market />} />{" "}
          <Route path="all-markets" element={<AllMarkets />} />
          <Route path="reserve/:productId" element={<ReserveDetails />} />
          <Route path="cart" element={<Cart />} />
          <Route path="search" element={<Search />} />
          <Route path="notification" element={<Notifcation />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="about" element={<AboutCostumer />} />
          <Route path="contact" element={<Contact />} />
          {/* special offer */}
          <Route path="all-special-offers" element={<AllSpecialOffer />} />
          <Route path="checkout" element={<CheckoutSummary />} />
          <Route path="payment-failed" element={<PaymentFailed />} />
          <Route path="payment-success" element={<PaymentSuccess />} />
          <Route path="featured-promotions" element={<FeaturedPromotions />} />
          <Route path="orders" element={<Orders />} />
          {/* auths */}
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="verify-email-sent" element={<VerifyEmailSent />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="signup-seller" element={<SignUpSeller />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="/my-account" element={<MyAccount />} />
          {/* legal */}
          <Route
            path="/terms-and-conditions"
            element={<TermsAndConditions />}
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </main>

      {/* FOOTER */}
      {!hideLayout && <CustomerFooter />}
    </div>
  );
};

const VendorLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarVendor />

      <main className="min-w-0 flex-1 overflow-y-auto bg-gray-100">
        <Routes>
          <Route index element={<DashboardVendor />} />
          <Route path="/vendor-products" element={<ProductsVendor />} />
          <Route path="/featured-promotion" element={<FeaturedPromotion />} />
          <Route path="/vendor-payout" element={<VendorPayout />} />
          <Route
            path="/featured-promotion-logs"
            element={<FeaturedPromotionLogs />}
          />
          <Route path="/reserved" element={<Reserved />} />
          <Route path="/pending" element={<PendingReservation />} />
          <Route path="/reservation-log" element={<ReservationHistory />} />
          <Route path="/archive-products" element={<ArchiveVendorProducts />} />
          <Route path="about" element={<AboutVendor />} />
          <Route path="market-settings" element={<MarketSetting />} />
          <Route path="/my-account" element={<VendorPersonalAccount />} />
          <Route path="notifications" element={<AllVendorNotifcation />} />

          {/* payment redirect status */}
          <Route
            path="/promotions/payment-success"
            element={<PromotionPaymentSuccess />}
          />

          <Route
            path="/promotions/payment-failed"
            element={<PromotionPaymentFailed />}
          />
        </Routes>
      </main>
    </div>
  );
};

const AdminLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarAdmin />

      <main className="min-w-0 flex-1 overflow-y-auto bg-gray-100">
        <Routes>
          <Route index element={<DashboardAdmin />} />

          {/* customer accnt */}

          <Route path="vendors" element={<Vendors />} />
          <Route path="registered-customers" element={<RegisteredCustomer />} />
          <Route
            path="unregistered-customers"
            element={<UnregisteredCustomer />}
          />

          {/* orders */}
          <Route path="orders" element={<OrdersFromVendor />} />

          {/* setting */}
          <Route path="admin-settings" element={<AdminSetting />} />
          <Route path="admin-account" element={<AdminPersonalAccount />} />

          <Route path="/legal-pages" element={<AdminLegalPages />} />

          {/* payout */}
          <Route path="payout-request" element={<PayoutRequest />} />
          <Route path="payout-history" element={<PayoutHistoryAdmin />} />

          {/* products */}
          <Route path="products" element={<Products />} />

          {/* promotions */}
          <Route path="/promotions" element={<AdminPromotionApprovals />} />
        </Routes>
      </main>
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
