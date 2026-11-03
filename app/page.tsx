'use client'

import { useState, useEffect, useRef } from 'react'

interface MessageFeed {
  id: string
  recipient: string
  isRecipientUsername: boolean
  sender: string
  isAnonymous: boolean
  message: string
  songTitle: string
  artistName: string
  coverUrl: string
  previewUrl: string
  likes: number
  comments: { id: string; user: string; text: string }[]
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [myUsername, setMyUsername] = useState('1stplaceyapper')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [feeds, setFeeds] = useState<MessageFeed[]>([])
  const [followedFriends, setFollowedFriends] = useState<string[]>([])

  const [friendSearchQuery, setFriendSearchQuery] = useState('')
  const [foundUsers, setFoundUsers] = useState<string[]>([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [isRecipientUsername, setIsRecipientUsername] = useState(true)
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [searchQuerySong, setSearchQuerySong] = useState('')
  const [songResults, setSongResults] = useState<any[]>([])
  const [selectedSong, setSelectedSong] = useState<any | null>(null)
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({})

  const [playingSongId, setPlayingSongId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setIsMounted(true)
    const savedTheme = localStorage.getItem('interlinked_theme')
    if (savedTheme === 'dark') setIsDarkMode(true)

    const currentUsn = '1stplaceyapper'
    setMyUsername(currentUsn)
    localStorage.setItem('interlinked_my_profile', JSON.stringify({ username: currentUsn }))
    localStorage.setItem('profile_username', currentUsn)

    const savedFeeds = localStorage.getItem('interlinked_feeds') || localStorage.getItem('interlinked_feed_posts')
    if (savedFeeds) {
      try { setFeeds(JSON.parse(savedFeeds)) } catch (e) {}
    } else {
      setFeeds([])
      localStorage.setItem('interlinked_feeds', JSON.stringify([]))
    }

    const savedFriends = localStorage.getItem('interlinked_friends')
    if (savedFriends) {
      try { setFollowedFriends(JSON.parse(savedFriends)) } catch (e) {}
    } else {
      setFollowedFriends([])
      localStorage.setItem('interlinked_friends', JSON.stringify([]))
    }

    const handleStorageUpdate = () => {
      const updatedFeeds = localStorage.getItem('interlinked_feeds') || localStorage.getItem('interlinked_feed_posts')
      if (updatedFeeds) {
        try { setFeeds(JSON.parse(updatedFeeds)) } catch (e) {}
      }
    }

    window.addEventListener('feed_updated', handleStorageUpdate)
    window.addEventListener('storage', handleStorageUpdate)

    return () => {
      if (audioRef.current) audioRef.current.pause()
      window.removeEventListener('feed_updated', handleStorageUpdate)
      window.removeEventListener('storage', handleStorageUpdate)
    }
  }, [])

  const toggleTheme = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('interlinked_theme', newMode ? 'dark' : 'light')
  }

  const toggleFollowFriend = (friend: string) => {
    const cleanFriend = friend.toLowerCase().trim().replace('@', '')
    if (!cleanFriend || cleanFriend === myUsername) return
    const updated = followedFriends.includes(cleanFriend)
      ? followedFriends.filter(f => f !== cleanFriend)
      : [...followedFriends, cleanFriend]
    setFollowedFriends(updated)
    localStorage.setItem('interlinked_friends', JSON.stringify(updated))
  }

  const handleSearchUser = (query: string) => {
    setFriendSearchQuery(query)
    if (!query.trim()) { setFoundUsers([]); return; }
    const q = query.toLowerCase().trim().replace('@', '')
    const allKnownUsers = new Set<string>([
      ...followedFriends,
      ...feeds.map(f => f.sender),
      ...feeds.map(f => f.recipient),
      'raka', 'nadia', 'celeste'
    ])
    allKnownUsers.add(q)
    const matches = Array.from(allKnownUsers).filter(u => u.includes(q) && u !== myUsername)
    setFoundUsers(matches)
  }

