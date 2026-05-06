import { Component, ElementRef, ViewChild, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

type RecordState = 'idle' | 'recording' | 'paused' | 'finished';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnDestroy {
  @ViewChild('playback') playbackEl!: ElementRef<HTMLAudioElement>;

  // 全信号化：确保 Angular 自动追踪变化
  readonly audioStream = signal<MediaStream | null>(null);
  readonly state = signal<RecordState>('idle');
  readonly mimeType = signal('audio/webm;codecs=opus');
  readonly errorMsg = signal<string | null>(null);
  readonly duration = signal(0);
  readonly playbackUrl = signal<string | null>(null);

  readonly hasMic = computed(() => this.audioStream() !== null);
  readonly isIdle = computed(() => this.state() === 'idle');
  readonly isRecording = computed(() => this.state() === 'recording');
  readonly isPaused = computed(() => this.state() === 'paused');
  readonly isFinished = computed(() => this.state() === 'finished');

  private recorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private startTime = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;

  readonly mimeOptions = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];

  async startMic(): Promise<void> {
    try {
      this.errorMsg.set(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioStream.set(stream);
    } catch (err: any) {
      this.errorMsg.set(`无法访问麦克风: ${err?.message ?? '未知错误'}`);
    }
  }

  startRecording(): void {
    const stream = this.audioStream();
    if (!stream) return;

    this.chunks = [];
    const preferredMime = this.mimeType();
    const options: MediaRecorderOptions = MediaRecorder.isTypeSupported(preferredMime)
      ? { mimeType: preferredMime }
      : {};

    this.recorder = new MediaRecorder(stream, options);

    // 数据收集
    this.recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    // 录制结束
    this.recorder.onstop = () => this.handleStop();

    // ✅ 移除 MediaRecorderErrorEvent 显式类型，改用 Event + 安全访问，零 import 依赖
    this.recorder.onerror = (e: Event) => {
      const error = (e as any).error as DOMException | undefined;
      this.errorMsg.set(`录制失败: ${error?.name || '未知错误'}`);
      this.state.set('idle');
      if (this.timerId) clearInterval(this.timerId);
    };

    // 记录实际生效的编码格式
    this.mimeType.set(this.recorder.mimeType || preferredMime);

    // 250ms 触发一次数据事件，兼容性更好
    this.recorder.start(250);
    this.startTime = Date.now();
    this.duration.set(0);
    this.state.set('recording');

    this.timerId = setInterval(() => {
      this.duration.set(Math.floor((Date.now() - this.startTime) / 1000));
    }, 250);
  }

  pauseRecording(): void {
    this.recorder?.pause();
    this.state.set('paused');
    if (this.timerId) clearInterval(this.timerId);
  }

  resumeRecording(): void {
    this.recorder?.resume();
    this.state.set('recording');
    this.startTime = Date.now() - this.duration() * 1000;
    this.timerId = setInterval(() => {
      this.duration.set(Math.floor((Date.now() - this.startTime) / 1000));
    }, 250);
  }

  stopRecording(): void {
    if (this.recorder?.state === 'recording' || this.recorder?.state === 'paused') {
      this.recorder.stop();
    }
  }

  private handleStop(): void {
    if (this.timerId) clearInterval(this.timerId);

    if (this.chunks.length === 0) {
      this.errorMsg.set('未捕获到音频数据。请确保麦克风未被占用，且录制时长 >1 秒');
      this.state.set('idle');
      return;
    }

    const type = (this.chunks[0] as Blob).type || 'audio/webm';
    const blob = new Blob(this.chunks, { type });
    
    if (this.playbackUrl()) URL.revokeObjectURL(this.playbackUrl()!);
    this.playbackUrl.set(URL.createObjectURL(blob));
    this.state.set('finished');
  }

  playRecording(): void {
    this.playbackEl?.nativeElement.play().catch(() => {});
  }

  downloadRecording(): void {
    const url = this.playbackUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording_${Date.now()}.${this.getExt()}`;
    a.click();
  }

  reset(): void {
    this.stopRecording();
    if (this.timerId) clearInterval(this.timerId);

    const stream = this.audioStream();
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      this.audioStream.set(null);
    }

    const url = this.playbackUrl();
    if (url) URL.revokeObjectURL(url);

    this.playbackUrl.set(null);
    this.chunks = [];
    this.recorder = null;
    this.state.set('idle');
    this.duration.set(0);
    this.errorMsg.set(null);
  }

  private getExt(): string {
    const m = this.mimeType();
    if (m.includes('mp4')) return 'm4a';
    if (m.includes('ogg')) return 'ogg';
    return 'webm';
  }

  formatTime(sec: number): string {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
    const url = this.playbackUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
