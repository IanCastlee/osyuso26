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
import ActiveShop from "./admin_components/pages/ActiveShop";
import NotActiveShop from "./admin_components/pages/NotActiveShop";
import VerifiedAccount from "./admin_components/pages/VerifiedAccount";
import NotVerifiedAccount from "./admin_components/pages/NotVerifiedAccount";
import NotActiveAccount from "./admin_components/pages/NotActiveAccount";
import MainCategory from "./admin_components/pages/MainCategory";
import SubCategory from "./admin_components/pages/SubCategory";
import TodaysSales from "./admin_components/pages/TodaysSales";
import SalesLog from "./admin_components/pages/SalesLog";
import Payout from "./admin_components/pages/Payout";
import PayoutLog from "./admin_components/pages/PayoutLog";
import Products from "./admin_components/pages/Products";
import SpecialOffer from "./admin_components/pages/SpecialOffer";
import NewArrival from "./admin_components/pages/NewArrival";
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
  ].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {/* HEADER */}
      {!hideLayout && <CustomerHeader />}

      {/* MAIN CONTENT */}
      <main className="flex-1">
        <Routes>
          <Route index element={<CustomerHomePage />} />
          <Route path="categories/:categoryId" element={<Categories />} />{" "}
          <Route path="all-categories" element={<AllCategories />} />
          <Route path="market/:id" element={<Market />} />{" "}
          <Route path="all-markets" element={<AllMarkets />} />
          <Route path="reserve/:productId" element={<ReserveDetails />} />
          <Route path="cart" element={<Cart />} />
          <Route path="notification" element={<Notifcation />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="about" element={<AboutCostumer />} />
          {/* special offer */}
          <Route path="all-special-offers" element={<AllSpecialOffer />} />
          <Route path="checkout" element={<CheckoutSummary />} />
          <Route path="payment-failed" element={<PaymentFailed />} />
          <Route path="payment-success" element={<PaymentSuccess />} />
          <Route path="orders" element={<Orders />} />
          {/* auths */}
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="verify-email-sent" element={<VerifyEmailSent />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="signup-seller" element={<SignUpSeller />} />
          <Route path="reset-password" element={<ResetPassword />} />
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
          <Route path="/featured-promotion" element={<FeaturedPromotion />} />
          <Route
            path="/featured-promotion-logs"
            element={<FeaturedPromotionLogs />}
          />
          <Route path="/reserved" element={<Reserved />} />
          <Route path="/reservation-log" element={<ReservationHistory />} />
          <Route path="about" element={<AboutVendor />} />
          <Route path="market-settings" element={<MarketSetting />} />
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

          {/* shop */}
          <Route path="active-shop" element={<ActiveShop />} />
          <Route path="not-active-shop" element={<NotActiveShop />} />

          {/* customer accnt */}
          <Route path="verified-account" element={<VerifiedAccount />} />
          <Route path="not-verified-account" element={<NotVerifiedAccount />} />
          <Route path="not-active-account" element={<NotActiveAccount />} />

          {/* categories */}
          <Route path="main-categories" element={<MainCategory />} />
          <Route path="sub-categories" element={<SubCategory />} />

          {/* sales */}
          <Route path="todays-sales" element={<TodaysSales />} />
          <Route path="sales-log" element={<SalesLog />} />

          {/* payout */}
          <Route path="payout" element={<Payout />} />
          <Route path="payout-log" element={<PayoutLog />} />

          {/* products */}
          <Route path="products" element={<Products />} />
          <Route path="special-offer" element={<SpecialOffer />} />
          <Route path="new-arrival" element={<NewArrival />} />
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
