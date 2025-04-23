
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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f8fafc] via-[#e0e7ef] to-[#f1f5f9] transition-all duration-700 relative overflow-x-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-blue-200 via-indigo-200 to-pink-200 rounded-full opacity-30 blur-3xl pointer-events-none -translate-x-1/3 -translate-y-1/3 z-0" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-br from-pink-200 via-yellow-100 to-blue-100 rounded-full opacity-30 blur-3xl pointer-events-none translate-x-1/4 translate-y-1/4 z-0" />
      <main className="relative z-10 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="w-full flex flex-col items-center pt-10 pb-6">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-display drop-shadow-sm text-center">
            Join the Waitlist
          </h1>
          <p className="text-gray-500 text-lg text-center mt-2 font-medium max-w-xl">
            Be the first to know when we launch. Invite friends to move up the list and unlock early access!
          </p>
        </header>
        <section className="flex-1 flex flex-col items-center justify-center w-full px-4">
          <div className="w-full max-w-xl">
            {step === "form" && (
              <form
                className="flex flex-col gap-7 animate-fade-in w-full"
                onSubmit={handleSubmit}
                autoComplete="off"
              >
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="text-gray-700 font-semibold text-base"
                  >
                    Email Address
                  </label>
                  <input
                    ref={inputRef}
                    id="email"
                    type="email"
                    className={clsx(
                      "rounded-xl px-4 py-3 border transition-all outline-none text-lg bg-[#f8fafc] shadow-sm font-medium focus:shadow-lg focus:bg-white w-full",
                      inputError
                        ? "border-red-400 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 focus:ring-2 focus:ring-blue-200"
                    )}
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoFocus
                    required
                  />
                  {inputError && (
                    <span className="text-red-500 text-xs mt-1">{inputError}</span>
                  )}
                </div>
                <button
                  type="submit"
                  className={clsx(
                    "w-full py-3 rounded-xl font-bold text-lg transition-all",
                    "bg-gradient-to-r from-blue-500 via-indigo-400 to-pink-400 text-white shadow-xl hover:scale-[1.03] active:scale-95 hover:shadow-2xl",
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
                  <div className="text-xs text-blue-500 text-center mt-2">
                    You were invited by a friend!
                  </div>
                )}
              </form>
            )}

            {step === "dashboard" && user && (
              <div className="flex flex-col gap-10 items-center animate-fade-in w-full py-10">
                <div className="w-full flex flex-col items-center gap-2">
                  <h2 className="text-3xl font-bold text-gray-900 text-center font-display drop-shadow-sm mb-2">
                    {justJoined ? "You're on the waitlist!" : "Welcome back!"}
                  </h2>
                  <span className="text-gray-600 text-lg font-medium text-center">
                    Share your link to move up the list:
                  </span>
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full mt-3">
                    <input
                      className="flex-1 px-3 py-3 rounded-xl border border-gray-200 bg-[#f8fafc] text-base text-gray-700 select-all min-w-0 shadow-sm font-medium focus:shadow-lg focus:bg-white transition-all"
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
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600 hover:bg-blue-200"
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
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-base font-semibold shadow hover:bg-blue-600 transition-all"
                      onClick={handleShareTwitter}
                    >
                      <Twitter size={18} /> Tweet
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-base font-semibold shadow hover:bg-gray-200 transition-all"
                      onClick={handleShareNative}
                    >
                      <Share2 size={18} /> Share
                    </button>
                  </div>
                </div>
                <div className="w-full flex flex-col items-center gap-1">
                  <span className="text-gray-900 font-semibold text-2xl font-display">
                    {referralCount} {referralCount === 1 ? "referral" : "referrals"}
                  </span>
                  <span className="text-gray-400 text-base">
                    Each friend who joins moves you up!
                  </span>
                  <div className="mt-2 text-base text-gray-500">
                    Your rank:{" "}
                    <span className="font-bold text-blue-500">
                      {rank} / {total}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-4 text-base text-indigo-500 underline hover:text-indigo-700"
                  onClick={handleReset}
                >
                  Join with a different email
                </button>
              </div>
            )}
          </div>
        </section>
        <footer className="w-full text-center text-gray-400 text-xs py-6 mt-auto">
          &copy; {new Date().getFullYear()} Waitlist Site. All rights reserved.
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