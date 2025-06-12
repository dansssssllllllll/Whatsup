import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import OpenAI from "openai";
import { insertUserSchema, insertPostSchema, insertMessageSchema, insertFriendshipSchema } from "@shared/schema";

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware
  const authenticateUser = async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  };

  // Session configuration
  const session = (await import('express-session')).default;
  app.use(session({
    secret: 'whatsup-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      await storage.updateUser(user.id, { isOnline: true, lastSeen: new Date() });
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/logout", authenticateUser, async (req: any, res) => {
    try {
      await storage.updateUser(req.user.id, { isOnline: false, lastSeen: new Date() });
      req.session.destroy();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get("/api/auth/me", authenticateUser, (req: any, res) => {
    res.json({ user: { ...req.user, password: undefined } });
  });

  // User routes
  app.get("/api/users", authenticateUser, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Post routes
  app.get("/api/posts/feed", authenticateUser, async (req: any, res) => {
    try {
      const posts = await storage.getFeedPosts(req.user.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  app.post("/api/posts", authenticateUser, async (req: any, res) => {
    try {
      const postData = insertPostSchema.parse({ ...req.body, userId: req.user.id });
      const post = await storage.createPost(postData);
      const postWithUser = { ...post, user: req.user };
      res.json(postWithUser);
    } catch (error) {
      res.status(400).json({ message: "Failed to create post" });
    }
  });

  app.post("/api/posts/:id/like", authenticateUser, async (req, res) => {
    try {
      const post = await storage.likePost(parseInt(req.params.id));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  // Message routes
  app.get("/api/messages/conversations", authenticateUser, async (req: any, res) => {
    try {
      const conversations = await storage.getUserConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:userId", authenticateUser, async (req: any, res) => {
    try {
      const messages = await storage.getMessages(req.user.id, parseInt(req.params.userId));
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", authenticateUser, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      
      const message = await storage.createMessage(messageData);
      const messageWithSender = { ...message, sender: req.user };
      
      // Emit to receiver if online
      if (messageData.receiverId) {
        io.emit(`message_${messageData.receiverId}`, messageWithSender);
      }
      
      res.json(messageWithSender);
    } catch (error) {
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // AI Chat route
  app.post("/api/ai/chat", authenticateUser, async (req: any, res) => {
    try {
      const { message } = req.body;
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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

      const aiResponse = response.choices[0].message.content;
      
      // Save AI message
      const aiMessage = await storage.createMessage({
        senderId: req.user.id,
        receiverId: null,
        content: aiResponse || "I'm sorry, I couldn't process that request.",
        isAi: true
      });

      res.json({ response: aiMessage.content });
    } catch (error) {
      console.error("AI Chat error:", error);
      res.json({ response: "I'm sorry, I'm having trouble connecting right now. Please try again later." });
    }
  });

  // Friend routes
  app.get("/api/friends", authenticateUser, async (req: any, res) => {
    try {
      const friends = await storage.getFriendships(req.user.id);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get("/api/friends/requests", authenticateUser, async (req: any, res) => {
    try {
      const requests = await storage.getFriendRequests(req.user.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post("/api/friends/request", authenticateUser, async (req: any, res) => {
    try {
      const { friendId } = req.body;
      const friendship = await storage.createFriendship({
        userId: req.user.id,
        friendId: parseInt(friendId),
        status: 'pending'
      });
      
      // Create notification
      await storage.createNotification({
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

  app.put("/api/friends/request/:id", authenticateUser, async (req, res) => {
    try {
      const { status } = req.body;
      const friendship = await storage.updateFriendshipStatus(parseInt(req.params.id), status);
      if (!friendship) {
        return res.status(404).json({ message: "Friend request not found" });
      }
      res.json(friendship);
    } catch (error) {
      res.status(500).json({ message: "Failed to update friend request" });
    }
  });

  // Notification routes
  app.get("/api/notifications", authenticateUser, async (req: any, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateUser, async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(parseInt(req.params.id));
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
        const message = await storage.createMessage(data);
        const messageWithSender = {
          ...message,
          sender: await storage.getUser(data.senderId)
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

  return httpServer;
}
