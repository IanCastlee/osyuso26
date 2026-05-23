import React from "react";
import CustomerDirectory from "../organisms/CustomerDirectory";

function UnregisteredCustomer() {
  return (
    <CustomerDirectory
      type="unregistered"
      title="Unregistered Customers"
      description="Manage unverified customer accounts and account restrictions."
    />
  );
}

export default UnregisteredCustomer;
