// audio-recorder.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  
  // 用于观察录音状态
  private recordingState = new BehaviorSubject<boolean>(false);
  recordingState$ = this.recordingState.asObservable();
  
  // 用于观察转换的文字
  private transcriptionResult = new BehaviorSubject<string>('');
  transcriptionResult$ = this.transcriptionResult.asObservable();

  // 开始录音
  async startRecording(): Promise<void> {
    try {
      // 请求麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // 16kHz 是语音识别常用采样率
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // 获取支持的MIME类型
      const mimeType = this.getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType
        ? { mimeType, audioBitsPerSecond: 128000 }
        : { audioBitsPerSecond: 128000 };

      // 创建 MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.audioChunks = [];

      // 设置事件处理器（在start之前）
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('音频数据块收集:', event.data.size, 'bytes');
        }
      };

      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
        this.recordingState.next(true);
        console.log('录音已开始');
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        this.recordingState.next(false);
        console.log('录音已停止');
        
        // 获取完整的音频Blob
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        
        console.log('音频Blob创建完成:', audioBlob.size, 'bytes, type:', mimeType);
        
        // 发送到语音识别服务
        this.sendToSpeechToText(audioBlob);
        
        // 清理资源
        this.cleanup();
      };

      this.mediaRecorder.onerror = (event: Event) => {
        console.error('MediaRecorder错误:', event);
        this.cleanup();
        throw new Error('录音过程中发生错误');
      };

      // 开始录音 - 每1秒触发一次dataavailable事件
      this.mediaRecorder.start(1000);
      
    } catch (error) {
      console.error('无法访问麦克风:', error);
      this.cleanup();
      throw new Error('无法访问麦克风，请检查权限设置');
    }
  }

  // 停止录音
  async stopRecording(): Promise<void> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      console.warn('没有正在进行的录音');
      return;
    }

    if (this.mediaRecorder.state === 'recording') {
      console.log('停止录音中...');
      // 请求最后的数据并停止
      this.mediaRecorder.stop();
    }
  }

  // 清理资源
  private cleanup(): void {
    // 停止所有音频轨道
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('音频轨道已停止');
      });
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  // 发送音频到语音识别API
  private async sendToSpeechToText(audioBlob: Blob): Promise<void> {
    try {
      // 这里可以选择不同的语音识别服务
      // 方法1: 使用Web Speech API（浏览器内置，免费但识别率较低）
      console.log("获取完整的音频Blob");
      console.log("使用Web Speech API");
      const result = await this.useWebSpeechAPI(audioBlob);
      
      // 方法2: 或使用第三方API（如Google Cloud Speech-to-Text, Azure Speech Services等）
      // const result = await this.useGoogleSpeechAPI(audioBlob);
      
      this.transcriptionResult.next(result);
    } catch (error) {
      console.error('语音转文字失败:', error);
      this.transcriptionResult.next('语音识别失败，请重试');
    }
  }

  // 方法1: 使用Web Speech API（免费，不需要API密钥）
  private useWebSpeechAPI(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        reject('浏览器不支持Web Speech API');
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || 
                               (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'zh-CN'; // 中文
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      // 由于Web Speech API需要实时流，我们先播放音频然后识别
      const audio = new Audio(URL.createObjectURL(audioBlob));
      
      audio.onplay = () => {
        recognition.start();
      };

      let transcript = '';
      
      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onend = () => {
        resolve(transcript);
        audio.pause();
        URL.revokeObjectURL(audio.src);
      };

      recognition.onerror = (event: any) => {
        reject(`识别错误: ${event.error}`);
        audio.pause();
        URL.revokeObjectURL(audio.src);
      };

      audio.play();
    });
  }

  // 方法2: 使用Google Cloud Speech-to-Text API（需要API密钥，但更准确）
  private async useGoogleSpeechAPI(audioBlob: Blob): Promise<string> {
    // 将音频转换为base64
    const base64Audio = await this.blobToBase64(audioBlob);
    
    // 这里需要替换为你的Google Cloud API密钥
    const apiKey = 'YOUR_GOOGLE_CLOUD_API_KEY';
    const apiUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;
    
    const requestBody = {
      config: {
        encoding: 'WEBM_OPUS', // 根据实际格式调整
        sampleRateHertz: 16000,
        languageCode: 'zh-CN',
        enableAutomaticPunctuation: true,
      },
      audio: {
        content: base64Audio.split(',')[1] // 移除data:audio/webm;base64,前缀
      }
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].alternatives[0].transcript;
      }
      return '';
    } catch (error) {
      throw new Error(`Google API请求失败: ${error}`);
    }
  }

  // 辅助方法：Blob转Base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // 获取支持的MIME类型
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return ''; // 使用浏览器默认类型
  }

  // 获取录音状态
  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  // 清除转录结果
  clearTranscription(): void {
    this.transcriptionResult.next('');
  }
}