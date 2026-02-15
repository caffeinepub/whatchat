import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Time "mo:core/Time";

actor {
  // Initialize the authorization system and include for all apps that manage personal or access-restricted data
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    email : Text;
    name : Text;
  };

  public type ConversationId = Text;

  public type Message = {
    id : Nat;
    sender : Principal;
    receiver : Principal;
    content : Text;
    timestamp : Int;
    isRead : Bool;
  };

  public type Conversation = {
    id : ConversationId;
    participants : [Principal];
    messages : Map.Map<Nat, Message>;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let conversations = Map.empty<ConversationId, Conversation>();

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

  // Messaging System
  func getConversationId(user1 : Principal, user2 : Principal) : ConversationId {
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

  public shared ({ caller }) func sendMessage(receiver : Principal, content : Text) : async Message {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    // Ensure conversation exists
    let conversationId = getConversationId(caller, receiver);

    let conversation = switch (conversations.get(conversationId)) {
      case (null) { createConversation(caller, receiver) };
      case (?conv) { conv };
    };

    // Create a new message ID based on current timestamp
    let newMessageId = Time.now();

    // Create the new message
    let newMessage : Message = {
      id = newMessageId.toNat();
      sender = caller;
      receiver;
      content;
      timestamp = Time.now();
      isRead = false;
    };

    // Add the new message to the conversation
    conversation.messages.add(newMessageId.toNat(), newMessage);

    // Store the updated conversation in the main conversations Map
    conversations.add(conversationId, conversation);

    newMessage;
  };

  public shared query ({ caller }) func getConversationIds() : async [ConversationId] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can retrieve conversations");
    };

    conversations.filter(
      func(_, conversation) { isParticipant(conversation, caller) }
    ).keys().toArray();
  };

  public query ({ caller }) func getConversationMessages(conversationId : ConversationId) : async [Message] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can retrieve messages");
    };

    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        if (not isParticipant(conversation, caller)) {
          Runtime.trap("Unauthorized: You are not a participant in this conversation");
        };
        conversation.messages.values().toArray();
      };
    };
  };

  public query ({ caller }) func getUnreadMessages(conversationId : ConversationId) : async [Message] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can retrieve messages");
    };

    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        if (not isParticipant(conversation, caller)) {
          Runtime.trap("Unauthorized: You are not a participant in this conversation");
        };
        conversation.messages.values().toArray().filter(
          func(msg) { msg.receiver == caller and not msg.isRead }
        );
      };
    };
  };

  public shared ({ caller }) func markMessagesAsRead(conversationId : ConversationId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mark messages as read");
    };

    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        if (not isParticipant(conversation, caller)) {
          Runtime.trap("Unauthorized: You are not a participant in this conversation");
        };

        var updatedMessages = conversation.messages;
        conversation.messages.forEach(
          func(messageId, message) {
            if (message.receiver == caller) {
              let updatedMessage = {
                message with
                isRead = true;
              };
              updatedMessages.add(messageId, updatedMessage);
            };
          }
        );
      };
    };
  };

  public query ({ caller }) func getUnreadMessageCount() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can retrieve unread message count");
    };

    var unreadCount = 0;
    conversations.filter(func(_, conversation) { isParticipant(conversation, caller) }).values().forEach(
      func(conversation) {
        conversation.messages.values().forEach(
          func(msg) { if (msg.receiver == caller and not msg.isRead) { unreadCount += 1 } }
        );
      }
    );
    unreadCount;
  };

  // Development instructions pointing to the full documentation
  public query ({ caller }) func getDevDocumentationUrl() : async Text {
    "To make changes, follow the instructions in the developer console or full documentation at app-access.internetcomputer.com. Built by the Haisch Team 2024.";
  };
};
