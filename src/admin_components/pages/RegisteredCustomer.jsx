import React from "react";
import CustomerDirectory from "../organisms/CustomerDirectory";

function RegisteredCustomer() {
  return (
    <CustomerDirectory
      type="registered"
      title="Registered Customers"
      description="Manage verified customer accounts and account restrictions."
    />
  );
}

export default RegisteredCustomer;
