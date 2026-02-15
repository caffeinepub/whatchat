import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import List "mo:core/List";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    email : Text;
    name : Text;
  };

  public type Message = {
    id : Nat;
    sender : Principal;
    receiver : Principal;
    content : Text;
    timestamp : Int;
    isRead : Bool;
  };

  public type Conversation = {
    id : Text;
    participants : [Principal];
    messages : Map.Map<Nat, Message>;
  };

  public type CallOffer = {
    offer : Text;
    caller : Principal;
    callee : Principal;
    timestamp : Int;
  };

  public type CallAnswer = {
    answer : Text;
    caller : Principal;
    callee : Principal;
    timestamp : Int;
  };

  public type Candidate = {
    candidate : Text;
    sender : Principal;
    receiver : Principal;
    timestamp : Int;
  };

  public type CallStatus = {
    caller : Principal;
    callee : Principal;
    status : Text;
    timestamp : Int;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let conversations = Map.empty<Text, Conversation>();
  let calls = Map.empty<Text, {
    offer : ?CallOffer;
    answer : ?CallAnswer;
    candidates : List.List<Candidate>;
    status : CallStatus;
  }>();

  func getConversationId(user1 : Principal, user2 : Principal) : Text {
    let ids = [user1.toText(), user2.toText()];
    let sorted = ids.sort();
    sorted[0].concat(sorted[1]);
  };

  func createConversation(user1 : Principal, user2 : Principal) : Conversation {
    {
      id = getConversationId(user1, user2);
      participants = [user1, user2];
      messages = Map.empty<Nat, Message>();
    };
  };

  func isParticipant(conversation : Conversation, user : Principal) : Bool {
    conversation.participants.any(func(p : Principal) : Bool { p == user });
  };

  public shared ({ caller }) func sendOffer(callee : Principal, offer : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can initiate calls");
    };

    let callKey = getConversationId(caller, callee);

    let newOffer : CallOffer = {
      offer;
      caller;
      callee;
      timestamp = Time.now();
    };

    let newStatus : CallStatus = {
      caller;
      callee;
      status = "ringing";
      timestamp = Time.now();
    };

    calls.add(callKey, {
      offer = ?newOffer;
      answer = null;
      candidates = List.empty<Candidate>();
      status = newStatus;
    });
  };

  public shared ({ caller }) func sendAnswer(callerPrincipal : Principal, answer : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can answer calls");
    };

    let callKey = getConversationId(caller, callerPrincipal);

    switch (calls.get(callKey)) {
      case (null) { Runtime.trap("No offer found for this call") };
      case (?call) {
        switch (call.offer) {
          case (null) { Runtime.trap("No offer found for this call") };
          case (?offer) {
            if (offer.callee != caller) {
              Runtime.trap("Unauthorized: You are not the intended recipient of this call");
            };
          };
        };
      };
    };

    let newAnswer : CallAnswer = {
      answer;
      caller : Principal = callerPrincipal;
      callee = caller;
      timestamp = Time.now();
    };

    switch (calls.get(callKey)) {
      case (null) { Runtime.trap("No offer found for this call") };
      case (?call) {
        let updatedCall = {
          call with
          answer = ?newAnswer;
          status = {
            call.status with
            status = "answered";
          };
        };
        calls.add(callKey, updatedCall);
      };
    };
  };

  public shared ({ caller }) func sendCandidate(receiver : Principal, candidate : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send candidates");
    };

    let callKey = getConversationId(caller, receiver);

    switch (calls.get(callKey)) {
      case (null) { Runtime.trap("No active call found") };
      case (?call) {
        if (call.status.caller != caller and call.status.callee != caller) {
          Runtime.trap("Unauthorized: You are not a participant in this call");
        };

        let newCandidate : Candidate = {
          candidate;
          sender = caller;
          receiver;
          timestamp = Time.now();
        };

        let updatedCandidates = switch (call.candidates.isEmpty()) {
          case (true) { List.singleton<Candidate>(newCandidate) };
          case (false) {
            call.candidates.add(newCandidate);
            call.candidates;
          };
        };

        let updatedCall = {
          call with
          candidates = updatedCandidates;
        };
        calls.add(callKey, updatedCall);
      };
    };
  };
};
