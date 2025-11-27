import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (phoneNumber: string) => void;
}

const normalizePhone = (raw: string) => {
  // Remove spaces and non-digits except leading '+'
  const cleaned = raw.replace(/\s+/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  // If user typed 10 digits (Indian), add +91
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  // If they typed with country code without + (e.g. 9199...), add +
  if (digits.length > 10 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`; // best-effort
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [step, setStep] = useState<'enterPhone' | 'enterOtp'>('enterPhone');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const apiBase = import.meta.env.MODE === 'production'
    ? (import.meta.env.VITE_OTP_SERVER_URL || '')
    : 'http://localhost:4000';

  const sendOtp = async () => {
    setMessage(null);
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setMessage('Please enter a valid phone number (10 digits).');
      return;
    }

    const formatted = normalizePhone(phone);
    setIsSending(true);
    try {
      const res = await fetch(`${apiBase}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to send OTP');
      }

      setStep('enterOtp');
      setMessage('OTP sent. Check your phone.');
    } catch (err: any) {
      console.error('sendOtp error', err);
      setMessage(err?.message || 'Failed to send OTP. Try again.');
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async () => {
    setMessage(null);
    const formatted = normalizePhone(phone);
    if (!otp || otp.trim().length < 3) {
      setMessage('Please enter the OTP received.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch(`${apiBase}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted, code: otp.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage('Login successful. Welcome!');
        // call parent with normalized phone (store as farmer id)
        onLoginSuccess(formatted);
      } else {
        const errMsg = data?.message || 'Incorrect OTP. Please try again.';
        setMessage(errMsg);
      }
    } catch (err: any) {
      console.error('verifyOtp error', err);
      setMessage(err?.message || 'Failed to verify OTP. Try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const goBack = () => {
    setOtp('');
    setStep('enterPhone');
    setMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-sky-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-sky-700 mb-4 text-center">Aqua Bridge — Login</h2>

        {message && (
          <div className="mb-4 text-sm text-sky-800 bg-sky-100 p-2 rounded">
            {message}
          </div>
        )}

        {step === 'enterPhone' && (
          <>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mobile number</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10 digit mobile (eg. 99xxxxxxx)"
                className="flex-grow px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>

            <button
              onClick={sendOtp}
              disabled={isSending}
              className={`mt-4 w-full py-2 rounded-lg font-medium ${isSending ? 'bg-slate-300' : 'bg-sky-600 text-white hover:bg-sky-700'}`}
            >
              {isSending ? 'Sending...' : 'Send OTP'}
            </button>

            <p className="mt-3 text-xs text-slate-500">
              We will send a one-time SMS code to verify your phone. Standard SMS charges may apply.
            </p>
          </>
        )}

        {step === 'enterOtp' && (
          <>
            <label className="block text-sm font-medium text-slate-700 mb-2">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter the 4-6 digit code"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={verifyOtp}
                disabled={isVerifying}
                className={`flex-1 py-2 rounded-lg font-medium ${isVerifying ? 'bg-slate-300' : 'bg-sky-600 text-white hover:bg-sky-700'}`}
              >
                {isVerifying ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                onClick={goBack}
                className="flex-1 py-2 rounded-lg border text-slate-700 hover:bg-slate-50"
              >
                Change number
              </button>
            </div>

            <button
              onClick={sendOtp}
              disabled={isSending}
              className="mt-3 w-full py-2 rounded-lg text-sm border text-sky-700 hover:bg-sky-50"
            >
              Resend OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
