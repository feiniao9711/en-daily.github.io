import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

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
export class AppComponent implements OnInit {
  // State management
  state: AppState = 'start';
  sentences: string[] = [];
  currentIndex: number = 0;
  scores: SentenceScore[] = [];
  isRecording: boolean = false;
  isProcessing: boolean = false;
  errorMessage: string = '';

  // Audio APIs
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recognition: any = null;

  constructor(private http: HttpClient) {
    this.initSpeechRecognition();
  }

  ngOnInit(): void {
    // Component initialized
  }

  /**
   * Initialize Web Speech API for speech recognition
   */
  private initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }
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
    this.errorMessage = '';
    this.audioChunks = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      this.errorMessage = 'Failed to access microphone. Please grant permission.';
      console.error('Error accessing microphone:', error);
    }
  }

  /**
   * Stop recording and process speech recognition
   */
  stopRecording(): void {
    if (!this.mediaRecorder || !this.isRecording) {
      return;
    }

    this.isRecording = false;
    this.isProcessing = true;

    this.mediaRecorder.stop();
    
    // Stop all audio tracks
    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());

    // Process speech recognition
    this.processSpeechRecognition();
  }

  /**
   * Process speech recognition and calculate score
   */
  private processSpeechRecognition(): void {
    if (!this.recognition) {
      this.errorMessage = 'Speech Recognition is not supported in your browser. Please use Chrome.';
      this.isProcessing = false;
      return;
    }

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const score = this.calculateScore(this.currentSentence, transcript);
      
      this.scores.push({
        sentence: this.currentSentence,
        score: score,
        recognized: transcript
      });

      this.isProcessing = false;
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.errorMessage = 'Speech recognition failed. Please try again.';
      this.isProcessing = false;
    };

    this.recognition.start();
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
}

// Made with Bob
