import { 
  users, posts, messages, friendships, notifications,
  type User, type InsertUser, 
  type Post, type InsertPost,
  type Message, type InsertMessage,
  type Friendship, type InsertFriendship,
  type Notification, type InsertNotification
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPost(id: number): Promise<Post | undefined>;
  getUserPosts(userId: number): Promise<Post[]>;
  getFeedPosts(userId: number): Promise<(Post & { user: User })[]>;
  likePost(postId: number): Promise<Post | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(userId1: number, userId2?: number): Promise<(Message & { sender: User })[]>;
  getUserConversations(userId: number): Promise<{ user: User; lastMessage: Message & { sender: User } }[]>;
  
  // Friendship operations
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  getFriendships(userId: number): Promise<(Friendship & { friend: User })[]>;
  getFriendRequests(userId: number): Promise<(Friendship & { user: User })[]>;
  updateFriendshipStatus(id: number, status: string): Promise<Friendship | undefined>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<(Notification & { fromUser?: User })[]>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private posts: Map<number, Post> = new Map();
  private messages: Map<number, Message> = new Map();
  private friendships: Map<number, Friendship> = new Map();
  private notifications: Map<number, Notification> = new Map();
  
  private currentUserId = 1;
  private currentPostId = 1;
  private currentMessageId = 1;
  private currentFriendshipId = 1;
  private currentNotificationId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create the owner account (Daniel Mojar) - hidden from public display
    const danielMojar: User = {
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
        profilePicture: "https://pixabay.com/get/g76ccff69a60402eeb726884e0820e2d9db2004640e2eff193f482b08a59345891d2e8f316fcfc807ec225481fe3eb544686e89ae6af933e669124ed4e4f7ccb5_1280.jpg",
        isOnline: true,
      },
      {
        username: "Mike Chen",
        firstName: "Mike",
        lastName: "Chen",
        email: "mike@example.com",
        profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
        isOnline: true,
      },
      {
        username: "Alex Rivera",
        firstName: "Alex",
        lastName: "Rivera",
        email: "alex@example.com",
        profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200",
        isOnline: false,
      },
    ];

    sampleUsers.forEach(userData => {
      const user: User = {
        id: this.currentUserId++,
        username: userData.username,
        password: "password123",
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        bio: "",
        profilePicture: userData.profilePicture,
        coverPhoto: "",
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
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        likes: 47,
        comments: 12,
        shares: 3,
      },
      {
        userId: 3, // Mike
        content: "Working on some exciting new projects! Can't wait to share what we've been building 🚀 #coding #startup #innovation",
        likes: 23,
        comments: 8,
        shares: 2,
      },
      {
        userId: 1, // Daniel
        content: "Excited to announce the launch of WhatsUp! 🚀 A new social platform built for genuine connections and meaningful conversations. Thank you to everyone who has supported this journey! #WhatsUp #SocialMedia #Innovation",
        imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        likes: 128,
        comments: 45,
        shares: 23,
      },
    ];

    samplePosts.forEach(postData => {
      const post: Post = {
        id: this.currentPostId++,
        userId: postData.userId,
        content: postData.content,
        imageUrl: postData.imageUrl || null,
        videoUrl: null,
        likes: postData.likes,
        comments: postData.comments,
        shares: postData.shares,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 7), // Random time in last week
      };
      this.posts.set(post.id, post);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      isVerified: false,
      isOnline: false,
      lastSeen: new Date(),
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const post: Post = {
      ...insertPost,
      id: this.currentPostId++,
      likes: 0,
      comments: 0,
      shares: 0,
      createdAt: new Date(),
    };
    this.posts.set(post.id, post);
    return post;
  }

  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getFeedPosts(userId: number): Promise<(Post & { user: User })[]> {
    const posts = Array.from(this.posts.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
    
    return posts.map(post => ({
      ...post,
      user: this.users.get(post.userId)!,
    })).filter(p => p.user);
  }

  async likePost(postId: number): Promise<Post | undefined> {
    const post = this.posts.get(postId);
    if (!post) return undefined;
    
    const updatedPost = { ...post, likes: post.likes + 1 };
    this.posts.set(postId, updatedPost);
    return updatedPost;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      ...insertMessage,
      id: this.currentMessageId++,
      createdAt: new Date(),
    };
    this.messages.set(message.id, message);
    return message;
  }

  async getMessages(userId1: number, userId2?: number): Promise<(Message & { sender: User })[]> {
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
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime())
      .map(message => ({
        ...message,
        sender: this.users.get(message.senderId)!,
      })).filter(m => m.sender);
  }

  async getUserConversations(userId: number): Promise<{ user: User; lastMessage: Message & { sender: User } }[]> {
    const messages = await this.getMessages(userId);
    const conversations = new Map<number, { user: User; lastMessage: Message & { sender: User } }>();
    
    messages.forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId! : message.senderId;
      const otherUser = this.users.get(otherUserId);
      
      if (otherUser && !message.isAi) {
        const existing = conversations.get(otherUserId);
        if (!existing || message.createdAt! > existing.lastMessage.createdAt!) {
          conversations.set(otherUserId, {
            user: otherUser,
            lastMessage: message,
          });
        }
      }
    });
    
    return Array.from(conversations.values())
      .sort((a, b) => b.lastMessage.createdAt!.getTime() - a.lastMessage.createdAt!.getTime());
  }

  async createFriendship(insertFriendship: InsertFriendship): Promise<Friendship> {
    const friendship: Friendship = {
      ...insertFriendship,
      id: this.currentFriendshipId++,
      createdAt: new Date(),
    };
    this.friendships.set(friendship.id, friendship);
    return friendship;
  }

  async getFriendships(userId: number): Promise<(Friendship & { friend: User })[]> {
    return Array.from(this.friendships.values())
      .filter(friendship => 
        (friendship.userId === userId || friendship.friendId === userId) && 
        friendship.status === 'accepted'
      )
      .map(friendship => ({
        ...friendship,
        friend: this.users.get(friendship.userId === userId ? friendship.friendId : friendship.userId)!,
      })).filter(f => f.friend);
  }

  async getFriendRequests(userId: number): Promise<(Friendship & { user: User })[]> {
    return Array.from(this.friendships.values())
      .filter(friendship => friendship.friendId === userId && friendship.status === 'pending')
      .map(friendship => ({
        ...friendship,
        user: this.users.get(friendship.userId)!,
      })).filter(f => f.user);
  }

  async updateFriendshipStatus(id: number, status: string): Promise<Friendship | undefined> {
    const friendship = this.friendships.get(id);
    if (!friendship) return undefined;
    
    const updatedFriendship = { ...friendship, status };
    this.friendships.set(id, updatedFriendship);
    return updatedFriendship;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const notification: Notification = {
      ...insertNotification,
      id: this.currentNotificationId++,
      createdAt: new Date(),
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  async getUserNotifications(userId: number): Promise<(Notification & { fromUser?: User })[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .map(notification => ({
        ...notification,
        fromUser: notification.fromUserId ? this.users.get(notification.fromUserId) : undefined,
      }));
  }

  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
}

export const storage = new MemStorage();
