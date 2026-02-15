import Map "mo:core/Map";
import Principal "mo:core/Principal";
import List "mo:core/List";

module {
  type CallOffer = {
    offer : Text;
    caller : Principal;
    callee : Principal;
    timestamp : Int;
  };

  type CallAnswer = {
    answer : Text;
    caller : Principal;
    callee : Principal;
    timestamp : Int;
  };

  type Candidate = {
    candidate : Text;
    sender : Principal;
    receiver : Principal;
    timestamp : Int;
  };

  type CallStatus = {
    caller : Principal;
    callee : Principal;
    status : Text;
    timestamp : Int;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, { email : Text; name : Text }>;
    conversations : Map.Map<Text, {
      id : Text;
      participants : [Principal];
      messages : Map.Map<Nat, {
        id : Nat;
        sender : Principal;
        receiver : Principal;
        content : Text;
        timestamp : Int;
        isRead : Bool;
      }>;
    }>;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, { email : Text; name : Text }>;
    conversations : Map.Map<Text, {
      id : Text;
      participants : [Principal];
      messages : Map.Map<Nat, {
        id : Nat;
        sender : Principal;
        receiver : Principal;
        content : Text;
        timestamp : Int;
        isRead : Bool;
      }>;
    }>;
    calls : Map.Map<Text, {
      offer : ?CallOffer;
      answer : ?CallAnswer;
      candidates : List.List<Candidate>;
      status : CallStatus;
    }>;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      calls = Map.empty<Text, {
        offer : ?CallOffer;
        answer : ?CallAnswer;
        candidates : List.List<Candidate>;
        status : CallStatus;
      }>();
    };
  };
};
