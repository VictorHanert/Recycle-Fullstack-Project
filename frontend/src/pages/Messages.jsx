/*
Conversation → A chat thread linked to a product (product_id). It has participants and messages.
ConversationParticipant → A join table linking users to conversations (many-to-many). Each row means a user is part of a conversation.
Message → A message inside a conversation, sent by a user (sender_id). It stores the text body, timestamps, and supports soft-delete via deleted_at.

What there is needed, 
 - from the user ID show all the Conversations it has by showing all relevant products the right
 - Click on product to see the messages
 - Show messages in a chat style
 - Input box to send new messages
 - If you are the seller, you can see all conversations for your products by clicking on product and it will show all conversations for that product
 - Then click on those to open the chat on a specific conversation with a person
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useFetch } from "../hooks/useFetch";
import { formatRelativeTime } from "../utils/formatUtils";
import { apiClient } from "../api/base";
import Alert from "../components/Alert";
import { useAlert } from "../hooks/useAlert";

function Messages() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { userId: routeUserId } = useParams(); // optional – e.g. /messages/:userId (from ProductDetail "Contact Seller")
  const location = useLocation();
  const { alertState, showError, showInfo, closeAlert } = useAlert();

  const query = new URLSearchParams(location.search);
  const routeProductId = query.get("productId");

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageText, setMessageText] = useState("");

  // 1) Fetch all conversations for the logged-in user
  const {
    data: conversations,
    loading: convLoading,
    error: convError,
    refetch: refetchConversations
  } = useFetch("/api/conversations");

  // 2) Messages for the selected conversation
  const {
    data: messages,
    loading: msgLoading,
    error: msgError,
    refetch: refetchMessages
  } = useFetch(selectedConversationId ? `/api/conversations/${selectedConversationId}/messages` : null);

  // Auto-scroll to latest message when messages change
  const endRef = useRef(null);
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversationId]);

  // Group conversations by product id
  const conversationsByProduct = useMemo(() => {
    const map = new Map();
    (conversations || []).forEach((c) => {
      const pid = c.product?.id;
      if (!pid) return;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid).push(c);
    });
    return map; // Map<productId, Conversation[]>
  }, [conversations]);

  // Split view for seller vs buyer
  const { sellerProducts, buyerProducts } = useMemo(() => {
    const seller = [];
    const buyer = [];
    (conversations || []).forEach((c) => {
      const isSeller = c.product?.seller?.id === user?.id;
      const arr = isSeller ? seller : buyer;
      const pid = c.product?.id;
      if (!pid) return;
      if (!arr.find((p) => p.id === pid)) {
        arr.push({ id: pid, product: c.product, conversations: [] });
      }
    });

    // Attach conversations to each group entry
    seller.forEach((entry) => {
      entry.conversations = (conversationsByProduct.get(entry.id) || []).sort((a, b) =>
        (b.last_message?.created_at || b.created_at || "")
          .localeCompare(a.last_message?.created_at || a.created_at || "")
      );
    });
    buyer.forEach((entry) => {
      entry.conversations = conversationsByProduct.get(entry.id) || [];
    });

    return { sellerProducts: seller, buyerProducts: buyer };
  }, [conversations, conversationsByProduct, user?.id]);

  useEffect(() => {
      if ((!routeUserId && !routeProductId) || !conversations) return;

      // find a matching conversation: same product + that seller
      const target = conversations.find(
        (c) =>
          String(c.product?.id) === String(routeProductId) &&
          c.participants?.some((p) => String(p.id) === String(routeUserId))
      );

      if (target) {
        setSelectedProductId(target.product?.id || null);
        setSelectedConversationId(target.id);
      } else if (routeProductId) {
        // no existing conversation → create new one
        (async () => {
          try {
            const res = await apiClient.request(`/api/conversations`, {
              method: "POST",
              body: JSON.stringify({
                product_id: routeProductId,
                participant_id: routeUserId,
              }),
            });
            const newConv = await res.json();
            await refetchConversations();
            setSelectedProductId(newConv.product?.id);
            setSelectedConversationId(newConv.id);
          } catch (err) {
            console.error("Failed to create conversation", err);
          }
        })();
      }
    }, [routeUserId, routeProductId, conversations]);


  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    const convs = conversationsByProduct.get(productId) || [];
    // Buyer: usually a single conversation per product → open immediately
    if (convs.length === 1) {
      setSelectedConversationId(convs[0].id);
    } else {
      setSelectedConversationId(null);
    }
  };

  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const body = messageText.trim();
    if (!body || !selectedConversationId) return;

    try {
      await apiClient.request(`/api/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body })
      });
      setMessageText("");
      await refetchMessages();
      await refetchConversations();
    } catch (err) {
      console.error("Send message error:", err);
      showError("Error", err.message || "Failed to send message");
    }
  };

  const renderProductItem = (entry) => {
    const product = entry.product;
    const firstImage = product?.images?.[0]?.url;
    const convCount = entry.conversations?.length || 0;
    const latest = entry.conversations?.[0]?.last_message || entry.conversations?.[0];

    return (
      <button
        key={entry.id}
        onClick={() => handleSelectProduct(entry.id)}
        className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition ${
          selectedProductId === entry.id ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
        }`}
      >
        <img
          src={firstImage || "https://placehold.co/60x60.png"}
          alt={product?.title || "Product"}
          className="w-12 h-12 rounded object-cover border"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-semibold truncate">{product?.title || "Untitled product"}</p>
            {convCount > 1 && (
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full border">{convCount} chats</span>
            )}
          </div>
          {latest?.created_at && (
            <p className="text-xs text-gray-500">{formatRelativeTime(latest.created_at)}</p>
          )}
        </div>
      </button>
    );
  };

  const renderConversationItem = (c) => {
    const other = c.participants?.find((p) => p.id !== user?.id);
    return (
      <button
        key={c.id}
        onClick={() => handleSelectConversation(c.id)}
        className={`w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition ${
          selectedConversationId === c.id ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
        }`}
      >
        <p className="font-medium truncate">{other?.username || "Conversation"}</p>
        {c.last_message?.body && (
          <p className="text-sm text-gray-600 truncate">{c.last_message.body}</p>
        )}
        <div className="text-xs text-gray-500 mt-1">
          {formatRelativeTime(c.last_message?.created_at || c.created_at)}
        </div>
      </button>
    );
  };

  return (
    <>
      <div className="px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Messages</h1>

          {/* Loading / Error */}
          {(convLoading || convError) && (
            <div className="mb-4">
              {convLoading ? (
                <div className="text-gray-600">Loading conversations...</div>
              ) : (
                <div className="text-red-600">{convError}</div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT: Products list (both buyer & seller sections) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Buyer section */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">My Conversations</h2>
                  <span className="text-xs text-gray-500">Buyer view</span>
                </div>
                {buyerProducts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No conversations yet.</p>
                ) : (
                  <div className="space-y-2">
                    {buyerProducts.map(renderProductItem)}
                  </div>
                )}
              </div>

              {/* Seller section */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">My Product Conversations</h2>
                  <span className="text-xs text-gray-500">Seller view</span>
                </div>
                {sellerProducts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No conversations on your products yet.</p>
                ) : (
                  <div className="space-y-2">
                    {sellerProducts.map(renderProductItem)}
                  </div>
                )}
              </div>
            </div>

            {/* MIDDLE: for sellers, show the conversations for the selected product if there are multiple */}
            <div className="lg:col-span-1">
              {selectedProductId ? (
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold mb-3">Conversations</h2>
                  <div className="space-y-2">
                    {(conversationsByProduct.get(selectedProductId) || []).map(renderConversationItem)}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-4 h-full min-h-32 flex items-center justify-center text-gray-500">
                  Select a product to view its chats
                </div>
              )}
            </div>

            {/* RIGHT: chat view */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow flex flex-col h-[70vh]">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="font-semibold">
                    {(() => {
                      const conv = (conversations || []).find((c) => c.id === selectedConversationId);
                      if (!conv) return "Chat";
                      const other = conv.participants?.find((p) => p.id !== user?.id);
                      return other?.username || "Chat";
                    })()}
                  </div>
                  {selectedConversationId && (
                    <button
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => refetchMessages()}
                      title="Refresh"
                    >
                      Refresh
                    </button>
                  )}
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgLoading && selectedConversationId && (
                    <div className="text-gray-500">Loading messages…</div>
                  )}
                  {msgError && (
                    <div className="text-red-600">{msgError}</div>
                  )}
                  {!selectedConversationId && (
                    <div className="h-full w-full flex items-center justify-center text-gray-500">
                      Select a conversation to start chatting
                    </div>
                  )}

                  {Array.isArray(messages) && messages.map((m) => {
                    const isOwn = m.sender?.id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 border ${
            isOwn ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-900 border-gray-200"
          }`}>
                          {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                          <div className={`mt-1 text-xs ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
                            {formatRelativeTime(m.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>

                {/* Composer */}
                <form onSubmit={handleSend} className="p-3 border-t flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder={selectedConversationId ? "Type your message…" : "Select a conversation first"}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={!selectedConversationId}
                  />
                  <button
                    type="submit"
                    disabled={!selectedConversationId || !messageText.trim()}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      !selectedConversationId || !messageText.trim()
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Small helper for users who arrive with no conversations */}
          {conversations && conversations.length === 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
              <p className="font-medium">No chats yet</p>
              <p className="text-sm">Go to a product page and use “Contact Seller” to start a conversation.</p>
            </div>
          )}
        </div>
      </div>

      <Alert
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        onConfirm={alertState.onConfirm}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.type === 'error' ? 'OK' : 'Confirm'}
        showCancel={alertState.type !== 'error' && alertState.type !== 'info'}
      />
    </>
  );
}

export default Messages;



