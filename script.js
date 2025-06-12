// WhatsUp by Mojar - Main JavaScript Application
class WhatsUpApp {
    constructor() {
        this.currentUser = null;
        this.socket = null;
        this.currentPage = 'feed';
        this.selectedChat = null;
        this.posts = [];
        this.users = [];
        this.conversations = [];
        this.notifications = [];
        this.friends = [];
        this.friendRequests = [];

        this.init();
    }

    init() {
        // Initialize the application
        this.initializeEventListeners();
        this.checkAuthStatus();
        this.initializeSocket();
        this.loadSampleData();
    }

    initializeEventListeners() {
        // Auth form
        const authForm = document.getElementById('authForm');
        const toggleAuth = document.getElementById('toggleAuth');
        const logoutBtn = document.getElementById('logoutBtn');

        authForm?.addEventListener('submit', (e) => this.handleAuth(e));
        toggleAuth?.addEventListener('click', () => this.toggleAuthMode());
        logoutBtn?.addEventListener('click', () => this.logout());

        // Navigation
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page) this.navigateTo(page);
            });
        });

        // Profile button
        document.querySelector('.profile-btn')?.addEventListener('click', () => {
            this.navigateTo('profile');
        });

        // Post creation
        const createPostBtn = document.getElementById('createPostBtn');
        const profileCreatePostBtn = document.getElementById('profileCreatePostBtn');
        
        createPostBtn?.addEventListener('click', () => this.createPost());
        profileCreatePostBtn?.addEventListener('click', () => this.createPost(true));

        // Message sending
        const sendMessageBtn = document.getElementById('sendMessageBtn');
        const messageText = document.getElementById('messageText');
        
        sendMessageBtn?.addEventListener('click', () => this.sendMessage());
        messageText?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Auto-resize textareas
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', this.autoResizeTextarea);
        });
    }

    autoResizeTextarea(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('whatsup_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        } else {
            this.showLoginPage();
        }
    }

    toggleAuthMode() {
        const nameFields = document.getElementById('nameFields');
        const emailField = document.getElementById('email');
        const toggleBtn = document.getElementById('toggleAuth');
        const loginTitle = document.getElementById('loginTitle');
        const loginSubtitle = document.getElementById('loginSubtitle');
        const authButton = document.getElementById('authButton');
        const forgotPassword = document.getElementById('forgotPassword');

        const isLogin = nameFields.style.display === 'none';

        if (isLogin) {
            // Switch to register
            nameFields.style.display = 'grid';
            emailField.style.display = 'block';
            toggleBtn.textContent = 'Already have an account?';
            loginTitle.textContent = 'Join WhatsUp';
            loginSubtitle.textContent = 'Create your account to start connecting.';
            authButton.textContent = 'Sign Up';
            forgotPassword.style.display = 'none';
        } else {
            // Switch to login
            nameFields.style.display = 'none';
            emailField.style.display = 'none';
            toggleBtn.textContent = 'Create New Account';
            loginTitle.textContent = 'Welcome to WhatsUp';
            loginSubtitle.textContent = 'Connect with friends and the world around you.';
            authButton.textContent = 'Log In';
            forgotPassword.style.display = 'block';
        }
    }

    async handleAuth(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const isLogin = document.getElementById('nameFields').style.display === 'none';
        
        const authData = {
            username: formData.get('username') || document.getElementById('username').value,
            password: formData.get('password') || document.getElementById('password').value
        };

        if (!isLogin) {
            authData.firstName = document.getElementById('firstName').value;
            authData.lastName = document.getElementById('lastName').value;
            authData.email = document.getElementById('email').value;
        }

        // Show loading
        const authButton = document.getElementById('authButton');
        authButton.disabled = true;
        authButton.textContent = 'Please wait...';

        try {
            if (isLogin) {
                await this.login(authData);
            } else {
                await this.register(authData);
            }
        } catch (error) {
            alert(error.message || 'Authentication failed');
        } finally {
            authButton.disabled = false;
            authButton.textContent = isLogin ? 'Log In' : 'Sign Up';
        }
    }

    async login(credentials) {
        // Check demo account
        if (credentials.username === 'Daniel Mojar' && credentials.password === 'danielot') {
            this.currentUser = {
                id: 1,
                username: 'Daniel Mojar',
                firstName: 'Daniel',
                lastName: 'Mojar',
                email: 'daniel@whatsup.com',
                bio: 'Founder & CEO at WhatsUp • Platform Owner',
                profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
                coverPhoto: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400',
                isVerified: true,
                isOnline: true
            };
            
            localStorage.setItem('whatsup_user', JSON.stringify(this.currentUser));
            this.showMainApp();
            return;
        }

        // Check existing users
        const existingUser = this.users.find(u => 
            u.username === credentials.username && u.password === credentials.password
        );

        if (existingUser) {
            this.currentUser = existingUser;
            localStorage.setItem('whatsup_user', JSON.stringify(this.currentUser));
            this.showMainApp();
        } else {
            throw new Error('Invalid credentials');
        }
    }

    async register(userData) {
        // Check if username exists
        if (this.users.find(u => u.username === userData.username)) {
            throw new Error('Username already exists');
        }

        // Create new user
        const newUser = {
            id: this.users.length + 2, // Start from 2 to avoid conflict with demo account
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password,
            bio: '',
            profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.firstName + ' ' + userData.lastName)}&background=1877f2&color=fff&size=200`,
            coverPhoto: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400',
            isVerified: false,
            isOnline: true
        };

        this.users.push(newUser);
        this.currentUser = newUser;
        localStorage.setItem('whatsup_user', JSON.stringify(this.currentUser));
        this.showMainApp();
    }

    logout() {
        this.currentUser = null;
        this.selectedChat = null;
        localStorage.removeItem('whatsup_user');
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.showLoginPage();
    }

    showLoginPage() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        this.updateUserInterface();
        this.navigateTo('feed');
    }

    updateUserInterface() {
        if (!this.currentUser) return;

        // Update user avatars and names
        const avatars = document.querySelectorAll('#userAvatar, #sidebarAvatar, #postAvatar, #profilePostAvatar');
        avatars.forEach(avatar => {
            avatar.src = this.currentUser.profilePicture;
            avatar.alt = this.currentUser.username;
        });

        // Update user names
        const names = document.querySelectorAll('#sidebarName');
        names.forEach(name => {
            name.textContent = this.currentUser.username;
            if (this.currentUser.isVerified) {
                const badge = name.querySelector('.verified-badge');
                if (badge) badge.style.display = 'inline-flex';
            }
        });

        // Update profile page
        this.updateProfilePage();

        // Update post placeholders
        const postPlaceholders = document.querySelectorAll('#postContent, #profilePostContent');
        postPlaceholders.forEach(placeholder => {
            placeholder.placeholder = `What's on your mind, ${this.currentUser.firstName || this.currentUser.username}?`;
        });
    }

    updateProfilePage() {
        if (!this.currentUser) return;

        // Profile picture and cover
        document.getElementById('profilePicture').src = this.currentUser.profilePicture;
        document.getElementById('profileCoverPhoto').src = this.currentUser.coverPhoto;
        
        // Profile name and verification
        const profileName = document.getElementById('profileName');
        profileName.textContent = this.currentUser.username;
        
        if (this.currentUser.isVerified) {
            document.getElementById('profileVerifiedBadge').style.display = 'flex';
            document.getElementById('profileVerifiedIcon').style.display = 'inline-flex';
        }

        // Profile bio and stats
        document.getElementById('profileBioText').textContent = this.currentUser.bio || 'WhatsUp User';
        
        const userPosts = this.posts.filter(p => p.userId === this.currentUser.id);
        document.getElementById('profileStats').textContent = `${this.friends.length} friends • ${userPosts.length} posts`;

        // About section
        this.updateAboutSection();

        // Friends count
        document.getElementById('profileFriendsCount').textContent = `${this.friends.length} friends`;
        
        // Load user's posts
        this.loadProfilePosts();
    }

    updateAboutSection() {
        const aboutContent = document.getElementById('aboutContent');
        aboutContent.innerHTML = '';

        const aboutItems = [
            { icon: 'fas fa-info-circle', text: this.currentUser.bio || 'No bio available' },
            { icon: 'fas fa-envelope', text: this.currentUser.email },
            { icon: 'fas fa-map-marker-alt', text: 'Lives in San Francisco, CA' },
            { icon: 'fas fa-calendar', text: `Joined ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` }
        ];

        if (this.currentUser.isOnline) {
            aboutItems.push({ icon: 'fas fa-circle', text: 'Active now', color: '#42b883' });
        }

        aboutItems.forEach(item => {
            if (item.text) {
                const aboutItem = document.createElement('div');
                aboutItem.className = 'about-item';
                aboutItem.innerHTML = `
                    <i class="${item.icon}" ${item.color ? `style="color: ${item.color}"` : ''}></i>
                    <span>${item.text}</span>
                `;
                aboutContent.appendChild(aboutItem);
            }
        });
    }

    navigateTo(page) {
        // Update active navigation items
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Show/hide pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}Page`).classList.add('active');

        this.currentPage = page;

        // Load page-specific content
        switch (page) {
            case 'feed':
                this.loadFeed();
                break;
            case 'messenger':
                this.loadMessenger();
                break;
            case 'friends':
                this.loadFriends();
                break;
            case 'notifications':
                this.loadNotifications();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }

    loadFeed() {
        this.renderPosts();
        this.renderOnlineFriends();
        this.renderSuggestedFriends();
        this.renderStories();
    }

    renderPosts() {
        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = '';

        // Sort posts by creation date (newest first)
        const sortedPosts = [...this.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        sortedPosts.forEach(post => {
            const postElement = this.createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    }

    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        
        const user = this.users.find(u => u.id === post.userId) || this.currentUser;
        const timeAgo = this.formatTimeAgo(post.createdAt);

        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-user-info">
                    <img src="${user.profilePicture}" alt="${user.username}" class="post-user-avatar">
                    <div>
                        <div class="post-user-name">
                            ${user.username}
                            ${user.isVerified ? '<span class="verified-badge"><i class="fas fa-check"></i></span>' : ''}
                        </div>
                        <div class="post-time">${timeAgo} • <i class="fas fa-globe-americas"></i></div>
                    </div>
                </div>
                <button class="post-menu-btn">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
            
            <div class="post-content">
                <div class="post-text">${post.content}</div>
                ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image" class="post-image">` : ''}
            </div>
            
            <div class="post-stats">
                <div class="post-reactions">
                    <span><i class="fas fa-thumbs-up" style="color: #1877f2;"></i> ${post.likes} likes</span>
                    <span>${post.comments} comments</span>
                    <span>${post.shares} shares</span>
                </div>
            </div>
            
            <div class="post-actions-bar">
                <button class="post-action" onclick="app.likePost(${post.id})">
                    <i class="far fa-thumbs-up"></i>
                    <span>Like</span>
                </button>
                <button class="post-action">
                    <i class="far fa-comment"></i>
                    <span>Comment</span>
                </button>
                <button class="post-action">
                    <i class="far fa-share"></i>
                    <span>Share</span>
                </button>
            </div>
        `;

        return postDiv;
    }

    renderStories() {
        const storiesContainer = document.getElementById('storiesContainer');
        storiesContainer.innerHTML = '';

        // Add friend stories
        this.users.slice(0, 4).forEach(user => {
            const storyDiv = document.createElement('div');
            storyDiv.className = 'story';
            storyDiv.innerHTML = `
                <div style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); padding: 3px; border-radius: 12px;">
                    <img src="${user.profilePicture}" alt="${user.username}'s Story" style="width: 90px; height: 122px; border-radius: 9px; object-fit: cover;">
                </div>
                <div style="text-align: center; font-size: 12px; font-weight: 600; margin-top: 4px;">${user.firstName || user.username}</div>
            `;
            storiesContainer.appendChild(storyDiv);
        });
    }

    renderOnlineFriends() {
        const container = document.getElementById('onlineFriendsContainer');
        container.innerHTML = '';

        const onlineUsers = this.users.filter(u => u.isOnline && u.id !== this.currentUser.id).slice(0, 6);
        
        onlineUsers.forEach(friend => {
            const friendDiv = document.createElement('div');
            friendDiv.className = 'friend-item';
            friendDiv.innerHTML = `
                <div class="friend-avatar">
                    <img src="${friend.profilePicture}" alt="${friend.username}">
                    <div class="online-indicator"></div>
                </div>
                <span class="friend-name">${friend.username}</span>
            `;
            friendDiv.addEventListener('click', () => this.startChat(friend));
            container.appendChild(friendDiv);
        });
    }

    renderSuggestedFriends() {
        const container = document.getElementById('suggestedFriendsContainer');
        container.innerHTML = '';

        const suggested = this.users.filter(u => u.id !== this.currentUser.id).slice(0, 2);
        
        suggested.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'suggested-user';
            userDiv.innerHTML = `
                <img src="${user.profilePicture}" alt="${user.username}" class="friend-avatar">
                <div class="suggested-user-info">
                    <div class="suggested-user-name">${user.username}</div>
                    <div class="mutual-friends">${Math.floor(Math.random() * 10) + 1} mutual friends</div>
                    <div class="suggested-user-actions">
                        <button class="add-friend-btn" onclick="app.sendFriendRequest(${user.id})">Add Friend</button>
                        <button class="remove-btn">Remove</button>
                    </div>
                </div>
            `;
            container.appendChild(userDiv);
        });
    }

    createPost(isProfile = false) {
        const contentId = isProfile ? 'profilePostContent' : 'postContent';
        const content = document.getElementById(contentId).value.trim();
        
        if (!content) return;

        const newPost = {
            id: this.posts.length + 1,
            userId: this.currentUser.id,
            content: content,
            imageUrl: null, // Could be extended to handle image uploads
            likes: 0,
            comments: 0,
            shares: 0,
            createdAt: new Date().toISOString()
        };

        this.posts.unshift(newPost);
        document.getElementById(contentId).value = '';
        
        if (isProfile) {
            this.loadProfilePosts();
        } else {
            this.renderPosts();
        }

        // Show success message
        this.showToast('Post created successfully!');
    }

    likePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            post.likes++;
            this.renderPosts();
            if (this.currentPage === 'profile') {
                this.loadProfilePosts();
            }
        }
    }

    loadMessenger() {
        this.renderConversations();
        
        // Start with AI chat by default
        const aiChat = {
            user: {
                id: 0,
                username: 'Artificial Intelligence',
                profilePicture: null,
                isVerified: true
            }
        };
        this.selectChat(aiChat);
    }

    renderConversations() {
        const container = document.getElementById('conversationsContainer');
        container.innerHTML = '';

        // Add AI conversation
        const aiConversation = document.createElement('div');
        aiConversation.className = 'conversation-item';
        aiConversation.innerHTML = `
            <div class="conversation-avatar">
                <div class="ai-avatar">
                    <i class="fas fa-robot"></i>
                </div>
            </div>
            <div class="conversation-info">
                <div class="conversation-name">
                    Artificial Intelligence
                    <span class="verified-badge"><i class="fas fa-check"></i></span>
                    <i class="fas fa-star" style="color: #f7b928; font-size: 12px; margin-left: 4px;"></i>
                </div>
                <div class="conversation-preview">Hello! How can I help you today?</div>
            </div>
            <div class="conversation-time">now</div>
        `;
        
        aiConversation.addEventListener('click', () => {
            this.selectChat({
                user: {
                    id: 0,
                    username: 'Artificial Intelligence',
                    profilePicture: null,
                    isVerified: true
                }
            });
        });
        
        container.appendChild(aiConversation);

        // Add user conversations
        this.users.filter(u => u.id !== this.currentUser.id).forEach(user => {
            const conversationDiv = document.createElement('div');
            conversationDiv.className = 'conversation-item';
            conversationDiv.innerHTML = `
                <div class="conversation-avatar">
                    <img src="${user.profilePicture}" alt="${user.username}">
                </div>
                <div class="conversation-info">
                    <div class="conversation-name">${user.username}</div>
                    <div class="conversation-preview">Start a conversation</div>
                </div>
                <div class="conversation-time">now</div>
            `;
            
            conversationDiv.addEventListener('click', () => this.selectChat({ user }));
            container.appendChild(conversationDiv);
        });
    }

    selectChat(conversation) {
        this.selectedChat = conversation;
        
        // Update active conversation
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget?.classList.add('active');

        // Show chat header and input
        document.getElementById('chatHeader').style.display = 'flex';
        document.getElementById('messageInput').style.display = 'flex';

        // Update chat header
        const chatAvatar = document.getElementById('chatAvatar');
        const chatUsername = document.getElementById('chatUsername');
        const chatStatus = document.getElementById('chatStatus');

        if (conversation.user.username === 'Artificial Intelligence') {
            chatAvatar.style.display = 'none';
            chatAvatar.nextElementSibling.innerHTML = '<div class="ai-avatar" style="width: 40px; height: 40px; border-radius: 50%;"><i class="fas fa-robot"></i></div>';
            chatUsername.innerHTML = 'Artificial Intelligence <span class="verified-badge"><i class="fas fa-check"></i></span>';
            chatStatus.textContent = 'Active now • AI Assistant';
        } else {
            chatAvatar.style.display = 'block';
            chatAvatar.src = conversation.user.profilePicture;
            chatUsername.textContent = conversation.user.username;
            chatStatus.textContent = 'Active now';
        }

        // Load messages
        this.loadMessages();
    }

    loadMessages() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';

        if (this.selectedChat?.user?.username === 'Artificial Intelligence') {
            // Show AI welcome message
            const welcomeMsg = document.createElement('div');
            welcomeMsg.className = 'message';
            welcomeMsg.innerHTML = `
                <div class="message-avatar ai-avatar" style="width: 32px; height: 32px;">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-bubble other">
                    Hello! I'm your AI assistant. I can help answer questions, provide information, or just have a friendly conversation. What would you like to know?
                    <div class="message-time">Just now</div>
                </div>
            `;
            container.appendChild(welcomeMsg);
        }
    }

    async sendMessage() {
        const messageText = document.getElementById('messageText');
        const content = messageText.value.trim();
        
        if (!content || !this.selectedChat) return;

        // Add user message
        this.addMessageToChat(content, true);
        messageText.value = '';

        if (this.selectedChat.user.username === 'Artificial Intelligence') {
            // Show typing indicator
            this.showTypingIndicator();
            
            try {
                const aiResponse = await this.getAIResponse(content);
                this.hideTypingIndicator();
                this.addMessageToChat(aiResponse, false, true);
            } catch (error) {
                this.hideTypingIndicator();
                this.addMessageToChat("I'm sorry, I'm having trouble connecting right now. Please try again later.", false, true);
            }
        } else {
            // Regular user message (would normally send via API)
            // For demo, just acknowledge the message
            setTimeout(() => {
                this.addMessageToChat("Thanks for your message! This is a demo response.", false);
            }, 1000);
        }
    }

    addMessageToChat(content, isOwn, isAI = false) {
        const container = document.getElementById('messagesContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'own' : ''}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (isOwn) {
            messageDiv.innerHTML = `
                <div class="message-bubble own">
                    ${content}
                    <div class="message-time">${time}</div>
                </div>
                <img src="${this.currentUser.profilePicture}" alt="${this.currentUser.username}" class="message-avatar">
            `;
        } else {
            const avatarHtml = isAI 
                ? '<div class="message-avatar ai-avatar" style="width: 32px; height: 32px;"><i class="fas fa-robot"></i></div>'
                : `<img src="${this.selectedChat.user.profilePicture}" alt="${this.selectedChat.user.username}" class="message-avatar">`;
                
            messageDiv.innerHTML = `
                ${avatarHtml}
                <div class="message-bubble other">
                    ${content}
                    <div class="message-time">${time}</div>
                </div>
            `;
        }
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    showTypingIndicator() {
        const container = document.getElementById('messagesContainer');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar ai-avatar" style="width: 32px; height: 32px;">
                <i class="fas fa-robot"></i>
            </div>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        typingDiv.id = 'typingIndicator';
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async getAIResponse(message) {
        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('AI service unavailable');
            }

            const data = await response.json();
            return data.response || "I'm sorry, I couldn't process that request.";
        } catch (error) {
            console.error('AI chat error:', error);
            // Fallback responses for demo
            const responses = [
                "That's an interesting question! I'd be happy to help you explore that topic further.",
                "I understand what you're asking. Let me think about the best way to explain this.",
                "Great point! There are several ways to look at this situation.",
                "I appreciate you sharing that with me. Here's what I think about it...",
                "That's a common question, and I'm glad you asked. Let me break it down for you."
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }

    startChat(user) {
        this.navigateTo('messenger');
        setTimeout(() => {
            this.selectChat({ user });
        }, 100);
    }

    loadFriends() {
        this.renderFriendRequests();
        this.renderCurrentFriends();
        this.renderSuggestedUsers();
    }

    renderFriendRequests() {
        const container = document.getElementById('friendRequestsContainer');
        const section = document.getElementById('friendRequestsSection');
        const badge = document.getElementById('requestsBadge');
        
        container.innerHTML = '';
        
        if (this.friendRequests.length === 0) {
            section.style.display = 'none';
            badge.textContent = '0';
            badge.style.display = 'none';
        } else {
            section.style.display = 'block';
            badge.textContent = this.friendRequests.length;
            badge.style.display = 'inline';
            
            this.friendRequests.forEach(request => {
                const requestDiv = this.createFriendCard(request, 'request');
                container.appendChild(requestDiv);
            });
        }
    }

    renderCurrentFriends() {
        const container = document.getElementById('currentFriendsContainer');
        const friendsCount = document.getElementById('friendsCount');
        
        container.innerHTML = '';
        friendsCount.textContent = `Your Friends (${this.friends.length})`;
        
        this.friends.forEach(friend => {
            const friendDiv = this.createFriendCard(friend, 'friend');
            container.appendChild(friendDiv);
        });
    }

    renderSuggestedUsers() {
        const container = document.getElementById('suggestedUsersContainer');
        container.innerHTML = '';
        
        const suggested = this.users.filter(u => 
            u.id !== this.currentUser.id && 
            !this.friends.find(f => f.id === u.id)
        );
        
        suggested.forEach(user => {
            const userDiv = this.createFriendCard(user, 'suggested');
            container.appendChild(userDiv);
        });
    }

    createFriendCard(user, type) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'friend-card';
        
        const onlineStatus = user.isOnline 
            ? '<span style="color: #42b883;"><i class="fas fa-circle" style="font-size: 8px; margin-right: 4px;"></i>Online</span>'
            : 'Offline';
            
        let actionsHtml = '';
        
        switch (type) {
            case 'request':
                actionsHtml = `
                    <button class="friend-action-btn primary" onclick="app.acceptFriendRequest(${user.id})">Confirm</button>
                    <button class="friend-action-btn secondary" onclick="app.declineFriendRequest(${user.id})">Delete</button>
                `;
                break;
            case 'friend':
                actionsHtml = `
                    <button class="friend-action-btn secondary" onclick="app.startChat(${JSON.stringify(user).replace(/"/g, '&quot;')})">Message</button>
                    <button class="friend-action-btn secondary">View Profile</button>
                `;
                break;
            case 'suggested':
                actionsHtml = `
                    <button class="friend-action-btn primary" onclick="app.sendFriendRequest(${user.id})">Add Friend</button>
                    <button class="friend-action-btn secondary">Remove</button>
                `;
                break;
        }
        
        cardDiv.innerHTML = `
            <img src="${user.profilePicture}" alt="${user.username}" class="friend-card-avatar">
            <div class="friend-card-name">${user.username}</div>
            <div class="friend-card-info">${type === 'friend' ? onlineStatus : `${Math.floor(Math.random() * 10) + 1} mutual friends`}</div>
            <div class="friend-card-actions">
                ${actionsHtml}
            </div>
        `;
        
        return cardDiv;
    }

    sendFriendRequest(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user && !this.friendRequests.find(r => r.id === userId)) {
            // In a real app, this would send a request to the server
            this.showToast(`Friend request sent to ${user.username}!`);
        }
    }

    acceptFriendRequest(userId) {
        const userIndex = this.friendRequests.findIndex(r => r.id === userId);
        if (userIndex > -1) {
            const user = this.friendRequests.splice(userIndex, 1)[0];
            this.friends.push(user);
            this.renderFriendRequests();
            this.renderCurrentFriends();
            this.showToast(`You are now friends with ${user.username}!`);
        }
    }

    declineFriendRequest(userId) {
        const userIndex = this.friendRequests.findIndex(r => r.id === userId);
        if (userIndex > -1) {
            this.friendRequests.splice(userIndex, 1);
            this.renderFriendRequests();
            this.showToast('Friend request declined.');
        }
    }

    loadNotifications() {
        const container = document.getElementById('notificationsContainer');
        container.innerHTML = '';
        
        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-bell"></i>
                    <p>No notifications yet</p>
                    <span>When you get notifications, they'll show up here</span>
                </div>
            `;
        } else {
            this.notifications.forEach(notification => {
                const notifDiv = this.createNotificationElement(notification);
                container.appendChild(notifDiv);
            });
        }
    }

    createNotificationElement(notification) {
        const notifDiv = document.createElement('div');
        notifDiv.className = `notification-item ${!notification.isRead ? 'unread' : ''}`;
        
        const iconInfo = this.getNotificationIcon(notification.type);
        const timeAgo = this.formatTimeAgo(notification.createdAt);
        
        notifDiv.innerHTML = `
            <img src="${notification.fromUser?.profilePicture || 'https://via.placeholder.com/48'}" alt="User" class="notification-avatar">
            <div class="notification-icon" style="background: ${iconInfo.color};">
                <i class="${iconInfo.icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-text">${notification.content}</div>
                <div class="notification-time">${timeAgo}</div>
                ${notification.type === 'friend_request' && !notification.isRead ? `
                    <div class="notification-actions">
                        <button class="notification-action-btn primary">Confirm</button>
                        <button class="notification-action-btn secondary">Delete</button>
                    </div>
                ` : ''}
            </div>
            ${!notification.isRead ? '<div class="unread-indicator"></div>' : ''}
        `;
        
        if (!notification.isRead) {
            notifDiv.addEventListener('click', () => {
                notification.isRead = true;
                this.loadNotifications();
            });
        }
        
        return notifDiv;
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'like':
                return { icon: 'fas fa-thumbs-up', color: '#1877f2' };
            case 'comment':
                return { icon: 'fas fa-comment', color: '#42b883' };
            case 'friend_request':
                return { icon: 'fas fa-user-plus', color: '#1877f2' };
            case 'message':
                return { icon: 'fas fa-envelope', color: '#8b5cf6' };
            default:
                return { icon: 'fas fa-bell', color: '#65676b' };
        }
    }

    loadProfile() {
        this.updateProfilePage();
    }

    loadProfilePosts() {
        const container = document.getElementById('profilePostsContainer');
        container.innerHTML = '';

        const userPosts = this.posts.filter(p => p.userId === this.currentUser.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (userPosts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--medium-gray);">
                    <i class="fas fa-sticky-note" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>No posts yet</p>
                    <span>Share your first post to get started!</span>
                </div>
            `;
        } else {
            userPosts.forEach(post => {
                const postElement = this.createPostElement(post);
                container.appendChild(postElement);
            });
        }

        // Update photos grid
        const photosGrid = document.getElementById('profilePhotosGrid');
        const postsWithImages = userPosts.filter(p => p.imageUrl);
        
        if (postsWithImages.length > 0) {
            photosGrid.innerHTML = '';
            postsWithImages.slice(0, 6).forEach(post => {
                const photoDiv = document.createElement('div');
                photoDiv.className = 'profile-photo-item';
                photoDiv.innerHTML = `<img src="${post.imageUrl}" alt="Photo">`;
                photosGrid.appendChild(photoDiv);
            });
        }
    }

    initializeSocket() {
        // Initialize Socket.IO for real-time features
        try {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('Connected to server');
                if (this.currentUser) {
                    this.socket.emit('join_room', this.currentUser.id);
                }
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
            });

            this.socket.on('new_message', (message) => {
                // Handle incoming messages
                if (this.selectedChat && message.senderId === this.selectedChat.user.id) {
                    this.addMessageToChat(message.content, false);
                }
            });
        } catch (error) {
            console.log('Socket.IO not available, running in offline mode');
        }
    }

    loadSampleData() {
        // Load sample users
        this.users = [
            {
                id: 2,
                username: 'Sarah Johnson',
                firstName: 'Sarah',
                lastName: 'Johnson',
                email: 'sarah@example.com',
                profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
                bio: 'Love traveling and photography 📸',
                isOnline: true,
                isVerified: false
            },
            {
                id: 3,
                username: 'Mike Chen',
                firstName: 'Mike',
                lastName: 'Chen',
                email: 'mike@example.com',
                profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
                bio: 'Software developer & tech enthusiast',
                isOnline: true,
                isVerified: false
            },
            {
                id: 4,
                username: 'Alex Rivera',
                firstName: 'Alex',
                lastName: 'Rivera',
                email: 'alex@example.com',
                profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
                bio: 'Artist and creative director',
                isOnline: false,
                isVerified: false
            }
        ];

        // Load sample posts
        this.posts = [
            {
                id: 1,
                userId: 2,
                content: 'Just had an amazing weekend at the mountains! Nature therapy is real 🏔️ #mountains #nature #weekend',
                imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
                likes: 47,
                comments: 12,
                shares: 3,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
            },
            {
                id: 2,
                userId: 3,
                content: 'Working on some exciting new projects! Can\'t wait to share what we\'ve been building 🚀 #coding #startup #innovation',
                imageUrl: null,
                likes: 23,
                comments: 8,
                shares: 2,
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
            },
            {
                id: 3,
                userId: 1,
                content: 'Excited to announce the launch of WhatsUp! 🚀 A new social platform built for genuine connections and meaningful conversations. Thank you to everyone who has supported this journey! #WhatsUp #SocialMedia #Innovation',
                imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
                likes: 128,
                comments: 45,
                shares: 23,
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
            }
        ];

        // Load sample notifications
        this.notifications = [
            {
                id: 1,
                type: 'like',
                content: 'Sarah Johnson liked your post',
                fromUser: this.users.find(u => u.id === 2),
                isRead: false,
                createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
            },
            {
                id: 2,
                type: 'comment',
                content: 'Mike Chen commented on your post',
                fromUser: this.users.find(u => u.id === 3),
                isRead: false,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
            }
        ];
    }

    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d`;
    }

    showToast(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #42b883;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the application
const app = new WhatsUpApp();