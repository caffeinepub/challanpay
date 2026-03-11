import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";

actor {
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

  let challans = Map.empty<Nat, Challan>();
  var nextId = 1;

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
    ignore await addChallan("MH14XY5678", "Wrong Parking", 300, "2024-06-03", "Mumbai", "Officer Sharma");
    ignore await addChallan("MH14XY5678", "Overloading", 800, "2024-06-04", "Mumbai", "Officer Khan");
  };

  public query ({ caller }) func getChallan(id : Nat) : async Challan {
    switch (challans.get(id)) {
      case (null) { Runtime.trap("Challan not found") };
      case (?challan) { challan };
    };
  };
};