  const searchItunes = async (query: string) => {
    setSearchQuerySong(query)
    if (!query.trim()) { setSongResults([]); return; }
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`)
      const data = await res.json()
      setSongResults(data.results || [])
    } catch (err) { console.error(err) }
  }

  const togglePlayPreview = (feedId: string, previewUrl: string) => {
    if (!previewUrl) return
    if (playingSongId === feedId) {
      if (audioRef.current) audioRef.current.pause()
      setPlayingSongId(null)
    } else {
      if (audioRef.current) audioRef.current.pause()
      audioRef.current = new Audio(previewUrl)
      audioRef.current.play().catch(e => console.log("Audio play error:", e))
      setPlayingSongId(feedId)
      audioRef.current.onended = () => setPlayingSongId(null)
    }
  }

  const handleSendSong = (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipient.trim() || !selectedSong) return
    
    const cleanRecipient = isRecipientUsername 
      ? recipient.trim().toLowerCase().replace('@', '') 
      : recipient.trim()

    const newFeed: MessageFeed = {
      id: Date.now().toString(),
      recipient: cleanRecipient,
      isRecipientUsername: isRecipientUsername,
      sender: myUsername,
      isAnonymous: isAnonymous,
      message: message.trim(), // Kosongkan jika sender mengosongkan caption
      songTitle: selectedSong.trackName,
      artistName: selectedSong.artistName,
      coverUrl: selectedSong.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
      previewUrl: selectedSong.previewUrl || '',
      likes: 0,
      comments: []
    }
    
    const updated = [newFeed, ...feeds]
    setFeeds(updated)
    
    localStorage.setItem('interlinked_feeds', JSON.stringify(updated))
    localStorage.setItem('interlinked_feed_posts', JSON.stringify(updated))
    window.dispatchEvent(new Event('feed_updated'))

    setIsModalOpen(false)
    setRecipient(''); setMessage(''); setSelectedSong(null); setSearchQuerySong(''); setIsAnonymous(false); setIsRecipientUsername(true);
  }

  const handleLike = (id: string) => {
    const updated = feeds.map(f => f.id === id ? { ...f, likes: f.likes + 1 } : f)
    setFeeds(updated)
    localStorage.setItem('interlinked_feeds', JSON.stringify(updated))
    localStorage.setItem('interlinked_feed_posts', JSON.stringify(updated))
    window.dispatchEvent(new Event('feed_updated'))
  }

  const handleDeleteFeed = (id: string) => {
    if (playingSongId === id && audioRef.current) {
      audioRef.current.pause()
      setPlayingSongId(null)
    }
    const updated = feeds.filter(f => f.id !== id)
    setFeeds(updated)
    localStorage.setItem('interlinked_feeds', JSON.stringify(updated))
    localStorage.setItem('interlinked_feed_posts', JSON.stringify(updated))
    window.dispatchEvent(new Event('feed_updated'))
  }

  const handleAddComment = (id: string) => {
    const text = commentInputs[id]
    if (!text?.trim()) return
    const updated = feeds.map(f => {
      if (f.id === id) {
        return {
          ...f,
          comments: [...f.comments, { id: Date.now().toString(), user: myUsername, text }]
        }
      }
      return f
    })
    setFeeds(updated)
    localStorage.setItem('interlinked_feeds', JSON.stringify(updated))
    localStorage.setItem('interlinked_feed_posts', JSON.stringify(updated))
    window.dispatchEvent(new Event('feed_updated'))
    setCommentInputs({ ...commentInputs, [id]: '' })
  }

  if (!isMounted) return <div className="min-h-screen bg-[#F4F1EA]" />

  const bgClass = isDarkMode ? 'bg-[#121211] text-[#E8E2D2]' : 'bg-[#F4F1EA] text-[#2C2A29]'
  const navBgClass = isDarkMode ? 'bg-[#121211]/80 border-[#222220]' : 'bg-[#F4F1EA]/80 border-[#E2DDD3]'
  const cardBgClass = isDarkMode ? 'bg-[#1A1A18] border-[#2A2A27] text-[#E8E2D2]' : 'bg-[#FAF8F5] border-[#E8E3D8] text-[#2C2A29]'

  return (
    <div className={`min-h-screen transition-colors duration-500 pb-32 ${bgClass}`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@300;400;500&display=swap');
        body { font-family: 'Newsreader', serif; letter-spacing: -0.01em; }
        .font-mono-custom { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* Editorial Minimalist Navbar */}
      <nav className={`border-b px-6 py-4 backdrop-blur-md sticky top-0 z-40 transition-colors ${navBgClass}`}>
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <a href="/" className="text-xl italic font-semibold tracking-wide flex items-center gap-1 opacity-90 hover:opacity-100">
            interlinked <span className="not-italic text-sm font-light">/ archive</span>
          </a>
          <div className="flex items-center gap-4 text-xs font-mono-custom">
            <button onClick={toggleTheme} className="opacity-60 hover:opacity-100 transition">
              {isDarkMode ? '[ light mode ]' : '[ dark mode ]'}
            </button>
            <a href="/profile" className="opacity-80 hover:opacity-100 transition border-b border-current pb-0.5">
              @{myUsername}
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-5 pt-10 space-y-10">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl italic font-normal tracking-tight leading-tight">
            songs left unsaid.
          </h1>
          <p className={`text-sm font-mono-custom max-w-sm mx-auto font-light opacity-70`}>
            An open collection of musical dedications, confessions, and unspoken letters.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => setIsModalOpen(true)} 
              className={`text-xs font-mono-custom tracking-wider uppercase px-6 py-3 rounded-full border transition-all hover:scale-105 ${
                isDarkMode 
                  ? 'border-[#3A3A35] bg-[#1E1E1C] text-[#E8E2D2] hover:bg-[#2A2A27]' 
                  : 'border-[#2C2A29] bg-[#2C2A29] text-[#F4F1EA] hover:bg-black'
              }`}
            >
              + dedicate a song
            </button>
          </div>
        </div>

        {/* Minimalist Search & Connections */}
        <div className={`border rounded-2xl p-5 space-y-4 ${cardBgClass}`}>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-mono-custom uppercase tracking-widest opacity-50">
              Find Connections
            </span>
          </div>
          
          <input 
            type="text"
            placeholder="Search by username (e.g. raka, nadia)..."
            value={friendSearchQuery}
            onChange={(e) => handleSearchUser(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition font-sans ${
              isDarkMode 
                ? 'bg-[#121211] border-[#2A2A27] text-[#E8E2D2] placeholder:opacity-30' 
                : 'bg-white border-[#E8E3D8] text-[#2C2A29] placeholder:opacity-30'
            }`}
          />

