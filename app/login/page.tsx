'use client'

import { useState, useEffect } from 'react'

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [step, setStep] = useState<'check_nis' | 'create_account' | 'login'>('check_nis')

  const [nisInput, setNisInput] = useState('')
  const [matchedStudent, setMatchedStudent] = useState<any>(null)
  
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    setIsMounted(true)
    const savedTheme = localStorage.getItem('interlinked_theme')
    if (savedTheme === 'dark') setIsDarkMode(true)

    const defaultStudents = [
      { nis: '242507101', name: 'Jasmine' },
      { nis: '242507105', name: 'Jessica' },
    ]
    localStorage.setItem('interlinked_allowed_nis', JSON.stringify(defaultStudents))
  }, [])

  const toggleTheme = () => {
    const nextMode = !isDarkMode
    setIsDarkMode(nextMode)
    localStorage.setItem('interlinked_theme', nextMode ? 'dark' : 'light')
  }

  const handleVerifyNis = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const cleanNis = nisInput.trim()
    if (!cleanNis) {
      setErrorMsg('NIS tidak boleh kosong.')
      return
    }

    const savedStudentsJson = localStorage.getItem('interlinked_allowed_nis')
    const allowedStudents = savedStudentsJson ? JSON.parse(savedStudentsJson) : []
    const student = allowedStudents.find((s: any) => s.nis === cleanNis)

    if (!student) {
      setErrorMsg('NIS tidak terdaftar dalam arsip sistem sekolah.')
      return
    }

    setMatchedStudent(student)

    const registeredAccountsJson = localStorage.getItem('interlinked_registered_accounts') || '[]'
    const accounts = JSON.parse(registeredAccountsJson)
    const existingAccount = accounts.find((acc: any) => acc.nis === cleanNis)

    if (existingAccount) {
      setStep('login')
    } else {
      setStep('create_account')
    }
  }

  const handleRegisterAccount = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const cleanUsername = usernameInput.toLowerCase().replace('@', '').trim()
    const cleanPassword = passwordInput.trim()

    if (!cleanUsername || !cleanPassword) {
      setErrorMsg('Username dan password wajib diisi.')
      return
    }

    const registeredAccountsJson = localStorage.getItem('interlinked_registered_accounts') || '[]'
    const accounts = JSON.parse(registeredAccountsJson)
    
    if (accounts.some((acc: any) => acc.username === cleanUsername)) {
      setErrorMsg('Username sudah digunakan orang lain.')
      return
    }

    const newAccount = {
      nis: matchedStudent.nis,
      name: matchedStudent.name,
      username: cleanUsername,
      password: cleanPassword,
      bio: 'Siswa/i Interlinked Archive',
      avatarUrl: '',
      instagram: '',
      tiktok: ''
    }

    accounts.push(newAccount)
    localStorage.setItem('interlinked_registered_accounts', JSON.stringify(accounts))
    localStorage.setItem('interlinked_user_profile', JSON.stringify(newAccount))
    localStorage.setItem('interlinked_my_profile', JSON.stringify(newAccount))

    window.location.href = `/profile?u=${cleanUsername}`
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const cleanUsername = usernameInput.toLowerCase().replace('@', '').trim()
    const cleanPassword = passwordInput.trim()

    const registeredAccountsJson = localStorage.getItem('interlinked_registered_accounts') || '[]'
    const accounts = JSON.parse(registeredAccountsJson)
    const foundAccount = accounts.find((acc: any) => acc.username === cleanUsername)

    if (!foundAccount) {
      setErrorMsg('Username arsip tidak ditemukan.')
      return
    }

    if (foundAccount.password !== cleanPassword) {
      setErrorMsg('Password salah!')
      return
    }

    localStorage.setItem('interlinked_user_profile', JSON.stringify(foundAccount))
    localStorage.setItem('interlinked_my_profile', JSON.stringify(foundAccount))

    window.location.href = `/profile?u=${cleanUsername}`
  }

  if (!isMounted) return <div className="min-h-screen bg-[#FAF6F0]" />

  const bgClass = isDarkMode ? 'bg-[#181615] text-[#ECE3D5]' : 'bg-[#FAF6F0] text-[#1E2022]'
  const cardClass = isDarkMode ? 'bg-[#23201D] border-[#332E29]' : 'bg-white border-[#EDE2D3]'
  const inputClass = isDarkMode ? 'bg-[#181615] border-[#332E29] text-[#ECE3D5] focus:border-[#E0A96D]' : 'bg-[#FAF6F0] border-[#EDE2D3] text-[#1E2022] focus:border-stone-400'

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col justify-between p-6 ${bgClass}`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-editorial { font-family: 'Newsreader', serif; }
      `}</style>

      {/* Header Logo persis seperti referensi: interlinked / archive */}
      <header className="max-w-md mx-auto w-full pt-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-editorial italic font-bold tracking-tight">interlinked</span>
          <span className="text-lg font-editorial font-normal opacity-40">/</span>
          <span className="text-xl font-editorial font-normal tracking-wide opacity-70">archive</span>
        </div>

        <button 
          onClick={toggleTheme}
          className={`text-[11px] font-mono uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition ${
            isDarkMode 
              ? 'border-[#332E29] hover:bg-[#332E29] text-[#E0A96D]' 
              : 'border-[#EDE2D3] hover:bg-stone-100 text-stone-600'
          }`}
        >
          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 w-full flex-1 flex flex-col justify-center my-auto">
        <div className={`border rounded-[2rem] p-8 sm:p-10 space-y-6 shadow-sm transition-all ${cardClass}`}>
          
          {step === 'check_nis' && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border inline-block ${isDarkMode ? 'border-[#332E29] text-[#E0A96D]' : 'border-[#EDE2D3] text-stone-500'}`}>
                  Autentikasi Siswa
                </span>
                <h1 className="text-3xl sm:text-4xl font-editorial italic font-medium tracking-tight">Verifikasi NIS</h1>
                <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#A89F91]' : 'text-stone-500'}`}>
                  Masukkan Nomor Induk Siswa resmi yang terdaftar untuk mulai menyusun profil arsip kamu.
                </p>
              </div>

              <form onSubmit={handleVerifyNis} className="space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3.5 rounded-2xl border border-red-500/30 text-red-400 bg-red-500/10 text-center leading-relaxed">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-mono uppercase text-[10px] tracking-wider opacity-60">Nomor Induk Siswa (NIS)</label>
                  <input 
                    type="text" 
                    value={nisInput} 
                    onChange={(e) => setNisInput(e.target.value)} 
                    placeholder="cth: 242507101" 
                    required 
                    className={`w-full p-3.5 rounded-2xl border outline-none font-mono text-sm transition-colors ${inputClass}`}
                  />
                </div>

                <button 
                  type="submit" 
                  className={`w-full font-medium py-3.5 rounded-2xl border transition shadow-xs tracking-wide ${isDarkMode ? 'border-[#332E29] bg-[#332E29] hover:bg-[#3d3631] text-[#E0A96D]' : 'border-stone-900 bg-stone-900 hover:bg-stone-800 text-white'}`}
                >
                  Verifikasi dan Lanjutkan
                </button>
              </form>

              <div className={`p-4 rounded-2xl border text-[11px] space-y-1.5 ${isDarkMode ? 'bg-[#181615] border-[#332E29] text-[#A89F91]' : 'bg-[#FAF6F0] border-[#EDE2D3] text-stone-600'}`}>
                <p className="font-mono uppercase tracking-wider text-[10px] font-bold opacity-70">Contoh Data Uji Coba NIS:</p>
                <div className="grid grid-cols-1 gap-1 font-mono pt-1">
                  <span>• <code className="font-bold">242507101</code> (Jasmine)</span>
                  <span>• <code className="font-bold">242507105</code> (Jessica)</span>
                </div>
              </div>
            </div>
          )}

          {step === 'create_account' && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border inline-block ${isDarkMode ? 'border-[#332E29] text-[#E0A96D]' : 'border-[#EDE2D3] text-stone-500'}`}>
                  Halo, {matchedStudent?.name}
                </span>
                <h1 className="text-3xl sm:text-4xl font-editorial italic font-medium tracking-tight">Buat Kredensial</h1>
                <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#A89F91]' : 'text-stone-500'}`}>
                  NIS terkonfirmasi. Tentukan username unik dan password rahasia untuk akun arsip kamu.
                </p>
              </div>

              <form onSubmit={handleRegisterAccount} className="space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3.5 rounded-2xl border border-red-500/30 text-red-400 bg-red-500/10 text-center leading-relaxed">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-mono uppercase text-[10px] tracking-wider opacity-60">Username Profil</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 opacity-40 font-mono">@</span>
                    <input 
                      type="text" 
                      value={usernameInput} 
                      onChange={(e) => setUsernameInput(e.target.value)} 
                      placeholder="cth: jasmine" 
                      required 
                      className={`w-full pl-9 pr-4 p-3.5 rounded-2xl border outline-none transition-colors ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono uppercase text-[10px] tracking-wider opacity-60">Password Akun</label>
                  <input 
                    type="password" 
                    value={passwordInput} 
                    onChange={(e) => setPasswordInput(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                    className={`w-full p-3.5 rounded-2xl border outline-none transition-colors ${inputClass}`}
                  />
                </div>

                <button 
                  type="submit" 
                  className={`w-full font-medium py-3.5 rounded-2xl border transition shadow-xs tracking-wide ${isDarkMode ? 'border-[#332E29] bg-[#332E29] hover:bg-[#3d3631] text-[#E0A96D]' : 'border-stone-900 bg-stone-900 hover:bg-stone-800 text-white'}`}
                >
                  Simpan dan Masuk ke Arsip
                </button>
              </form>

              <button 
                onClick={() => setStep('check_nis')} 
                className="w-full text-center text-[11px] opacity-60 hover:opacity-100 transition font-mono pt-1"
              >
                Ganti atau masukkan NIS lain
              </button>
            </div>
          )}

          {step === 'login' && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border inline-block ${isDarkMode ? 'border-[#332E29] text-[#E0A96D]' : 'border-[#EDE2D3] text-stone-500'}`}>
                  Portal Masuk Arsip
                </span>
                <h1 className="text-3xl sm:text-4xl font-editorial italic font-medium tracking-tight">Log In</h1>
                <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#A89F91]' : 'text-stone-500'}`}>
                  Masukkan kredensial username dan password yang telah kamu daftarkan sebelumnya.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3.5 rounded-2xl border border-red-500/30 text-red-400 bg-red-500/10 text-center leading-relaxed">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-mono uppercase text-[10px] tracking-wider opacity-60">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 opacity-40 font-mono">@</span>
                    <input 
                      type="text" 
                      value={usernameInput} 
                      onChange={(e) => setUsernameInput(e.target.value)} 
                      placeholder="username kamu" 
                      required 
                      className={`w-full pl-9 pr-4 p-3.5 rounded-2xl border outline-none transition-colors ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono uppercase text-[10px] tracking-wider opacity-60">Password</label>
                  <input 
                    type="password" 
                    value={passwordInput} 
                    onChange={(e) => setPasswordInput(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                    className={`w-full p-3.5 rounded-2xl border outline-none transition-colors ${inputClass}`}
                  />
                </div>

                <button 
                  type="submit" 
                  className={`w-full font-medium py-3.5 rounded-2xl border transition shadow-xs tracking-wide ${isDarkMode ? 'border-[#332E29] bg-[#332E29] hover:bg-[#3d3631] text-[#E0A96D]' : 'border-stone-900 bg-stone-900 hover:bg-stone-800 text-white'}`}
                >
                  Akses Halaman Arsip
                </button>
              </form>

              <button 
                onClick={() => setStep('check_nis')} 
                className="w-full text-center text-[11px] opacity-60 hover:opacity-100 transition font-mono pt-1"
              >
                Reset Verifikasi NIS
              </button>
            </div>
          )}

        </div>
      </main>

      <footer className={`py-4 text-center text-[11px] font-mono tracking-wider transition-colors ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}>
        interlinked archiver system © 2026
      </footer>
    </div>
  )
}