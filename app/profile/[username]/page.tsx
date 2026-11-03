'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface ShelfItem {
  type: string
  title: string
  subtitle?: string
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

interface UserProfileData {
  displayName: string
  bio: string
  avatarUrl: string
  instagram: string
  tiktok: string
  compatibility?: string
  commonTaste?: string
  items: ShelfItem[]
}

export default function FriendProfilePage() {
  const params = useParams()
  const rawUsername = params?.username as string || ''
  const profileKey = rawUsername.toLowerCase().replace('@', '').trim()

  const [isMounted, setIsMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'shelf' | 'posts'>('shelf')
  const [activePlayItem, setActivePlayItem] = useState<ShelfItem | null>(null)
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [theirPosts, setTheirPosts] = useState<FeedPost[]>([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const savedTheme = localStorage.getItem('interlinked_theme')
    if (savedTheme === 'dark') setIsDarkMode(true)

    if (!profileKey) {
      setNotFound(true)
      return
    }

    // 1. Cek apakah profil ini tersimpan di LocalStorage utama pengguna (misal tersimpan dari interaksi atau profil lokal)
    const savedProfilesStr = localStorage.getItem('interlinked_profiles')
    let foundProfile: UserProfileData | null = null

    if (savedProfilesStr) {
      try {
        const profilesMap = JSON.parse(savedProfilesStr)
        if (profilesMap[profileKey]) {
          foundProfile = profilesMap[profileKey]
        }
      } catch (e) {
        console.error("Error parsing saved profiles", e)
      }
    }

    // 2. Jika tidak ada di custom storage, coba cari dari data feed postingan publik mereka
    const savedFeed = localStorage.getItem('interlinked_feed_posts') || localStorage.getItem('interlinked_feeds')
    let userPosts: FeedPost[] = []

    if (savedFeed) {
      try {
        const allPosts: FeedPost[] = JSON.parse(savedFeed)
        userPosts = allPosts.filter(post => {
          const author = (post.author || '').toLowerCase().replace('@', '').trim()
          return author === profileKey
        })
        setTheirPosts(userPosts)
      } catch (e) {
        setTheirPosts([])
      }
    }

    if (foundProfile) {
      setProfileData(foundProfile)
    } else if (userPosts.length > 0) {
      // Rekonstruksi profil dasar dari postingan yang ada jika profil belum tersimpan secara eksplisit
      setProfileData({
        displayName: profileKey.charAt(0).toUpperCase() + profileKey.slice(1),
        bio: 'Exploring interlinked universe ✨',
        avatarUrl: userPosts[0]?.coverUrl || '',
        instagram: profileKey,
        tiktok: '',
        compatibility: '82%',
        commonTaste: 'General Media',
        items: []
      })
    } else {
      setNotFound(true)
    }
  }, [profileKey])

  if (!isMounted) return <div className="min-h-screen bg-[#FAF8F5]" />

  const bgClass = isDarkMode ? 'bg-[#121211] text-[#E8E2D2]' : 'bg-[#FAF8F5] text-slate-800'
  const cardBgClass = isDarkMode ? 'bg-[#1A1A18] border-[#2A2A27]' : 'bg-white/70 border-stone-200/80'

  const shelfSections = [
    { type: 'Artists' },
    { type: 'Albums' },
    { type: 'Songs' },
    { type: 'TV Shows' },
    { type: 'Movies' },
    { type: 'Books' },
  ]

  if (notFound || !profileData) {
    return (
      <div className={`min-h-screen transition-colors duration-500 flex flex-col items-center justify-center p-6 ${bgClass}`}>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=JetBrains+Mono:wght@300;400;500&display=swap');
          body { font-family: 'Newsreader', serif; }
          .font-mono-custom { font-family: 'JetBrains Mono', monospace; }
        `}</style>
        <div className={`border rounded-3xl p-10 max-w-md w-full text-center space-y-4 shadow-sm ${cardBgClass}`}>
          <span className="text-3xl">🔍</span>
          <h1 className="text-2xl italic font-normal">Profile Not Found</h1>
          <p className="text-xs font-mono-custom opacity-60">
            Akun @{profileKey} tidak ditemukan di archive lokal interlinked.
          </p>
          <div className="pt-4">
            <a 
              href="/" 
              className="inline-block px-6 py-2.5 rounded-full border border-current text-xs font-mono-custom opacity-80 hover:opacity-100 transition"
            >
              [back to feed]
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 pb-32 ${bgClass}`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=JetBrains+Mono:wght@300;400;500&display=swap');
        body { font-family: 'Newsreader', serif; }
        .font-mono-custom { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* Navbar Minimalist */}
      <nav className={`border-b px-6 py-4 backdrop-blur-md sticky top-0 z-40 transition-colors ${isDarkMode ? 'border-[#222220] bg-[#121211]/80' : 'border-stone-200/60 bg-white/60'}`}>
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <a href="/" className="text-xl italic font-semibold tracking-wide flex items-center gap-1 opacity-90 hover:opacity-100 font-sans">
            interlinked <span className="not-italic text-sm font-light">/ profile</span>
          </a>

          <div className="flex items-center gap-4 text-xs font-mono-custom opacity-70">
            <span>@{profileKey}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-5 pt-12 space-y-10">
        
        {/* Profile Header */}
        <div className={`border rounded-3xl p-8 space-y-6 shadow-sm backdrop-blur-md ${cardBgClass}`}>
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              {profileData.avatarUrl ? (
                <img src={profileData.avatarUrl} alt={profileData.displayName} className="w-20 h-20 rounded-2xl object-cover border border-stone-300/40 shadow-inner" />
              ) : (
                <div className="w-20 h-20 rounded-2xl border border-stone-300 flex items-center justify-center italic text-2xl font-normal opacity-80">
                  {profileData.displayName.charAt(0)}
                </div>
              )}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[10px] font-mono-custom uppercase tracking-widest opacity-40 block">Community Archive</span>
              <h1 className="text-3xl italic font-normal tracking-tight truncate">
                {profileData.displayName}
              </h1>
              <p className="text-xs font-mono-custom opacity-60">
                @{profileKey}
              </p>
            </div>
          </div>

          <p className="text-base italic font-light opacity-80 font-sans leading-relaxed">
            "{profileData.bio}"
          </p>

          <div className="flex items-center gap-3 pt-1 flex-wrap text-xs font-mono-custom">
            {profileData.instagram && (
              <a 
                href={`https://instagram.com/${profileData.instagram}`} 
                target="_blank" 
                rel="noreferrer"
                className="opacity-60 hover:opacity-100 transition border-b border-current pb-0.5"
              >
                ig: @{profileData.instagram}
              </a>
            )}
            {profileData.tiktok && (
              <a 
                href={`https://tiktok.com/@${profileData.tiktok}`} 
                target="_blank" 
                rel="noreferrer"
                className="opacity-60 hover:opacity-100 transition border-b border-current pb-0.5"
              >
                tt: @{profileData.tiktok}
              </a>
            )}
          </div>
        </div>

        {/* Taste Compatibility Score Widget */}
        {profileData.commonTaste && (
          <div className={`border rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm backdrop-blur-md ${cardBgClass}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 border border-current/20 opacity-90">
                ✨
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium font-sans opacity-90">
                  Taste Compatibility
                </p>
                <p className="text-[11px] font-mono-custom opacity-60 truncate">
                  Kamu & @{profileKey} sama-sama suka <strong className="font-semibold">{profileData.commonTaste}</strong>
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full border border-current/20 text-xs font-mono-custom font-semibold flex-shrink-0 opacity-90">
              {profileData.compatibility || '85%'} Match
            </div>
          </div>
        )}

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
            onClick={() => setActiveTab('posts')} 
            className={`transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'posts' ? 'opacity-100 font-medium border-b border-current pb-0.5' : 'opacity-40 hover:opacity-80'}`}
          >
            <span>[posts]</span>
            <span className="border border-current px-1.5 py-0.2 rounded-full text-[10px] opacity-70">{theirPosts.length}</span>
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'shelf' ? (
          <>
            {activePlayItem && (
              <div className={`border rounded-2xl p-4 space-y-3 shadow-sm ${cardBgClass}`}>
                <div className="flex justify-between items-center text-xs font-mono-custom">
                  <span className="opacity-60">preview player: <span className="font-semibold italic">{activePlayItem.title}</span></span>
                  <button onClick={() => setActivePlayItem(null)} className="opacity-40 hover:opacity-100 transition">[close]</button>
                </div>
                <iframe
                  src={`https://open.spotify.com/embed`}
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
                const existingItem = profileData.items.find((i) => i.type === section.type)

                return (
                  <div key={section.type} className={`border rounded-3xl p-6 space-y-4 flex flex-col shadow-sm ${cardBgClass}`}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-mono-custom uppercase tracking-widest opacity-50">
                        {section.type}
                      </h3>
                    </div>
                    
                    {existingItem ? (
                      <div 
                        onClick={() => {
                          if (section.type === 'Songs' || section.type === 'Albums') {
                            setActivePlayItem(existingItem)
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
                        </div>
                      </div>
                    ) : (
                      <div className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-2xl py-12 opacity-30 ${isDarkMode ? 'border-[#2A2A27]' : 'border-stone-200'}`}>
                        <p className="text-xs font-mono-custom tracking-wider uppercase">Empty Archive</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {theirPosts.length > 0 ? (
              theirPosts.map((post) => (
                <div 
                  key={post.id} 
                  onClick={() => { window.location.href = `/#${post.id}` }}
                  className={`border rounded-2xl p-5 space-y-3 cursor-pointer transition hover:border-current group shadow-sm ${cardBgClass}`}
                >
                  <div className="flex justify-between items-center text-xs font-mono-custom">
                    <span className="opacity-80 font-medium">@{profileKey}</span>
                    <span className="opacity-40 text-[10px]">{post.createdAt}</span>
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
              ))
            ) : (
              <div className={`border rounded-3xl p-12 text-center space-y-2 shadow-sm ${cardBgClass}`}>
                <p className="text-xs font-mono-custom opacity-40 uppercase tracking-wider">No Posts Yet</p>
                <p className="text-xs italic opacity-60 font-sans">Belum ada postingan dari akun ini.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Navigation Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <nav className={`flex items-center gap-1.5 p-2 backdrop-blur-xl border rounded-full shadow-xl transition-all ${
          isDarkMode ? 'bg-[#1A1A18]/95 border-[#2A2A27] shadow-black/40 text-[#E8E2D2]' : 'bg-white/80 border-stone-200/80 shadow-stone-300/30 text-slate-800'
        }`}>
          <a
            href="/"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition active:scale-95 font-mono ${
              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-stone-100/80'
            }`}
          >
            <span>[</span>feed<span>]</span>
          </a>
          <a
            href="/profile"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition active:scale-95 font-mono ${
              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-stone-100/80'
            }`}
          >
            <span>[</span>shelf<span>]</span>
          </a>
        </nav>
      </div>
    </div>
  )
}