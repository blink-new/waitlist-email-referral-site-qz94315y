
import React, { useState, useRef, useEffect } from "react";
import { Copy, Check, Share2, Twitter } from "lucide-react";
import clsx from "clsx";

const fakeReferralBase = window.location.origin + "/?ref=";

type WaitlistUser = {
  email: string;
  referralCode: string;
  referredBy?: string;
  referrals: string[];
};

function generateReferralCode(email: string) {
  return btoa(email).replace(/=+$/, "");
}

function getWaitlist(): WaitlistUser[] {
  try {
    const data = localStorage.getItem("waitlist_users");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveWaitlist(users: WaitlistUser[]) {
  localStorage.setItem("waitlist_users", JSON.stringify(users));
}

function findUserByEmail(email: string): WaitlistUser | undefined {
  return getWaitlist().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function findUserByCode(code: string): WaitlistUser | undefined {
  return getWaitlist().find((u) => u.referralCode === code);
}

function addUser(email: string, referredByCode?: string): { user: WaitlistUser; error?: string } {
  const waitlist = getWaitlist();
  if (findUserByEmail(email)) {
    return { user: findUserByEmail(email)!, error: "This email is already on the waitlist." };
  }
  const referralCode = generateReferralCode(email);
  const user: WaitlistUser = {
    email,
    referralCode,
    referredBy: referredByCode,
    referrals: [],
  };
  waitlist.push(user);

  if (referredByCode) {
    const referrer = findUserByCode(referredByCode);
    if (referrer && !referrer.referrals.includes(email)) {
      referrer.referrals.push(email);
    }
  }
  saveWaitlist(waitlist);
  return { user };
}

function getReferralCount(user: WaitlistUser) {
  return user.referrals.length;
}

function getUserRank(user: WaitlistUser) {
  const waitlist = getWaitlist();
  const sorted = [...waitlist].sort((a, b) => {
    const diff = getReferralCount(b) - getReferralCount(a);
    if (diff !== 0) return diff;
    return 0;
  });
  return sorted.findIndex((u) => u.email === user.email) + 1;
}

export default function App() {
  const [step, setStep] = useState<"form" | "dashboard">("form");
  const [email, setEmail] = useState("");
  const [inputError, setInputError] = useState("");
  const [user, setUser] = useState<WaitlistUser | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justJoined, setJustJoined] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const [referralParam, setReferralParam] = useState<string | undefined>();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || undefined;
    setReferralParam(ref);
    const lastEmail = localStorage.getItem("waitlist_last_email");
    if (lastEmail) {
      const existing = findUserByEmail(lastEmail);
      if (existing) {
        setUser(existing);
        setStep("dashboard");
      }
    }
  }, []);

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInputError("");
    if (!validateEmail(email)) {
      setInputError("Please enter a valid email address.");
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const { user: newUser, error } = addUser(email, referralParam);
      if (error) {
        setInputError(error);
        setLoading(false);
        return;
      }
      setUser(newUser);
      setStep("dashboard");
      setJustJoined(true);
      localStorage.setItem("waitlist_last_email", email);
      setLoading(false);
    }, 700);
  }

  function handleCopy() {
    if (!user) return;
    navigator.clipboard.writeText(`${fakeReferralBase}${user.referralCode}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1200);
  }

  function handleShareTwitter() {
    if (!user) return;
    const url = encodeURIComponent(`${fakeReferralBase}${user.referralCode}`);
    const text = encodeURIComponent(
      "Join this awesome waitlist! Get early access and perks:"
    );
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      "_blank"
    );
  }

  function handleShareNative() {
    if (!user) return;
    if (navigator.share) {
      navigator.share({
        title: "Waitlist Invite",
        text: "Join this awesome waitlist! Get early access and perks:",
        url: `${fakeReferralBase}${user.referralCode}`,
      });
    } else {
      handleCopy();
    }
  }

  function handleReset() {
    setStep("form");
    setEmail("");
    setInputError("");
    setUser(null);
    setJustJoined(false);
    localStorage.removeItem("waitlist_last_email");
  }

  const [referralCount, setReferralCount] = useState(0);
  useEffect(() => {
    if (user) {
      if (justJoined) {
        setReferralCount(0);
        let count = 0;
        const target = getReferralCount(user);
        if (target === 0) return;
        const interval = setInterval(() => {
          count++;
          setReferralCount(count);
          if (count >= target) clearInterval(interval);
        }, 120);
        return () => clearInterval(interval);
      } else {
        setReferralCount(getReferralCount(user));
      }
    }
  }, [user, justJoined]);

  const rank = user ? getUserRank(user) : null;
  const total = getWaitlist().length;

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center relative overflow-x-hidden">
      {/* Vercel-style background grid + subtle glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, #fff2 0%, #0000 70%), repeating-linear-gradient(90deg, #222 0 1px, transparent 1px 80px), repeating-linear-gradient(180deg, #222 0 1px, transparent 1px 80px)",
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, #fff1 0%, #0000 100%)"
      }} />
      <main className="relative z-10 flex flex-col min-h-screen w-full items-center justify-center">
        <header className="w-full flex flex-col items-center pt-24 pb-12">
          <img
            src="https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png"
            alt="Vercel Logo"
            className="w-14 h-14 mb-8 drop-shadow-xl"
            draggable={false}
          />
          <h1 className="text-5xl font-extrabold text-white tracking-tight font-display drop-shadow-lg text-center leading-tight">
            Get Early Access
          </h1>
          <p className="text-gray-400 text-xl text-center mt-6 font-medium max-w-2xl leading-relaxed">
            Be the first to experience our new platform.<br className="hidden sm:inline" />
            <span className="inline-block mt-2 text-white/80 font-semibold tracking-wide">
              Join the waitlist and invite friends to move up and unlock exclusive early access.
            </span>
          </p>
        </header>
        <section className="flex-1 flex flex-col items-center justify-center w-full px-4">
          <div className="w-full max-w-lg">
            {step === "form" && (
              <form
                className="flex flex-col gap-8 animate-fade-in w-full bg-white/5 rounded-2xl shadow-2xl p-8 border border-white/10 backdrop-blur-md"
                onSubmit={handleSubmit}
                autoComplete="off"
              >
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="text-gray-200 font-semibold text-lg"
                  >
                    Email Address
                  </label>
                  <input
                    ref={inputRef}
                    id="email"
                    type="email"
                    className={clsx(
                      "rounded-xl px-5 py-4 border transition-all outline-none text-lg bg-[#18181b] shadow-sm font-medium focus:shadow-lg focus:bg-black w-full text-white",
                      inputError
                        ? "border-red-400 focus:ring-2 focus:ring-red-200"
                        : "border-neutral-800 focus:ring-2 focus:ring-white/30"
                    )}
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoFocus
                    required
                  />
                  {inputError && (
                    <span className="text-red-400 text-xs mt-1">{inputError}</span>
                  )}
                </div>
                <button
                  type="submit"
                  className={clsx(
                    "w-full py-4 rounded-xl font-bold text-lg transition-all",
                    "bg-gradient-to-r from-white via-gray-200 to-white text-black shadow-xl hover:scale-[1.03] active:scale-95 hover:shadow-2xl",
                    loading && "opacity-60 cursor-not-allowed"
                  )}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="animate-pulse">Joining...</span>
                  ) : (
                    "Join Waitlist"
                  )}
                </button>
                {referralParam && (
                  <div className="text-xs text-blue-400 text-center mt-2">
                    You were invited by a friend!
                  </div>
                )}
              </form>
            )}

            {step === "dashboard" && user && (
              <div className="flex flex-col gap-12 items-center animate-fade-in w-full py-10">
                <div className="w-full flex flex-col items-center gap-2">
                  <h2 className="text-3xl font-bold text-white text-center font-display drop-shadow-sm mb-2">
                    {justJoined ? "You're on the waitlist!" : "Welcome back!"}
                  </h2>
                  <span className="text-gray-300 text-lg font-medium text-center">
                    Share your link to move up the list:
                  </span>
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full mt-3">
                    <input
                      className="flex-1 px-3 py-3 rounded-xl border border-neutral-800 bg-[#18181b] text-base text-white select-all min-w-0 shadow-sm font-medium focus:shadow-lg focus:bg-black transition-all"
                      value={`${fakeReferralBase}${user.referralCode}`}
                      readOnly
                      onFocus={(e) => e.target.select()}
                      style={{ minWidth: 0 }}
                    />
                    <button
                      type="button"
                      className={clsx(
                        "p-3 rounded-xl transition-all",
                        copySuccess
                          ? "bg-green-900 text-green-300"
                          : "bg-neutral-900 text-white hover:bg-neutral-800"
                      )}
                      onClick={handleCopy}
                      aria-label="Copy referral link"
                    >
                      {copySuccess ? <Check size={22} /> : <Copy size={22} />}
                    </button>
                  </div>
                  <div className="flex gap-3 mt-4 flex-wrap w-full justify-center">
                    <button
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-base font-semibold shadow hover:bg-gray-200 transition-all"
                      onClick={handleShareTwitter}
                    >
                      <Twitter size={18} /> Tweet
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-base font-semibold shadow hover:bg-neutral-800 transition-all"
                      onClick={handleShareNative}
                    >
                      <Share2 size={18} /> Share
                    </button>
                  </div>
                </div>
                <div className="w-full flex flex-col items-center gap-1">
                  <span className="text-white font-semibold text-2xl font-display">
                    {referralCount} {referralCount === 1 ? "referral" : "referrals"}
                  </span>
                  <span className="text-gray-400 text-base">
                    Each friend who joins moves you up!
                  </span>
                  <div className="mt-2 text-base text-gray-400">
                    Your rank:{" "}
                    <span className="font-bold text-white">
                      {rank} / {total}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-4 text-base text-white underline hover:text-gray-300"
                  onClick={handleReset}
                >
                  Join with a different email
                </button>
              </div>
            )}
          </div>
        </section>
        <footer className="w-full text-center text-gray-700 text-xs py-8 mt-auto bg-black/80 border-t border-neutral-900">
          <span className="text-gray-500">&copy; {new Date().getFullYear()} Waitlist Site. Not affiliated with Vercel.</span>
        </footer>
      </main>
      <style>
        {`
        .animate-fade-in {
          animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(24px);}
          to { opacity: 1; transform: none;}
        }
        .font-display {
          font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          letter-spacing: -0.01em;
        }
        .animate-pop {
          animation: popIn 0.5s cubic-bezier(.4,0,.2,1);
        }
        @keyframes popIn {
          0% { transform: scale(0.7); opacity: 0; }
          80% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        `}
      </style>
    </div>
  );
}