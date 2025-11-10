import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMessagesStore } from "../stores/messagesStore";
import { useProductsStore } from "../stores/productsStore";
import { formatRelativeTime } from "../utils/formatUtils";
import { apiClient } from "../api/base";
import Alert from "../components/shared/Alert";
import { useAlert } from "../hooks/useAlert";

function Messages() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { userId: routeUserId } = useParams();
  const location = useLocation();
  const { alertState, showError, closeAlert } = useAlert();

  const query = new URLSearchParams(location.search);
  const routeProductId = query.get("productId");

  // Zustand stores
  const {
    conversations,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    getMessages,
    findConversation,
  } = useMessagesStore();

  const { fetchProduct, getProductFromCache } = useProductsStore();

  // Local UI state
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [productDetails, setProductDetails] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [showChatView, setShowChatView] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Track if we've already created a conversation to prevent duplicates
  const createdConversationRef = useRef(false);
  const routeHandledRef = useRef(false);

  const endRef = useRef(null);

  // Get current messages from store
  const currentMessages = getMessages(selectedConversationId);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      if (token) {
        try {
          await fetchConversations(token);
        } catch (error) {
          console.error('Failed to load conversations:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [token, fetchConversations]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (endRef.current && currentMessages?.messages) {
      endRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "nearest",
        inline: "nearest"
      });
    }
  }, [currentMessages?.messages]);

  // Auto-refresh conversations and messages
  useEffect(() => {
    if (!token) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && token) {
        fetchConversations(token);
        if (selectedConversationId) {
          fetchMessages(selectedConversationId, token);
        }
      }
    };

    const intervalId = setInterval(() => {
      if (!document.hidden && token) {
        fetchConversations(token);
        if (selectedConversationId) {
          fetchMessages(selectedConversationId, token);
        }
      }
    }, 5000);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedConversationId, token, fetchConversations, fetchMessages]);

  // Mark messages as read
  useEffect(() => {
    if (selectedConversationId && showChatView && token) {
      markAsRead(selectedConversationId, token);
    }
  }, [selectedConversationId, showChatView, currentMessages, token, markAsRead]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId && token) {
      fetchMessages(selectedConversationId, token);
    }
  }, [selectedConversationId, token, fetchMessages]);

  // Fetch product details for all unique product IDs
  useEffect(() => {
    if (!conversations || conversations.length === 0) return;

    const uniqueProductIds = [
      ...new Set(
        conversations
          .map((c) => c.product_id)
          .filter((id) => id !== null && id !== undefined)
      ),
    ];

    const fetchProducts = async () => {
      for (const productId of uniqueProductIds) {
        if (!productDetails[productId]) {
          try {
            // Try cache first
            let product = getProductFromCache(productId);
            
            // If not in cache, fetch it
            if (!product) {
              product = await fetchProduct(productId);
            }
            
            if (product) {
              setProductDetails((prev) => ({
                ...prev,
                [productId]: product,
              }));
            }
          } catch (error) {
            console.error(`Failed to fetch product ${productId}:`, error);
          }
        }
      }
    };

    fetchProducts();
  }, [conversations, productDetails, fetchProduct, getProductFromCache]);

  // Handle route params for direct conversation access
  useEffect(() => {
    const handleRouteParams = async () => {
      // Prevent multiple executions
      if (routeHandledRef.current) return;
      
      if (!conversations || (!routeUserId && !routeProductId)) return;
      
      // Mark as handled before async operations
      routeHandledRef.current = true;

      const target = findConversation(routeProductId, routeUserId);

      if (target) {
        setSelectedProductId(target.product_id);
        setSelectedConversationId(target.id);
        setShowChatView(true);
        navigate("/messages", { replace: true });
        return;
      }

      // Only create conversation if we haven't already
      if (routeProductId && routeUserId && token && !createdConversationRef.current) {
        createdConversationRef.current = true;
        try {
          const initialMessage = query.get("msg") || "Hi! I'm interested in your product.";
          const res = await apiClient.request(`/api/messages/conversations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              product_id: Number(routeProductId),
              participant_ids: [Number(routeUserId)],
              first_message: initialMessage,
            }),
          });
          const newConv = typeof res.json === "function" ? await res.json() : res;

          await fetchConversations(token);
          setSelectedProductId(newConv.product_id ?? null);
          setSelectedConversationId(newConv.id ?? null);
          setShowChatView(true);
          navigate("/messages", { replace: true });
        } catch (err) {
          console.error("Failed to create conversation", err);
          showError("Error", err.message || "Failed to create conversation");
          createdConversationRef.current = false; // Reset on error
        }
      }
    };

    handleRouteParams();
  }, [routeUserId, routeProductId, conversations, token]);
  
  // Reset route handled ref when navigating away from messages with params
  useEffect(() => {
    if (!routeUserId && !routeProductId) {
      routeHandledRef.current = false;
      createdConversationRef.current = false;
    }
  }, [routeUserId, routeProductId]);

  // Group conversations by product
  const conversationsByProduct = new Map();
  (conversations || []).forEach((c) => {
    const pid = c.product_id;
    if (!pid) return;
    if (!conversationsByProduct.has(pid)) conversationsByProduct.set(pid, []);
    conversationsByProduct.get(pid).push(c);
  });

  // Get unique products with conversations
  const buyerProducts = Array.from(conversationsByProduct.keys()).map((pid) => ({
    id: pid,
    conversations: conversationsByProduct.get(pid).sort(
      (a, b) => (b.last_message_at || "").localeCompare(a.last_message_at || "")
    ),
  }));

  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    setSelectedConversationId(null);
    setShowChatView(false);
  };

  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
    setShowChatView(true);
  };

  const handleBackToConversations = () => {
    setShowChatView(false);
    setSelectedConversationId(null);
  };

  const handleBackToProducts = () => {
    setShowChatView(false);
    setSelectedConversationId(null);
    setSelectedProductId(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const body = messageText.trim();
    if (!body || !selectedConversationId || isSending || !token) return;

    setIsSending(true);
    try {
      await sendMessage(selectedConversationId, body, token);
      setMessageText("");
    } catch (err) {
      console.error("Send message error:", err);
      showError("Error", err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const renderProductItem = (entry) => {
    const convCount = entry.conversations?.length || 0;
    const latestCreatedAt = entry.conversations?.[0]?.last_message_at;
    const product = productDetails[entry.id];
    
    const totalUnread = entry.conversations?.reduce((sum, conv) => 
      sum + (conv.unread_count || 0), 0) || 0;
    
    const imageUrl = product?.images?.[0]?.url || "https://placehold.co/60x60.png";
    const productTitle = product?.title || `Product #${entry.id}`;

    return (
      <button
        key={entry.id}
        onClick={() => handleSelectProduct(entry.id)}
        className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition relative ${
          selectedProductId === entry.id
            ? "bg-blue-50 border-blue-200"
            : "bg-white border-gray-200"
        }`}
      >
        {totalUnread > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
        
        <img
          src={imageUrl}
          alt={productTitle}
          className="w-12 h-12 rounded object-cover border"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-semibold truncate">{productTitle}</p>
            {convCount > 1 && (
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full border">
                {convCount} chats
              </span>
            )}
          </div>
          {latestCreatedAt && (
            <p className="text-xs text-gray-500">
              {formatRelativeTime(latestCreatedAt)}
            </p>
          )}
        </div>
      </button>
    );
  };

  const renderConversationItem = (c) => {
    const other = c.participants?.find((p) => p.user_id !== user?.id);
    const displayName = other?.username || `User #${other?.user_id}` || "Conversation";
    const hasUnread = (c.unread_count || 0) > 0;
    
    return (
      <button
        key={c.id}
        onClick={() => handleSelectConversation(c.id)}
        className={`w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition relative ${
          selectedConversationId === c.id
            ? "bg-blue-50 border-blue-200"
            : "bg-white border-gray-200"
        }`}
      >
        {hasUnread && (
          <span className="absolute top-3 right-3 h-3 w-3 bg-red-500 rounded-full"></span>
        )}
        
        <p className={`font-medium truncate ${hasUnread ? 'font-bold' : ''}`}>
          {displayName}
        </p>
        {c.last_message_preview && (
          <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
            {c.last_message_preview}
          </p>
        )}
        <div className="text-xs text-gray-500 mt-1">
          {formatRelativeTime(c.last_message_at)}
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-gray-600">Loading conversations...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Messages</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Products Column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow flex flex-col h-[70vh]">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-lg font-semibold">My Products</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {(buyerProducts || []).length === 0 ? (
                    <p className="text-gray-500 text-sm">No conversations yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {buyerProducts.map(renderProductItem)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Initial prompt */}
            {!selectedProductId && !showChatView && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-8 h-[70vh] flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 mx-auto mb-4 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="text-lg font-medium">Click on a conversation</p>
                    <p className="text-sm mt-2">to see your messages!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Conversations List */}
            {selectedProductId && !showChatView && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow flex flex-col h-[70vh]">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Conversations</h2>
                    <button
                      onClick={handleBackToProducts}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      ← Back
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                      {(conversationsByProduct.get(selectedProductId) || []).map(
                        renderConversationItem
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat View */}
            {showChatView && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow flex flex-col h-[70vh]">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBackToConversations}
                        className="text-gray-600 hover:text-gray-900 transition"
                        title="Back to conversations"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <div className="font-semibold">
                        {(() => {
                          const conv = (conversations || []).find(
                            (c) => c.id === selectedConversationId
                          );
                          if (!conv) return "Chat";
                          const other = conv.participants?.find(
                            (p) => p.user_id !== user?.id
                          );
                          return other?.username || `User #${other?.user_id}` || "Chat";
                        })()}
                      </div>
                    </div>
                    {selectedConversationId && (
                      <button
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => token && fetchMessages(selectedConversationId, token)}
                        title="Refresh"
                      >
                        Refresh
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {!selectedConversationId && (
                      <div className="h-full w-full flex items-center justify-center text-gray-500">
                        Select a conversation to start chatting
                      </div>
                    )}

                    {Array.isArray(currentMessages?.messages) &&
                      currentMessages.messages.map((m) => {
                        const isOwn = m.sender_id === user?.id;
                        return (
                          <div
                            key={m.id}
                            className={`flex ${
                              isOwn ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2 border ${
                                isOwn
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-gray-50 text-gray-900 border-gray-200"
                              }`}
                            >
                              {m.body && (
                                <p className="whitespace-pre-wrap break-words">
                                  {m.body}
                                </p>
                              )}
                              <div
                                className={`mt-1 text-xs ${
                                  isOwn ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                {formatRelativeTime(m.created_at)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    <div ref={endRef} />
                  </div>

                  <form
                    onSubmit={handleSend}
                    className="p-3 border-t flex items-center gap-2"
                  >
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder={
                        selectedConversationId
                          ? "Type your message…"
                          : "Select a conversation first"
                      }
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={!selectedConversationId}
                    />
                    <button
                      type="submit"
                      disabled={!selectedConversationId || !messageText.trim() || isSending}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        !selectedConversationId || !messageText.trim() || isSending
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isSending ? "Sending..." : "Send"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {conversations && conversations.length === 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
              <p className="font-medium">No chats yet</p>
              <p className="text-sm">
                Go to a product page and use "Contact Seller" to start a conversation.
              </p>
            </div>
          )}
        </div>
      </div>

      <Alert
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.type === "error" ? "OK" : "Confirm"}
        showCancel={false}
      />
    </>
  );
}

export default Messages;
