import { useEffect, useMemo, useState } from "react";
import { Clock3, SearchX, UserRoundPlus, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/toast";
import SearchInput from "../../components/ui/SearchInput";
import SectionTitle from "../../components/ui/SectionTitle";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import FriendCard from "../../components/social/FriendCard";
import { api } from "../../lib/api";

const SEARCH_PAGE_SIZE = 4;
const REQUEST_PAGE_SIZE = 4;
const FRIEND_PAGE_SIZE = 6;

function FriendsPage() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [syncing, setSyncing] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const [friendsPage, setFriendsPage] = useState(1);

  async function refresh() {
    setSyncing(true);

    try {
      const [friendsPayload, requestsPayload] = await Promise.all([
        api.listFriends(token),
        api.listFriendRequests(token)
      ]);

      setFriends(friendsPayload.data);
      setRequests(requestsPayload.data);
    } catch (error) {
      toast({
        title: "Không tải được danh sách bạn bè",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, [token]);

  const friendIds = useMemo(
    () => new Set(friends.map((friendship) => friendship.friend.userId)),
    [friends]
  );

  const requestMap = useMemo(
    () => new Map(requests.map((request) => [request.friend.userId, request])),
    [requests]
  );

  const searchResults = useMemo(
    () => results.filter((item) => item.userId !== user?.userId),
    [results, user?.userId]
  );

  const paginatedSearchResults = useMemo(
    () =>
      searchResults.slice(
        (searchPage - 1) * SEARCH_PAGE_SIZE,
        searchPage * SEARCH_PAGE_SIZE
      ),
    [searchPage, searchResults]
  );

  const paginatedRequests = useMemo(
    () =>
      requests.slice(
        (requestPage - 1) * REQUEST_PAGE_SIZE,
        requestPage * REQUEST_PAGE_SIZE
      ),
    [requestPage, requests]
  );

  const paginatedFriends = useMemo(
    () =>
      friends.slice(
        (friendsPage - 1) * FRIEND_PAGE_SIZE,
        friendsPage * FRIEND_PAGE_SIZE
      ),
    [friends, friendsPage]
  );

  useEffect(() => {
    setSearchPage((current) =>
      current > Math.max(1, Math.ceil(searchResults.length / SEARCH_PAGE_SIZE)) ? 1 : current
    );
  }, [searchResults.length]);

  useEffect(() => {
    setRequestPage((current) =>
      current > Math.max(1, Math.ceil(requests.length / REQUEST_PAGE_SIZE)) ? 1 : current
    );
  }, [requests.length]);

  useEffect(() => {
    setFriendsPage((current) =>
      current > Math.max(1, Math.ceil(friends.length / FRIEND_PAGE_SIZE)) ? 1 : current
    );
  }, [friends.length]);

  async function handleSearch() {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setResults([]);
      setSearchPage(1);
      return;
    }

    setSearching(true);

    try {
      const payload = await api.searchUsers(normalizedQuery, token);
      setResults(payload.data);
      setSearchPage(1);
    } catch (error) {
      toast({
        title: "Không thể tìm kiếm người dùng",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  }

  async function runAction(actionKey, action, successTitle, successDescription = "") {
    setBusyKey(actionKey);

    try {
      await action();
      toast({
        title: successTitle,
        description: successDescription
      });
      await refresh();
    } catch (error) {
      toast({
        title: "Thao tác thất bại",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="page-stack friends-page">
      <section className="panel friends-panel friends-panel--search">
        <SectionTitle
          eyebrow="Bạn bè"
          title="Tìm và kết nối người chơi"
          meta={syncing ? "Đang đồng bộ" : `${friends.length} bạn`}
        />

        <SearchInput
          value={query}
          onChange={setQuery}
          onSubmit={handleSearch}
          placeholder="Tìm tên đăng nhập hoặc tên hiển thị"
          buttonLabel={searching ? "Đang tìm..." : "Tìm kiếm"}
          disabled={searching || syncing}
        />

        {searchResults.length ? (
          <>
            <div className="friends-search-results">
              {paginatedSearchResults.map((item) => {
                const existingRequest = requestMap.get(item.userId);
                const alreadyFriend = friendIds.has(item.userId);
                const isBusy = busyKey === `search:${item.userId}`;
                let badge = "";
                let action = null;

                if (alreadyFriend) {
                  badge = "Đã kết bạn";
                  action = (
                    <button type="button" className="secondary-button" disabled>
                      Đã là bạn
                    </button>
                  );
                } else if (existingRequest) {
                  badge = existingRequest.isRequester ? "Đã gửi" : "Đang chờ";
                  action = (
                    <button type="button" className="secondary-button" disabled>
                      {existingRequest.isRequester ? "Đã gửi lời mời" : "Có lời mời"}
                    </button>
                  );
                } else {
                  action = (
                    <button
                      type="button"
                      className="primary-button"
                      disabled={isBusy}
                      onClick={() =>
                        runAction(
                          `search:${item.userId}`,
                          () => api.sendFriendRequest(token, item.userId),
                          "Đã gửi lời mời kết bạn",
                          `Lời mời đã được gửi tới ${item.displayName || item.username}.`
                        )
                      }
                    >
                      {isBusy ? "Đang gửi..." : "Kết bạn"}
                    </button>
                  );
                }

                return (
                  <FriendCard
                    key={item.userId}
                    name={item.displayName || item.username}
                    subtitle={`@${item.username}`}
                    description="Người dùng trong hệ thống."
                    badge={badge}
                    actions={action}
                  />
                );
              })}
            </div>
            <Pagination
              page={searchPage}
              totalPages={Math.ceil(searchResults.length / SEARCH_PAGE_SIZE)}
              onPageChange={setSearchPage}
            />
          </>
        ) : (
          <EmptyState
            icon={query.trim() ? SearchX : UserRoundPlus}
            title={query.trim() ? "Không tìm thấy người phù hợp" : "Bắt đầu từ một tìm kiếm"}
            description={
              query.trim()
                ? "Thử đổi từ khóa hoặc nhập đúng tên đăng nhập."
                : "Nhập tên hiển thị hoặc tên đăng nhập để tìm người dùng."
            }
          />
        )}
      </section>

      <div className="split-layout friends-layout">
        <section className="panel friends-panel">
          <SectionTitle
            eyebrow="Lời mời"
            title="Đang chờ xử lý"
            meta={`${requests.length} mục`}
          />

          <div className="friends-stack">
            {requests.length ? (
              paginatedRequests.map((request) => {
                const isBusy = busyKey === `request:${request.friendshipId}`;

                return (
                  <FriendCard
                    key={request.friendshipId}
                    name={request.friend.displayName || request.friend.username}
                    subtitle={`@${request.friend.username}`}
                    description={
                      request.isRequester
                        ? "Đang chờ phản hồi."
                        : "Đã gửi lời mời kết bạn cho bạn."
                    }
                    badge={request.isRequester ? "Đã gửi" : "Mới"}
                    actions={
                      request.isRequester ? (
                        <button type="button" className="secondary-button" disabled>
                          Đang chờ phản hồi
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="primary-button"
                            disabled={isBusy}
                            onClick={() =>
                              runAction(
                                `request:${request.friendshipId}`,
                                () => api.updateFriendRequest(token, request.friendshipId, "accept"),
                                "Đã chấp nhận lời mời",
                                `${request.friend.displayName || request.friend.username} đã được thêm vào danh sách bạn bè.`
                              )
                            }
                          >
                            {isBusy ? "Đang xử lý..." : "Chấp nhận"}
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={isBusy}
                            onClick={() =>
                              runAction(
                                `request:${request.friendshipId}`,
                                () => api.updateFriendRequest(token, request.friendshipId, "reject"),
                                "Đã từ chối lời mời",
                                "Lời mời đã được đóng lại."
                              )
                            }
                          >
                            Từ chối
                          </button>
                        </>
                      )
                    }
                  />
                );
              })
            ) : (
              <EmptyState
                icon={Clock3}
                title="Chưa có lời mời nào"
                description="Lời mời mới sẽ xuất hiện tại đây."
              />
            )}
          </div>
          <Pagination
            page={requestPage}
            totalPages={Math.ceil(requests.length / REQUEST_PAGE_SIZE)}
            onPageChange={setRequestPage}
          />
        </section>

        <section className="panel friends-panel">
          <SectionTitle
            eyebrow="Danh sách"
            title="Bạn bè của bạn"
            meta={`${friends.length} người`}
          />

          <div className="friends-stack">
            {friends.length ? (
              paginatedFriends.map((friendship) => {
                const isBusy = busyKey === `friend:${friendship.friendshipId}`;

                return (
                  <FriendCard
                    key={friendship.friendshipId}
                    name={friendship.friend.displayName || friendship.friend.username}
                    subtitle={`@${friendship.friend.username}`}
                    description="Đã kết nối trong hệ thống."
                    badge="Đã kết nối"
                    actions={
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={isBusy}
                        onClick={() =>
                          runAction(
                            `friend:${friendship.friendshipId}`,
                            () => api.removeFriendship(token, friendship.friendshipId),
                            "Đã xóa khỏi danh sách bạn bè",
                            `${friendship.friend.displayName || friendship.friend.username} không còn trong danh sách kết nối của bạn.`
                          )
                        }
                      >
                        {isBusy ? "Đang xóa..." : "Xóa bạn"}
                      </button>
                    }
                  />
                );
              })
            ) : (
              <EmptyState
                icon={Users}
                title="Danh sách bạn bè đang trống"
                description="Khi lời mời được chấp nhận, người dùng sẽ xuất hiện tại đây."
              />
            )}
          </div>
          <Pagination
            page={friendsPage}
            totalPages={Math.ceil(friends.length / FRIEND_PAGE_SIZE)}
            onPageChange={setFriendsPage}
          />
        </section>
      </div>
    </div>
  );
}

export default FriendsPage;
