import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";

import List "mo:core/List";


actor {
  type UtrStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type UtrRecord = {
    id : Nat;
    challanId : Nat;
    vehicleNumber : Text;
    amount : Nat;
    utr : Text;
    status : UtrStatus;
    submittedAt : Text;
  };

  type Status = {
    #pending;
    #paid;
  };

  type Challan = {
    id : Nat;
    vehicleNumber : Text;
    violationType : Text;
    fineAmount : Nat;
    discountedAmount : Nat;
    date : Text;
    location : Text;
    status : Status;
    officerName : Text;
  };

  type ViolationType = {
    id : Nat;
    name : Text;
    amount : Nat;
  };

  type ManualPaymentRecord = {
    id : Nat;
    vehicleNumber : Text;
    phone : Text;
    violations : Text;
    totalAmount : Nat;
    utr : Text;
    status : UtrStatus;
    submittedAt : Text;
  };

  let challans = Map.empty<Nat, Challan>();
  let utrRecords = Map.empty<Nat, UtrRecord>();
  let violationTypes = Map.empty<Nat, ViolationType>();
  let manualPaymentRecords = Map.empty<Nat, ManualPaymentRecord>();

  var nextId = 1;
  var nextUtrId = 1 : Nat;
  var nextViolationTypeId = 1 : Nat;
  var nextManualPaymentId = 1 : Nat;
  var upiId : ?Text = null;
  var supportNumber : ?Text = null;
  var apiKey : ?Text = null;
  var apiBaseUrl : ?Text = null;

  func applyDiscount(amount : Nat) : Nat {
    amount * 70 / 100;
  };

  public shared ({ caller }) func addChallan(vehicleNumber : Text, violationType : Text, fineAmount : Nat, date : Text, location : Text, officerName : Text) : async Nat {
    let discountedAmount = applyDiscount(fineAmount);
    let challan : Challan = {
      id = nextId;
      vehicleNumber;
      violationType;
      fineAmount;
      discountedAmount;
      date;
      location;
      status = #pending;
      officerName;
    };

    challans.add(nextId, challan);
    nextId += 1;
    challan.id;
  };

  public shared ({ caller }) func payChallan(id : Nat) : async () {
    switch (challans.get(id)) {
      case (null) { Runtime.trap("Challan not found") };
      case (?challan) {
        if (challan.status == #paid) { Runtime.trap("Challan already paid") };

        let updatedChallan : Challan = {
          id = challan.id;
          vehicleNumber = challan.vehicleNumber;
          violationType = challan.violationType;
          fineAmount = challan.fineAmount;
          discountedAmount = challan.discountedAmount;
          date = challan.date;
          location = challan.location;
          status = #paid;
          officerName = challan.officerName;
        };
        challans.add(id, updatedChallan);
      };
    };
  };

  public query ({ caller }) func getChallansByVehicle(vehicleNumber : Text) : async [Challan] {
    challans.values().toArray().filter(func(ch) { ch.vehicleNumber == vehicleNumber });
  };

  public shared ({ caller }) func seedSampleData() : async () {
    ignore await addChallan("MH12AB1234", "Speeding", 500, "2024-06-01", "Pune", "Officer Singh");
    ignore await addChallan("MH12AB1234", "Red Light", 1000, "2024-06-02", "Pune", "Officer Patel");
    ignore await addChallan("DL3CAF9087", "Wrong Parking", 300, "2024-06-03", "Delhi", "Officer Sharma");
    ignore await addChallan("DL3CAF9087", "Overloading", 800, "2024-06-04", "Delhi", "Officer Khan");
    ignore await addChallan("KA05MG7654", "Speeding", 700, "2024-06-05", "Bangalore", "Officer Rao");
  };

  public query ({ caller }) func getChallan(id : Nat) : async Challan {
    switch (challans.get(id)) {
      case (null) { Runtime.trap("Challan not found") };
      case (?challan) { challan };
    };
  };

  public shared ({ caller }) func setUpiId(newUpiId : Text) : async () {
    upiId := ?newUpiId;
  };

  public query ({ caller }) func getUpiId() : async ?Text {
    upiId;
  };

  public shared ({ caller }) func setSupportNumber(number : Text) : async () {
    supportNumber := ?number;
  };

  public query ({ caller }) func getSupportNumber() : async ?Text {
    supportNumber;
  };

  public shared ({ caller }) func setApiConfig(key : Text, baseUrl : Text) : async () {
    apiKey := ?key;
    apiBaseUrl := ?baseUrl;
  };

  public query ({ caller }) func getApiConfig() : async { apiKey : ?Text; apiBaseUrl : ?Text } {
    { apiKey; apiBaseUrl };
  };

  public shared ({ caller }) func submitUtr(challanId : Nat, vehicleNumber : Text, amount : Nat, utr : Text, submittedAt : Text) : async Nat {
    let utrRecord : UtrRecord = {
      id = nextUtrId;
      challanId;
      vehicleNumber;
      amount;
      utr;
      status = #pending;
      submittedAt;
    };

    utrRecords.add(nextUtrId, utrRecord);
    let utrId = nextUtrId;
    nextUtrId += 1;
    utrId;
  };

  public query ({ caller }) func getUtrSubmissions() : async [UtrRecord] {
    utrRecords.values().toArray();
  };

  public shared ({ caller }) func approveUtr(utrId : Nat) : async () {
    switch (utrRecords.get(utrId)) {
      case (null) { Runtime.trap("UTR not found") };
      case (?utrRecord) {
        if (utrRecord.status != #pending) {
          Runtime.trap("UTR is not pending");
        };

        let updatedUtr : UtrRecord = {
          id = utrRecord.id;
          challanId = utrRecord.challanId;
          vehicleNumber = utrRecord.vehicleNumber;
          amount = utrRecord.amount;
          utr = utrRecord.utr;
          status = #approved;
          submittedAt = utrRecord.submittedAt;
        };
        utrRecords.add(utrId, updatedUtr);

        switch (challans.get(utrRecord.challanId)) {
          case (null) { Runtime.trap("Challan not found") };
          case (?challan) {
            let updatedChallan : Challan = {
              id = challan.id;
              vehicleNumber = challan.vehicleNumber;
              violationType = challan.violationType;
              fineAmount = challan.fineAmount;
              discountedAmount = challan.discountedAmount;
              date = challan.date;
              location = challan.location;
              status = #paid;
              officerName = challan.officerName;
            };
            challans.add(challan.id, updatedChallan);
          };
        };
      };
    };
  };

  public shared ({ caller }) func rejectUtr(utrId : Nat) : async () {
    switch (utrRecords.get(utrId)) {
      case (null) { Runtime.trap("UTR not found") };
      case (?utrRecord) {
        if (utrRecord.status != #pending) {
          Runtime.trap("UTR is not pending");
        };

        let updatedUtr : UtrRecord = {
          id = utrRecord.id;
          challanId = utrRecord.challanId;
          vehicleNumber = utrRecord.vehicleNumber;
          amount = utrRecord.amount;
          utr = utrRecord.utr;
          status = #rejected;
          submittedAt = utrRecord.submittedAt;
        };
        utrRecords.add(utrId, updatedUtr);
      };
    };
  };

  // Violation Types
  public shared ({ caller }) func addViolationType(name : Text, amount : Nat) : async Nat {
    let violationType : ViolationType = {
      id = nextViolationTypeId;
      name;
      amount;
    };

    violationTypes.add(nextViolationTypeId, violationType);
    nextViolationTypeId += 1;
    violationType.id;
  };

  public shared ({ caller }) func deleteViolationType(id : Nat) : async () {
    violationTypes.remove(id);
  };

  public query ({ caller }) func getViolationTypes() : async [ViolationType] {
    violationTypes.values().toArray();
  };

  // Manual Payment Records
  public shared ({ caller }) func submitManualPayment(vehicleNumber : Text, phone : Text, violations : Text, totalAmount : Nat, utr : Text, submittedAt : Text) : async Nat {
    let record : ManualPaymentRecord = {
      id = nextManualPaymentId;
      vehicleNumber;
      phone;
      violations;
      totalAmount;
      utr;
      status = #pending;
      submittedAt;
    };

    manualPaymentRecords.add(nextManualPaymentId, record);
    let recordId = nextManualPaymentId;
    nextManualPaymentId += 1;
    recordId;
  };

  public query ({ caller }) func getManualPayments() : async [ManualPaymentRecord] {
    manualPaymentRecords.values().toArray();
  };

  public shared ({ caller }) func approveManualPayment(id : Nat) : async () {
    switch (manualPaymentRecords.get(id)) {
      case (null) { Runtime.trap("Manual payment record not found") };
      case (?record) {
        if (record.status != #pending) {
          Runtime.trap("Record is not pending");
        };

        let updatedRecord : ManualPaymentRecord = {
          id = record.id;
          vehicleNumber = record.vehicleNumber;
          phone = record.phone;
          violations = record.violations;
          totalAmount = record.totalAmount;
          utr = record.utr;
          status = #approved;
          submittedAt = record.submittedAt;
        };
        manualPaymentRecords.add(id, updatedRecord);
      };
    };
  };

  public shared ({ caller }) func rejectManualPayment(id : Nat) : async () {
    switch (manualPaymentRecords.get(id)) {
      case (null) { Runtime.trap("Manual payment record not found") };
      case (?record) {
        if (record.status != #pending) {
          Runtime.trap("Record is not pending");
        };

        let updatedRecord : ManualPaymentRecord = {
          id = record.id;
          vehicleNumber = record.vehicleNumber;
          phone = record.phone;
          violations = record.violations;
          totalAmount = record.totalAmount;
          utr = record.utr;
          status = #rejected;
          submittedAt = record.submittedAt;
        };
        manualPaymentRecords.add(id, updatedRecord);
      };
    };
  };
};
