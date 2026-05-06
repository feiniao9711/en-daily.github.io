import { Component, signal, computed, OnInit, OnDestroy, NgZone, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare global {
  interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

interface Quote { content: string; author: string; }
type AppStatus = 'loading' | 'ready' | 'recording' | 'manual' | 'scoring' | 'finished';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('playback') playbackEl!: ElementRef<HTMLAudioElement>;

  readonly quotes = signal<Quote[]>([]);
  readonly currentIndex = signal(0);
  readonly scores = signal<number[]>([]);
  readonly status = signal<AppStatus>('loading');
  readonly transcript = signal('');
  readonly manualInput = signal('');
  readonly currentScore = signal<number | null>(null);
  readonly errorMsg = signal<string | null>(null);

  readonly currentQuote = computed(() => this.quotes()[this.currentIndex()] || { content: '', author: '' });
  readonly isFinished = computed(() => this.status() === 'finished');
  readonly avgScore = computed(() => {
    const valid = this.scores().filter(s => s !== null);
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
  });
  readonly progress = computed(() => `${this.currentIndex() + 1} / 8`);

  private recognition: any;

  ngOnInit(): void { this.loadDailyQuotes(); }

  async loadDailyQuotes(): Promise<void> {
    const baseDate = new Date('2026-05-06');
    const page = Math.floor((Date.now() - baseDate.getTime()) / 86400000) + 1;
    try {
      const res = await fetch(`https://api.quotable.io/quotes?limit=8&page=${page}`);
      if (!res.ok) throw new Error('API异常');
      const data = await res.json();
      this.quotes.set(data.results || []);
    } catch {
      this.quotes.set([
        { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { content: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
        { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { content: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
        { content: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
        { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { content: "Act as if what you do makes a difference. It does.", author: "William James" }
      ]);
    }
    this.scores.set(Array(8).fill(null));
    this.currentIndex.set(0);
    this.status.set('ready');
  }

  playTTS(): void {
    window.speechSynthesis.cancel();
    const quote = this.currentQuote();
    if (!quote.content) return;
    const u = new SpeechSynthesisUtterance(quote.content);
    u.lang = 'en-US'; u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }

  startTest(): void {
    this.errorMsg.set(null);
    if (!SpeechRecognition) {
      this.status.set('manual');
      this.errorMsg.set('当前浏览器不支持语音识别，已切换至手动输入模式');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.continuous = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (e: any) => {
      this.transcript.set(e.results[0][0].transcript);
      this.evaluateScore(this.transcript());
    };

    this.recognition.onerror = (e: any) => {
      if (e.error === 'network' || e.error === 'service-not-allowed') {
        this.status.set('manual');
        this.errorMsg.set('语音识别服务暂不可用，请手动输入您朗读的句子');
      } else {
        this.errorMsg.set(`识别错误: ${e.error}`);
        this.status.set('ready');
      }
    };

    this.recognition.onend = () => {
      if (this.status() === 'recording') this.status.set('ready');
    };

    try {
      this.recognition.start();
      this.status.set('recording');
    } catch {
      this.status.set('manual');
    }
  }

  stopTest(): void {
    if (this.recognition) this.recognition.stop();
  }

  submitManual(): void {
    if (!this.manualInput().trim()) {
      this.errorMsg.set('请输入内容后再提交');
      return;
    }
    this.transcript.set(this.manualInput());
    this.evaluateScore(this.manualInput().trim());
  }

  private evaluateScore(spoken: string): void {
    const quote = this.currentQuote();
    if (!quote.content) return;
    const original = quote.content;
    const score = this.calculateOverlap(original, spoken);
    this.currentScore.set(score);
    const newScores = [...this.scores()];
    newScores[this.currentIndex()] = score;
    this.scores.set(newScores);
    this.status.set('scoring');
  }

  private calculateOverlap(orig: string, spoken: string): number {
    if (!spoken) return 0;
    const clean = (s: string) => s.toLowerCase().replace(/[^\w\s']/g, '').trim();
    const origWords = clean(orig).split(/\s+/);
    const spokenWords = clean(spoken).split(/\s+/);
    
    let matches = 0, sIdx = 0;
    for (const oW of origWords) {
      for (let j = sIdx; j < spokenWords.length; j++) {
        if (spokenWords[j] === oW || spokenWords[j].includes(oW) || oW.includes(spokenWords[j])) {
          matches++; sIdx = j + 1; break;
        }
      }
    }
    return Math.min(100, Math.round((matches / origWords.length) * 100));
  }

  nextQuote(): void {
    if (this.currentIndex() < 7) {
      this.currentIndex.update(i => i + 1);
      this.status.set('ready');
      this.transcript.set('');
      this.manualInput.set('');
      this.currentScore.set(null);
    } else {
      this.status.set('finished');
    }
  }

  restart(): void {
    window.speechSynthesis.cancel();
    if (this.recognition) this.recognition.abort();
    this.currentIndex.set(0);
    this.scores.set(Array(8).fill(null));
    this.transcript.set('');
    this.manualInput.set('');
    this.currentScore.set(null);
    this.status.set('ready');
    this.errorMsg.set(null);
  }

  ngOnDestroy(): void {
    window.speechSynthesis.cancel();
    if (this.recognition) this.recognition.abort();
  }
}
