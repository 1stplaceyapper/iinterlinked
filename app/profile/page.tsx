'use client'

import { useState, useEffect, useRef } from 'react'

interface ShelfItem {
  type: string
  title: string
  subtitle?: string
  coverUrl: string
}

interface SearchResult {
  title: string
  subtitle: string
  coverUrl: string
}

interface Comment {
  id: string
  user: string
  text: string
}

interface FeedPost {
  id: string
  author: string
  taggedUser?: string
  mediaTitle: string
  mediaType: string
  coverUrl: string
  caption: string
  createdAt: string
  likes: number
  comments: Comment[]
}

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    username: '1stplaceyapper',
    displayName: 'anne',
    bio: 'mise-en-scène is my love language',
    avatarUrl: '',
    instagram: 'anne.celeste',
    tiktok: 'anne.vibes'
  })

  const [items, setItems] = useState<ShelfItem[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'shelf' | 'mentions' | 'my_posts'>('shelf')

  // Status Public / Private untuk My Posts & Mentions
  const [isMyPostsPublic, setIsMyPostsPublic] = useState(true)
  const [isMentionsPublic, setIsMentionsPublic] = useState(true)

  // Active Player & Modals
  const [activePlayItem, setActivePlayItem] = useState<ShelfItem | null>(null)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  // Feed States (Mentions & My Posts)
  const [mentions, setMentions] = useState<FeedPost[]>([])
  const [myPosts, setMyPosts] = useState<FeedPost[]>([])

  // Edit Profile Modal
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [tempUsername, setTempUsername] = useState('')
  const [tempName, setTempName] = useState('')
  const [tempBio, setTempBio] = useState('')
  const [tempAvatar, setTempAvatar] = useState('')
  const [tempInstagram, setTempInstagram] = useState('')
  const [tempTiktok, setTempTiktok] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = () => {
    let activeUsername = '1stplaceyapper'
    
    const params = new URLSearchParams(window.location.search)
    const urlUser = params.get('u') || params.get('username')

    const savedProfile = localStorage.getItem('interlinked_user_profile')
    let currentProfile = {
      username: '1stplaceyapper',
      displayName: 'anne',
      bio: 'mise-en-scène is my love language',
      avatarUrl: '',
      instagram: 'anne.celeste',
      tiktok: 'anne.vibes'
    }

    if (savedProfile) {
      try { 
        currentProfile = JSON.parse(savedProfile)
      } catch (e) {}
    }

    if (urlUser) {
      activeUsername = urlUser.toLowerCase().replace('@', '').trim()
      if (currentProfile.username.toLowerCase() !== activeUsername) {
        currentProfile = {
          username: activeUsername,
          displayName: activeUsername,
          bio: 'interlinked community member archive',
          avatarUrl: '',
          instagram: '',
          tiktok: ''
        }
      }
    } else if (currentProfile.username) {
      activeUsername = currentProfile.username.toLowerCase().replace('@', '').trim()
    }

    setProfile(currentProfile)

    const savedFeed = localStorage.getItem('interlinked_feed_posts') || localStorage.getItem('interlinked_feeds')
    if (savedFeed) {
      try {
        const allPosts: FeedPost[] = JSON.parse(savedFeed)
        
        const filteredMentions = allPosts.filter(post => {
          if (!post.taggedUser) return false
          const cleanTagged = post.taggedUser.toLowerCase().replace('@', '').trim()
          return cleanTagged === activeUsername
        })
        setMentions(filteredMentions)

        const filteredMyPosts = allPosts.filter(post => {
          const authorField = post.author || (post as any).sender || ''
          const cleanAuthor = authorField.toLowerCase().replace('@', '').trim()
          return cleanAuthor === activeUsername
        })
        setMyPosts(filteredMyPosts)

      } catch (e) {
        setMentions([])
        setMyPosts([])
      }
    }
  }

  useEffect(() => {
    setIsMounted(true)
    const savedShelf = localStorage.getItem('interlinked_shelf')
    if (savedShelf) {
      try { setItems(JSON.parse(savedShelf)) } catch (e) {}
    }

    const savedTheme = localStorage.getItem('interlinked_theme')
    if (savedTheme === 'dark') setIsDarkMode(true)

    // Load preferensi Public/Private dari localStorage
    const savedMyPostsPub = localStorage.getItem('interlinked_myposts_public')
    if (savedMyPostsPub !== null) setIsMyPostsPublic(savedMyPostsPub === 'true')

    const savedMentionsPub = localStorage.getItem('interlinked_mentions_public')
    if (savedMentionsPub !== null) setIsMentionsPublic(savedMentionsPub === 'true')

    loadData()

    const handleStorageChange = () => {
      loadData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('feed_updated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('feed_updated', handleStorageChange)
    }
  }, [])

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('interlinked_shelf', JSON.stringify(items))
    }
  }, [items, isMounted])

  const toggleMyPostsVisibility = () => {
    const nextVal = !isMyPostsPublic
    setIsMyPostsPublic(nextVal)
    localStorage.setItem('interlinked_myposts_public', String(nextVal))
  }

  const toggleMentionsVisibility = () => {
    const nextVal = !isMentionsPublic
    setIsMentionsPublic(nextVal)
    localStorage.setItem('interlinked_mentions_public', String(nextVal))
  }

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('interlinked_theme', newTheme ? 'dark' : 'light')
  }

  const calculateTasteMatch = (currentShelf: ShelfItem[]) => {
    if (!currentShelf.length) return { percentage: 25, sharedText: 'koleksi media awal' }
    
    const sampleVisitorShelf = [
      { type: 'Movies', title: 'Interstellar' },
      { type: 'Songs', title: 'Die For You' },
      { type: 'Artists', title: 'The Weeknd' }
    ]

    let matchingCount = 0
    const matchedCategories: string[] = []

    currentShelf.forEach(item => {
      const isMatch = sampleVisitorShelf.some(visitorItem => 
        visitorItem.type.toLowerCase() === item.type.toLowerCase() ||
        visitorItem.title.toLowerCase() === item.title.toLowerCase()
      )
      if (isMatch) {
        matchingCount++
        if (!matchedCategories.includes(item.type)) {
          matchedCategories.push(item.type)
        }
      }
    })

    const score = Math.min(Math.max(Math.round((matchingCount / Math.max(currentShelf.length, 1)) * 100) + 40, 35), 96)
    
    let sharedText = 'kategori media'
    if (matchedCategories.length > 0) {
      sharedText = matchedCategories.join(' & ')
    } else if (currentShelf.length > 0) {
      sharedText = currentShelf[0].type
    }

    return { percentage: score, sharedText }
  }

  const compatibility = calculateTasteMatch(items)

  const shelfSections = [
    { type: 'Artists' },
    { type: 'Albums' },
    { type: 'Songs' },
    { type: 'TV Shows' },
    { type: 'Movies' },
    { type: 'Books' },
  ]

  useEffect(() => {
    if (!searchQuery.trim() || !activeModal) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        let results: SearchResult[] = []

        if (activeModal === 'Movies' || activeModal === 'TV Shows') {
          const typeParam = activeModal === 'Movies' ? 'movie' : 'series'
          const res = await fetch(`https://www.omdbapi.com/?apikey=trilogy&s=${encodeURIComponent(searchQuery)}&type=${typeParam}`)
          const data = await res.json()

          if (data.Search) {
            results = data.Search.map((item: any) => ({
              title: item.Title,
              subtitle: `${activeModal} • ${item.Year}`,
              coverUrl: (item.Poster && item.Poster !== 'N/A') ? item.Poster : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80"
            }))
          }
        } else if (activeModal === 'Artists') {
          const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&entity=album&limit=15`)
          const data = await res.json()
          const seenArtists = new Set()
          results = []

          for (const resItem of (data.results || [])) {
            if (!seenArtists.has(resItem.artistName)) {
              seenArtists.add(resItem.artistName)
              let imgUrl = (resItem.artworkUrl100 || '').replace('100x100bb', '600x600bb')
              results.push({
                title: resItem.artistName,
                subtitle: `Artist • ${resItem.primaryGenreName || 'Music'}`,
                coverUrl: imgUrl
              })
            }
          }
        } else {
          let media = 'music'; let entity = 'song'
          if (activeModal === 'Albums') { media = 'music'; entity = 'album' }
          if (activeModal === 'Songs') { media = 'music'; entity = 'song' }
          if (activeModal === 'Books') { media = 'ebook'; entity = 'ebook' }

          const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=${media}&entity=${entity}&limit=15`)
          const data = await res.json()

          results = (data.results || []).map((res: any) => {
            let img = (res.artworkUrl100 || '').replace('100x100bb', '600x600bb')
            return {
              title: res.trackName || res.collectionName || res.artistName,
              subtitle: res.artistName ? `by ${res.artistName}` : activeModal,
              coverUrl: img || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80"
            }
          })
        }

        setSearchResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, activeModal])

  function handleSelectItem(selected: { title: string; coverUrl: string }) {
    if (!activeModal) return
    const updatedItems = items.filter(i => i.type !== activeModal)
    setItems([...updatedItems, { type: activeModal, title: selected.title, coverUrl: selected.coverUrl }])
    setSearchQuery('')
    setActiveModal(null)
  }

  function handleRemoveItem(type: string, e: React.MouseEvent) {
    e.stopPropagation()
    setItems(items.filter(i => i.type !== type))
    if (activePlayItem?.type === type) setActivePlayItem(null)
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setTempAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleSaveProfile() {
    const cleanUser = tempUsername.toLowerCase().replace('@', '').trim() || profile.username
    const updated = {
      username: cleanUser,
      displayName: tempName || profile.displayName,
      bio: tempBio || profile.bio,
      avatarUrl: tempAvatar || profile.avatarUrl,
      instagram: tempInstagram.trim(),
      tiktok: tempTiktok.trim()
    }
    setProfile(updated)
    localStorage.setItem('interlinked_user_profile', JSON.stringify(updated))
    setShowEditProfile(false)
    window.dispatchEvent(new Event('feed_updated'))
    loadData()
  }

  function openEditProfileModal() {
    setTempUsername(profile.username)
    setTempName(profile.displayName)
    setTempBio(profile.bio)
    setTempAvatar(profile.avatarUrl)
    setTempInstagram(profile.instagram || '')
    setTempTiktok(profile.tiktok || '')
    setShowEditProfile(true)
  }

  if (!isMounted) return <div className={`min-h-screen ${isDarkMode ? 'bg-[#121211]' : 'bg-[#F4F1EA]'}`} />

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

      {/* Navbar Minimalist */}
      <nav className={`border-b px-6 py-4 backdrop-blur-md sticky top-0 z-40 transition-colors ${navBgClass}`}>
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <a href="/" className="text-xl italic font-semibold tracking-wide flex items-center gap-1 opacity-90 hover:opacity-100">
            interlinked <span className="not-italic text-sm font-light">/ archive</span>
          </a>

          <div className="flex items-center gap-4 text-xs font-mono-custom">
            <button onClick={toggleTheme} className="opacity-60 hover:opacity-100 transition">
              {isDarkMode ? '[dark]' : '[light]'}
            </button>

            <span className="opacity-40">/</span>

            <span className="opacity-80">
              @{profile.username}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-5 pt-12 space-y-10">
        
        {/* Profile Header */}
        <div className={`border rounded-3xl p-8 space-y-6 ${cardBgClass}`}>
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} className="w-20 h-20 rounded-2xl object-cover border border-current opacity-90" />
              ) : (
                <div className="w-20 h-20 rounded-2xl border border-current flex items-center justify-center italic text-2xl font-normal opacity-80">
                  {profile.displayName.charAt(0)}
                </div>
              )}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[10px] font-mono-custom uppercase tracking-widest opacity-40 block">Personal Archive</span>
              <h1 className="text-3xl italic font-normal tracking-tight truncate">
                {profile.displayName}
              </h1>
              <p className="text-xs font-mono-custom opacity-60">
                @{profile.username}
              </p>
            </div>
          </div>

          <p className="text-base italic font-light opacity-80 font-sans leading-relaxed">
            "{profile.bio}"
          </p>

          <div className="flex items-center gap-3 pt-1 flex-wrap text-xs font-mono-custom">
            {profile.instagram && (
              <a 
                href={`https://instagram.com/${profile.instagram}`} 
                target="_blank" 
                rel="noreferrer"
                className="opacity-60 hover:opacity-100 transition border-b border-current pb-0.5"
              >
                ig: @{profile.instagram}
              </a>
            )}
            {profile.tiktok && (
              <a 
                href={`https://tiktok.com/@${profile.tiktok}`} 
                target="_blank" 
                rel="noreferrer"
                className="opacity-60 hover:opacity-100 transition border-b border-current pb-0.5"
              >
                tt: @{profile.tiktok}
              </a>
            )}
          </div>

          <div className="pt-2 border-t border-current opacity-10"></div>

          <div className="flex gap-3 justify-between items-center text-xs font-mono-custom">
            <button 
              onClick={openEditProfileModal}
              className="opacity-60 hover:opacity-100 transition border-b border-current pb-0.5"
            >
              [edit profile & socials]
            </button>
            <button 
              onClick={() => alert(`Link profil kamu: ${window.location.origin}/profile?u=${profile.username}`)}
              className="opacity-40 hover:opacity-80 transition"
            >
              [share]
            </button>
          </div>
        </div>

        {/* Taste Compatibility Score Widget */}
        <div className={`border rounded-2xl p-4 flex items-center justify-between gap-4 ${cardBgClass}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <p className="text-xs font-mono-custom uppercase tracking-wider opacity-40">Taste Compatibility</p>
              <p className="text-xs italic opacity-80 mt-0.5 truncate">
                kamu & @{profile.username} sama-sama suka <span className="font-semibold">{compatibility.sharedText}</span>
              </p>
            </div>
          </div>

          <span className="text-xs font-mono-custom opacity-80 shrink-0 border border-current px-2.5 py-1 rounded-full">
            {compatibility.percentage}% Match
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 border-b border-current/10 pb-3 text-xs font-mono-custom overflow-x-auto">
          <button 
            onClick={() => setActiveTab('shelf')} 
            className={`transition whitespace-nowrap ${activeTab === 'shelf' ? 'opacity-100 font-medium border-b border-current pb-0.5' : 'opacity-40 hover:opacity-80'}`}
          >
            [shelf archive]
          </button>
          <span className="opacity-25">/</span>
          <button 
            onClick={() => setActiveTab('my_posts')} 
            className={`transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'my_posts' ? 'opacity-100 font-medium border-b border-current pb-0.5' : 'opacity-40 hover:opacity-80'}`}
          >
            <span>[my posts]</span>
            <span className="border border-current px-1.5 py-0.2 rounded-full text-[10px] opacity-70">{myPosts.length}</span>
          </button>
          <span className="opacity-25">/</span>
          <button 
            onClick={() => setActiveTab('mentions')} 
            className={`transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'mentions' ? 'opacity-100 font-medium border-b border-current pb-0.5' : 'opacity-40 hover:opacity-80'}`}
          >
            <span>[mentions]</span>
            <span className="border border-current px-1.5 py-0.2 rounded-full text-[10px] opacity-70">{mentions.length}</span>
          </button>
        </div>

        {/* Main Section Content based on Tab */}
        {activeTab === 'shelf' ? (
          <>
            {activePlayItem && (
              <div className={`border rounded-2xl p-4 space-y-3 ${cardBgClass}`}>
                <div className="flex justify-between items-center text-xs font-mono-custom">
                  <span className="opacity-60">preview player: <span className="font-semibold italic">{activePlayItem.title}</span></span>
                  <button onClick={() => setActivePlayItem(null)} className="opacity-40 hover:opacity-100 transition">[close]</button>
                </div>
                <iframe
                  src={`https://open.spotify.com/embed/search/${encodeURIComponent(activePlayItem.title)}?utm_source=generator&theme=${isDarkMode ? '0' : '1'}`}
                  width="100%"
                  height="80"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-xl opacity-90"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shelfSections.map((section) => {
                const existingItem = items.find((i) => i.type === section.type)

                return (
                  <div key={section.type} className={`border rounded-3xl p-6 space-y-4 flex flex-col transition ${cardBgClass}`}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-mono-custom uppercase tracking-widest opacity-50">
                        {section.type}
                      </h3>
                      <button 
                        onClick={() => setActiveModal(section.type)}
                        className="text-xs font-mono-custom opacity-60 hover:opacity-100 border-b border-current pb-0.5 transition"
                      >
                        [+ add]
                      </button>
                    </div>
                    
                    {existingItem ? (
                      <div 
                        onClick={() => {
                          if (section.type === 'Songs' || section.type === 'Albums') {
                            setActivePlayItem(existingItem)
                          } else {
                            setActiveModal(section.type)
                          }
                        }} 
                        className="relative rounded-2xl overflow-hidden group border border-current/10 cursor-pointer flex-1 min-h-[180px]"
                      >
                        <img src={existingItem.coverUrl} alt={existingItem.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-4">
                          <div className="flex items-center gap-2 flex-1 pr-2 truncate">
                            {(section.type === 'Songs' || section.type === 'Albums') && (
                              <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-mono-custom">play</span>
                            )}
                            <p className="text-xs font-medium text-white tracking-wide truncate font-sans">{existingItem.title}</p>
                          </div>
                          <button 
                            onClick={(e) => handleRemoveItem(section.type, e)}
                            className="text-[10px] font-mono-custom opacity-70 hover:opacity-100 text-white bg-black/40 px-2 py-1 rounded-full backdrop-blur-md transition"
                          >
                            [remove]
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setActiveModal(section.type)}
                        className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-2xl py-12 transition opacity-60 hover:opacity-100 ${
                          isDarkMode ? 'border-[#2A2A27]' : 'border-[#E8E3D8]'
                        }`}
                      >
                        <p className="text-xs font-mono-custom tracking-wider uppercase">Add {section.type}</p>
                        <p className="text-[11px] italic opacity-60 mt-0.5 font-sans">Search and archive favorite</p>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : activeTab === 'my_posts' ? (
          /* Tab My Posts dengan Toggle Public/Private */
          <div className="space-y-4">
            <div className={`border rounded-2xl p-4 flex items-center justify-between text-xs font-mono-custom ${cardBgClass}`}>
              <div className="flex items-center gap-2">
                <span className="opacity-65">
                  {isMyPostsPublic ? '🌐 public posts by @' : '🔒 private posts by @'}{profile.username}
                </span>
              </div>
              <button 
                onClick={toggleMyPostsVisibility}
                className="border border-current px-3 py-1 rounded-full opacity-80 hover:opacity-100 transition font-medium"
              >
                {isMyPostsPublic ? 'Switch to Private' : 'Switch to Public'}
              </button>
            </div>

            {isMyPostsPublic ? (
              myPosts.length > 0 ? (
                <div className="space-y-4">
                  {myPosts.map((post) => (
                    <div 
                      key={post.id} 
                      onClick={() => { window.location.href = `/#${post.id}` }}
                      className={`border rounded-2xl p-5 space-y-3 cursor-pointer transition hover:border-current group ${cardBgClass}`}
                    >
                      <div className="flex justify-between items-center text-xs font-mono-custom">
                        <span className="opacity-80 font-medium">@{profile.username} {post.taggedUser ? `→ to @${post.taggedUser}` : ''}</span>
                        <div className="flex items-center gap-2">
                          <span className="opacity-40 text-[10px]">{post.createdAt}</span>
                          <span className="opacity-40 group-hover:opacity-100">[view]</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 border border-current/10 rounded-xl">
                        <img src={post.coverUrl} alt={post.mediaTitle} className="w-12 h-12 rounded-lg object-cover shrink-0 opacity-90" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-mono-custom uppercase tracking-wider opacity-40">{post.mediaType}</p>
                          <p className="text-sm font-medium italic truncate font-sans">{post.mediaTitle}</p>
                        </div>
                      </div>

                      <p className="text-xs italic opacity-80 font-sans leading-relaxed">
                        "{post.caption}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`border rounded-3xl p-12 text-center space-y-2 ${cardBgClass}`}>
                  <p className="text-xs font-mono-custom opacity-40 uppercase tracking-wider">No Posts Yet</p>
                  <p className="text-xs italic opacity-60 font-sans">Belum ada postingan feed dari @{profile.username}.</p>
                </div>
              )
            ) : (
              <div className={`border rounded-3xl p-12 text-center space-y-2 ${cardBgClass}`}>
                <p className="text-xs font-mono-custom opacity-40 uppercase tracking-wider">Postingan Disembunyikan (Private)</p>
                <p className="text-xs italic opacity-60 font-sans">Daftar post kamu diset ke private dan tidak bisa dilihat publik.</p>
              </div>
            )}
          </div>
        ) : (
          /* Tab Mentions dengan Toggle Public/Private */
          <div className="space-y-4">
            <div className={`border rounded-2xl p-4 flex items-center justify-between text-xs font-mono-custom ${cardBgClass}`}>
              <div className="flex items-center gap-2">
                <span className="opacity-65">
                  {isMentionsPublic ? '🌐 public mentions of @' : '🔒 private mentions of @'}{profile.username}
                </span>
              </div>
              <button 
                onClick={toggleMentionsVisibility}
                className="border border-current px-3 py-1 rounded-full opacity-80 hover:opacity-100 transition font-medium"
              >
                {isMentionsPublic ? 'Switch to Private' : 'Switch to Public'}
              </button>
            </div>

            {isMentionsPublic ? (
              mentions.length > 0 ? (
                <div className="space-y-3">
                  {mentions.map((mention) => (
                    <div 
                      key={mention.id} 
                      onClick={() => { window.location.href = `/#${mention.id}` }}
                      className={`border rounded-2xl p-5 space-y-3 cursor-pointer transition hover:border-current group ${cardBgClass}`}
                    >
                      <div className="flex justify-between items-center text-xs font-mono-custom">
                        <span className="opacity-80 font-medium group-hover:underline">@{mention.author} menandai kamu</span>
                        <div className="flex items-center gap-2">
                          <span className="opacity-40 text-[10px]">{mention.createdAt}</span>
                          <span className="opacity-40 group-hover:opacity-100">[view post]</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 border border-current/10 rounded-xl">
                        <img src={mention.coverUrl} alt={mention.mediaTitle} className="w-12 h-12 rounded-lg object-cover shrink-0 opacity-90" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-mono-custom uppercase tracking-wider opacity-40">{mention.mediaType}</p>
                          <p className="text-sm font-medium italic truncate font-sans">{mention.mediaTitle}</p>
                        </div>
                      </div>

                      <p className="text-xs italic opacity-80 font-sans leading-relaxed">
                        "{mention.caption}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`border rounded-3xl p-12 text-center space-y-2 ${cardBgClass}`}>
                  <p className="text-xs font-mono-custom opacity-40 uppercase tracking-wider">No Mentions Found</p>
                  <p className="text-xs italic opacity-60 font-sans">Belum ada orang yang menandai username @{profile.username}.</p>
                </div>
              )
            ) : (
              <div className={`border rounded-3xl p-12 text-center space-y-2 ${cardBgClass}`}>
                <p className="text-xs font-mono-custom opacity-40 uppercase tracking-wider">Mention Disembunyikan (Private)</p>
                <p className="text-xs italic opacity-60 font-sans">Daftar mention kamu diset ke private.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Switcher Navigation Bar Bottom */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-md px-6 py-3 rounded-full shadow-lg flex items-center gap-6 border z-40 ${
        isDarkMode ? 'bg-[#1A1A18]/90 border-[#2A2A27] text-[#E8E2D2]' : 'bg-[#FAF8F5]/90 border-[#E8E3D8] text-[#2C2A29]'
      }`}>
        <a href="/" className="text-xs font-mono-custom opacity-60 hover:opacity-100 transition">
          feed
        </a>
        <span className="opacity-20">/</span>
        <a href="/profile" className="text-xs font-mono-custom opacity-100 border-b border-current pb-0.5 font-medium">
          shelf
        </a>
      </div>

      {/* Modal Edit Profile */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto ${cardBgClass}`}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg italic font-normal">Edit Profile</h3>
              <button onClick={() => setShowEditProfile(false)} className="text-xs font-mono-custom opacity-50 hover:opacity-100">[close]</button>
            </div>
            
            <div className="text-center space-y-3">
              {tempAvatar ? (
                <img src={tempAvatar} className="w-20 h-20 rounded-2xl object-cover mx-auto border border-current opacity-90" />
              ) : (
                <div className="w-20 h-20 rounded-2xl border border-current flex items-center justify-center opacity-60 mx-auto text-xl italic font-normal">
                  -
                </div>
              )}
              
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-mono-custom opacity-70 hover:opacity-100 border-b border-current pb-0.5"
              >
                [choose photo]
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono-custom">
              <div className="space-y-1">
                <label className="opacity-50">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 opacity-40">@</span>
                  <input 
                    type="text" 
                    value={tempUsername} 
                    onChange={(e) => setTempUsername(e.target.value)} 
                    className={`w-full border rounded-xl pl-7 pr-3 py-2.5 outline-none font-sans ${
                      isDarkMode ? 'bg-[#121211] border-[#2A2A27]' : 'bg-white border-[#E8E3D8]'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="opacity-50">Display Name</label>
                <input 
                  type="text" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)} 
                  className={`w-full border rounded-xl px-3 py-2.5 outline-none font-sans ${
                    isDarkMode ? 'bg-[#121211] border-[#2A2A27]' : 'bg-white border-[#E8E3D8]'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="opacity-50">Bio</label>
                <textarea 
                  value={tempBio} 
                  onChange={(e) => setTempBio(e.target.value)} 
                  rows={2}
                  className={`w-full border rounded-xl px-3 py-2.5 outline-none font-sans resize-none ${
                    isDarkMode ? 'bg-[#121211] border-[#2A2A27]' : 'bg-white border-[#E8E3D8]'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="opacity-50">Instagram Handle</label>
                <input 
                  type="text" 
                  value={tempInstagram} 
                  onChange={(e) => setTempInstagram(e.target.value)} 
                  placeholder="username"
                  className={`w-full border rounded-xl px-3 py-2.5 outline-none font-sans ${
                    isDarkMode ? 'bg-[#121211] border-[#2A2A27]' : 'bg-white border-[#E8E3D8]'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="opacity-50">TikTok Handle</label>
                <input 
                  type="text" 
                  value={tempTiktok} 
                  onChange={(e) => setTempTiktok(e.target.value)} 
                  placeholder="username"
                  className={`w-full border rounded-xl px-3 py-2.5 outline-none font-sans ${
                    isDarkMode ? 'bg-[#121211] border-[#2A2A27]' : 'bg-white border-[#E8E3D8]'
                  }`}
                />
              </div>
            </div>

            <button 
              onClick={handleSaveProfile}
              className={`w-full py-3 rounded-xl text-xs font-mono-custom tracking-wider uppercase transition ${
                isDarkMode ? 'bg-[#E8E2D2] text-[#121211] hover:opacity-90' : 'bg-[#2C2A29] text-[#FAF8F5] hover:opacity-90'
              }`}
            >
              Simpan Profil
            </button>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {activeModal && activeModal !== 'Movies' && activeModal !== 'TV Shows' && activeModal !== 'Artists' && activeModal !== 'Albums' && activeModal !== 'Songs' && activeModal !== 'Books' ? null : activeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 max-h-[85vh] flex flex-col ${cardBgClass}`}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg italic font-normal">Add {activeModal}</h3>
              <button onClick={() => { setActiveModal(null); setSearchQuery(''); setSearchResults([]); }} className="text-xs font-mono-custom opacity-50 hover:opacity-100">[close]</button>
            </div>

            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Cari judul atau nama ${activeModal.toLowerCase()}...`}
                autoFocus
                className={`w-full border rounded-xl px-4 py-3 text-xs font-mono-custom outline-none ${
                  isDarkMode ? 'bg-[#121211] border-[#2A2A27]' : 'bg-white border-[#E8E3D8]'
                }`}
              />
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {loading && <p className="text-xs font-mono-custom opacity-40 text-center py-6">Mencari...</p>}

              {!loading && searchResults.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectItem(item)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:border-current/20 cursor-pointer transition ${
                    isDarkMode ? 'hover:bg-[#222220]' : 'hover:bg-[#F0ECE1]'
                  }`}
                >
                  <img src={item.coverUrl} alt={item.title} className="w-12 h-12 rounded-xl object-cover shrink-0 opacity-90" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate font-sans">{item.title}</p>
                    <p className="text-[10px] font-mono-custom opacity-50 truncate mt-0.5">{item.subtitle}</p>
                  </div>
                  <span className="text-xs font-mono-custom opacity-40 shrink-0">[select]</span>
                </div>
              ))}

              {!loading && searchQuery && searchResults.length === 0 && (
                <p className="text-xs font-mono-custom opacity-40 text-center py-8">Tidak ditemukan hasil untuk "{searchQuery}".</p>
              )}

              {!searchQuery && !loading && (
                <p className="text-xs font-mono-custom opacity-30 text-center py-8">Ketik sesuatu di atas untuk mulai mencari.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}