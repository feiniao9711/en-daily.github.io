import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AudioRecorderService } from '../service/audio-recorder.service';
import { filter, Subscription } from 'rxjs';

interface SentenceScore {
  sentence: string;
  score: number;
  recognized: string;
}

type AppState = 'start' | 'practice' | 'result';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  // State management
  state: AppState = 'start';
  sentences: string[] = [];
  currentIndex: number = 0;
  scores: SentenceScore[] = [];
  isRecording: boolean = false;
  isProcessing: boolean = false;
  errorMessage: string = '';

  private recognition: any = null;
  private subscriptions: Subscription[] = [];

  constructor(private audioRecorderService: AudioRecorderService, private http: HttpClient) {
  }

  ngOnInit(): void {
    // 订阅录音状态
    this.subscriptions.push(
      this.audioRecorderService.recordingState$.subscribe(
        state => this.isRecording = state
      )
    );

    // 订阅转录结果
    this.audioRecorderService.transcriptionResult$
      .pipe(
        filter(text => !!text)
      )
      .subscribe(async (text) => {
        this.isProcessing = false;
        if (this.currentSentence) {
          let score = this.calculateScore(
            this.currentSentence,
            text
          );
          this.scores.push({
            sentence: this.currentSentence,
            score: score,
            recognized: text
          });
        }
      });
  }

  /**
   * Start the practice session
   */
  async startPractice(): Promise<void> {
    this.errorMessage = '';
    const date = this.getCurrentDate();
    const filePath = `sentence/${date}.txt`;

    try {
      const text = await this.http.get(filePath, { responseType: 'text' }).toPromise();

      if (text) {
        this.sentences = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        if (this.sentences.length === 0) {
          this.errorMessage = 'No sentences found in the file.';
          return;
        }

        this.currentIndex = 0;
        this.scores = [];
        this.state = 'practice';
      }
    } catch (error) {
      this.errorMessage = `Failed to load sentences for ${date}. Please check if the file exists.`;
      console.error('Error loading sentences:', error);
    }
  }

  /**
   * Get current date in YYYYMMDD format
   */
  private getCurrentDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Get current sentence
   */
  get currentSentence(): string {
    return this.sentences[this.currentIndex] || '';
  }

  /**
   * Get progress text
   */
  get progressText(): string {
    return `Sentence ${this.currentIndex + 1} / ${this.sentences.length}`;
  }

  /**
   * Play current sentence using Text-to-Speech
   */
  playSentence(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(this.currentSentence);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      window.speechSynthesis.speak(utterance);
    } else {
      this.errorMessage = 'Text-to-Speech is not supported in your browser.';
    }
  }

  /**
   * Start recording user's voice
   */
  async startRecording(): Promise<void> {
    try {
      this.errorMessage = '';
      await this.audioRecorderService.startRecording();
    } catch (error: any) {
      this.errorMessage = error.message || '开始录音失败';
      console.error('开始录音失败:', error);
    }
  }

  async stopRecording(): Promise<void> {
    try {
      this.errorMessage = '';
      await this.audioRecorderService.stopRecording();
    } catch (error: any) {
      this.errorMessage = error.message || '停止录音失败';
      console.error('停止录音失败:', error);
    }
  }

  /**
   * Calculate score using Levenshtein Distance algorithm
   */
  private calculateScore(original: string, recognized: string): number {
    const s1 = original.toLowerCase().replace(/[^\w\s]/g, '');
    const s2 = recognized.toLowerCase().replace(/[^\w\s]/g, '');

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    if (maxLength === 0) return 100;

    const score = Math.round((1 - distance / maxLength) * 100);
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Levenshtein Distance algorithm implementation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Check if current sentence has been scored
   */
  get isCurrentSentenceScored(): boolean {
    return this.scores.length > this.currentIndex;
  }

  /**
   * Move to next sentence
   */
  nextSentence(): void {
    if (this.currentIndex < this.sentences.length - 1) {
      this.currentIndex++;
    } else {
      this.state = 'result';
    }
  }

  /**
   * Calculate average score
   */
  get averageScore(): number {
    if (this.scores.length === 0) return 0;

    const total = this.scores.reduce((sum, item) => sum + item.score, 0);
    return Math.round(total / this.scores.length);
  }

  /**
   * Get score color class
   */
  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  }

  /**
   * Restart practice
   */
  restart(): void {
    this.state = 'start';
    this.sentences = [];
    this.currentIndex = 0;
    this.scores = [];
    this.errorMessage = '';
  }

  // 清除转录结果
  clearTranscription(): void {
    this.audioRecorderService.clearTranscription();
  }

  ngOnDestroy() {
    // 清理订阅
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // 确保录音被停止
    if (this.isRecording) {
      this.stopRecording().catch(console.error);
    }
  }
}

// Made with Bob
