import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: 'whatsup-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve static files
app.use(express.static('.'));

// In-memory storage
class MemStorage {
  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.messages = new Map();
    this.friendships = new Map();
    this.notifications = new Map();
    this.currentUserId = 1;
    this.currentPostId = 1;
    this.currentMessageId = 1;
    this.currentFriendshipId = 1;
    this.currentNotificationId = 1;
    this.seedData();
  }

  seedData() {
    // Create the owner account (Daniel Mojar) - available for login
    const danielMojar = {
      id: this.currentUserId++,
      username: "Daniel Mojar",
      password: "danielot",
      firstName: "Daniel",
      lastName: "Mojar",
      email: "daniel@whatsup.com",
      bio: "Founder & CEO at WhatsUp • Platform Owner",
      profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200",
      coverPhoto: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=400",
      isVerified: true,
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
    };
    this.users.set(danielMojar.id, danielMojar);

    // Create sample users
    const sampleUsers = [
      {
        username: "Sarah Johnson",
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah@example.com",
        profilePicture: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        isOnline: true,
        bio: "Love traveling and photography 📸",
      },
      {
        username: "Mike Chen",
        firstName: "Mike",
        lastName: "Chen",
        email: "mike@example.com",
        profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        isOnline: true,
        bio: "Software developer & tech enthusiast",
      },
      {
        username: "Alex Rivera",
        firstName: "Alex",
        lastName: "Rivera",
        email: "alex@example.com",
        profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        isOnline: false,
        bio: "Artist and creative director",
      },
    ];

    sampleUsers.forEach(userData => {
      const user = {
        id: this.currentUserId++,
        username: userData.username,
        password: "password123",
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        bio: userData.bio || "",
        profilePicture: userData.profilePicture,
        coverPhoto: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400",
        isVerified: false,
        isOnline: userData.isOnline,
        lastSeen: new Date(),
        createdAt: new Date(),
      };
      this.users.set(user.id, user);
    });

    // Create sample posts
    const samplePosts = [
      {
        userId: 2, // Sarah
        content: "Just had an amazing weekend at the mountains! Nature therapy is real 🏔️ #mountains #nature #weekend",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        likes: 47,
        comments: 12,
        shares: 3,
      },
      {
        userId: 3, // Mike
        content: "Working on some exciting new projects! Can't wait to share what we've been building 🚀 #coding #startup #innovation",
        imageUrl: null,
        likes: 23,
        comments: 8,
        shares: 2,
      },
      {
        userId: 1, // Daniel
        content: "Excited to announce the launch of WhatsUp! 🚀 A new social platform built for genuine connections and meaningful conversations. Thank you to everyone who has supported this journey! #WhatsUp #SocialMedia #Innovation",
        imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        likes: 128,
        comments: 45,
        shares: 23,
      },
    ];

    samplePosts.forEach(postData => {
      const post = {
        id: this.currentPostId++,
        userId: postData.userId,
        content: postData.content,
        imageUrl: postData.imageUrl,
        videoUrl: null,
        likes: postData.likes,
        comments: postData.comments,
        shares: postData.shares,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 7), // Random time in last week
      };
      this.posts.set(post.id, post);
    });
  }

  getUser(id) {
    return this.users.get(id);
  }

  getUserByUsername(username) {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  createUser(userData) {
    const user = {
      ...userData,
      id: this.currentUserId++,
      isVerified: false,
      isOnline: false,
      lastSeen: new Date(),
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  createPost(postData) {
    const post = {
      ...postData,
      id: this.currentPostId++,
      likes: 0,
      comments: 0,
      shares: 0,
      createdAt: new Date(),
    };
    this.posts.set(post.id, post);
    return post;
  }

  getPost(id) {
    return this.posts.get(id);
  }

  getUserPosts(userId) {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getFeedPosts(userId) {
    const posts = Array.from(this.posts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return posts.map(post => ({
      ...post,
      user: this.users.get(post.userId),
    })).filter(p => p.user);
  }

  likePost(postId) {
    const post = this.posts.get(postId);
    if (!post) return undefined;
    
    const updatedPost = { ...post, likes: post.likes + 1 };
    this.posts.set(postId, updatedPost);
    return updatedPost;
  }

  createMessage(messageData) {
    const message = {
      ...messageData,
      id: this.currentMessageId++,
      createdAt: new Date(),
    };
    this.messages.set(message.id, message);
    return message;
  }

  getMessages(userId1, userId2) {
    let messages = Array.from(this.messages.values());
    
    if (userId2) {
      messages = messages.filter(message => 
        (message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)
      );
    } else {
      messages = messages.filter(message => 
        message.receiverId === userId1 || message.senderId === userId1
      );
    }
    
    return messages
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(message => ({
        ...message,
        sender: this.users.get(message.senderId),
      })).filter(m => m.sender);
  }

  getUserConversations(userId) {
    const messages = this.getMessages(userId);
    const conversations = new Map();
    
    messages.forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const otherUser = this.users.get(otherUserId);
      
      if (otherUser && !message.isAi) {
        const existing = conversations.get(otherUserId);
        if (!existing || message.createdAt > existing.lastMessage.createdAt) {
          conversations.set(otherUserId, {
            user: otherUser,
            lastMessage: message,
          });
        }
      }
    });
    
    return Array.from(conversations.values())
      .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
  }

  createFriendship(friendshipData) {
    const friendship = {
      ...friendshipData,
      id: this.currentFriendshipId++,
      createdAt: new Date(),
    };
    this.friendships.set(friendship.id, friendship);
    return friendship;
  }

  getFriendships(userId) {
    return Array.from(this.friendships.values())
      .filter(friendship => 
        (friendship.userId === userId || friendship.friendId === userId) && 
        friendship.status === 'accepted'
      )
      .map(friendship => ({
        ...friendship,
        friend: this.users.get(friendship.userId === userId ? friendship.friendId : friendship.userId),
      })).filter(f => f.friend);
  }

  getFriendRequests(userId) {
    return Array.from(this.friendships.values())
      .filter(friendship => friendship.friendId === userId && friendship.status === 'pending')
      .map(friendship => ({
        ...friendship,
        user: this.users.get(friendship.userId),
      })).filter(f => f.user);
  }

  updateFriendshipStatus(id, status) {
    const friendship = this.friendships.get(id);
    if (!friendship) return undefined;
    
    const updatedFriendship = { ...friendship, status };
    this.friendships.set(id, updatedFriendship);
    return updatedFriendship;
  }

  createNotification(notificationData) {
    const notification = {
      ...notificationData,
      id: this.currentNotificationId++,
      createdAt: new Date(),
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  getUserNotifications(userId) {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(notification => ({
        ...notification,
        fromUser: notification.fromUserId ? this.users.get(notification.fromUserId) : undefined,
      }));
  }

  markNotificationRead(id) {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
}

const storage = new MemStorage();

// AI Chat functionality
async function getAIResponse(message) {
  // Check if OpenAI API key is available
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'default_key') {
    // Fallback responses for demo
    const responses = [
      "That's an interesting question! I'd be happy to help you explore that topic further.",
      "I understand what you're asking. Let me think about the best way to explain this.",
      "Great point! There are several ways to look at this situation.",
      "I appreciate you sharing that with me. Here's what I think about it...",
      "That's a common question, and I'm glad you asked. Let me break it down for you.",
      "I find that fascinating! Here's my perspective on what you've shared.",
      "You've raised an excellent point. Let me offer some thoughts on this.",
      "That's a thoughtful question. Based on what you've told me, I think...",
      "I can see why you're curious about this. Let me share what I know.",
      "That's definitely worth exploring. Here's how I would approach it..."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  try {
    // Use dynamic import for OpenAI
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are an AI assistant for WhatsUp social media platform. Be friendly, helpful, and engaging. Keep responses conversational and not too long."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 150
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("AI Chat error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
}

// Authentication middleware
const authenticateUser = (req, res, next) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  req.user = user;
  next();
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Auth routes
app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    const user = storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.userId = user.id;
    storage.updateUser(user.id, { isOnline: true, lastSeen: new Date() });
    
    res.json({ user: { ...user, password: undefined } });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

app.post("/api/auth/register", (req, res) => {
  try {
    const { username, firstName, lastName, email, password } = req.body;
    
    const existingUser = storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const user = storage.createUser({
      username,
      firstName,
      lastName,
      email,
      password,
      bio: "",
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=1877f2&color=fff&size=200`,
      coverPhoto: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400"
    });
    
    req.session.userId = user.id;
    
    res.json({ user: { ...user, password: undefined } });
  } catch (error) {
    res.status(400).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/logout", authenticateUser, (req, res) => {
  try {
    storage.updateUser(req.user.id, { isOnline: false, lastSeen: new Date() });
    req.session.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
});

app.get("/api/auth/me", authenticateUser, (req, res) => {
  res.json({ user: { ...req.user, password: undefined } });
});

// User routes
app.get("/api/users", authenticateUser, (req, res) => {
  try {
    const users = storage.getAllUsers();
    res.json(users.map(user => ({ ...user, password: undefined })));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.get("/api/users/:id", authenticateUser, (req, res) => {
  try {
    const user = storage.getUser(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ ...user, password: undefined });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Post routes
app.get("/api/posts/feed", authenticateUser, (req, res) => {
  try {
    const posts = storage.getFeedPosts(req.user.id);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feed" });
  }
});

app.post("/api/posts", authenticateUser, (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    const post = storage.createPost({
      userId: req.user.id,
      content,
      imageUrl: imageUrl || null,
      videoUrl: null
    });
    const postWithUser = { ...post, user: req.user };
    res.json(postWithUser);
  } catch (error) {
    res.status(400).json({ message: "Failed to create post" });
  }
});

app.post("/api/posts/:id/like", authenticateUser, (req, res) => {
  try {
    const post = storage.likePost(parseInt(req.params.id));
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to like post" });
  }
});

// Message routes
app.get("/api/messages/conversations", authenticateUser, (req, res) => {
  try {
    const conversations = storage.getUserConversations(req.user.id);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

app.get("/api/messages/:userId", authenticateUser, (req, res) => {
  try {
    const messages = storage.getMessages(req.user.id, parseInt(req.params.userId));
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

app.post("/api/messages", authenticateUser, (req, res) => {
  try {
    const { content, receiverId } = req.body;
    const message = storage.createMessage({
      senderId: req.user.id,
      receiverId: receiverId || null,
      content,
      isAi: false
    });
    
    const messageWithSender = { ...message, sender: req.user };
    
    // Emit to receiver if online
    if (receiverId) {
      io.emit(`message_${receiverId}`, messageWithSender);
    }
    
    res.json(messageWithSender);
  } catch (error) {
    res.status(400).json({ message: "Failed to send message" });
  }
});

// AI Chat route
app.post("/api/ai/chat", authenticateUser, async (req, res) => {
  try {
    const { message } = req.body;
    
    const aiResponse = await getAIResponse(message);
    
    // Save AI message
    const aiMessage = storage.createMessage({
      senderId: req.user.id,
      receiverId: null,
      content: aiResponse,
      isAi: true
    });

    res.json({ response: aiMessage.content });
  } catch (error) {
    console.error("AI Chat error:", error);
    res.json({ response: "I'm sorry, I'm having trouble connecting right now. Please try again later." });
  }
});

// Friend routes
app.get("/api/friends", authenticateUser, (req, res) => {
  try {
    const friends = storage.getFriendships(req.user.id);
    res.json(friends);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch friends" });
  }
});

app.get("/api/friends/requests", authenticateUser, (req, res) => {
  try {
    const requests = storage.getFriendRequests(req.user.id);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch friend requests" });
  }
});

app.post("/api/friends/request", authenticateUser, (req, res) => {
  try {
    const { friendId } = req.body;
    const friendship = storage.createFriendship({
      userId: req.user.id,
      friendId: parseInt(friendId),
      status: 'pending'
    });
    
    // Create notification
    storage.createNotification({
      userId: parseInt(friendId),
      type: 'friend_request',
      content: `${req.user.username} sent you a friend request`,
      fromUserId: req.user.id,
      isRead: false
    });
    
    res.json(friendship);
  } catch (error) {
    res.status(400).json({ message: "Failed to send friend request" });
  }
});

app.put("/api/friends/request/:id", authenticateUser, (req, res) => {
  try {
    const { status } = req.body;
    const friendship = storage.updateFriendshipStatus(parseInt(req.params.id), status);
    if (!friendship) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    res.json(friendship);
  } catch (error) {
    res.status(500).json({ message: "Failed to update friend request" });
  }
});

// Notification routes
app.get("/api/notifications", authenticateUser, (req, res) => {
  try {
    const notifications = storage.getUserNotifications(req.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

app.put("/api/notifications/:id/read", authenticateUser, (req, res) => {
  try {
    const notification = storage.markNotificationRead(parseInt(req.params.id));
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// Socket.IO real-time functionality
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const message = storage.createMessage(data);
      const messageWithSender = {
        ...message,
        sender: storage.getUser(data.senderId)
      };
      
      // Send to receiver
      if (data.receiverId) {
        io.to(`user_${data.receiverId}`).emit("new_message", messageWithSender);
      }
      
      // Send back to sender
      socket.emit("message_sent", messageWithSender);
    } catch (error) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WhatsUp by Mojar server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});