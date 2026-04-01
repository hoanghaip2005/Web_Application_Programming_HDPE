import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MessagesSquare, SearchX, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/toast";
import SearchInput from "../../components/ui/SearchInput";
import SectionTitle from "../../components/ui/SectionTitle";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import ConversationListItem from "../../components/messages/ConversationListItem";
import MessageBubble from "../../components/messages/MessageBubble";
import { api } from "../../lib/api";

const CONVERSATION_PAGE_SIZE = 7;

function getConversationTitle(conversation, currentUserId) {
  const otherMembers = (conversation.members || []).filter(
    (member) => member.userId !== currentUserId,
  );
  const source = otherMembers.length
    ? otherMembers
    : conversation.members || [];

  if (!source.length) {
    return "Hội thoại mới";
  }

  return source
    .map((member) => member.displayName || member.username)
    .join(", ");
}

function buildMessagePreview(messageBody, maxLength = 64) {
  const normalized = String(messageBody || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

function getConversationActivityTime(conversation) {
  return new Date(
    conversation.latestMessageAt || conversation.createdAt || Date.now(),
  ).getTime();
}

function sortConversationsByActivity(conversations) {
  return [...conversations].sort(
    (left, right) =>
      getConversationActivityTime(right) - getConversationActivityTime(left),
  );
}

function buildConversationSummary(conversation) {
  const latestMessage = conversation.messages?.[conversation.messages.length - 1];

  return {
    conversationId: conversation.conversationId,
    conversationType: conversation.conversationType || "direct",
    createdAt: conversation.createdAt || latestMessage?.sentAt || new Date().toISOString(),
    latestMessageAt: latestMessage?.sentAt || conversation.latestMessageAt || null,
    latestMessagePreview: latestMessage
      ? buildMessagePreview(latestMessage.messageBody)
      : buildMessagePreview(conversation.latestMessagePreview),
    unreadCount: 0,
    members: conversation.members || [],
  };
}

function upsertConversationSummary(conversations, conversation) {
  const summary = buildConversationSummary(conversation);
  const existingConversation = conversations.find(
    (item) => item.conversationId === summary.conversationId,
  );
  const exists = conversations.some(
    (item) => item.conversationId === summary.conversationId,
  );
  const next = exists
    ? conversations.map((item) =>
        item.conversationId === summary.conversationId
          ? {
              ...item,
              ...summary,
              createdAt: summary.createdAt || item.createdAt,
            }
          : item,
      )
    : [
        {
          ...summary,
          createdAt: summary.createdAt || existingConversation?.createdAt,
        },
        ...conversations,
      ];

  return sortConversationsByActivity(next);
}

function MessagesPage() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [friends, setFriends] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [conversationQuery, setConversationQuery] = useState("");
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [openingConversationId, setOpeningConversationId] = useState("");
  const [creatingConversationId, setCreatingConversationId] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationPage, setConversationPage] = useState(1);
  const messageEndRef = useRef(null);
  const deferredConversationQuery = useDeferredValue(
    conversationQuery.trim().toLowerCase(),
  );

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [
    selectedConversation?.conversationId,
    selectedConversation?.messages?.length,
  ]);

  async function openConversation(conversationId) {
    if (!conversationId || openingConversationId === conversationId) {
      return;
    }

    setOpeningConversationId(conversationId);
    setLoadingThread(true);

    try {
      const payload = await api.getConversation(token, conversationId);
      startTransition(() => {
        setSelectedConversation(payload.data);
        setConversations((current) =>
          upsertConversationSummary(current, payload.data),
        );
      });
    } catch (error) {
      toast({
        title: "Không thể mở hội thoại",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setOpeningConversationId("");
      setLoadingThread(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoadingSidebar(true);

      try {
        const [conversationPayload, friendsPayload] = await Promise.all([
          api.listConversations(token),
          api.listFriends(token),
        ]);

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setConversations(conversationPayload.data);
          setFriends(friendsPayload.data);
        });

        const firstConversationId = conversationPayload.data[0]?.conversationId;
        if (firstConversationId) {
          setLoadingThread(true);
          const detailPayload = await api.getConversation(
            token,
            firstConversationId,
          );
          if (cancelled) {
            return;
          }

          startTransition(() => {
            setSelectedConversation(detailPayload.data);
            setConversations((current) =>
              upsertConversationSummary(current, detailPayload.data),
            );
          });
        } else {
          setSelectedConversation(null);
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "Không tải được dữ liệu tin nhắn",
            description: error.message,
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingSidebar(false);
          setLoadingThread(false);
        }
      }
    }

    bootstrap().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token, toast]);

  const filteredConversations = useMemo(() => {
    if (!deferredConversationQuery) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const title = getConversationTitle(
        conversation,
        user?.userId,
      ).toLowerCase();
      const preview = String(
        conversation.latestMessagePreview || "",
      ).toLowerCase();

      return (
        title.includes(deferredConversationQuery) ||
        preview.includes(deferredConversationQuery)
      );
    });
  }, [conversations, deferredConversationQuery, user?.userId]);

  const paginatedConversations = useMemo(
    () =>
      filteredConversations.slice(
        (conversationPage - 1) * CONVERSATION_PAGE_SIZE,
        conversationPage * CONVERSATION_PAGE_SIZE,
      ),
    [conversationPage, filteredConversations],
  );

  useEffect(() => {
    setConversationPage(1);
  }, [deferredConversationQuery]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredConversations.length / CONVERSATION_PAGE_SIZE),
    );

    setConversationPage((current) => (current > totalPages ? totalPages : current));
  }, [filteredConversations.length]);

  const friendIdsWithConversation = useMemo(() => {
    const ids = new Set();

    conversations.forEach((conversation) => {
      (conversation.members || []).forEach((member) => {
        if (member.userId !== user?.userId) {
          ids.add(member.userId);
        }
      });
    });

    return ids;
  }, [conversations, user?.userId]);

  const availableFriendsForNewConversation = useMemo(
    () =>
      friends.filter(
        (friendship) =>
          !friendIdsWithConversation.has(friendship.friend.userId),
      ),
    [friends, friendIdsWithConversation],
  );

  const selectedConversationTitle = useMemo(
    () => getConversationTitle(selectedConversation || {}, user?.userId),
    [selectedConversation, user?.userId],
  );

  async function handleCreateDirectConversation(friendUserId) {
    setCreatingConversationId(friendUserId);
    setLoadingThread(true);

    try {
      const payload = await api.createDirectConversation(token, friendUserId);
      setConversationQuery("");
      setConversationPage(1);
      startTransition(() => {
        setSelectedConversation(payload.data);
        setConversations((current) =>
          upsertConversationSummary(current, payload.data),
        );
      });
    } catch (error) {
      toast({
        title: "Không thể tạo hội thoại",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreatingConversationId("");
      setLoadingThread(false);
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    if (!selectedConversation || !messageBody.trim() || sending) {
      return;
    }

    setSending(true);
    const draftMessage = messageBody.trim();
    const currentConversation = selectedConversation;
    const currentConversationId = currentConversation.conversationId;
    const optimisticMessage = {
      messageId: `temp-${Date.now()}`,
      senderId: user?.userId,
      senderUsername: user?.username || user?.email || "Bạn",
      messageBody: draftMessage,
      sentAt: new Date().toISOString(),
    };
    const optimisticConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, optimisticMessage],
    };

    setMessageBody("");
    startTransition(() => {
      setSelectedConversation(optimisticConversation);
      setConversations((current) =>
        upsertConversationSummary(current, optimisticConversation),
      );
    });

    try {
      const payload = await api.sendMessage(
        token,
        currentConversationId,
        draftMessage,
      );
      startTransition(() => {
        setSelectedConversation((current) =>
          current?.conversationId === currentConversationId
            ? payload.data
            : current,
        );
        setConversations((current) =>
          upsertConversationSummary(current, payload.data),
        );
      });
    } catch (error) {
      startTransition(() => {
        setSelectedConversation((current) =>
          current?.conversationId === currentConversationId
            ? currentConversation
            : current,
        );
        setConversations((current) =>
          upsertConversationSummary(current, currentConversation),
        );
      });
      setMessageBody(draftMessage);
      toast({
        title: "Không thể gửi tin nhắn",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page-stack messages-page">
      <section className="panel messages-panel">
        <SectionTitle
          eyebrow="Tin nhắn"
          meta={`${conversations.length} hội thoại`}
        />

        <div className="messages-layout">
          <aside className="messages-sidebar">
            <SearchInput
              value={conversationQuery}
              onChange={setConversationQuery}
              onSubmit={() => {}}
              placeholder="Tìm hội thoại hoặc nội dung gần nhất"
              buttonLabel="Lọc"
              disabled={loadingSidebar}
            />

            <div className="messages-friends">
              <div className="messages-friends__head">
                <strong>Bắt đầu chat mới</strong>
                <span>{availableFriendsForNewConversation.length} bạn</span>
              </div>

              {availableFriendsForNewConversation.length ? (
                <div className="messages-friends__list">
                  {availableFriendsForNewConversation.map((friendship) => (
                    <button
                      key={friendship.friendshipId}
                      type="button"
                      className="secondary-button messages-friends__action"
                      disabled={
                        creatingConversationId === friendship.friend.userId
                      }
                      onClick={() =>
                        handleCreateDirectConversation(friendship.friend.userId)
                      }
                    >
                      {creatingConversationId === friendship.friend.userId
                        ? "Đang mở..."
                        : friendship.friend.displayName ||
                          friendship.friend.username}
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title={
                    friends.length
                      ? "Bạn đã có hội thoại với tất cả bạn bè"
                      : "Chưa có bạn để nhắn tin"
                  }
                  description={
                    friends.length
                      ? "Những người đã có chat sẽ chỉ xuất hiện ở danh sách hội thoại bên dưới."
                      : "Hãy kết bạn trước, sau đó bạn có thể mở hội thoại riêng tại đây."
                  }
                />
              )}
            </div>

            <div className="messages-conversation-list">
              {loadingSidebar ? (
                <EmptyState
                  icon={MessagesSquare}
                  title="Đang tải hội thoại"
                  description="Danh sách hội thoại đang được đồng bộ."
                />
              ) : filteredConversations.length ? (
                <>
                  {paginatedConversations.map((conversation) => (
                    <ConversationListItem
                      key={conversation.conversationId}
                      title={getConversationTitle(conversation, user?.userId)}
                      timestamp={
                        conversation.latestMessageAt || conversation.createdAt
                      }
                      unreadCount={conversation.unreadCount}
                      active={
                        selectedConversation?.conversationId ===
                        conversation.conversationId
                      }
                      loading={
                        openingConversationId === conversation.conversationId &&
                        loadingThread
                      }
                      onClick={() =>
                        openConversation(conversation.conversationId)
                      }
                    />
                  ))}
                  <Pagination
                    page={conversationPage}
                    totalPages={Math.ceil(
                      filteredConversations.length / CONVERSATION_PAGE_SIZE,
                    )}
                    onPageChange={setConversationPage}
                  />
                </>
              ) : (
                <EmptyState
                  icon={conversationQuery.trim() ? SearchX : MessagesSquare}
                  title={
                    conversationQuery.trim()
                      ? "Không có hội thoại phù hợp"
                      : "Chưa có hội thoại nào"
                  }
                  description={
                    conversationQuery.trim()
                      ? "Thử đổi từ khóa tìm kiếm hoặc chọn một người bạn để mở hội thoại mới."
                      : "Bạn có thể chọn một người bạn ở trên để bắt đầu nhắn tin."
                  }
                />
              )}
            </div>
          </aside>

          <section className="messages-thread">
            {selectedConversation ? (
              <>
                <div className="messages-thread__header">
                  <div className="messages-thread__title">
                    <h2>{selectedConversationTitle}</h2>
                    <p className="muted">
                      {selectedConversation.members.length} thành viên trong hội
                      thoại
                    </p>
                  </div>
                  {loadingThread ? (
                    <span className="muted">Đang đồng bộ hội thoại...</span>
                  ) : null}
                </div>

                <div className="messages-thread__body">
                  {selectedConversation.messages.length ? (
                    selectedConversation.messages.map((message) => (
                      <MessageBubble
                        key={message.messageId}
                        senderName={message.senderUsername}
                        body={message.messageBody}
                        sentAt={message.sentAt}
                        isOwn={message.senderId === user?.userId}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={MessagesSquare}
                      title="Chưa có tin nhắn nào"
                      description="Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện."
                    />
                  )}
                  <div ref={messageEndRef} />
                </div>

                <form
                  className="messages-composer"
                  onSubmit={handleSendMessage}
                >
                  <textarea
                    rows="3"
                    value={messageBody}
                    placeholder="Nhập nội dung tin nhắn..."
                    onChange={(event) => setMessageBody(event.target.value)}
                  />
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={sending || !messageBody.trim()}
                  >
                    {sending ? "Đang gửi..." : "Gửi tin nhắn"}
                  </button>
                </form>
              </>
            ) : (
              <div className="messages-thread__empty">
                <EmptyState
                  icon={MessagesSquare}
                  title="Chưa chọn hội thoại"
                  description="Chọn một hội thoại ở cột trái hoặc mở cuộc trò chuyện mới với bạn bè."
                />
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export default MessagesPage;
