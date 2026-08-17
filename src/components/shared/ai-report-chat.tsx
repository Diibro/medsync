"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Sparkles, ShieldAlert, AlertTriangle, Send, Mic, Square, Volume2, VolumeX, Loader2, Info, Headphones } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { HealthReport } from "@/lib/ai/summary";
import type { ChatTurn } from "@/lib/ai/chat";

type AskAction = (history: ChatTurn[], question: string) => Promise<{ reply?: string; error?: string } | undefined>;

interface MinimalRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type RecognitionCtor = new () => MinimalRecognition;

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const COPY = {
  doctor: {
    title: "AI Chart Summary",
    placeholder: "Ask about this patient, or describe a test/medication you're considering...",
    disclaimer: "Generated from this patient's on-file records only. Always verify before acting — not a substitute for clinical judgment.",
    conditionsLabel: "Critical conditions",
    warningsLabel: "Watch for",
  },
  patient: {
    title: "Your Health Summary",
    placeholder: "Ask a question about your health record...",
    disclaimer: "A simplified summary of your own records. Always check with your doctor before making health decisions.",
    conditionsLabel: "Important to know",
    warningsLabel: "Be careful of",
  },
};

export function AiReportChat({
  report,
  audience,
  askAction,
}: {
  report: HealthReport;
  audience: "doctor" | "patient";
  askAction: AskAction;
}) {
  const copy = COPY[audience];
  const reportText = [report.summary, ...report.criticalConditions, ...report.warnings].join(". ");
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [audioMode, setAudioMode] = useState(false);
  const recognitionRef = useRef<MinimalRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasAutoReadReport = useRef(false);
  const spokenMessageCount = useRef(0);

  useEffect(() => {
    // Feature-detecting browser-only Web Speech APIs: reading `window` during render would mismatch
    // SSR output, so this has to happen post-mount — no non-effect equivalent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoiceSupported(getRecognitionCtor() !== null);
    setTtsSupported(typeof window.speechSynthesis !== "undefined");
    setAudioMode(localStorage.getItem("medsync-ai-audio-mode") === "true");
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  function speak(key: string, text: string) {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    if (speakingKey === key) {
      setSpeakingKey(null);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.onend = () => setSpeakingKey(null);
    utter.onerror = () => setSpeakingKey(null);
    setSpeakingKey(key);
    window.speechSynthesis.speak(utter);
  }

  function setAndPersistAudioMode(value: boolean) {
    setAudioMode(value);
    localStorage.setItem("medsync-ai-audio-mode", String(value));
  }

  // Audio Mode: read the report aloud the moment it's ready (or the moment the setting is turned
  // on, if the report is already showing), then read every new assistant reply as it arrives.
  useEffect(() => {
    if (!audioMode || !ttsSupported || hasAutoReadReport.current) return;
    hasAutoReadReport.current = true;
    speak("report", reportText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioMode, ttsSupported]);

  useEffect(() => {
    if (!audioMode || !ttsSupported) return;
    if (messages.length <= spokenMessageCount.current) return;
    spokenMessageCount.current = messages.length;
    const last = messages[messages.length - 1];
    // Reading a new assistant reply aloud is a reaction to server data arriving, not derivable
    // state — no non-effect equivalent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (last.role === "assistant") speak(`msg-${messages.length - 1}`, last.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, audioMode, ttsSupported]);

  function toggleListening() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function send() {
    const question = input.trim();
    if (!question || pending) return;
    setError(null);
    setInput("");
    const historyBefore = messages;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    startTransition(async () => {
      const result = await askAction(historyBefore, question);
      if (!result || result.error) {
        setError(result?.error ?? "Something went wrong. Try again.");
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", text: result.reply ?? "" }]);
    });
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="rounded-xl border border-[#3D5A8A]/25 bg-gradient-to-br from-[#152540] to-[#121A2C] shadow-sm overflow-hidden shrink-0">
        <div className="px-4 py-3 bg-[#1B3A6B] flex items-center gap-2">
          <Sparkles size={16} className="text-blue-200 shrink-0" />
          <h2 className="text-white text-sm font-semibold flex-1">{copy.title}</h2>
          {ttsSupported && (
            <>
              <label className="flex items-center gap-1.5 shrink-0 cursor-pointer" title="Automatically read the report and every new reply aloud">
                <Headphones size={13} className="text-blue-200" />
                <span className="text-[11px] text-blue-200 hidden sm:inline">Audio Mode</span>
                <Switch size="sm" checked={audioMode} onCheckedChange={setAndPersistAudioMode} />
              </label>
              <button
                type="button"
                onClick={() => speak("report", reportText)}
                className="text-blue-200 hover:text-white transition-colors shrink-0"
                title="Read summary aloud"
              >
                {speakingKey === "report" ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </>
          )}
        </div>
        <div className="p-4 flex flex-col gap-3">
          <p className="text-sm text-[#C3CEE3] leading-relaxed">{report.summary}</p>

          {report.criticalConditions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#7CA6E8] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <ShieldAlert size={12} /> {copy.conditionsLabel}
              </h3>
              <ul className="flex flex-col gap-1">
                {report.criticalConditions.map((c, i) => (
                  <li key={i} className="text-xs text-[#AEBBD6] leading-relaxed flex items-start gap-1.5">
                    <span className="text-[#7CA6E8] mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.warnings.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#D8A05C] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={12} /> {copy.warningsLabel}
              </h3>
              <ul className="flex flex-col gap-1">
                {report.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-[#E8C89A] leading-relaxed flex items-start gap-1.5">
                    <span className="text-[#D8A05C] mt-0.5">•</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-[#5D7099] flex items-start gap-1 pt-1 border-t border-[#243149]">
            <Info size={11} className="shrink-0 mt-0.5" /> {copy.disclaimer}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-[120px] overflow-y-auto flex flex-col gap-2.5 px-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed flex items-start gap-1.5 ${
                m.role === "user"
                  ? "bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] text-white"
                  : "bg-[#121A2C] border border-[#243149] text-[#C3CEE3]"
              }`}
            >
              <span className="flex-1">{m.text}</span>
              {m.role === "assistant" && ttsSupported && (
                <button type="button" onClick={() => speak(`msg-${i}`, m.text)} className="text-[#7CA6E8] hover:text-white shrink-0 mt-0.5">
                  {speakingKey === `msg-${i}` ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
              )}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="bg-[#121A2C] border border-[#243149] rounded-xl px-3 py-2 flex items-center gap-1.5">
              <Loader2 size={12} className="text-[#7CA6E8] animate-spin" />
              <span className="text-xs text-[#7488AA]">Thinking...</span>
            </div>
          </div>
        )}
        {error && <p className="text-xs text-red-400 px-1">{error}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={listening ? "Listening..." : copy.placeholder}
          disabled={pending}
          className="flex-1 h-10 rounded-lg bg-[#121A2C] border border-[#243149] px-3 text-xs text-[#E7ECF5] placeholder:text-[#5D7099] outline-none focus:border-[#3D6FC4] disabled:opacity-50"
        />
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={pending}
            className={`h-10 w-10 shrink-0 rounded-lg border flex items-center justify-center transition-colors ${
              listening ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-[#121A2C] border-[#243149] text-[#7CA6E8] hover:bg-[#152540]"
            }`}
            title={listening ? "Stop listening" : "Speak your question"}
          >
            {listening ? <Square size={14} /> : <Mic size={16} />}
          </button>
        )}
        <button
          type="button"
          onClick={send}
          disabled={pending || !input.trim()}
          className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] disabled:opacity-50 text-white flex items-center justify-center transition-colors"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