          {foundUsers.length > 0 && (
            <div className={`border rounded-xl divide-y overflow-hidden max-h-40 overflow-y-auto font-mono-custom text-xs ${isDarkMode ? 'border-[#2A2A27] divide-[#2A2A27]' : 'border-[#E8E3D8] divide-[#E8E3D8]'}`}>
              {foundUsers.map((username) => {
                const isFollowing = followedFriends.includes(username)
                const profileUrl = username === myUsername ? '/profile' : `/profile/${username}`
                return (
                  <div key={username} className="flex items-center justify-between p-3">
                    <a href={profileUrl} className="font-medium hover:underline">
                      @{username}
                    </a>
                    <div className="flex items-center gap-3">
                      <a href={profileUrl} className="opacity-60 hover:opacity-100 text-[11px]">
                        profile ↗
                      </a>
                      <button 
                        onClick={() => toggleFollowFriend(username)}
                        className={`px-3 py-1 rounded-full text-[10px] tracking-wider transition ${
                          isFollowing 
                            ? 'opacity-40 line-through' 
                            : (isDarkMode ? 'bg-[#2A2A27] text-white' : 'bg-[#2C2A29] text-white')
                        }`}
                      >
                        {isFollowing ? 'linked' : 'link'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Linked Friends Pill List */}
          <div className="pt-2">
            <p className="text-[10px] font-mono-custom uppercase tracking-wider mb-2 opacity-40">Linked Archives ({followedFriends.length})</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {followedFriends.length === 0 ? (
                <p className="text-xs italic opacity-40">No connections linked yet.</p>
              ) : (
                followedFriends.map((friend) => (
                  <div key={friend} className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-current opacity-70 text-xs font-mono-custom">
                    <a href={`/profile/${friend}`} className="hover:underline">@{friend}</a>
                    <button onClick={() => toggleFollowFriend(friend)} className="opacity-40 hover:opacity-100 ml-1">×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Global Feed Search */}
        <div>
          <input 
            type="text"
            placeholder="Search archive by song, message, or names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-5 py-3 rounded-2xl border text-sm outline-none transition font-sans ${
              isDarkMode 
                ? 'bg-[#1A1A18] border-[#2A2A27] text-[#E8E2D2] placeholder:opacity-30' 
                : 'bg-white border-[#E8E3D8] text-[#2C2A29] placeholder:opacity-30'
            }`}
          />
        </div>

        {/* Feed List */}
        <div className="space-y-6">
          {feeds.length === 0 ? (
            <div className={`text-center py-16 border rounded-3xl ${cardBgClass}`}>
              <p className="text-sm italic opacity-40">The archive is empty.</p>
            </div>
          ) : (
            feeds
              .filter((item) => {
                const q = searchQuery.toLowerCase()
                return (
                  item.songTitle.toLowerCase().includes(q) ||
                  item.artistName.toLowerCase().includes(q) ||
                  item.message.toLowerCase().includes(q) ||
                  item.sender.toLowerCase().includes(q) ||
                  item.recipient.toLowerCase().includes(q)
                )
              })
              .map((item) => {
                const isPlaying = playingSongId === item.id
                const senderClean = item.sender.toLowerCase().trim().replace('@', '')
                const senderProfileUrl = senderClean === myUsername ? '/profile' : `/profile/${senderClean}`

                const recipientClean = item.recipient.toLowerCase().trim().replace('@', '')
                const recipientProfileUrl = recipientClean === myUsername ? '/profile' : `/profile/${recipientClean}`
                const isTaggedUser = item.isRecipientUsername !== false && !item.recipient.includes(' ') && item.recipient.length < 25

                const isMyPost = item.sender.toLowerCase().trim().replace('@', '') === myUsername.toLowerCase().trim().replace('@', '')

                return (
                  <div key={item.id} className={`border rounded-3xl p-6 md:p-8 space-y-6 shadow-xs transition ${cardBgClass}`}>
                    
                    {/* Meta Header */}
                    <div className="flex justify-between items-center text-xs font-mono-custom opacity-70">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>to:</span>
                        {isTaggedUser ? (
                          <a href={recipientProfileUrl} className="font-semibold underline underline-offset-4">@{recipientClean}</a>
                        ) : (
                          <span className="font-semibold">{item.recipient}</span>
                        )}
                        <span className="mx-2 opacity-30">/</span>
                        <span>from:</span>
                        {item.isAnonymous ? (
                          <span className="italic opacity-60">anonymous</span>
                        ) : (
                          <a href={senderProfileUrl} className="italic underline underline-offset-4">@{senderClean}</a>
                        )}
                      </div>

                      {isMyPost && (
                        <button 
                          onClick={() => handleDeleteFeed(item.id)}
                          className="text-[10px] opacity-40 hover:opacity-100 transition"
                        >
                          [remove]
                        </button>
                      )}
                    </div>

                    {/* Main Confession / Message (Hanya dirender jika ada isinya) */}
                    {item.message && (
                      <div className="py-2">
                        <p className="text-xl md:text-2xl italic font-normal leading-relaxed tracking-wide">
                          "{item.message}"
                        </p>
                      </div>
                    )}

                    {/* Song Track Card */}
                    <div className={`flex items-center gap-4 p-3.5 rounded-2xl border transition ${
                      isDarkMode ? 'bg-[#121211] border-[#2A2A27]' : 'bg-white border-[#E8E3D8]'
                    }`}>
                      <div className="relative cursor-pointer group shrink-0" onClick={() => togglePlayPreview(item.id, item.previewUrl)}>
                        <img src={item.coverUrl} alt={item.songTitle} className="w-14 h-14 rounded-xl object-cover" />
                        <div className={`absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition opacity-0 group-hover:opacity-100 ${isPlaying ? 'opacity-100' : ''}`}>
                          <span className="text-white text-xs font-mono-custom">{isPlaying ? '❚❚' : '▶'}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate font-sans">{item.songTitle}</h4>
                        <p className="text-xs truncate font-mono-custom opacity-50 mt-0.5">{item.artistName}</p>
                      </div>

                      {item.previewUrl && (
                        <button 
                          onClick={() => togglePlayPreview(item.id, item.previewUrl)}
                          className={`px-4 py-2 rounded-full text-xs font-mono-custom tracking-wider transition shrink-0 ${
                            isPlaying 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : (isDarkMode ? 'bg-[#222220] text-[#E8E2D2] hover:bg-[#2A2A27]' : 'bg-[#2C2A29] text-[#F4F1EA] hover:bg-black')
                          }`}
                        >
                          {isPlaying ? 'pause' : 'listen'}
                        </button>
                      )}
                    </div>

                    {/* Interaction / Likes */}
                    <div className="flex items-center justify-between pt-2 border-t border-current opacity-10"></div>
                    <div className="flex items-center justify-between text-xs font-mono-custom pt-1">
                      <button onClick={() => handleLike(item.id)} className="flex items-center gap-2 opacity-70 hover:opacity-100 transition">
                        <span>✦</span> <span>{item.likes} resonance</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-3 pt-2">
                      {item.comments.map(c => {
                        const commenterClean = c.user.toLowerCase().trim().replace('@', '')
                        const commenterProfileUrl = commenterClean === myUsername ? '/profile' : `/profile/${commenterClean}`
                        return (
                          <div key={c.id} className={`text-xs p-3 rounded-xl font-sans ${isDarkMode ? 'bg-[#121211]' : 'bg-white'}`}>
                            <a href={commenterProfileUrl} className="font-mono-custom font-semibold mr-2 opacity-80 hover:underline">@{commenterClean}</a> 
                            <span className="opacity-90">{c.text}</span>
                          </div>
                        )
                      })}
                      <div className="flex gap-2 pt-2">
                        <input 
                          type="text" 
                          placeholder="Leave a quiet response..." 
                          value={commentInputs[item.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [item.id]: e.target.value })}
                          className={`flex-1 text-xs px-4 py-2.5 rounded-full border outline-none font-sans ${
                            isDarkMode ? 'bg-[#121211] border-[#2A2A27] text-[#E8E2D2]' : 'bg-white border-[#E8E3D8] text-[#2C2A29]'
                          }`}
                        />
                        <button 
                          onClick={() => handleAddComment(item.id)} 
                          className={`text-xs font-mono-custom px-5 py-2.5 rounded-full border transition ${
                            isDarkMode ? 'border-[#3A3A35] bg-[#222220] hover:bg-[#2A2A27]' : 'border-[#2C2A29] bg-[#2C2A29] text-[#F4F1EA]'
                          }`}
                        >
                          reply
                        </button>
                      </div>
                    </div>

                  </div>
                )
              })
          )}
        </div>

        {/* Minimalist Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className={`border rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl ${cardBgClass}`}>
              <div className="flex justify-between items-center">
                <h3 className="italic text-2xl font-normal">Dedicate a song</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-sm font-mono-custom opacity-50 hover:opacity-100">[esc]</button>
              </div>

              <form onSubmit={handleSendSong} className="space-y-4 font-sans">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-mono-custom uppercase tracking-widest opacity-50 block">Recipient</label>
                    <div className="flex items-center gap-1 text-[10px] font-mono-custom">
                      <button
                        type="button"
                        onClick={() => setIsRecipientUsername(true)}
                        className={`px-2 py-0.5 rounded transition ${isRecipientUsername ? (isDarkMode ? 'bg-[#2A2A27] text-white font-semibold' : 'bg-[#2C2A29] text-white font-semibold') : 'opacity-40'}`}
                      >
                        @ username
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsRecipientUsername(false)}
                        className={`px-2 py-0.5 rounded transition ${!isRecipientUsername ? (isDarkMode ? 'bg-[#2A2A27] text-white font-semibold' : 'bg-[#2C2A29] text-white font-semibold') : 'opacity-40'}`}
                      >
                        text / initials
                      </button>
                    </div>
                  </div>

                  <input 
                    type="text" 
                    placeholder={isRecipientUsername ? "e.g. raka or @nadia" : "e.g. For A.K., or My Bestfriend..."} 
                    value={recipient} 
                    onChange={(e) => setRecipient(e.target.value)} 
                    required 
                    className={`w-full text-sm p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-[#121211] border-[#2A2A27]' : 'bg-white border-[#E8E3D8]'}`} 
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input 
                    type="checkbox" 
                    id="anonymousCheck" 
                    checked={isAnonymous} 
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-stone-400 cursor-pointer w-4 h-4 accent-stone-700" 
                  />
                  <label htmlFor="anonymousCheck" className="text-xs font-mono-custom cursor-pointer select-none opacity-80">
                    Send anonymously (hide my username)
                  </label>
                </div>

                <div>
                  <label className="text-[11px] font-mono-custom uppercase tracking-widest opacity-50 block mb-1.5">Search Track</label>
                  <input 
                    type="text" 
                    placeholder="Search song title or artist..." 
                    value={searchQuerySong} 
                    onChange={(e) => searchItunes(e.target.value)} 
                    className={`w-full text-sm p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-[#121211] border-[#2A2A27]' : 'bg-white border-[#E8E3D8]'}`} 
                  />
                </div>

                {songResults.length > 0 && (
                  <div className={`border rounded-xl max-h-48 overflow-y-auto divide-y ${isDarkMode ? 'border-[#2A2A27] divide-[#2A2A27]' : 'border-[#E8E3D8] divide-[#E8E3D8]'}`}>
                    {songResults.map((song) => (
                      <div key={song.trackId} onClick={() => { setSelectedSong(song); setSearchQuerySong(song.trackName); setSongResults([]); }} className={`p-3 flex items-center gap-3 cursor-pointer text-xs ${selectedSong?.trackId === song.trackId ? (isDarkMode ? 'bg-[#2A2A27]' : 'bg-[#E8E3D8]/50') : ''}`}>
                        <img src={song.artworkUrl100} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="truncate">
                          <p className="font-medium truncate">{song.trackName}</p>
                          <p className="text-[11px] truncate font-mono-custom opacity-50">{song.artistName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-mono-custom uppercase tracking-widest opacity-50 block mb-1.5">Your Message / Note <span className="opacity-40 font-normal">(Optional)</span></label>
                  <textarea 
                    placeholder="Write something unspoken, or leave blank to post just the song..." 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    rows={4} 
                    className={`w-full text-sm p-3 rounded-xl border outline-none resize-none ${isDarkMode ? 'bg-[#121211] border-[#2A2A27]' : 'bg-white border-[#E8E3D8]'}`} 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={!selectedSong || !recipient.trim()} 
                  className={`w-full text-xs font-mono-custom tracking-widest uppercase py-3.5 rounded-xl border transition ${
                    !selectedSong || !recipient.trim() 
                      ? 'opacity-30 cursor-not-allowed' 
                      : (isDarkMode ? 'border-[#3A3A35] bg-[#222220] text-[#E8E2D2] hover:bg-[#2A2A27]' : 'border-[#2C2A29] bg-[#2C2A29] text-[#F4F1EA] hover:bg-black')
                  }`}
                >
                  Publish to Archive
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}