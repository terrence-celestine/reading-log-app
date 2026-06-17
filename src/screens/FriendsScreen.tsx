// src/screens/FriendsScreen.tsx
import { useState, useEffect } from 'react';
import { UserPlus, BookOpen, Check, X, Send } from 'lucide-react';

interface FriendActivity {
  userId: string;
  username: string;
  email: string;
  currentlyReading: {
    title: string;
    author: string;
    pagesRead: number;
    totalPages: number;
    coverUrl?: string;
  } | null;
  lastFinished: {
    title: string;
    author: string;
    coverUrl?: string;
  } | null;
}

interface PendingRequest {
  friendshipId: string;
  username: string;
}

const FriendsScreen = () => {
  const [friends, setFriends] = useState<FriendActivity[]>([]);
  const [pendingReceived, setPendingReceived] = useState<PendingRequest[]>([]);
  const [pendingSent, setPendingSent] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUsername, setAddUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingRec, setSendingRec] = useState<string | null>(null);
  const [recBookId, setRecBookId] = useState('');
  const [recMessage, setRecMessage] = useState('');
  const [recSent, setRecSent] = useState<string | null>(null);
  const [myBooks, setMyBooks] = useState<{ id: string; title: string }[]>([]);

    useEffect(() => {
    fetch('/api/books/sync')
        .then(res => res.ok ? res.json() : [])
        .then(data => setMyBooks(data.filter((b: { deleted: boolean }) => !b.deleted)));
    }, []);

    const handleSendRec = async (toUserId: string) => {
        if (!recBookId) return;
        try {
          const res = await fetch('/api/recs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toUserId, bookId: recBookId, message: recMessage }),
          });
          if (res.ok) {
            setRecSent(toUserId);
            setSendingRec(null);
            setRecBookId('');
            setRecMessage('');
          }
        } catch (err) {
          console.error(err);
        }
      };

  const fetchFriends = () => {
    setLoading(true);
    fetch('/api/friends')
      .then(res => res.ok ? res.json() : { friends: [], pendingReceived: [], pendingSent: [] })
      .then(data => {
        setFriends(data.friends ?? []);
        setPendingReceived(data.pendingReceived ?? []);
        setPendingSent(data.pendingSent ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFriends(); }, []);

  const handleAddFriend = async () => {
    if (!addUsername.trim()) return;
    setAdding(true);
    setMessage('');
    try {
      const res = await fetch('/api/friends?action=request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresseeUsername: addUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Friend request sent!');
        setAddUsername('');
        setShowAddInput(false);
        fetchFriends();
      } else {
        setMessage(data.error);
      }
    } catch {
      setMessage('Something went wrong');
    } finally {
      setAdding(false);
    }
  };

  const handleRespond = async (friendshipId: string, action: 'accepted' | 'declined') => {
    await fetch('/api/friends?action=respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendshipId, action }),
    });
    fetchFriends();
  };

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[15px] font-medium text-[#2C2C2A]">Friends</h1>
        <button
          onClick={() => setShowAddInput(!showAddInput)}
          className="flex items-center gap-1.5 bg-[#2C2C2A] text-[#F7F5F0] text-[11px] font-medium px-3 py-1.5 rounded-full"
        >
          <UserPlus size={13} />
          Add friend
        </button>
      </div>

      {/* Add friend input */}
      {showAddInput && (
        <div className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-[12px] text-[#888780]">Enter their username to send a request</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={addUsername}
              onChange={e => setAddUsername(e.target.value)}
              placeholder="username…"
              className="flex-1 bg-[#F0EDE6] border border-[#E0DDD6] rounded-xl px-3 py-2 text-[13px] text-[#2C2C2A] placeholder:text-[#B4B2A9] outline-none focus:border-[#C8C5BE]"
            />
            <button
              onClick={handleAddFriend}
              disabled={adding}
              className="bg-[#2C2C2A] disabled:bg-[#C8C5BE] text-[#F7F5F0] text-[12px] font-medium px-4 py-2 rounded-xl flex items-center gap-1.5"
            >
              <Check size={13} />
              Send
            </button>
            <button
              onClick={() => { setShowAddInput(false); setAddUsername(''); setMessage(''); }}
              className="text-[#B4B2A9] px-2"
            >
              <X size={16} />
            </button>
          </div>
          {message && (
            <p className={`text-[12px] ${message.includes('sent') ? 'text-[#3B6D11]' : 'text-red-500'}`}>
              {message}
            </p>
          )}
        </div>
      )}

      {/* Pending received */}
      {pendingReceived.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Friend requests</p>
          {pendingReceived.map(req => (
            <div key={req.friendshipId} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EDEAE2] flex items-center justify-center text-[12px] font-medium text-[#2C2C2A]">
                {req.username.charAt(0).toUpperCase()}
              </div>
              <p className="text-[13px] font-medium text-[#2C2C2A] flex-1">{req.username}</p>
              <button
                onClick={() => handleRespond(req.friendshipId, 'accepted')}
                className="bg-[#2C2C2A] text-[#F7F5F0] text-[11px] font-medium px-3 py-1.5 rounded-full"
              >
                Accept
              </button>
              <button
                onClick={() => handleRespond(req.friendshipId, 'declined')}
                className="bg-[#EDEAE2] text-[#5F5E5A] text-[11px] font-medium px-3 py-1.5 rounded-full"
              >
                Decline
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending sent */}
      {pendingSent.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Sent requests</p>
          {pendingSent.map(req => (
            <div key={req.friendshipId} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EDEAE2] flex items-center justify-center text-[12px] font-medium text-[#2C2C2A]">
                {req.username.charAt(0).toUpperCase()}
              </div>
              <p className="text-[13px] font-medium text-[#2C2C2A] flex-1">{req.username}</p>
              <span className="text-[11px] text-[#B4B2A9] bg-[#EDEAE2] px-3 py-1.5 rounded-full">Pending</span>
            </div>
          ))}
        </div>
      )}

      {/* Friends list */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && friends.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && (
        <div className="text-center py-12 border border-dashed border-[#E8E5DE] rounded-2xl">
          <p className="text-sm text-[#888780]">No friends yet</p>
          <p className="text-xs text-[#B4B2A9] mt-1">Add a friend by their username</p>
        </div>
      )}

      {friends.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Friends</p>
          {friends.map(friend => (
            <div key={friend.userId} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EDEAE2] flex items-center justify-center text-[12px] font-medium text-[#2C2C2A]">
                  {friend.username.charAt(0).toUpperCase()}
                </div>
                <p className="text-[13px] font-medium text-[#2C2C2A]">{friend.username}</p>
              </div>

              {friend.currentlyReading ? (
                <div className="flex gap-3 bg-[#F7F5F0] rounded-xl p-3">
                  <div className="w-8 h-12 rounded bg-[#EEEDFE] shrink-0 flex items-center justify-center overflow-hidden">
                    {friend.currentlyReading.coverUrl ? (
                      <img src={friend.currentlyReading.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={14} color="#534AB7" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[#888780] mb-1">Currently reading</p>
                    <p className="text-[12px] font-medium text-[#2C2C2A] truncate">{friend.currentlyReading.title}</p>
                    <p className="text-[11px] text-[#888780]">{friend.currentlyReading.author}</p>
                    {friend.currentlyReading.totalPages > 0 && (
                      <div className="mt-2">
                        <div className="h-[2px] bg-[#E8E5DE] rounded-full">
                          <div
                            className="h-[2px] bg-[#2C2C2A] rounded-full"
                            style={{ width: `${Math.min((friend.currentlyReading.pagesRead / friend.currentlyReading.totalPages) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[#B4B2A9] mt-1">{friend.currentlyReading.pagesRead} / {friend.currentlyReading.totalPages} pp</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-[#B4B2A9]">Not currently reading anything</p>
              )}

              {friend.lastFinished && (
                <p className="text-[11px] text-[#888780]">
                  Last finished: <span className="text-[#2C2C2A] font-medium">{friend.lastFinished.title}</span>
                </p>
              )}

            {/* Send rec */}
            {sendingRec === friend.userId ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-[#E8E5DE]">
                <p className="text-[11px] text-[#888780]">Pick a book to recommend</p>
                <select
                value={recBookId}
                onChange={e => setRecBookId(e.target.value)}
                className="bg-[#F0EDE6] border border-[#E0DDD6] rounded-xl px-3 py-2 text-[12px] text-[#2C2C2A] outline-none"
                >
                <option value="">Select a book…</option>
                {myBooks.map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                ))}
                </select>
                <input
                type="text"
                value={recMessage}
                onChange={e => setRecMessage(e.target.value)}
                placeholder="Add a message… (optional)"
                className="bg-[#F0EDE6] border border-[#E0DDD6] rounded-xl px-3 py-2 text-[12px] text-[#2C2C2A] placeholder:text-[#B4B2A9] outline-none"
                />
                <div className="flex gap-2">
                <button
                    onClick={() => handleSendRec(friend.userId)}
                    disabled={!recBookId}
                    className="flex-1 bg-[#2C2C2A] disabled:bg-[#C8C5BE] text-[#F7F5F0] text-[12px] font-medium py-2 rounded-xl"
                >
                    Send rec
                </button>
                <button
                    onClick={() => { setSendingRec(null); setRecBookId(''); setRecMessage(''); }}
                    className="bg-[#EDEAE2] text-[#5F5E5A] text-[12px] font-medium px-4 py-2 rounded-xl"
                >
                    Cancel
                </button>
                </div>
            </div>
            ) : (
            <button
                onClick={() => setSendingRec(friend.userId)}
                className="w-full bg-[#EDEAE2] text-[#2C2C2A] text-[12px] font-medium py-2 rounded-xl flex items-center justify-center gap-2"
            >
                <Send size={13} />
                {recSent === friend.userId ? 'Rec sent ✓' : 'Recommend a book'}
            </button>
            )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default FriendsScreen;