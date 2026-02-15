import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import List "mo:core/List";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

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

  public type OfferResponse = {
    state : Text;
    offer : ?Text;
    caller : ?Principal;
  };

  public type AnswerResponse = {
    state : Text;
    answer : ?Text;
    callee : ?Principal;
  };

  public type CandidatesResponse = {
    candidates : [Candidate];
    hasCandidates : Bool;
  };

  public type StatusResponse = {
    status : ?Text;
    hasStatus : Bool;
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // WebRTC Call Signaling Endpoints
  public query ({ caller }) func fetchOffer(callee : Principal) : async OfferResponse {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can fetch offers");
    };

    let callKey = getConversationId(callee, caller);

    switch (calls.get(callKey)) {
      case (null) {
        {
          state = "no-offer";
          offer = null;
          caller = null;
        };
      };
      case (?call) {
        // Verify caller is a participant in this call
        if (call.status.caller != caller and call.status.callee != caller) {
          Runtime.trap("Unauthorized: You are not a participant in this call");
        };

        switch (call.offer) {
          case (null) {
            {
              state = "no-offer";
              offer = null;
              caller = null;
            };
          };
          case (?offer) {
            {
              state = call.status.status;
              offer = ?offer.offer;
              caller = ?offer.caller;
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func fetchAnswer(callee : Principal) : async AnswerResponse {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can fetch answers");
    };

    let callKey = getConversationId(callee, caller);

    switch (calls.get(callKey)) {
      case (null) {
        {
          state = "no-answer";
          answer = null;
          callee = null;
        };
      };
      case (?call) {
        // Verify caller is a participant in this call
        if (call.status.caller != caller and call.status.callee != caller) {
          Runtime.trap("Unauthorized: You are not a participant in this call");
        };

        switch (call.answer) {
          case (null) {
            {
              state = "no-answer";
              answer = null;
              callee = null;
            };
          };
          case (?answer) {
            {
              state = call.status.status;
              answer = ?answer.answer;
              callee = ?answer.callee;
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func fetchCandidates(callee : Principal) : async CandidatesResponse {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can fetch candidates");
    };

    let callKey = getConversationId(callee, caller);

    switch (calls.get(callKey)) {
      case (null) {
        { candidates = [] : [Candidate]; hasCandidates = false };
      };
      case (?call) {
        // Verify caller is a participant in this call
        if (call.status.caller != caller and call.status.callee != caller) {
          Runtime.trap("Unauthorized: You are not a participant in this call");
        };

        if (call.candidates.isEmpty()) {
          { candidates = [] : [Candidate]; hasCandidates = false };
        } else {
          switch (call.candidates.isEmpty()) {
            case (true) { { candidates = [] : [Candidate]; hasCandidates = false } };
            case (false) {
              let candidateArray = call.candidates.toArray();
              { candidates = candidateArray; hasCandidates = candidateArray.size() > 0 };
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func fetchStatus(callee : Principal) : async StatusResponse {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can fetch status");
    };

    let callKey = getConversationId(callee, caller);

    switch (calls.get(callKey)) {
      case (null) { { status = null; hasStatus = false } };
      case (?call) {
        // Verify caller is a participant in this call
        if (call.status.caller != caller and call.status.callee != caller) {
          Runtime.trap("Unauthorized: You are not a participant in this call");
        };

        if (call.status.status == "active") {
          { status = null; hasStatus = false };
        } else {
          { status = ?call.status.status; hasStatus = true };
        };
      };
    };
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

  public shared ({ caller }) func clearCallState(participant1 : Principal, participant2 : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can clear call state");
    };

    let callKey = getConversationId(participant1, participant2);

    // Verify caller is a participant in the call being cleared
    switch (calls.get(callKey)) {
      case (null) { 
        // No call exists, nothing to clear - this is fine
      };
      case (?call) {
        if (call.status.caller != caller and call.status.callee != caller) {
          Runtime.trap("Unauthorized: You can only clear call state for calls you participated in");
        };
      };
    };

    calls.remove(callKey);
  };
};
